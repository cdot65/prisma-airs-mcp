---
layout: documentation
title: Enhanced AIRS Client
permalink: /developers/src/airs/index-file/
category: developers
---

# Enhanced AIRS Client (src/airs/index.ts)

Wrapper around the base AIRS client that adds caching and rate limiting for production use.

## Core Purpose

- Add response caching to reduce API calls
- Implement rate limiting to prevent quota exhaustion
- Maintain same API interface as base client
- Provide cache and rate limit statistics

## Key Components

### EnhancedPrismaAirsClient Class

```typescript
export class EnhancedPrismaAirsClient {
    constructor(config: AirsEnhancedClientConfig) {
        // Base client + optional cache + optional rate limiter
    }
    
    // Same methods as base client, but enhanced:
    async scanSync(request: AirsScanRequest): Promise<AirsScanResponse>
    async scanAsync(requests: AirsAsyncScanObject[]): Promise<AirsAsyncScanResponse>
    async getScanResults(scanIds: string[]): Promise<AirsScanIdResult[]>
    async getThreatScanReports(reportIds: string[]): Promise<AirsThreatScanReportObject[]>
    
    // Additional management methods:
    clearCache(): void
    resetRateLimits(): void
    getCacheStats(): CacheStats | null
    getRateLimiterStats(): RateLimiterStats | null
}
```

### Enhancement Flow

```
Request → Rate Limit Check → Cache Check → Base Client → Cache Store → Response
         ↓ (if limited)      ↓ (if hit)                    ↑
         Wait                Return cached                Store
```

## Integration in Application

- **Created By**: Factory module as singleton
- **Used By**: Tools and resource handlers
- **Features**: Transparent caching and rate limiting
- **Configuration**: Environment-based feature toggles

## Key Features

### Smart Caching
- Only caches successful responses
- TTL-based expiration
- Size-limited cache

### Rate Limiting
- Per-operation-type limits
- Automatic waiting when limited
- Token bucket algorithm

### Statistics
- Real-time cache performance
- Rate limit availability
- Memory usage tracking

## Performance Benefits

- **Reduced API Calls**: Cache hits avoid network requests
- **Quota Protection**: Rate limiting prevents API errors
- **Faster Response**: Cached data returns immediately
- **Reliability**: Graceful handling of limits

## Related Modules

- [Base Client]({{ site.baseurl }}/developers/src/airs/client/) - Core API functionality
- [Cache]({{ site.baseurl }}/developers/src/airs/cache/) - Caching implementation
- [Rate Limiter]({{ site.baseurl }}/developers/src/airs/rate-limiter/) - Rate limit logic
- [Factory]({{ site.baseurl }}/developers/src/airs/factory/) - Client instantiation