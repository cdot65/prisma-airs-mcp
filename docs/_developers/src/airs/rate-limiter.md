---
layout: documentation
title: AIRS Rate Limiter
permalink: /developers/src/airs/rate-limiter/
category: developers
---

The rate limiter module implements a token bucket algorithm to control the rate of API requests to the AIRS service. It
prevents API quota exhaustion and ensures compliance with rate limits.

## Overview

The `PrismaAirsRateLimiter` class provides:

- Token bucket algorithm implementation
- Key-based rate limiting (default key: 'default')
- Configurable request limits and time windows
- Non-blocking and blocking (wait) methods
- Rate limit status checking
- Automatic cleanup of old buckets

## Architecture

```text
┌─────────────────────────────────────────┐
│       PrismaAirsRateLimiter             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Token Buckets                │  │
│  │  Map<string, TokenBucket>         │  │
│  │  • Key-based buckets              │  │
│  │  • Configurable max requests      │  │
│  │  • Time window in ms              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Token Management             │  │
│  │  • checkLimit()                   │  │
│  │  • waitForLimit()                 │  │
│  │  • Refill based on time elapsed   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Bucket Management            │  │
│  │  • Status checking                │  │
│  │  • Reset functionality            │  │
│  │  • Automatic cleanup              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Token Bucket Algorithm

### How It Works

1. **Bucket Capacity**: Each key has a bucket with maximum tokens (maxRequests)
2. **Token Consumption**: Each request consumes one token
3. **Token Refill**: Tokens are refilled based on elapsed time windows
4. **Rate Limiting**: Empty bucket blocks requests
5. **Time Window**: Tokens refill after each time window period

### Token Bucket Structure

```typescript
interface TokenBucket {
    tokens: number;      // Current available tokens
    lastRefill: number;  // Last refill timestamp
}
```

## Configuration

### Rate Limiter Configuration

```typescript
interface AirsRateLimiterConfig {
    enabled?: boolean;     // Enable/disable rate limiting (default: true)
    maxRequests: number;   // Maximum requests per window
    windowMs: number;      // Time window in milliseconds
}
```

### Example Configuration

```typescript
// Allow 100 requests per minute
const config: AirsRateLimiterConfig = {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000  // 1 minute
};
```

## API Methods

### constructor(config)

Creates a new rate limiter instance.

```typescript
constructor(config: AirsRateLimiterConfig)
```

**Example:**

```typescript
const rateLimiter = new PrismaAirsRateLimiter({
    enabled: true,
    maxRequests: 50,
    windowMs: 60000  // 50 requests per minute
});
```

### checkLimit(key)

Checks if a request is allowed and consumes a token if so.

```typescript
checkLimit(key: string = 'default'): boolean
```

**Parameters:**

- `key: string` - Rate limit key (default: 'default')

**Returns:**

- `boolean` - True if request is allowed, false if rate limited

**Example:**

```typescript
if (rateLimiter.checkLimit('api-calls')) {
    // Allowed - proceed with request
    const result = await client.scanSync(request);
} else {
    // Rate limited - handle accordingly
    throw new Error('Rate limit exceeded');
}
```

### waitForLimit(key)

Waits until a request is allowed.

```typescript
async waitForLimit(key: string = 'default'): Promise<void>
```

**Parameters:**

- `key: string` - Rate limit key (default: 'default')

**Example:**

```typescript
// Wait for rate limit to allow request
await rateLimiter.waitForLimit('api-calls');
// Request is now allowed
const result = await client.scanSync(request);
```

### getStatus(key)

Gets current rate limit status for a key.

```typescript
getStatus(key: string = 'default'): {
    available: number;
    limit: number;
    resetAt: Date;
} | null
```

**Parameters:**

- `key: string` - Rate limit key (default: 'default')

**Returns:**

- Object with available tokens, limit, and reset time
- `null` if no bucket exists for key

**Example:**

```typescript
const status = rateLimiter.getStatus('api-calls');
console.log(`${status.available}/${status.limit} requests available`);
console.log(`Resets at: ${status.resetAt}`);
```

### reset(key)

Resets rate limit for a specific key.

```typescript
reset(key: string = 'default'): void
```

**Parameters:**

- `key: string` - Rate limit key to reset (default: 'default')

**Example:**

```typescript
// Reset specific key
rateLimiter.reset('api-calls');

// Reset default key
rateLimiter.reset();
```

### clear()

Clears all rate limit buckets.

```typescript
clear(): void
```

**Example:**

```typescript
// Clear all rate limits
rateLimiter.clear();
```

### getStats()

Gets rate limiter statistics.

```typescript
getStats(): {
    bucketCount: number;
    enabled: boolean;
}
```

**Returns:**

- `bucketCount: number` - Number of active buckets
- `enabled: boolean` - Whether rate limiting is enabled

**Example:**

```typescript
const stats = rateLimiter.getStats();
console.log(`Active buckets: ${stats.bucketCount}`);
console.log(`Rate limiting enabled: ${stats.enabled}`);
```

## Token Refill Logic

### How Refill Works

The rate limiter refills tokens based on elapsed time windows:

```typescript
// Calculate tokens to add based on elapsed time
const elapsed = now - bucket.lastRefill;
const tokensToAdd = Math.floor(elapsed / this.config.windowMs) * this.config.maxRequests;

if (tokensToAdd > 0) {
    bucket.tokens = Math.min(this.config.maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
}
```

### Automatic Cleanup

The rate limiter automatically cleans up old buckets that haven't been used:

```typescript
// Cleanup interval is 2x the window time (minimum 60 seconds)
const cleanupInterval = Math.max(this.config.windowMs * 2, 60000);
```

## Usage Patterns

### Basic Rate Limiting

```typescript
class AIRSService {
    private rateLimiter = new PrismaAirsRateLimiter({
        enabled: true,
        maxRequests: 100,
        windowMs: 60000
    });

    async scanContent(content: string) {
        // Check rate limit
        if (!this.rateLimiter.checkLimit('scan-api')) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Proceed with API call
        return await this.client.scanSync({
            tr_id: generateId(),
            request: [{ prompt: content, profile_name: 'default' }]
        });
    }
}
```

### With Wait For Limit

```typescript
async function scanWithWait(content: string) {
    // Wait for rate limit to allow request
    await rateLimiter.waitForLimit('scan-api');
    
    // Now guaranteed to be allowed
    return await client.scanSync({
        tr_id: generateId(),
        request: [{ prompt: content, profile_name: 'default' }]
    });
}
```

### Batch Processing

```typescript
async function processBatch(items: string[]) {
    const results = [];
    
    for (const item of items) {
        // Wait for rate limit
        await rateLimiter.waitForLimit('batch-scan');
        
        // Process item
        results.push(await scanItem(item));
    }

    return results;
}
```

### Status Checking

```typescript
async function checkRateLimitStatus() {
    const status = rateLimiter.getStatus('api-calls');
    
    if (status) {
        console.log(`Available: ${status.available}/${status.limit}`);
        console.log(`Resets at: ${status.resetAt.toISOString()}`);
        
        if (status.available === 0) {
            const waitTime = status.resetAt.getTime() - Date.now();
            console.log(`Rate limited. Wait ${waitTime}ms`);
        }
    }
}
```

## Integration with Enhanced Client

The enhanced AIRS client (in index.ts) integrates rate limiting:

```typescript
// Create rate limiter
const rateLimiter = new PrismaAirsRateLimiter({
    enabled: true,
    maxRequests: 100,
    windowMs: 60000  // 100 requests per minute
});

// Use with enhanced client
const enhancedClient = createEnhancedClient(baseClient, cache, rateLimiter);

// Rate limiting is applied automatically
try {
    const result = await enhancedClient.scanSync(request);
} catch (error) {
    if (error.message.includes('Rate limit exceeded')) {
        // Handle rate limiting
    }
}
```

## Monitoring and Metrics

### Real-time Monitoring

```typescript
function monitorRateLimits(rateLimiter: PrismaAirsRateLimiter) {
    setInterval(() => {
        const stats = rateLimiter.getStats();
        const status = rateLimiter.getStatus();
        
        logger.info('Rate limiter stats', {
            bucketCount: stats.bucketCount,
            enabled: stats.enabled,
            available: status?.available,
            limit: status?.limit,
            resetAt: status?.resetAt
        });

        // Alert if rate limited
        if (status && status.available === 0) {
            logger.warn('Rate limit exhausted', {
                resetAt: status.resetAt
            });
        }
    }, 30000); // Every 30 seconds
}
```

### Metrics Export

```typescript
function exportMetrics(rateLimiter: PrismaAirsRateLimiter) {
    const stats = rateLimiter.getStats();
    const status = rateLimiter.getStatus('default');
    
    metrics.gauge('rate_limit.buckets.count', stats.bucketCount);
    metrics.gauge('rate_limit.enabled', stats.enabled ? 1 : 0);
    
    if (status) {
        metrics.gauge('rate_limit.tokens.available', status.available);
        metrics.gauge('rate_limit.tokens.limit', status.limit);
    }
}
```

## Configuration Examples

### Conservative (Production)

```typescript
new PrismaAirsRateLimiter({
    enabled: true,
    maxRequests: 50,      // 50 requests
    windowMs: 60000       // per minute
});
```

### Aggressive (Development)

```typescript
new PrismaAirsRateLimiter({
    enabled: true,
    maxRequests: 1000,    // 1000 requests
    windowMs: 60000       // per minute
});
```

### Disabled (Testing)

```typescript
new PrismaAirsRateLimiter({
    enabled: false,       // No rate limiting
    maxRequests: 0,
    windowMs: 0
});
```

## Testing

### Unit Tests

```typescript
describe('PrismaAirsRateLimiter', () => {
    let rateLimiter: PrismaAirsRateLimiter;

    beforeEach(() => {
        rateLimiter = new PrismaAirsRateLimiter({
            enabled: true,
            maxRequests: 10,
            windowMs: 1000
        });
    });

    it('should allow requests within limit', () => {
        for (let i = 0; i < 10; i++) {
            expect(rateLimiter.checkLimit('test')).toBe(true);
        }
        expect(rateLimiter.checkLimit('test')).toBe(false);
    });

    it('should refill tokens over time', async () => {
        // Consume all tokens
        for (let i = 0; i < 10; i++) {
            rateLimiter.checkLimit('test');
        }

        // Wait for window to pass
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Should have tokens again
        const status = rateLimiter.getStatus('test');
        expect(status.available).toBeGreaterThan(0);
    });
});
```

### Integration Tests

```typescript
it('should handle burst traffic', async () => {
    const rateLimiter = new PrismaAirsRateLimiter({
        enabled: true,
        maxRequests: 5,
        windowMs: 1000
    });

    // First 5 requests should succeed
    for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit()).toBe(true);
    }

    // 6th request should fail
    expect(rateLimiter.checkLimit()).toBe(false);
});
```

## Best Practices

### 1. Configure Based on API Limits

```typescript
// Match your API tier limits
const rateLimiter = new PrismaAirsRateLimiter({
    enabled: true,
    maxRequests: 100,     // API limit
    windowMs: 60000       // per minute
});
```

### 2. Monitor and Adjust

```typescript
// Check rate limit status
const status = rateLimiter.getStatus();
if (status && status.available < status.limit * 0.2) {
    logger.warn('Rate limit usage high', {
        available: status.available,
        limit: status.limit
    });
}
```

### 3. Implement Graceful Degradation

```typescript
async function scanWithFallback(content: string) {
    // Check rate limit status
    if (!rateLimiter.checkLimit('scan')) {
        const status = rateLimiter.getStatus('scan');
        const waitTime = status ? 
            status.resetAt.getTime() - Date.now() : 60000;
        
        return { 
            status: 'rate_limited', 
            retry_after: Math.ceil(waitTime / 1000) 
        };
    }

    // Proceed with scan
    return await client.scanSync(request);
}
```

## Troubleshooting

### Common Issues

1. **Constant Rate Limiting**
    - Check token bucket configuration
    - Verify refill rates match usage
    - Monitor actual request rates

2. **Burst Traffic Rejected**
    - Increase maxTokens for burst capacity
    - Implement request queuing
    - Add retry logic

3. **Tokens Not Refilling**
    - Check system time
    - Verify refill interval configuration
    - Look for timer issues

### Debug Logging

The rate limiter logs debug information internally:

```typescript
// Set LOG_LEVEL=debug to see rate limit operations
logger.debug('Rate limit check passed', {
    key,
    remainingTokens: bucket.tokens,
});

logger.warn('Rate limit exceeded', {
    key,
    nextRefill: new Date(bucket.lastRefill + this.config.windowMs).toISOString(),
});
```

## Related Documentation

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Rate limiter integration
- [Cache Module]({{ site.baseurl }}/developers/src/airs/cache/) - Complementary optimization
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Environment settings
- [Monitoring]({{ site.baseurl }}/developers/src/utils/monitoring/) - Performance tracking
