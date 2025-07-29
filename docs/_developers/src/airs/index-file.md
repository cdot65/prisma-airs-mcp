---
layout: documentation
title: Enhanced AIRS Client
permalink: /developers/src/airs/index-file/
category: developers
---

# Enhanced AIRS Client Module (src/airs/index.ts)

The enhanced AIRS client module wraps the base client with additional capabilities including response caching and rate
limiting. It provides a transparent layer that improves performance and prevents API quota exhaustion while maintaining
the same interface as the base client.

## Overview

The `PrismaAIRSClientWithCache` class provides:

- Transparent response caching for identical requests
- Token bucket rate limiting for API quota management
- Cache bypass options for fresh data
- Statistics and monitoring capabilities
- Seamless integration with the base client API

## Architecture

```
┌─────────────────────────────────────────┐
│    PrismaAIRSClientWithCache            │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Request Flow                  │ │
│  │                                    │ │
│  │  1. Check Rate Limit              │ │
│  │  2. Check Cache                   │ │
│  │  3. Call Base Client              │ │
│  │  4. Cache Response                │ │
│  │  5. Return Result                  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Components                    │ │
│  │  • Base Client                     │ │
│  │  • Cache (Optional)                │ │
│  │  • Rate Limiter (Optional)         │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Class Definition

### Constructor

```typescript
constructor(
    client: PrismaAIRSClient,
    options: {
        cache?: PrismaAirsCache;
        rateLimiter?: TokenBucketRateLimiter;
    } = {}
)
```

**Parameters:**

- `client: PrismaAIRSClient` - Base AIRS client instance
- `options.cache?: PrismaAirsCache` - Optional cache instance
- `options.rateLimiter?: TokenBucketRateLimiter` - Optional rate limiter

**Example:**

```typescript
const enhancedClient = new PrismaAIRSClientWithCache(
    baseClient,
    {
        cache: new PrismaAirsCache({ ttlSeconds: 300 }),
        rateLimiter: new TokenBucketRateLimiter({ enabled: true })
    }
);
```

## Enhanced Methods

### scanSync(request, options?)

Performs synchronous scanning with caching and rate limiting.

```typescript
async scanSync(
    request: ScanSyncRequest,
    options?: { bypassCache?: boolean }
): Promise<ScanSyncResponse>
```

**Parameters:**

- `request: ScanSyncRequest` - Scan request
- `options.bypassCache?: boolean` - Skip cache lookup

**Flow:**

1. Check rate limit availability
2. Generate cache key from request
3. Check cache (unless bypassed)
4. Call base client on cache miss
5. Cache successful response
6. Return result

**Example:**

```typescript
// Normal request - uses cache
const result = await client.scanSync({
    tr_id: 'scan_123',
    request: [{
        prompt: 'Check this content',
        profile_name: 'default'
    }]
});

// Force fresh scan - bypass cache
const freshResult = await client.scanSync(request, {
    bypassCache: true
});
```

### scanAsync(request)

Initiates asynchronous scanning with rate limiting.

```typescript
async scanAsync(request: ScanAsyncRequest): Promise<ScanAsyncResponse>
```

**Parameters:**

- `request: ScanAsyncRequest` - Async scan request

**Note:** Async scans are not cached as they return scan IDs, not results.

**Example:**

```typescript
const response = await client.scanAsync({
    requests: [
        {
            tr_id: 'batch_1',
            request: [{ prompt: 'Content 1', profile_name: 'strict' }]
        }
    ]
});

console.log('Scan ID:', response.scan_id);
```

### getScanResults(scanIds)

Retrieves scan results with caching and rate limiting.

```typescript
async getScanResults(scanIds: string[]): Promise<ScanResult[]>
```

**Parameters:**

- `scanIds: string[]` - Array of scan IDs

**Caching:** Results are cached by scan ID for completed scans.

**Example:**

```typescript
const results = await client.getScanResults(['scan_123', 'scan_456']);

// Subsequent calls for same IDs use cache
const cachedResults = await client.getScanResults(['scan_123']);
```

### getThreatReports(reportIds)

Retrieves threat reports with caching and rate limiting.

```typescript
async getThreatReports(reportIds: string[]): Promise<ThreatReport[]>
```

**Parameters:**

- `reportIds: string[]` - Array of report IDs

**Example:**

```typescript
const reports = await client.getThreatReports(['report_abc']);
```

## Cache Management

### Cache Key Generation

The enhanced client uses content-based cache keys:

```typescript
// For sync scans
const cacheKey = this.cache.generateScanKey(request);

// For results/reports
const cacheKey = `scan_results_${scanIds.sort().join('_')}`;
const cacheKey = `threat_reports_${reportIds.sort().join('_')}`;
```

### Cache Behavior

1. **Hit**: Returns cached data immediately
2. **Miss**: Calls base client and caches result
3. **Bypass**: Skips cache lookup but still caches result
4. **Error**: Errors are not cached

### Cache Statistics

```typescript
const stats = client.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
console.log(`Cache size: ${stats.size}`);
```

## Rate Limiting

### Rate Limit Checking

Each method checks rate limits before proceeding:

```typescript
private checkRateLimit(operation: string): void {
    if (this.rateLimiter && !this.rateLimiter.tryConsume(operation)) {
        throw new AIRSAPIError(
            'Rate limit exceeded. Please try again later.',
            429,
            'RATE_LIMIT_EXCEEDED'
        );
    }
}
```

### Rate Limit Operations

- `scanSync`: Per sync scan request
- `scanAsync`: Per async scan request
- `getScanResults`: Per results retrieval
- `getThreatReports`: Per reports retrieval

### Rate Limit Status

```typescript
const status = client.getRateLimitStatus();
console.log('Available tokens:', status.scanSync.available);
console.log('Next refill:', status.scanSync.nextRefill);
```

## Usage Patterns

### Basic Usage

```typescript
// Create enhanced client with all features
const client = new PrismaAIRSClientWithCache(
    new PrismaAIRSClient({ apiKey: 'your-key' }),
    {
        cache: new PrismaAirsCache({ ttlSeconds: 300 }),
        rateLimiter: new TokenBucketRateLimiter({ enabled: true })
    }
);

// Use like base client
const result = await client.scanSync(request);
```

### Conditional Caching

```typescript
async function scanContent(content: string, useCache: boolean = true) {
    const client = getAirsClient();
    
    const request = {
        tr_id: generateId(),
        request: [{
            prompt: content,
            profile_name: 'default'
        }]
    };

    if (!useCache) {
        return await client.scanSync(request, { bypassCache: true });
    }

    return await client.scanSync(request);
}
```

### Error Handling

```typescript
try {
    const result = await client.scanSync(request);
} catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
        // Handle rate limiting
        console.log('Rate limited, retry later');
    } else if (error.status === 401) {
        // Handle auth errors
        console.log('Invalid API key');
    } else {
        // Handle other errors
        throw error;
    }
}
```

### Monitoring Integration

```typescript
// Log cache performance
setInterval(() => {
    const stats = client.getCacheStats();
    logger.info('Cache performance', {
        hitRate: stats.hitRate,
        size: stats.size,
        evictions: stats.evictions
    });
}, 60000);

// Monitor rate limits
const rateLimitStatus = client.getRateLimitStatus();
if (rateLimitStatus.scanSync.available < 10) {
    logger.warn('Low rate limit tokens', rateLimitStatus);
}
```

## Configuration Examples

### High-Performance Setup

```typescript
// Aggressive caching, moderate rate limits
const client = new PrismaAIRSClientWithCache(
    baseClient,
    {
        cache: new PrismaAirsCache({
            ttlSeconds: 600,      // 10 minute cache
            maxSize: 10000        // Large cache
        }),
        rateLimiter: new TokenBucketRateLimiter({
            limits: {
                scanSync: {
                    maxTokens: 200,     // Burst capacity
                    refillRate: 100,
                    refillInterval: 60000
                }
            }
        })
    }
);
```

### Conservative Setup

```typescript
// Short cache, strict rate limits
const client = new PrismaAIRSClientWithCache(
    baseClient,
    {
        cache: new PrismaAirsCache({
            ttlSeconds: 60,       // 1 minute cache
            maxSize: 100          // Small cache
        }),
        rateLimiter: new TokenBucketRateLimiter({
            limits: {
                scanSync: {
                    maxTokens: 50,
                    refillRate: 50,
                    refillInterval: 60000
                }
            }
        })
    }
);
```

### No Enhancement Setup

```typescript
// Direct base client usage
const client = new PrismaAIRSClientWithCache(
    baseClient,
    {
        // No cache or rate limiter
    }
);
```

## Performance Metrics

### Cache Effectiveness

```typescript
function analyzeCachePerformance(client: PrismaAIRSClientWithCache) {
    const stats = client.getCacheStats();
    
    return {
        effectiveness: stats.hitRate,
        memorySaved: stats.hits * AVG_RESPONSE_SIZE,
        apiCallsSaved: stats.hits,
        costSaved: stats.hits * API_CALL_COST
    };
}
```

### Rate Limit Utilization

```typescript
function analyzeRateLimitUsage(client: PrismaAIRSClientWithCache) {
    const status = client.getRateLimitStatus();
    
    return Object.entries(status).map(([op, data]) => ({
        operation: op,
        utilization: ((data.max - data.available) / data.max) * 100,
        rejected: data.rejected
    }));
}
```

## Testing

### Unit Tests

```typescript
describe('PrismaAIRSClientWithCache', () => {
    let client: PrismaAIRSClientWithCache;
    let mockBaseClient: jest.Mocked<PrismaAIRSClient>;
    let cache: PrismaAirsCache;

    beforeEach(() => {
        mockBaseClient = createMockClient();
        cache = new PrismaAirsCache({ ttlSeconds: 60 });
        
        client = new PrismaAIRSClientWithCache(mockBaseClient, {
            cache
        });
    });

    it('should cache scan results', async () => {
        const request = createTestRequest();
        
        // First call - cache miss
        await client.scanSync(request);
        expect(mockBaseClient.scanSync).toHaveBeenCalledTimes(1);

        // Second call - cache hit
        await client.scanSync(request);
        expect(mockBaseClient.scanSync).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when requested', async () => {
        const request = createTestRequest();
        
        await client.scanSync(request);
        await client.scanSync(request, { bypassCache: true });
        
        expect(mockBaseClient.scanSync).toHaveBeenCalledTimes(2);
    });
});
```

### Integration Tests

```typescript
it('should handle rate limiting gracefully', async () => {
    const client = new PrismaAIRSClientWithCache(baseClient, {
        rateLimiter: new TokenBucketRateLimiter({
            limits: {
                scanSync: {
                    maxTokens: 2,
                    refillRate: 1,
                    refillInterval: 1000
                }
            }
        })
    });

    // Use up tokens
    await client.scanSync(request1);
    await client.scanSync(request2);

    // Should be rate limited
    await expect(client.scanSync(request3))
        .rejects.toThrow('Rate limit exceeded');
});
```

## Best Practices

### 1. Use Factory Pattern

```typescript
// Don't create clients directly
import { getAirsClient } from './airs/factory';

const client = getAirsClient(); // Properly configured
```

### 2. Monitor Cache Hit Rate

```typescript
// Track cache effectiveness
if (client.getCacheStats().hitRate < 30) {
    logger.warn('Low cache hit rate - consider adjusting TTL');
}
```

### 3. Handle All Error Types

```typescript
try {
    await client.scanSync(request);
} catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
        // Retry with backoff
    } else if (error.status >= 500) {
        // Server error - might be transient
    } else {
        // Client error - don't retry
    }
}
```

### 4. Use Appropriate Cache TTL

```typescript
// Short TTL for dynamic content
const shortCache = new PrismaAirsCache({ ttlSeconds: 60 });

// Long TTL for stable content
const longCache = new PrismaAirsCache({ ttlSeconds: 3600 });
```

## Troubleshooting

### Cache Not Working

1. **Check Cache Instance**: Ensure cache is provided to constructor
2. **Verify TTL**: Check if TTL is too short
3. **Monitor Stats**: Use getCacheStats() to debug
4. **Check Keys**: Verify cache key generation

### Rate Limiting Issues

1. **Check Configuration**: Verify rate limit settings
2. **Monitor Usage**: Track token consumption
3. **Adjust Limits**: Increase limits if needed
4. **Add Retry Logic**: Implement exponential backoff

### Performance Problems

1. **Cache Size**: Monitor cache memory usage
2. **Hit Rate**: Optimize cache key generation
3. **Network**: Check base client timeouts
4. **Logging**: Reduce debug logging in production

## Related Documentation

- [Base Client]({{ site.baseurl }}/developers/src/airs/client/) - Core API functionality
- [Cache Module]({{ site.baseurl }}/developers/src/airs/cache/) - Caching implementation
- [Rate Limiter]({{ site.baseurl }}/developers/src/airs/rate-limiter/) - Rate limiting details
- [Factory]({{ site.baseurl }}/developers/src/airs/factory/) - Client instantiation
- [Types]({{ site.baseurl }}/developers/src/types/airs-types/) - Type definitions