---
layout: documentation
title: AIRS Factory
permalink: /developers/src/airs/factory/
category: developers
---

Singleton factory for creating and managing the enhanced AIRS client instance. Ensures consistent configuration across the application.

## Core Purpose

- Provide singleton instance of enhanced AIRS client
- Configure client with environment settings
- Initialize cache and rate limiter components
- Expose cache/rate limit management methods

## Key Components

### Factory Functions

```typescript
// Get or create singleton client
export function getAirsClient(): EnhancedPrismaAirsClient

// Cache management
export function clearAirsCache(): void

// Rate limit management  
export function resetAirsRateLimits(): void
```

### Client Configuration

```typescript
const client = new EnhancedPrismaAirsClient({
    apiUrl: config.airs.apiUrl,
    apiKey: config.airs.apiKey,
    timeout: config.airs.timeout,
    maxRetries: config.airs.retryAttempts,
    retryDelay: config.airs.retryDelay,
    cache: config.cache.enabled ? {
        ttlSeconds: config.cache.ttlSeconds,
        maxSize: config.cache.maxSize * 1024 * 1024
    } : undefined,
    rateLimiter: config.rateLimit.enabled ? {
        maxRequests: config.rateLimit.maxRequests,
        windowMs: config.rateLimit.windowMs
    } : undefined
});
```

## Integration in Application

- **Used By**: All modules needing AIRS API access
- **Configuration**: Loaded from environment via config module
- **Pattern**: Singleton ensures single client instance
- **Features**: Optional cache and rate limiting

## Key Benefits

### Singleton Pattern

- Single client instance across application
- Consistent configuration
- Shared cache and rate limits

### Configuration Management

- Centralized environment loading
- Feature toggling (cache/rate limit)
- Easy testing with mock clients

### Resource Management

- Global cache clearing
- Rate limit reset for testing
- Memory efficient

## Related Modules

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - The client being created
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Settings source
- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Primary consumer
