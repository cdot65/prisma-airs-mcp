---
layout: documentation
title: AIRS Cache
permalink: /developers/src/airs/cache/
category: developers
---

# AIRS Cache (src/airs/cache.ts)

In-memory TTL-based cache for AIRS API responses. Reduces API calls and improves response times.

## Core Purpose

- Cache AIRS API responses with time-based expiration
- Generate consistent cache keys for requests
- Provide cache statistics and management
- Prevent repeated API calls for identical requests

## Key Components

### PrismaAirsCache Class

```typescript
export class PrismaAirsCache {
    constructor(config: AirsCacheConfig) {
        // ttlSeconds: Time to live for entries
        // maxSize: Maximum cache size in bytes
    }
    
    // Core cache operations
    get<T>(key: string): T | null
    set<T>(key: string, value: T): void
    delete(key: string): void
    clear(): void
    
    // Static key generation
    static generateScanKey(type: string, request: any): string
    static generateResultKey(type: string, ids: string[]): string
}
```

### Cache Entry Structure

```typescript
interface CacheEntry {
    value: any;
    expiresAt: number;  // Unix timestamp
    size: number;       // Bytes
}
```

## Integration in Application

- **Used By**: Enhanced AIRS client for response caching
- **TTL Configuration**: Default 300 seconds (5 minutes)
- **Size Limit**: Configurable max size in bytes
- **Eviction**: TTL-based with size constraints

## Key Features

### Automatic Expiration

- Entries expire after TTL seconds
- Expired entries removed on access

### Size Management

- Tracks cache size in bytes
- Evicts oldest entries when size limit reached

### Performance Stats

```typescript
getCacheStats(): {
    size: number;    // Current size in bytes
    count: number;   // Number of entries
    enabled: boolean;
}
```

## Cache Key Patterns

- **Sync Scans**: `sync:${hash(request)}`
- **Scan Results**: `scan-results:${sortedIds.join(',')}`
- **Threat Reports**: `threat-reports:${sortedIds.join(',')}`

## Related Modules

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Uses cache for API responses
- [Rate Limiter]({{ site.baseurl }}/developers/src/airs/rate-limiter/) - Works alongside for API management
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Cache settings