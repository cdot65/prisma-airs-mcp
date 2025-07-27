---
layout: documentation
title: AIRS Client Module
permalink: /developers/src/airs/
category: developers
---

# AIRS Integration Layer (src/airs/)

The AIRS module provides a production-ready client implementation for integrating with Prisma AI Runtime Security (AIRS) API. It features a layered architecture with caching, rate limiting, retry logic, and comprehensive error handling.

## Module Structure

```
src/airs/
├── client.ts        # Core REST API client with retry logic
├── cache.ts         # LRU cache implementation for responses
├── rate-limiter.ts  # Token bucket rate limiting
├── index.ts         # Enhanced client orchestrating all features
└── factory.ts       # Singleton factory for client instances
```

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│            Application Code                 │
└─────────────────┬───────────────────────────┘
                  │ Uses singleton via factory
┌─────────────────▼───────────────────────────┐
│          EnhancedPrismaAirsClient           │
│              (index.ts)                     │
│  • Orchestrates all features                │
│  • Provides unified API                     │
└─────────┬──────────┬──────────┬─────────────┘
          │          │          │
┌─────────▼───┐ ┌────▼────┐ ┌──▼──────────────┐
│   Cache     │ │  Rate   │ │  Base Client    │
│ (cache.ts)  │ │ Limiter │ │ (client.ts)     │
│             │ │         │ │                 │
│ • LRU evict │ │ • Token │ │ • HTTP calls    │
│ • TTL expiry│ │  bucket │ │ • Retry logic   │
│ • SHA keys  │ │ • Queue │ │ • Error handle  │
└─────────────┘ └─────────┘ └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │ Prisma AIRS API │
                            └─────────────────┘
```

## Core Components

### 1. Base Client (client.ts)

The foundation layer handling all HTTP communication with the AIRS API.

#### Key Features

- **Automatic Retry**: Exponential backoff for transient failures
- **Error Handling**: Typed errors with status codes
- **Request Validation**: Parameter checking before API calls
- **Logging**: Structured logging of all operations

#### Configuration

```typescript
// Imported from '../types'
interface AirsClientConfig {
    apiUrl: string;      // Base URL for AIRS API
    apiKey: string;      // Authentication token (x-pan-token)
    timeout?: number;    // Request timeout in ms (default: 30000)
    maxRetries?: number; // Retry attempts (default: 3)
    retryDelay?: number; // Initial retry delay in ms (default: 1000)
}
```

#### API Methods

| Method               | Endpoint                      | Purpose                    |
| -------------------- | ----------------------------- | -------------------------- |
| `scanSync()`         | `POST /v1/scan/sync/request`  | Real-time content scanning |
| `scanAsync()`        | `POST /v1/scan/async/request` | Batch scanning             |
| `getScanResults()`   | `GET /v1/scan/results`        | Retrieve scan results      |
| `getThreatReports()` | `GET /v1/scan/reports`        | Get detailed reports       |

#### Error Handling

```typescript
export class PrismaAirsApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public response?: AirsErrorResponse,
    ) {
        super(message);
        this.name = 'PrismaAirsApiError';
    }
}
```

**Common Error Codes**:

- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `429` - Rate limited
- `500` - Server error

### 2. Cache Layer (cache.ts)

In-memory LRU cache reducing API calls and improving response times.

#### Features

- **LRU Eviction**: Removes least recently used items when full
- **TTL Support**: Automatic expiration of stale entries
- **SHA-256 Keys**: Consistent hashing for cache keys
- **Hit Rate Tracking**: Performance metrics

#### Configuration

```typescript
interface AirsCacheConfig {
    enabled?: boolean;    // Enable/disable caching (default: true)
    maxSize?: number;     // Maximum cache entries (default: 1000)
    ttlSeconds?: number;  // Time-to-live in seconds (default: 300)
}
```

#### Cache Key Generation

```typescript
// Key format: prefix:sha256(normalized_json)
generateKey(prefix
:
string, data
:
unknown
):
string
{
    const normalized = JSON.stringify(this.sortKeys(data));
    const hash = crypto.createHash('sha256')
        .update(normalized)
        .digest('hex');
    return `${prefix}:${hash}`;
}
```

#### Statistics

```typescript
interface CacheStats {
    size: number;        // Current number of entries
    maxSize: number;     // Maximum allowed entries
    hits: number;        // Total cache hits
    misses: number;      // Total cache misses
    hitRate: number;     // Hit rate percentage
    evictions: number;   // Total evictions
}
```

### 3. Rate Limiter (rate-limiter.ts)

Token bucket implementation preventing API quota exhaustion.

#### Algorithm

- **Token Bucket**: Fixed capacity with continuous refill
- **Per-Operation Limits**: Different limits for different operations
- **Request Queuing**: Automatic waiting when bucket empty

#### Configuration

```typescript
interface AirsRateLimiterConfig {
    enabled?: boolean;           // Enable rate limiting (default: true)
    scanRequestsPerMinute?: number;    // Scan limit (default: 100)
    reportRequestsPerMinute?: number;  // Report limit (default: 50)
    resultRequestsPerMinute?: number;  // Result limit (default: 200)
}
```

#### Operation Types

| Operation | Default Limit | Use Case         |
| --------- | ------------- | ---------------- |
| `scan`    | 100/min       | Content scanning |
| `report`  | 50/min        | Threat reports   |
| `result`  | 200/min       | Result retrieval |

### 4. Enhanced Client (index.ts)

Orchestration layer combining all features into a unified interface.

#### Features

- **Automatic Caching**: Transparent response caching
- **Rate Limit Management**: Automatic request throttling
- **Unified API**: Single interface for all operations
- **Graceful Degradation**: Works without cache/rate limiter

#### Usage Example

```typescript
const client = new EnhancedPrismaAirsClient({
    apiUrl: 'https://api.aisecurity.paloaltonetworks.com',
    apiKey: process.env.AIRS_API_KEY,
    cache: {
        enabled: true,
        ttlSeconds: 300,
        maxSize: 1000
    },
    rateLimiter: {
        enabled: true,
        scanRequestsPerMinute: 100
    }
});

// Automatic caching and rate limiting
const result = await client.scanSync({
    prompt: 'Check this content',
    profile_name: 'strict'
});
```

### 5. Factory Pattern (factory.ts)

Singleton factory ensuring single client instance per configuration.

#### Purpose

- **Resource Efficiency**: Reuses connections and caches
- **Consistency**: Same client across application
- **Configuration Management**: Centralizes client setup

#### Implementation

```typescript
export class PrismaAirsClientFactory {
    private static instance?: EnhancedPrismaAirsClient;

    static getInstance(config?: AirsEnhancedClientConfig): EnhancedPrismaAirsClient {
        if (!this.instance) {
            if (!config) {
                throw new Error('Configuration required for first initialization');
            }
            this.instance = new EnhancedPrismaAirsClient(config);
        }
        return this.instance;
    }

    static reset(): void {
        this.instance = undefined;
    }
}
```

## Type System

All types are centralized in `src/types/airs.ts` with consistent `Airs` prefixing:

### Request Types

| Type                  | Purpose                |
| --------------------- | ---------------------- |
| `AirsScanRequest`     | Synchronous scan input |
| `AirsAsyncScanObject` | Async scan item        |
| `AirsRequestOptions`  | Request configuration  |

### Response Types

| Type                         | Purpose                |
| ---------------------------- | ---------------------- |
| `AirsScanResponse`           | Scan results           |
| `AirsAsyncScanResponse`      | Async operation status |
| `AirsScanIdResult`           | Retrieved scan result  |
| `AirsThreatScanReportObject` | Detailed threat report |

### Configuration Types

| Type                       | Purpose                |
| -------------------------- | ---------------------- |
| `AirsClientConfig`         | Base client settings   |
| `AirsCacheConfig`          | Cache settings         |
| `AirsRateLimiterConfig`    | Rate limit settings    |
| `AirsEnhancedClientConfig` | Complete configuration |

## Best Practices

### 1. Use the Factory

```typescript
// ✅ Good - Use factory for singleton
const client = getAirsClient();

// ❌ Bad - Direct instantiation
const client = new EnhancedPrismaAirsClient(config);
```

### 2. Handle Errors

```typescript
try {
    const result = await client.scanSync(request);
} catch (error) {
    if (error instanceof PrismaAirsApiError) {
        if (error.statusCode === 429) {
            // Handle rate limiting
        } else if (error.statusCode === 401) {
            // Handle auth error
        }
    }
}
```

### 3. Monitor Performance

```typescript
// Get cache statistics
const stats = client.getCacheStats();
logger.info('Cache performance', {
    hitRate: `${stats.hitRate}%`,
    size: stats.size
});

// Get rate limit status
const status = client.getRateLimitStatus();
logger.info('Rate limit status', status);
```

### 4. Configure Appropriately

```typescript
// Production configuration
const config: AirsEnhancedClientConfig = {
    apiUrl: process.env.AIRS_API_URL,
    apiKey: process.env.AIRS_API_KEY,
    timeout: 30000,
    maxRetries: 3,
    cache: {
        enabled: true,
        ttlSeconds: 300,      // 5 minutes
        maxSize: 1000
    },
    rateLimiter: {
        enabled: true,
        scanRequestsPerMinute: 100
    }
};
```

## Common Patterns

### Batch Processing

```typescript
// Process multiple items with rate limiting
const items = ['content1', 'content2', ...];
const results = [];

for (const item of items) {
    try {
        // Rate limiter automatically throttles
        const result = await client.scanSync({
            prompt: item,
            profile_name: 'default'
        });
        results.push(result);
    } catch (error) {
        logger.error('Scan failed', {item, error});
    }
}
```

### Cache Warming

```typescript
// Pre-populate cache with common requests
const commonPrompts = ['test', 'hello', ...];

for (const prompt of commonPrompts) {
    await client.scanSync({prompt, profile_name: 'default'});
}
```

### Graceful Degradation

```typescript
// Disable features in development
const isDev = process.env.NODE_ENV === 'development';

const config: AirsEnhancedClientConfig = {
    // ... base config
    cache: {
        enabled: !isDev,  // Disable in dev for fresh results
        ttlSeconds: 300
    },
    rateLimiter: {
        enabled: true,    // Always enable to respect API limits
        scanRequestsPerMinute: isDev ? 10 : 100
    }
};
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
    - Verify `AIRS_API_KEY` is set correctly
    - Check API key permissions
    - Ensure `x-pan-token` header is sent

2. **Rate Limiting**
    - Monitor rate limit status
    - Adjust limits based on quota
    - Implement backoff strategies

3. **Cache Misses**
    - Check TTL configuration
    - Monitor cache size
    - Verify key generation

4. **Timeout Errors**
    - Increase timeout for large payloads
    - Check network connectivity
    - Monitor API response times

### Debug Logging

Enable debug logs for troubleshooting:

```bash
LOG_LEVEL=debug npm start
```

## Performance Optimization

### Cache Tuning

```typescript
// Monitor and adjust cache size
const stats = client.getCacheStats();
if (stats.evictions > stats.hits * 0.1) {
    // Too many evictions, increase cache size
}
```

### Rate Limit Optimization

```typescript
// Adjust limits based on usage patterns
const status = client.getRateLimitStatus();
if (status.scan.available < 10) {
    // Near limit, slow down requests
}
```

## Integration with MCP

The AIRS client is primarily used by the Tools handler to execute security scans:

```typescript
// In src/tools/index.ts
const client = getAirsClient();

const result = await client.scanSync({
    prompt: params.prompt,
    response: params.response,
    profile_name: params.profile || 'default'
});
```

## Next Steps

- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - See how tools use the AIRS client
- [Configuration Module]({{ site.baseurl }}/developers/src/config/) - Understand configuration management
- [Types Module]({{ site.baseurl }}/developers/src/types/) - Explore type definitions
