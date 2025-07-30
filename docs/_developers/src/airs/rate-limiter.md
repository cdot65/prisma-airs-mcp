---
layout: documentation
title: AIRS Rate Limiter
permalink: /developers/src/airs/rate-limiter/
category: developers
---

Token bucket rate limiter for AIRS API calls. Prevents API quota exhaustion and ensures smooth operation.

## Core Purpose

- Implement token bucket algorithm for rate limiting
- Manage API call quotas per operation type
- Provide async waiting for rate limit availability
- Track rate limit statistics

## Key Components

### PrismaAirsRateLimiter Class

```typescript
export class PrismaAirsRateLimiter {
    constructor(config: AirsRateLimiterConfig) {
        // maxRequests: Maximum requests per window
        // windowMs: Time window in milliseconds
    }
    
    // Core rate limiting methods
    async checkLimit(key: string): Promise<boolean>
    async waitForLimit(key: string): Promise<void>
    reset(key?: string): void
    
    // Statistics
    getStatus(key: string): { available: number; resetAt: Date }
}
```

### Token Bucket Algorithm

```typescript
interface Bucket {
    tokens: number;      // Available tokens
    lastRefill: number;  // Last refill timestamp
}
```

## Operation Types

Different rate limits for different operations:

- `scan` - Synchronous and async scans
- `results` - Fetching scan results
- `reports` - Retrieving threat reports

## Integration in Application

- **Used By**: Enhanced AIRS client before API calls
- **Configuration**: Max requests and window period
- **Behavior**: Async waiting when rate limited
- **Monitoring**: Real-time status and statistics

## Key Features

### Token Refill

- Tokens refill over time based on window
- Partial refills for smooth rate limiting

### Async Waiting

```typescript
// Will wait if rate limited
await rateLimiter.waitForLimit('scan');
// Then proceed with API call
```

### Status Checking

```typescript
const status = rateLimiter.getStatus('scan');
// { available: 45, resetAt: Date }
```

## Rate Limit Strategy

1. Check available tokens
2. If available, consume and proceed
3. If not, calculate wait time
4. Sleep until tokens available
5. Retry with recursion

## Related Modules

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Integrates rate limiting
- [Cache]({{ site.baseurl }}/developers/src/airs/cache/) - Works together for API efficiency
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Rate limit settings
