---
layout: documentation
title: AIRS Module (src/airs/)
permalink: /developers/src-airs/
category: developers
---

# AIRS Module Documentation

The AIRS module provides a complete client implementation for integrating with Prisma AI Runtime Security (AIRS) API. It includes REST API communication, caching, rate limiting, and comprehensive type definitions.

## Module Overview

The AIRS module consists of six files that work together to provide a robust API client:

- **types.ts** - TypeScript type definitions for all AIRS API requests and responses
- **client.ts** - Core REST API client with retry logic and error handling
- **cache.ts** - LRU cache implementation for API response caching
- **rate-limiter.ts** - Token bucket rate limiting to prevent API throttling
- **index.ts** - Enhanced client that combines caching and rate limiting
- **factory.ts** - Singleton factory for client instance management

## File Documentation

### types.ts - Type Definitions

This file contains all TypeScript interfaces and types generated from the Prisma AIRS OpenAPI schema.

#### Request Types

```typescript
export interface ScanRequest {
    tr_id?: string;              // Transaction ID for tracking
    ai_profile: AiProfile;       // Security profile configuration
    metadata?: Metadata;         // Optional metadata
    contents: ContentItem[];     // Content to scan
}

export interface ContentItem {
    prompt?: string;             // User input to scan
    response?: string;           // AI response to scan
    code_prompt?: string;        // Code in prompt
    code_response?: string;      // Code in response
    context?: string;            // Additional context
}
```

#### Response Types

```typescript
export interface ScanResponse {
    report_id: string;
    scan_id: string;
    tr_id?: string;
    profile_id?: string;
    profile_name?: string;
    category: 'malicious' | 'benign';
    action: 'block' | 'allow';
    prompt_detected?: PromptDetected;
    response_detected?: ResponseDetected;
    // ... additional fields
}
```

#### Threat Detection Types

The response includes detailed threat detection for both prompts and responses:

```typescript
export interface PromptDetected {
    url_cats?: boolean;          // Malicious URL categories
    dlp?: boolean;               // Data loss prevention
    injection?: boolean;         // Prompt injection
    toxic_content?: boolean;     // Toxic/harmful content
    malicious_code?: boolean;    // Malicious code detection
    agent?: boolean;             // AI agent threats
    topic_violation?: boolean;   // Topic guardrail violations
}
```

### client.ts - Core API Client

The base client handles all HTTP communication with the AIRS API.

#### Client Configuration

```typescript
export interface AIRSClientConfig {
    apiUrl: string;              // AIRS API endpoint
    apiKey: string;              // Authentication token
    timeout?: number;            // Request timeout (default: 30000ms)
    maxRetries?: number;         // Retry attempts (default: 3)
    retryDelay?: number;         // Initial retry delay (default: 1000ms)
}
```

#### Main Client Class

```typescript
export class PrismaAIRSClient {
    constructor(config: AIRSClientConfig) {
        // Initializes with configuration
        // Sets up base URL with version
        // Configures retry and timeout settings
    }

    // Synchronous scanning
    async scanSync(request: ScanRequest): Promise<ScanResponse>

    // Asynchronous batch scanning
    async scanAsync(requests: AsyncScanObject[]): Promise<AsyncScanResponse>

    // Retrieve scan results by IDs
    async getScanResults(scanIds: string[]): Promise<ScanIdResult[]>

    // Get detailed threat reports
    async getThreatScanReports(reportIds: string[]): Promise<ThreatScanReportObject[]>
}
```

#### Error Handling

```typescript
export class AIRSAPIError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public response?: AIRSErrorResponse
    ) {
        super(message);
        this.name = 'AIRSAPIError';
    }
}
```

The client implements:
- Automatic retry with exponential backoff
- Rate limit handling (429 responses)
- Network error recovery
- Structured error responses

### cache.ts - Response Caching

Implements a size-based cache with TTL (Time-To-Live) to reduce API calls and improve performance.

#### Cache Configuration

```typescript
export interface CacheConfig {
    ttlSeconds: number;          // Time-to-live in seconds
    maxSize: number;             // Maximum cache size in bytes
    enabled?: boolean;           // Enable/disable caching
}
```

#### Cache Implementation

```typescript
export class AIRSCache {
    // Set a value with optional TTL override
    set<T>(key: string, data: T, ttlOverride?: number): void

    // Get a value if not expired
    get<T>(key: string): T | undefined

    // Clear all cached entries
    clear(): void

    // Get cache statistics
    getStats(): {
        size: number;            // Current size in bytes
        count: number;           // Number of entries
        enabled: boolean;        // Cache status
    }

    // Generate cache keys
    static generateScanKey(method: string, data: unknown): string
    static generateResultKey(type: string, ids: string[]): string
}
```

Key features:
- Simple hash-based cache key generation
- Automatic expiration of old entries
- Size-based eviction when capacity reached
- Periodic cleanup of expired entries
- Memory size estimation for entries

### rate-limiter.ts - API Rate Limiting

Implements token bucket algorithm to prevent API throttling.

#### Rate Limiter Configuration

```typescript
export interface RateLimiterConfig {
    maxRequests: number;         // Maximum requests allowed
    windowMs: number;            // Time window in milliseconds
    enabled?: boolean;           // Enable/disable rate limiting
}
```

#### Rate Limiter Implementation

```typescript
export class AIRSRateLimiter {
    // Check if request is allowed and consume token
    checkLimit(key: string = 'default'): boolean

    // Wait until rate limit allows request
    async waitForLimit(key: string = 'default'): Promise<void>

    // Get current rate limit status
    getStatus(key: string = 'default'): {
        available: number;
        limit: number;
        resetAt: Date;
    } | null

    // Reset rate limit for specific key
    reset(key: string = 'default'): void

    // Clear all rate limit buckets
    clear(): void

    // Get statistics for monitoring
    getStats(): {
        bucketCount: number;
        enabled: boolean;
    }
}
```

The rate limiter uses a token bucket algorithm with configurable limits per operation key. It automatically refills tokens based on the time window and tracks usage per operation type.

### index.ts - Enhanced Client

Combines the base client with caching and rate limiting capabilities.

```typescript
export class EnhancedPrismaAIRSClient {
    constructor(config: EnhancedAIRSClientConfig) {
        // Initializes base client
        // Sets up optional cache
        // Configures optional rate limiter
    }

    // All base client methods with enhancements
    async scanSync(request: ScanRequest): Promise<ScanResponse> {
        // 1. Check rate limit
        // 2. Check cache
        // 3. Make API call if needed
        // 4. Cache successful response
        // 5. Return result
    }

    // Cache management
    getCacheStats(): CacheStats | null
    clearCache(): void

    // Rate limit management
    getRateLimiterStats(): RateLimiterStats | null
    resetRateLimits(): void
}
```

### factory.ts - Client Factory

Provides singleton instance management for the AIRS client.

```typescript
let clientInstance: EnhancedPrismaAIRSClient | null = null;

export function getAIRSClient(): EnhancedPrismaAIRSClient {
    if (!clientInstance) {
        const config = getConfig();
        clientInstance = new EnhancedPrismaAIRSClient({
            apiUrl: config.airs.apiUrl,
            apiKey: config.airs.apiKey,
            timeout: config.airs.timeout,
            maxRetries: config.airs.retryAttempts,
            retryDelay: config.airs.retryDelay,
            cache: config.cache.enabled ? {
                ttlSeconds: config.cache.ttlSeconds,
                maxSize: config.cache.maxSize,
                enabled: config.cache.enabled,
            } : undefined,
            rateLimiter: config.rateLimit.enabled ? {
                maxRequests: config.rateLimit.maxRequests,
                windowMs: config.rateLimit.windowMs,
                enabled: config.rateLimit.enabled,
            } : undefined,
        });
    }
    return clientInstance;
}

export function resetAIRSClient(): void {
    if (clientInstance) {
        clientInstance.clearCache();
        clientInstance.resetRateLimits();
        clientInstance = null;
    }
}
```

## Usage Examples

### Basic Scanning

```typescript
import { getAIRSClient } from './airs/factory';

const client = getAIRSClient();

// Scan content synchronously
const result = await client.scanSync({
    ai_profile: { profile_name: 'Prisma AIRS' },
    contents: [{
        prompt: 'User input to check',
        response: 'AI response to verify'
    }]
});

if (result.category === 'malicious') {
    console.log('Threat detected:', result.action);
}
```

### Batch Scanning

```typescript
// Scan multiple items asynchronously
const asyncResult = await client.scanAsync([
    {
        req_id: 1,
        scan_req: {
            ai_profile: { profile_name: 'Prisma AIRS' },
            contents: [{ prompt: 'First item' }]
        }
    },
    {
        req_id: 2,
        scan_req: {
            ai_profile: { profile_name: 'Prisma AIRS' },
            contents: [{ prompt: 'Second item' }]
        }
    }
]);

// Poll for results
const results = await client.getScanResults([asyncResult.scan_id]);
```

### Cache Management

```typescript
// Get cache statistics
const stats = client.getCacheStats();
if (stats) {
    console.log(`Cache size: ${stats.size} bytes`);
    console.log(`Cache entries: ${stats.count}`);
    console.log(`Cache enabled: ${stats.enabled}`);
}

// Clear cache when needed
client.clearCache();
```

## Error Handling

```typescript
try {
    const result = await client.scanSync(request);
} catch (error) {
    if (error instanceof AIRSAPIError) {
        switch (error.statusCode) {
            case 401:
                console.error('Invalid API key');
                break;
            case 429:
                console.error('Rate limited - will retry automatically');
                break;
            case 500:
                console.error('AIRS service error');
                break;
        }
    }
}
```

## Configuration

The module uses environment variables via the config system:

```bash
# Required
AIRS_API_URL=https://api.prismacloud.io/airs
AIRS_API_KEY=your-api-key

# Optional AIRS settings
AIRS_TIMEOUT=30000
AIRS_RETRY_ATTEMPTS=3
AIRS_RETRY_DELAY=1000

# Cache settings
CACHE_ENABLED=true
CACHE_MAX_SIZE=10485760  # 10MB in bytes
CACHE_TTL_SECONDS=300    # 5 minutes

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000  # 1 minute
```

## Best Practices

1. **Use the factory** - Always get the client via `getAIRSClient()` for proper singleton management
2. **Handle errors** - Implement proper error handling for API failures
3. **Monitor cache** - Check cache statistics to ensure good hit rates
4. **Batch when possible** - Use async scanning for multiple items
5. **Respect rate limits** - The client handles this automatically but monitor usage

## Integration with MCP

The AIRS module is used by:
- **Tool handlers** - Execute security scans via MCP tools
- **Resource handlers** - Retrieve scan results and reports
- **Transport layer** - Provides scan status for long operations

## Next Steps

- [MCP Tools]({{ site.baseurl }}/developers/src-tools/) - How tools use the AIRS client
- [Configuration]({{ site.baseurl }}/developers/src-config/) - Detailed configuration options
- [Transport Layer]({{ site.baseurl }}/developers/src-transport/) - Request handling and routing