---
layout: documentation
title: Enhanced AIRS Client
permalink: /developers/src/airs/index-file/
category: developers
---

# Enhanced AIRS Client Module (src/airs/index.ts)

The enhanced AIRS client module provides an enhanced wrapper around the base Prisma AIRS API client, adding critical
production features including response caching and rate limiting. It orchestrates the base client, cache, and rate
limiter to provide a robust, production-ready interface.

## Overview

The `EnhancedPrismaAirsClient` class provides:

- Transparent response caching for identical requests
- Token bucket rate limiting for API quota management
- Cache bypass options for fresh data
- Statistics and monitoring capabilities
- Seamless integration with the base client API

## Architecture

```
┌─────────────────────────────────────────┐
│    EnhancedPrismaAirsClient             │
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
constructor(config: AirsEnhancedClientConfig)
```

**Configuration:**

```typescript
interface AirsEnhancedClientConfig {
    apiUrl: string;
    apiKey: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
    cache?: AirsCacheConfig;
    rateLimiter?: AirsRateLimiterConfig;
}
```

**Example:**

```typescript
const client = new EnhancedPrismaAirsClient({
    apiUrl: 'https://api.airs.example.com',
    apiKey: 'your-api-key',
    cache: { ttlSeconds: 300, maxSize: 10485760, enabled: true },
    rateLimiter: { maxRequests: 100, windowMs: 60000, enabled: true }
});
```

## Enhanced Methods

### scanSync(request, options?)

Performs synchronous scanning with caching and rate limiting.

```typescript
async scanSync(
    request: AirsScanRequest,
    options?: AirsRequestOptions
): Promise<AirsScanResponse>
```

**Parameters:**

- `request: AirsScanRequest` - Scan request
- `options?: AirsRequestOptions` - Optional request options (headers, signal)

**Flow:**

1. Wait for rate limit availability (if rate limiter enabled)
2. Generate cache key using static method
3. Check cache for existing result
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

// With custom options
const result2 = await client.scanSync(request, {
    headers: { 'x-custom-header': 'value' }
});
```

### scanAsync(requests, options?)

Initiates asynchronous scanning with rate limiting.

```typescript
async scanAsync(
    requests: AirsAsyncScanObject[],
    options?: AirsRequestOptions
): Promise<AirsAsyncScanResponse>
```

**Parameters:**

- `requests: AirsAsyncScanObject[]` - Array of async scan objects
- `options?: AirsRequestOptions` - Optional request options

**Note:** Async scans are not cached as they return scan IDs, not results.

**Example:**

```typescript
const response = await client.scanAsync([
    {
        tr_id: 'batch_1',
        request: [{ prompt: 'Content 1', profile_name: 'strict' }]
    },
    {
        tr_id: 'batch_2',
        request: [{ prompt: 'Content 2', profile_name: 'strict' }]
    }
]);

// Response contains scan IDs for polling
console.log('Scan IDs:', response.scan_ids);
```

### getScanResults(scanIds, options?)

Retrieves scan results with caching and rate limiting.

```typescript
async getScanResults(
    scanIds: string[],
    options?: AirsRequestOptions
): Promise<AirsScanIdResult[]>
```

**Parameters:**

- `scanIds: string[]` - Array of scan IDs
- `options?: AirsRequestOptions` - Optional request options

**Caching:** Results are only cached when ALL results have status 'complete'.

**Example:**

```typescript
const results = await client.getScanResults(['scan_123', 'scan_456']);

// Subsequent calls for same IDs use cache
const cachedResults = await client.getScanResults(['scan_123']);
```

### getThreatScanReports(reportIds, options?)

Retrieves threat reports with caching and rate limiting.

```typescript
async getThreatScanReports(
    reportIds: string[],
    options?: AirsRequestOptions
): Promise<AirsThreatScanReportObject[]>
```

**Parameters:**

- `reportIds: string[]` - Array of report IDs
- `options?: AirsRequestOptions` - Optional request options

**Example:**

```typescript
const reports = await client.getThreatScanReports(['report_abc']);
```

## Cache Management

### Cache Key Generation

The enhanced client uses static methods for cache key generation:

```typescript
// For sync scans
const cacheKey = PrismaAirsCache.generateScanKey('sync', request);

// For results/reports
const cacheKey = PrismaAirsCache.generateResultKey('scan-results', scanIds);
const cacheKey = PrismaAirsCache.generateResultKey('threat-reports', reportIds);
```

### Cache Behavior

1. **Hit**: Returns cached data immediately
2. **Miss**: Calls base client and caches result
3. **Error**: Errors are not cached
4. **Complete Results**: Only complete scan results are cached

### Cache Statistics

```typescript
const stats = client.getCacheStats();
if (stats) {
    console.log(`Cache size: ${stats.size} bytes`);
    console.log(`Entry count: ${stats.count}`);
    console.log(`Enabled: ${stats.enabled}`);
}
```

## Rate Limiting

### Rate Limit Checking

Each method waits for rate limit availability:

```typescript
// Check rate limit
if (this.rateLimiter) {
    await this.rateLimiter.waitForLimit('scan');
}
```

### Rate Limit Keys

- `scan`: For both sync and async scan requests
- `results`: For scan results retrieval
- `reports`: For threat report retrieval

### Rate Limiter Statistics

```typescript
const stats = client.getRateLimiterStats();
if (stats) {
    console.log('Bucket count:', stats.bucketCount);
    console.log('Enabled:', stats.enabled);
}
```

## Usage Patterns

### Basic Usage

```typescript
// Create enhanced client with all features
const client = new EnhancedPrismaAirsClient({
    apiUrl: 'https://api.airs.example.com',
    apiKey: 'your-key',
    cache: {
        ttlSeconds: 300,
        maxSize: 10485760,
        enabled: true
    },
    rateLimiter: {
        maxRequests: 100,
        windowMs: 60000,
        enabled: true
    }
});

// Use just like base client
const result = await client.scanSync(request);
```

### Additional Methods

```typescript
// Clear the cache
client.clearCache();

// Reset rate limits
client.resetRateLimits();

// Get cache statistics
const cacheStats = client.getCacheStats();

// Get rate limiter statistics
const rateLimiterStats = client.getRateLimiterStats();
```

### Error Handling

```typescript
try {
    const result = await client.scanSync(request);
} catch (error) {
    if (error instanceof PrismaAirsApiError) {
        if (error.statusCode === 429) {
            // Rate limited by API (not local rate limiter)
            console.log('API rate limit exceeded');
        } else if (error.statusCode === 401) {
            // Handle auth errors
            console.log('Invalid API key');
        }
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
    if (stats) {
        logger.info('Cache performance', {
            size: stats.size,
            count: stats.count,
            enabled: stats.enabled
        });
    }
}, 60000);

// Monitor rate limiter
const rateLimiterStats = client.getRateLimiterStats();
if (rateLimiterStats) {
    logger.info('Rate limiter status', {
        bucketCount: rateLimiterStats.bucketCount,
        enabled: rateLimiterStats.enabled
    });
}
```

## Configuration Examples

### High-Performance Setup

```typescript
// Aggressive caching, moderate rate limits
const client = new EnhancedPrismaAirsClient({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    cache: {
        ttlSeconds: 600,      // 10 minute cache
        maxSize: 104857600,   // 100MB cache
        enabled: true
    },
    rateLimiter: {
        maxRequests: 200,     // Higher limit
        windowMs: 60000,      // Per minute
        enabled: true
    }
});
```

### Conservative Setup

```typescript
// Short cache, strict rate limits
const client = new EnhancedPrismaAirsClient({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    cache: {
        ttlSeconds: 60,       // 1 minute cache
        maxSize: 10485760,    // 10MB cache
        enabled: true
    },
    rateLimiter: {
        maxRequests: 50,      // Lower limit
        windowMs: 60000,      // Per minute
        enabled: true
    }
});
```

### No Enhancement Setup

```typescript
// Without cache or rate limiter
const client = new EnhancedPrismaAirsClient({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
    // No cache or rateLimiter config
});
```

## Performance Metrics

### Performance Monitoring

```typescript
function monitorClientPerformance(client: EnhancedPrismaAirsClient) {
    const cacheStats = client.getCacheStats();
    const rateLimiterStats = client.getRateLimiterStats();
    
    return {
        cache: {
            enabled: cacheStats?.enabled || false,
            sizeBytes: cacheStats?.size || 0,
            entryCount: cacheStats?.count || 0
        },
        rateLimiter: {
            enabled: rateLimiterStats?.enabled || false,
            bucketCount: rateLimiterStats?.bucketCount || 0
        }
    };
}
```

## Testing

### Unit Tests

```typescript
describe('EnhancedPrismaAirsClient', () => {
    let client: EnhancedPrismaAirsClient;

    beforeEach(() => {
        client = new EnhancedPrismaAirsClient({
            apiUrl: 'https://test.api.com',
            apiKey: 'test-key',
            cache: {
                ttlSeconds: 60,
                maxSize: 1048576,
                enabled: true
            }
        });
    });

    it('should cache scan results', async () => {
        const request = createTestRequest();
        
        // Mock the underlying HTTP call
        jest.spyOn(client['client'], 'scanSync')
            .mockResolvedValue(mockResponse);
        
        // First call - cache miss
        await client.scanSync(request);
        expect(client['client'].scanSync).toHaveBeenCalledTimes(1);

        // Second call - cache hit
        await client.scanSync(request);
        expect(client['client'].scanSync).toHaveBeenCalledTimes(1);
    });
});
```

### Integration Tests

```typescript
it('should handle rate limiting gracefully', async () => {
    const client = new EnhancedPrismaAirsClient({
        apiUrl: 'https://test.api.com',
        apiKey: 'test-key',
        rateLimiter: {
            maxRequests: 2,
            windowMs: 1000,
            enabled: true
        }
    });

    // Use up tokens
    await client.scanSync(request1);
    await client.scanSync(request2);

    // Third request will wait for rate limit
    const startTime = Date.now();
    await client.scanSync(request3);
    const elapsed = Date.now() - startTime;
    
    // Should have waited
    expect(elapsed).toBeGreaterThan(900);
});
```

## Best Practices

### 1. Use Factory Pattern

```typescript
// Don't create clients directly
import { getAirsClient } from './airs/factory';

const client = getAirsClient(); // Properly configured
```

### 2. Monitor Cache Usage

```typescript
// Track cache effectiveness
const stats = client.getCacheStats();
if (stats && stats.count > 0) {
    logger.info('Cache usage', {
        entries: stats.count,
        sizeBytes: stats.size
    });
}
```

### 3. Handle All Error Types

```typescript
try {
    await client.scanSync(request);
} catch (error) {
    if (error instanceof PrismaAirsApiError) {
        if (error.statusCode === 429) {
            // API rate limit - retry with backoff
        } else if (error.statusCode >= 500) {
            // Server error - might be transient
        } else {
            // Client error - don't retry
        }
    }
}
```

### 4. Clear Resources When Needed

```typescript
// Clear cache when data changes
client.clearCache();

// Reset rate limits for testing
client.resetRateLimits();
```

## Troubleshooting

### Cache Not Working

1. **Check Configuration**: Ensure cache config is provided and enabled
2. **Verify TTL**: Check if TTL is too short
3. **Monitor Stats**: Use getCacheStats() to debug
4. **Check Keys**: Verify cache key generation with static methods

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