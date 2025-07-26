---
layout: documentation
title: AIRS Module (src/airs/)
permalink: /developers/src/airs/
category: developers
---

# AIRS Module Documentation

The AIRS module provides a comprehensive client implementation for integrating with Prisma AI Runtime Security (AIRS) API. It features an enhanced client with caching and rate limiting, built on top of a robust base API client with retry logic and error handling.

## Module Overview

The AIRS module consists of five core files that work together to provide a production-ready API client:

```
src/airs/
├── client.ts        # Core REST API client with retry logic
├── cache.ts         # LRU cache for API responses
├── rate-limiter.ts  # Token bucket rate limiting
├── index.ts         # Enhanced client orchestrating all features
└── factory.ts       # Singleton factory for client instances
```

## Architecture

The module follows a layered architecture:

1. **Base Layer** (`client.ts`) - Raw API communication
2. **Enhancement Layer** (`cache.ts`, `rate-limiter.ts`) - Performance and reliability
3. **Orchestration Layer** (`index.ts`) - Unified interface
4. **Factory Layer** (`factory.ts`) - Instance management

## Type System

All types are centralized in `src/types/airs.ts` with the `Airs` prefix:

```typescript
import type {
    AirsScanRequest,
    AirsScanResponse,
    AirsAsyncScanObject,
    AirsEnhancedClientConfig
} from '../types';
```

## Component Documentation

### client.ts - Core API Client

The base client handles all HTTP communication with the AIRS API, including retry logic and error handling.

#### Configuration

```typescript
export interface AirsClientConfig {
    apiUrl: string;      // AIRS API endpoint
    apiKey: string;      // Authentication token (x-pan-token)
    timeout?: number;    // Request timeout (default: 30000ms)
    maxRetries?: number; // Retry attempts (default: 3)
    retryDelay?: number; // Initial retry delay (default: 1000ms)
}
```

#### Client Implementation

```typescript
export class PrismaAirsClient {
    constructor(config: AirsClientConfig) {
        // Initialize axios instance with interceptors
        this.api = axios.create({
            baseURL: config.apiUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'x-pan-token': config.apiKey,
            },
        });
    }

    // Synchronous content scanning
    async scanSync(request: AirsScanRequest): Promise<AirsScanResponse> {
        const response = await this.api.post('/v1/scan/sync/request', request);
        return response.data;
    }

    // Asynchronous batch scanning
    async scanAsync(requests: AirsAsyncScanObject[]): Promise<AirsAsyncScanResponse> {
        const response = await this.api.post('/v1/scan/async/request', { requests });
        return response.data;
    }

    // Retrieve scan results by IDs
    async getScanResults(scanIds: string[]): Promise<AirsScanIdResult[]> {
        const response = await this.api.get('/v1/scan/results', {
            params: { scan_ids: scanIds.join(',') }
        });
        return response.data.scan_results;
    }

    // Get detailed threat reports
    async getThreatScanReports(reportIds: string[]): Promise<AirsThreatScanReportObject[]> {
        const response = await this.api.get('/v1/scan/reports', {
            params: { report_ids: reportIds.join(',') }
        });
        return response.data.reports;
    }
}
```

#### Error Handling

```typescript
export class PrismaAirsApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public response?: AirsErrorResponse
    ) {
        super(message);
        this.name = 'PrismaAirsApiError';
    }
}
```

### cache.ts - Response Caching

Implements an LRU (Least Recently Used) cache to reduce API calls and improve performance.

#### Cache Configuration

```typescript
export interface AirsCacheConfig {
    ttlSeconds: number;   // Time to live for cache entries
    maxSize: number;      // Maximum number of cached items
    enabled?: boolean;    // Enable/disable caching
}
```

#### Cache Implementation

```typescript
export class PrismaAirsCache {
    private cache = new Map<string, AirsCacheEntry<unknown>>();
    private accessOrder: string[] = [];

    // Get cached value with automatic expiration
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) return null;
        
        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.delete(key);
            return null;
        }
        
        // Update access order for LRU
        this.updateAccessOrder(key);
        entry.hits++;
        
        return entry.value as T;
    }

    // Set value with TTL
    set<T>(key: string, value: T): void {
        // Evict least recently used if at capacity
        if (this.cache.size >= this.config.maxSize) {
            this.evictLRU();
        }
        
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (this.config.ttlSeconds * 1000),
            hits: 0
        });
        
        this.updateAccessOrder(key);
    }
}
```

#### Cache Key Generation

```typescript
export class PrismaAirsCache {
    // Generate deterministic cache keys
    static generateScanKey(type: string, request: AirsScanRequest): string {
        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify({ type, request }))
            .digest('hex');
        return `scan:${type}:${hash.substring(0, 16)}`;
    }

    static generateResultKey(type: string, ids: string[]): string {
        const sortedIds = [...ids].sort();
        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify({ type, ids: sortedIds }))
            .digest('hex');
        return `${type}:${hash.substring(0, 16)}`;
    }
}
```

### rate-limiter.ts - API Rate Limiting

Implements token bucket algorithm to prevent API quota exhaustion.

#### Rate Limiter Configuration

```typescript
export interface AirsRateLimiterConfig {
    maxRequests: number;  // Maximum requests per window
    windowMs: number;     // Time window in milliseconds
    enabled?: boolean;    // Enable/disable rate limiting
}
```

#### Token Bucket Implementation

```typescript
export class PrismaAirsRateLimiter {
    private buckets = new Map<string, TokenBucket>();

    // Check if request is allowed
    checkLimit(key: string = 'default'): boolean {
        const bucket = this.getOrCreateBucket(key);
        
        // Refill tokens based on time elapsed
        this.refillTokens(bucket);
        
        // Check if tokens available
        if (bucket.tokens > 0) {
            bucket.tokens--;
            return true;
        }
        
        return false;
    }

    // Wait until request is allowed
    async waitForLimit(key: string = 'default'): Promise<void> {
        while (!this.checkLimit(key)) {
            const waitTime = this.getWaitTime(key);
            await this.sleep(Math.min(waitTime, 1000));
        }
    }

    // Get current rate limit status
    getStatus(key: string = 'default'): RateLimitStatus {
        const bucket = this.buckets.get(key);
        return {
            available: bucket?.tokens || this.config.maxRequests,
            limit: this.config.maxRequests,
            resetAt: new Date(bucket?.lastRefill + this.config.windowMs)
        };
    }
}
```

### index.ts - Enhanced Client

The enhanced client orchestrates the base client, cache, and rate limiter to provide a unified, production-ready interface.

#### Enhanced Configuration

```typescript
export interface AirsEnhancedClientConfig extends AirsClientConfig {
    cache?: AirsCacheConfig;
    rateLimiter?: AirsRateLimiterConfig;
}
```

#### Enhanced Client Implementation

```typescript
export class EnhancedPrismaAirsClient {
    private readonly client: PrismaAirsClient;
    private readonly cache?: PrismaAirsCache;
    private readonly rateLimiter?: PrismaAirsRateLimiter;

    constructor(config: AirsEnhancedClientConfig) {
        this.client = new PrismaAirsClient(config);
        
        if (config.cache) {
            this.cache = new PrismaAirsCache(config.cache);
        }
        
        if (config.rateLimiter) {
            this.rateLimiter = new PrismaAirsRateLimiter(config.rateLimiter);
        }
    }

    // Scan with caching and rate limiting
    async scanSync(request: AirsScanRequest): Promise<AirsScanResponse> {
        // Apply rate limiting
        if (this.rateLimiter) {
            await this.rateLimiter.waitForLimit('scan');
        }

        // Check cache
        const cacheKey = PrismaAirsCache.generateScanKey('sync', request);
        if (this.cache) {
            const cached = this.cache.get<AirsScanResponse>(cacheKey);
            if (cached) return cached;
        }

        // Make request
        const response = await this.client.scanSync(request);

        // Cache response
        if (this.cache && response) {
            this.cache.set(cacheKey, response);
        }

        return response;
    }

    // Get performance statistics
    getCacheStats(): CacheStats | null {
        return this.cache?.getStats() || null;
    }

    getRateLimiterStats(): RateLimiterStats | null {
        return this.rateLimiter?.getStats() || null;
    }
}
```

### factory.ts - Singleton Factory

Manages client instances using the singleton pattern to ensure consistent configuration and resource sharing.

#### Factory Implementation

```typescript
export class PrismaAirsClientFactory {
    private static instance: PrismaAirsClientFactory;
    private client: EnhancedPrismaAirsClient | null = null;

    private constructor() {}

    static getInstance(): PrismaAirsClientFactory {
        if (!PrismaAirsClientFactory.instance) {
            PrismaAirsClientFactory.instance = new PrismaAirsClientFactory();
        }
        return PrismaAirsClientFactory.instance;
    }

    getClient(config?: AirsEnhancedClientConfig): EnhancedPrismaAirsClient {
        if (!this.client) {
            if (!config) {
                throw new Error('Configuration required for first client creation');
            }
            this.client = new EnhancedPrismaAirsClient(config);
        }
        return this.client;
    }

    resetClient(): void {
        this.client = null;
    }
}
```

## Usage Examples

### Basic Usage

```typescript
import { EnhancedPrismaAirsClient } from './airs';
import { getConfig } from './config';

const config = getConfig();
const client = new EnhancedPrismaAirsClient({
    apiUrl: config.airs.apiUrl,
    apiKey: config.airs.apiKey,
    cache: {
        ttlSeconds: 300,
        maxSize: 1000,
        enabled: true
    },
    rateLimiter: {
        maxRequests: 100,
        windowMs: 60000,
        enabled: true
    }
});

// Scan content
const result = await client.scanSync({
    prompt: 'Check this user input',
    profile_name: 'strict'
});
```

### Using the Factory

```typescript
import { PrismaAirsClientFactory } from './airs/factory';

// Get singleton instance
const factory = PrismaAirsClientFactory.getInstance();

// Get or create client
const client = factory.getClient({
    apiUrl: process.env.AIRS_API_URL!,
    apiKey: process.env.AIRS_API_KEY!
});

// Use client across application
const results = await client.scanSync(request);
```

### Monitoring Performance

```typescript
// Get cache statistics
const cacheStats = client.getCacheStats();
console.log('Cache hit rate:', cacheStats?.hitRate);
console.log('Cache size:', cacheStats?.size);

// Get rate limiter status
const rateLimitStatus = client.getRateLimiterStats();
console.log('Available requests:', rateLimitStatus?.available);
console.log('Reset time:', rateLimitStatus?.resetAt);
```

## Error Handling

### API Errors

```typescript
try {
    const result = await client.scanSync(request);
} catch (error) {
    if (error instanceof PrismaAirsApiError) {
        console.error('API Error:', error.statusCode, error.message);
        
        if (error.statusCode === 429) {
            // Rate limited by API
            console.log('Waiting for rate limit reset...');
        }
    }
}
```

### Configuration Errors

```typescript
try {
    const client = factory.getClient();
} catch (error) {
    // No configuration provided for first client
    console.error('Client not configured:', error.message);
}
```

## Best Practices

### 1. Use the Factory Pattern

Always use the factory for consistent client instances:

```typescript
const factory = PrismaAirsClientFactory.getInstance();
const client = factory.getClient(config);
```

### 2. Configure Caching Appropriately

- Set TTL based on data freshness requirements
- Size cache based on memory constraints
- Monitor hit rates to optimize performance

### 3. Implement Rate Limiting

- Set limits below API quotas
- Use different buckets for different operations
- Monitor rate limit status proactively

### 4. Handle Errors Gracefully

- Catch and handle specific error types
- Implement retry logic for transient failures
- Log errors with appropriate context

### 5. Monitor Performance

- Track cache hit rates
- Monitor rate limit utilization
- Log slow requests
- Alert on error rates

## Integration with MCP

The AIRS module integrates with the MCP server through tool handlers:

```typescript
// In tools/index.ts
import { EnhancedPrismaAirsClient } from '../airs';

const client = new EnhancedPrismaAirsClient(config);

// Tool implementation
async function scanContent(args: ToolsScanContentArgs): Promise<AirsScanResponse> {
    return await client.scanSync({
        prompt: args.prompt,
        response: args.response,
        profile_name: args.profile
    });
}
```

## Performance Considerations

### Caching Strategy

- **Sync scans**: Cached with content hash
- **Async scans**: Not cached (returns scan IDs)
- **Results**: Cached only when complete
- **Reports**: Always cached

### Rate Limiting Strategy

- **Per-operation buckets**: Different limits for scan/results
- **Graceful degradation**: Queue requests when limited
- **Monitoring**: Track limit utilization

### Memory Management

- **LRU eviction**: Removes least used entries
- **TTL expiration**: Automatic cleanup
- **Size limits**: Configurable maximum entries

## Next Steps

- [Types Module]({{ site.baseurl }}/developers/src/types/) - Type definitions
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - MCP tool implementations
- [Config Module]({{ site.baseurl }}/developers/src/config/) - Configuration management