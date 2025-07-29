---
layout: documentation
title: AIRS Cache
permalink: /developers/src/airs/cache/
category: developers
---

# AIRS Cache Module (src/airs/cache.ts)

The cache module implements an in-memory Least Recently Used (LRU) cache for AIRS API responses. It provides performance
optimization by storing and reusing scan results for identical requests, reducing API calls and improving response
times.

## Overview

The `PrismaAirsCache` class provides:

- Content-based cache key generation for deterministic caching
- Configurable time-to-live (TTL) for cache entries
- Maximum size limits to control memory usage
- Cache statistics for monitoring performance
- Thread-safe operations

## Architecture

```
┌─────────────────────────────────────────┐
│           PrismaAirsCache               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Cache Storage                 │ │
│  │  Map<string, CacheEntry>          │ │
│  │  • Key: Content hash              │ │
│  │  • Value: Response + metadata     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      LRU Management                │ │
│  │  • Access tracking                 │ │
│  │  • Eviction policy                 │ │
│  │  • Size limits                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Statistics                    │ │
│  │  • Hit/miss counters               │ │
│  │  • Hit rate calculation            │ │
│  │  • Size tracking                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Cache Entry Structure

```typescript
interface CacheEntry<T> {
    data: T;                    // Cached response data
    timestamp: number;          // Creation timestamp
    lastAccessed: number;       // Last access timestamp
    hits: number;              // Access count
}
```

## Key Generation

### Content-Based Hashing

The cache uses a deterministic key generation algorithm that ignores transaction IDs:

```typescript
generateScanKey(request: ScanSyncRequest): string {
    const normalized = {
        request: request.request.map(req => ({
            prompt: req.prompt || '',
            response: req.response || '',
            context: req.context || '',
            profile_name: req.profile_name || 'default',
        })),
    };

    const content = JSON.stringify(normalized, Object.keys(normalized).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
}
```

**Key Properties:**

- Same content always generates the same key
- Transaction IDs are excluded from hashing
- Order-independent for object properties
- Profile names are included in the hash

### Example Key Generation

```typescript
// These requests generate the SAME cache key:
const request1 = {
    tr_id: 'transaction_123',
    request: [{ prompt: 'Hello', profile_name: 'default' }]
};

const request2 = {
    tr_id: 'transaction_456',  // Different tr_id
    request: [{ prompt: 'Hello', profile_name: 'default' }]
};

// These requests generate DIFFERENT cache keys:
const request3 = {
    tr_id: 'transaction_789',
    request: [{ prompt: 'Hello', profile_name: 'strict' }]  // Different profile
};
```

## API Methods

### constructor(options)

Creates a new cache instance with configuration options.

```typescript
constructor(options: CacheOptions = {})
```

**Options:**

```typescript
interface CacheOptions {
    ttlSeconds?: number;      // Time-to-live in seconds (default: 300)
    maxSize?: number;         // Maximum entries (default: 1000)
    cleanupInterval?: number; // Cleanup interval in ms (default: 60000)
}
```

**Example:**

```typescript
const cache = new PrismaAirsCache({
    ttlSeconds: 600,        // 10 minute TTL
    maxSize: 500,           // 500 entry limit
    cleanupInterval: 30000  // Clean every 30 seconds
});
```

### set(key, data)

Stores data in the cache with automatic eviction if needed.

```typescript
set(key: string, data: T): void
```

**Parameters:**

- `key: string` - Cache key (typically from generateScanKey)
- `data: T` - Data to cache

**Behavior:**

- Evicts LRU entry if cache is full
- Updates existing entries
- Tracks storage timestamp

### get(key)

Retrieves data from cache if valid.

```typescript
get(key: string): T | undefined
```

**Parameters:**

- `key: string` - Cache key to retrieve

**Returns:**

- `T` - Cached data if found and valid
- `undefined` - If not found or expired

**Behavior:**

- Updates last accessed time
- Increments hit counter
- Returns undefined for expired entries

### has(key)

Checks if a valid entry exists without updating access time.

```typescript
has(key: string): boolean
```

**Parameters:**

- `key: string` - Cache key to check

**Returns:**

- `boolean` - True if valid entry exists

### delete(key)

Removes an entry from the cache.

```typescript
delete(key: string): boolean
```

**Parameters:**

- `key: string` - Cache key to remove

**Returns:**

- `boolean` - True if entry was deleted

### clear()

Removes all entries from the cache.

```typescript
clear(): void
```

**Usage:**

```typescript
// Clear cache and reset statistics
cache.clear();
console.log(cache.size()); // 0
```

### getStats()

Returns cache performance statistics.

```typescript
getStats(): CacheStats
```

**Returns:**

```typescript
interface CacheStats {
    hits: number;          // Total cache hits
    misses: number;        // Total cache misses
    hitRate: number;       // Hit rate percentage (0-100)
    size: number;          // Current entry count
    evictions: number;     // Total evictions
    expirations: number;   // Total expirations
}
```

**Example:**

```typescript
const stats = cache.getStats();
console.log(`Hit rate: ${stats.hitRate.toFixed(2)}%`);
console.log(`Cache size: ${stats.size}/${cache['maxSize']}`);
```

## Cache Behavior

### TTL (Time-To-Live)

Entries expire after the configured TTL:

```typescript
private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttlMs;
}
```

### LRU Eviction

When cache is full, least recently used entries are removed:

```typescript
private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < lruTime) {
            lruTime = entry.lastAccessed;
            lruKey = key;
        }
    }

    if (lruKey) {
        this.cache.delete(lruKey);
        this.stats.evictions++;
    }
}
```

### Automatic Cleanup

Background cleanup removes expired entries:

```typescript
private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                this.stats.expirations++;
            }
        }
    }, this.cleanupInterval);
}
```

## Usage Patterns

### Basic Caching

```typescript
const cache = new PrismaAirsCache();

// Generate cache key
const key = cache.generateScanKey(request);

// Check cache first
const cached = cache.get(key);
if (cached) {
    return cached; // Cache hit
}

// Make API call on cache miss
const result = await apiClient.scanSync(request);

// Store in cache
cache.set(key, result);

return result;
```

### With Enhanced Client

The enhanced AIRS client uses the cache automatically:

```typescript
// Cache is integrated in the enhanced client
const client = new PrismaAIRSClientWithCache(baseClient, {
    cache: new PrismaAirsCache({ ttlSeconds: 600 })
});

// First call - cache miss, makes API request
const result1 = await client.scanSync(request);

// Second identical call - cache hit, returns immediately
const result2 = await client.scanSync(request);
```

### Cache Bypass

```typescript
// Force fresh API call
const freshResult = await client.scanSync(request, { 
    bypassCache: true 
});
```

## Performance Optimization

### Memory Management

1. **Size Limits**: Configure maxSize based on available memory
2. **TTL Tuning**: Balance freshness vs. performance
3. **Cleanup Interval**: Adjust based on traffic patterns

### Cache Sizing Guidelines

```typescript
// High-traffic production
const cache = new PrismaAirsCache({
    ttlSeconds: 300,     // 5 minutes
    maxSize: 10000,      // 10k entries
});

// Low-traffic development
const cache = new PrismaAirsCache({
    ttlSeconds: 3600,    // 1 hour
    maxSize: 100,        // 100 entries
});
```

### Hit Rate Optimization

Monitor and optimize cache hit rates:

```typescript
setInterval(() => {
    const stats = cache.getStats();
    if (stats.hitRate < 50) {
        logger.warn('Low cache hit rate', stats);
        // Consider increasing TTL or cache size
    }
}, 60000);
```

## Cache Key Examples

### Simple Prompt Scan

```typescript
const request = {
    tr_id: 'scan_123',
    request: [{
        prompt: 'Check this text',
        profile_name: 'default'
    }]
};

// Cache key based on: prompt + profile_name
const key = cache.generateScanKey(request);
```

### Complex Multi-Part Scan

```typescript
const request = {
    tr_id: 'scan_456',
    request: [{
        prompt: 'User question',
        response: 'AI response',
        context: 'Previous conversation',
        profile_name: 'strict'
    }]
};

// Cache key based on: prompt + response + context + profile_name
const key = cache.generateScanKey(request);
```

## Monitoring and Debugging

### Cache Metrics

```typescript
function logCacheMetrics(cache: PrismaAirsCache) {
    const stats = cache.getStats();
    
    logger.info('Cache metrics', {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        totalRequests: stats.hits + stats.misses,
        cacheSize: stats.size,
        evictions: stats.evictions,
        expirations: stats.expirations
    });
}
```

### Debug Logging

```typescript
// Log cache operations
cache.on('hit', (key) => {
    logger.debug('Cache hit', { key: key.substring(0, 8) });
});

cache.on('miss', (key) => {
    logger.debug('Cache miss', { key: key.substring(0, 8) });
});
```

## Testing

### Unit Tests

```typescript
describe('PrismaAirsCache', () => {
    let cache: PrismaAirsCache;

    beforeEach(() => {
        cache = new PrismaAirsCache({ ttlSeconds: 60 });
    });

    afterEach(() => {
        cache.clear();
    });

    it('should cache and retrieve data', () => {
        const key = 'test_key';
        const data = { result: 'test' };

        cache.set(key, data);
        expect(cache.get(key)).toEqual(data);
    });

    it('should generate consistent keys', () => {
        const request1 = createTestRequest('123');
        const request2 = createTestRequest('456');

        const key1 = cache.generateScanKey(request1);
        const key2 = cache.generateScanKey(request2);

        expect(key1).toBe(key2); // Same content, different tr_id
    });
});
```

### Integration Tests

```typescript
it('should improve performance with caching', async () => {
    const client = new PrismaAIRSClientWithCache(mockClient, {
        cache: new PrismaAirsCache()
    });

    const start1 = Date.now();
    await client.scanSync(request); // Cache miss
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await client.scanSync(request); // Cache hit
    const time2 = Date.now() - start2;

    expect(time2).toBeLessThan(time1 / 10); // 10x faster
});
```

## Best Practices

### 1. Configure for Your Use Case

```typescript
// Interactive applications - shorter TTL
new PrismaAirsCache({ ttlSeconds: 60 });

// Batch processing - longer TTL
new PrismaAirsCache({ ttlSeconds: 3600 });

// High-volume - larger cache
new PrismaAirsCache({ maxSize: 10000 });
```

### 2. Monitor Cache Performance

```typescript
// Regular monitoring
setInterval(() => {
    const stats = cache.getStats();
    metrics.gauge('cache.hit_rate', stats.hitRate);
    metrics.gauge('cache.size', stats.size);
}, 60000);
```

### 3. Handle Cache Failures Gracefully

```typescript
try {
    const cached = cache.get(key);
    if (cached) return cached;
} catch (error) {
    logger.error('Cache error', error);
    // Continue without cache
}
```

## Related Documentation

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Cache integration
- [Rate Limiter]({{ site.baseurl }}/developers/src/airs/rate-limiter/) - Complementary optimization
- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - Request/response types
- [Performance Guide]({{ site.baseurl }}/developers/performance/) - Optimization strategies