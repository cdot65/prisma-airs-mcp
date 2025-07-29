---
layout: documentation
title: AIRS Cache
permalink: /developers/src/airs/cache/
category: developers
---

The cache module implements an in-memory TTL-based cache for AIRS API responses. It provides performance
optimization by storing and reusing scan results for identical requests, reducing API calls and improving response
times. The cache evicts entries based on expiration time when space is needed.

## Overview

The `PrismaAirsCache` class provides:

- Content-based cache key generation for deterministic caching
- Configurable time-to-live (TTL) for cache entries
- Maximum size limits (in bytes) to control memory usage
- Cache statistics (size, count, enabled status)
- Automatic eviction when size limit is reached

## Architecture

```text
┌─────────────────────────────────────────┐
│           PrismaAirsCache               │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Cache Storage                │  │
│  │  Map<string, CacheEntry>          │  │
│  │  • Key: Content hash              │  │
│  │  • Value: Response + metadata     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Size Management              │  │
│  │  • Size estimation                │  │
│  │  • Eviction by expiration         │  │
│  │  • Byte-based limits              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Statistics                   │  │
│  │  • Current size (bytes)           │  │
│  │  • Entry count                    │  │
│  │  • Enabled status                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Cache Entry Structure

```typescript
interface CacheEntry<T> {
    data: T;          // Cached response data
    expiresAt: number; // Expiration timestamp (Date.now() + ttl * 1000)
    size: number;      // Estimated size in bytes
}
```

## Key Generation

### Content-Based Hashing

The cache uses static methods for deterministic key generation:

```typescript
static generateScanKey(method: string, data: unknown): string {
    // Only hash the content and profile, not the tr_id or metadata
    const scanData = data as { ai_profile: unknown; contents: unknown };
    const cacheableData = {
        profile: scanData.ai_profile,
        contents: scanData.contents,
    };
    const hash = this.simpleHash(JSON.stringify(cacheableData));
    return `scan:${method}:${hash}`;
}

static generateResultKey(type: string, ids: string[]): string {
    return `${type}:${ids.sort().join(',')}`;
}
```

**Key Properties:**

- Uses a simple hash function (not crypto hash)
- Includes method/type prefix in the key
- For scans: hashes profile and contents only
- For results: concatenates sorted IDs

### Example Key Generation

```typescript
// Scan key generation
const scanData = {
    ai_profile: { name: 'default' },
    contents: [{ text: 'Hello world' }],
    tr_id: 'transaction_123'  // Ignored in key generation
};

const key = PrismaAirsCache.generateScanKey('sync', scanData);
// Returns: "scan:sync:abc123" (where abc123 is the hash)

// Result key generation
const resultKey = PrismaAirsCache.generateResultKey('scan-results', ['scan_123', 'scan_456']);
// Returns: "scan-results:scan_123,scan_456"
```

## API Methods

### constructor(config)

Creates a new cache instance with configuration.

```typescript
constructor(config: AirsCacheConfig)
```

**Configuration:**

```typescript
interface AirsCacheConfig {
    enabled?: boolean;    // Whether caching is enabled (default: true)
    ttlSeconds: number;   // Time-to-live in seconds
    maxSize: number;      // Maximum cache size in bytes
}
```

**Example:**

```typescript
const cache = new PrismaAirsCache({
    enabled: true,
    ttlSeconds: 300,     // 5 minute TTL
    maxSize: 10485760    // 10MB limit
});
```

### set(key, data, ttlOverride?)

Stores data in the cache with automatic eviction if needed.

```typescript
set<T>(key: string, data: T, ttlOverride?: number): void
```

**Parameters:**

- `key: string` - Cache key
- `data: T` - Data to cache
- `ttlOverride?: number` - Optional TTL override in seconds

**Behavior:**

- Evicts oldest entries by expiration time if size limit exceeded
- Deletes existing entry before adding new one
- Estimates size using JSON serialization

### get(key)

Retrieves data from cache if valid.

```typescript
get<T>(key: string): T | undefined
```

**Parameters:**

- `key: string` - Cache key to retrieve

**Returns:**

- `T` - Cached data if found and not expired
- `undefined` - If not found, expired, or cache disabled

**Behavior:**

- Checks if cache is enabled
- Deletes expired entries automatically
- Logs cache hits for debugging

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

Returns cache statistics.

```typescript
getStats(): {
    size: number;
    count: number;
    enabled: boolean;
}
```

**Returns:**

- `size: number` - Current cache size in bytes
- `count: number` - Number of cached entries
- `enabled: boolean` - Whether cache is enabled

**Example:**

```typescript
const stats = cache.getStats();
console.log(`Cache size: ${stats.size} bytes`);
console.log(`Entry count: ${stats.count}`);
console.log(`Enabled: ${stats.enabled}`);
```

### destroy()

Destroys the cache and cleans up resources.

```typescript
destroy(): void
```

**Usage:**

```typescript
// Clean up cache when shutting down
cache.destroy();
```

## Cache Behavior

### TTL (Time-To-Live)

Entries expire after the configured TTL:

```typescript
// Check if expired
if (Date.now() > entry.expiresAt) {
    this.delete(key);
    return undefined;
}
```

### Size-Based Eviction

When cache size limit is reached, oldest entries by expiration time are removed:

```typescript
private evictOldest(): void {
    const sortedEntries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.expiresAt - b.expiresAt,
    );

    for (const [key] of sortedEntries) {
        if (this.currentSize <= this.config.maxSize * 0.9) {
            break;
        }

        this.delete(key);
    }
}
```

### No Automatic Cleanup

The cache does not have a background cleanup timer. Expired entries are removed lazily when accessed via `get()` method.

## Usage Patterns

### Basic Caching

```typescript
const cache = new PrismaAirsCache({
    enabled: true,
    ttlSeconds: 300,
    maxSize: 10485760  // 10MB
});

// Generate cache key using static method
const key = PrismaAirsCache.generateScanKey('sync', scanData);

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

The enhanced AIRS client (in index.ts) uses the cache automatically:

```typescript
// Cache is configured when creating enhanced client
const cache = new PrismaAirsCache({
    enabled: true,
    ttlSeconds: 600,
    maxSize: 10485760
});

const client = createEnhancedClient(baseClient, cache);

// First call - cache miss, makes API request
const result1 = await client.scanSync(request);

// Second identical call - cache hit, returns immediately
const result2 = await client.scanSync(request);
```

## Performance Optimization

### Memory Management

1. **Size Limits**: Configure maxSize in bytes based on available memory
2. **TTL Tuning**: Balance freshness vs. performance
3. **Eviction**: Automatic when size limit is reached (90% threshold)

### Cache Sizing Guidelines

```typescript
// High-traffic production
const cache = new PrismaAirsCache({
    enabled: true,
    ttlSeconds: 300,      // 5 minutes
    maxSize: 104857600    // 100MB
});

// Low-traffic development
const cache = new PrismaAirsCache({
    enabled: true,
    ttlSeconds: 3600,     // 1 hour
    maxSize: 10485760     // 10MB
});
```

### Cache Monitoring

Monitor cache usage:

```typescript
setInterval(() => {
    const stats = cache.getStats();
    logger.info('Cache stats', {
        sizeBytes: stats.size,
        entries: stats.count,
        enabled: stats.enabled,
        utilization: ((stats.size / maxSize) * 100).toFixed(2) + '%'
    });
}, 60000);
```

## Cache Key Examples

```typescript
// For scan requests - uses static method
const scanData = {
    ai_profile: { name: 'default', version: '1.0' },
    contents: [{ text: 'User input to scan' }]
};
const scanKey = PrismaAirsCache.generateScanKey('sync', scanData);
// Returns: "scan:sync:abc123"

// For result requests - uses static method  
const resultKey = PrismaAirsCache.generateResultKey(
    'scan-results', 
    ['scan_123', 'scan_456']
);
// Returns: "scan-results:scan_123,scan_456"
```

## Monitoring and Debugging

### Cache Metrics

```typescript
function logCacheMetrics(cache: PrismaAirsCache) {
    const stats = cache.getStats();
    
    logger.info('Cache metrics', {
        sizeBytes: stats.size,
        entryCount: stats.count,
        enabled: stats.enabled,
        sizeMB: (stats.size / 1048576).toFixed(2)
    });
}
```

### Debug Logging

The cache logs debug information internally:

```typescript
// Cache operations are logged automatically
// Set LOG_LEVEL=debug to see cache hits/misses
logger.debug('Cache hit', { key });
logger.debug('Cache miss', { key });
logger.debug('Cache set', { key, size, expiresAt });
logger.debug('Cache delete', { key });
```

## Testing

### Unit Tests

```typescript
describe('PrismaAirsCache', () => {
    let cache: PrismaAirsCache;

    beforeEach(() => {
        cache = new PrismaAirsCache({ 
            enabled: true,
            ttlSeconds: 60,
            maxSize: 1048576  // 1MB
        });
    });

    afterEach(() => {
        cache.destroy();
    });

    it('should cache and retrieve data', () => {
        const key = 'test_key';
        const data = { result: 'test' };

        cache.set(key, data);
        expect(cache.get(key)).toEqual(data);
    });

    it('should generate consistent keys', () => {
        const data1 = { ai_profile: 'default', contents: ['test'] };
        const data2 = { ai_profile: 'default', contents: ['test'] };

        const key1 = PrismaAirsCache.generateScanKey('sync', data1);
        const key2 = PrismaAirsCache.generateScanKey('sync', data2);

        expect(key1).toBe(key2); // Same content
    });
});
```

### Integration Tests

```typescript
it('should improve performance with caching', async () => {
    const cache = new PrismaAirsCache({
        enabled: true,
        ttlSeconds: 300,
        maxSize: 10485760
    });

    // Mock the enhanced client behavior
    const cachedScan = async (request) => {
        const key = PrismaAirsCache.generateScanKey('sync', request);
        const cached = cache.get(key);
        if (cached) return cached;
        
        const result = await mockClient.scanSync(request);
        cache.set(key, result);
        return result;
    };

    const start1 = Date.now();
    await cachedScan(request); // Cache miss
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await cachedScan(request); // Cache hit
    const time2 = Date.now() - start2;

    expect(time2).toBeLessThan(time1 / 10); // 10x faster
});
```

## Best Practices

### 1. Configure for Your Use Case

```typescript
// Interactive applications - shorter TTL
new PrismaAirsCache({ 
    enabled: true,
    ttlSeconds: 60,
    maxSize: 10485760  // 10MB
});

// Batch processing - longer TTL
new PrismaAirsCache({ 
    enabled: true,
    ttlSeconds: 3600,
    maxSize: 52428800  // 50MB
});

// Development - disable cache
new PrismaAirsCache({ 
    enabled: false,
    ttlSeconds: 0,
    maxSize: 0
});
```

### 2. Monitor Cache Performance

```typescript
// Regular monitoring
setInterval(() => {
    const stats = cache.getStats();
    metrics.gauge('cache.size_bytes', stats.size);
    metrics.gauge('cache.entry_count', stats.count);
    metrics.gauge('cache.enabled', stats.enabled ? 1 : 0);
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
