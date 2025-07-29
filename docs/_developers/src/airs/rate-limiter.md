---
layout: documentation
title: AIRS Rate Limiter
permalink: /developers/src/airs/rate-limiter/
category: developers
---

# AIRS Rate Limiter Module (src/airs/rate-limiter.ts)

The rate limiter module implements a token bucket algorithm to control the rate of API requests to the AIRS service. It
prevents API quota exhaustion and ensures compliance with rate limits while allowing burst capacity for traffic spikes.

## Overview

The `TokenBucketRateLimiter` class provides:

- Token bucket algorithm implementation
- Per-operation rate limiting
- Burst capacity support
- Non-blocking token checks
- Rate limit statistics
- Configurable refill rates

## Architecture

```
┌─────────────────────────────────────────┐
│       TokenBucketRateLimiter           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Token Buckets                 │ │
│  │  Map<string, Bucket>               │ │
│  │  • scanSync: 100 tokens/min        │ │
│  │  • scanAsync: 50 tokens/min        │ │
│  │  • getScanResults: 200 tokens/min  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Token Management              │ │
│  │  • Consumption                     │ │
│  │  • Refill logic                    │ │
│  │  • Availability check              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Statistics                    │ │
│  │  • Tokens consumed                 │ │
│  │  • Requests allowed/rejected       │ │
│  │  • Current availability            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Token Bucket Algorithm

### How It Works

1. **Bucket Capacity**: Each operation has a bucket with maximum tokens
2. **Token Consumption**: Each request consumes one or more tokens
3. **Token Refill**: Tokens are added at a configured rate
4. **Burst Support**: Full bucket allows burst traffic
5. **Rate Limiting**: Empty bucket blocks requests

```
Time →
[████████████] Full bucket (10/10 tokens)
     ↓ 5 requests
[██████-----] After requests (5/10 tokens)
     ↓ Time passes (refill)
[████████---] After refill (8/10 tokens)
```

## Configuration

### Rate Limiter Options

```typescript
interface RateLimiterConfig {
    enabled?: boolean;              // Enable rate limiting
    limits?: Record<string, {       // Per-operation limits
        maxTokens: number;          // Bucket capacity
        refillRate: number;         // Tokens per interval
        refillInterval: number;     // Interval in ms
    }>;
}
```

### Default Configuration

```typescript
const DEFAULT_LIMITS = {
    scanSync: {
        maxTokens: 100,
        refillRate: 100,
        refillInterval: 60000,    // 100 requests/minute
    },
    scanAsync: {
        maxTokens: 50,
        refillRate: 50,
        refillInterval: 60000,    // 50 requests/minute
    },
    getScanResults: {
        maxTokens: 200,
        refillRate: 200,
        refillInterval: 60000,    // 200 requests/minute
    },
    getThreatReports: {
        maxTokens: 200,
        refillRate: 200,
        refillInterval: 60000,    // 200 requests/minute
    },
};
```

## API Methods

### constructor(config)

Creates a new rate limiter instance.

```typescript
constructor(config: RateLimiterConfig = {})
```

**Example:**

```typescript
const rateLimiter = new TokenBucketRateLimiter({
    enabled: true,
    limits: {
        scanSync: {
            maxTokens: 50,
            refillRate: 50,
            refillInterval: 60000  // 50/minute
        }
    }
});
```

### tryConsume(operation, tokens)

Attempts to consume tokens for an operation.

```typescript
tryConsume(operation: string, tokens: number = 1): boolean
```

**Parameters:**

- `operation: string` - Operation name (e.g., 'scanSync')
- `tokens: number` - Number of tokens to consume (default: 1)

**Returns:**

- `boolean` - True if tokens were consumed, false if insufficient tokens

**Example:**

```typescript
if (rateLimiter.tryConsume('scanSync')) {
    // Allowed - proceed with request
    const result = await client.scanSync(request);
} else {
    // Rate limited - handle accordingly
    throw new Error('Rate limit exceeded');
}
```

### canConsume(operation, tokens)

Checks if tokens are available without consuming them.

```typescript
canConsume(operation: string, tokens: number = 1): boolean
```

**Parameters:**

- `operation: string` - Operation name
- `tokens: number` - Number of tokens to check

**Returns:**

- `boolean` - True if tokens are available

**Example:**

```typescript
// Check availability before making request
if (!rateLimiter.canConsume('scanSync')) {
    logger.warn('Rate limit approaching');
}
```

### getTokensAvailable(operation)

Gets the current number of available tokens.

```typescript
getTokensAvailable(operation: string): number
```

**Parameters:**

- `operation: string` - Operation name

**Returns:**

- `number` - Available tokens (0 if operation not found)

**Example:**

```typescript
const available = rateLimiter.getTokensAvailable('scanSync');
console.log(`${available} requests available`);
```

### reset(operation?)

Resets token buckets to full capacity.

```typescript
reset(operation?: string): void
```

**Parameters:**

- `operation?: string` - Specific operation to reset (omit for all)

**Example:**

```typescript
// Reset specific operation
rateLimiter.reset('scanSync');

// Reset all operations
rateLimiter.reset();
```

### getStats(operation?)

Gets rate limiting statistics.

```typescript
getStats(operation?: string): RateLimiterStats | Record<string, RateLimiterStats>
```

**Returns:**

```typescript
interface RateLimiterStats {
    tokensConsumed: number;      // Total consumed
    requestsAllowed: number;     // Total allowed
    requestsRejected: number;    // Total rejected
    currentTokens: number;       // Current available
    maxTokens: number;          // Bucket capacity
    refillRate: number;         // Refill rate
    refillInterval: number;     // Refill interval
}
```

**Example:**

```typescript
// Get stats for specific operation
const syncStats = rateLimiter.getStats('scanSync');
console.log(`Success rate: ${
    (syncStats.requestsAllowed / 
     (syncStats.requestsAllowed + syncStats.requestsRejected) * 100
    ).toFixed(2)}%`
);

// Get all stats
const allStats = rateLimiter.getStats();
```

## Token Bucket Implementation

### Bucket Structure

```typescript
interface TokenBucket {
    tokens: number;              // Current tokens
    maxTokens: number;          // Maximum capacity
    refillRate: number;         // Tokens per interval
    refillInterval: number;     // Interval in ms
    lastRefill: number;         // Last refill timestamp
}
```

### Refill Logic

Tokens are refilled based on elapsed time:

```typescript
private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const intervalsElapsed = timePassed / bucket.refillInterval;
    
    if (intervalsElapsed >= 1) {
        const tokensToAdd = Math.floor(intervalsElapsed) * bucket.refillRate;
        bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
    }
}
```

## Usage Patterns

### Basic Rate Limiting

```typescript
class AIRSService {
    private rateLimiter = new TokenBucketRateLimiter();

    async scanContent(content: string) {
        // Check rate limit
        if (!this.rateLimiter.tryConsume('scanSync')) {
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

### With Retry Logic

```typescript
async function scanWithRetry(content: string, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        if (rateLimiter.tryConsume('scanSync')) {
            return await client.scanSync(request);
        }

        // Wait before retry
        const waitTime = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    throw new Error('Rate limit exceeded after retries');
}
```

### Batch Processing

```typescript
async function processBatch(items: string[]) {
    const results = [];
    
    for (const item of items) {
        // Wait for token availability
        while (!rateLimiter.canConsume('scanSync')) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Consume token and process
        if (rateLimiter.tryConsume('scanSync')) {
            results.push(await scanItem(item));
        }
    }

    return results;
}
```

### Priority Queue

```typescript
class PriorityRateLimiter {
    async processHighPriority(request: Request) {
        // High priority gets immediate token if available
        if (this.rateLimiter.tryConsume('scanSync', 1)) {
            return await this.client.scanSync(request);
        }
        throw new Error('No tokens available');
    }

    async processLowPriority(request: Request) {
        // Low priority only proceeds if enough tokens
        const available = this.rateLimiter.getTokensAvailable('scanSync');
        if (available > 10 && this.rateLimiter.tryConsume('scanSync', 1)) {
            return await this.client.scanSync(request);
        }
        throw new Error('Insufficient tokens for low priority');
    }
}
```

## Integration with Enhanced Client

The enhanced AIRS client integrates rate limiting automatically:

```typescript
// Rate limiting is built into the enhanced client
const client = new PrismaAIRSClientWithCache(baseClient, {
    rateLimiter: new TokenBucketRateLimiter({
        enabled: true,
        limits: {
            scanSync: {
                maxTokens: 60,
                refillRate: 60,
                refillInterval: 60000  // 60/minute
            }
        }
    })
});

// Automatic rate limiting
try {
    const result = await client.scanSync(request);
} catch (error) {
    if (error.message.includes('Rate limit exceeded')) {
        // Handle rate limiting
    }
}
```

## Monitoring and Metrics

### Real-time Monitoring

```typescript
function monitorRateLimits(rateLimiter: TokenBucketRateLimiter) {
    setInterval(() => {
        const stats = rateLimiter.getStats();
        
        Object.entries(stats).forEach(([operation, opStats]) => {
            const usage = ((opStats.maxTokens - opStats.currentTokens) / 
                          opStats.maxTokens * 100);
            
            logger.info('Rate limit status', {
                operation,
                usage: `${usage.toFixed(2)}%`,
                available: opStats.currentTokens,
                rejected: opStats.requestsRejected
            });

            // Alert on high usage
            if (usage > 80) {
                logger.warn('High rate limit usage', { operation, usage });
            }
        });
    }, 30000); // Every 30 seconds
}
```

### Metrics Export

```typescript
function exportMetrics(rateLimiter: TokenBucketRateLimiter) {
    const stats = rateLimiter.getStats();
    
    Object.entries(stats).forEach(([operation, opStats]) => {
        metrics.gauge(`rate_limit.tokens.available.${operation}`, 
                     opStats.currentTokens);
        metrics.counter(`rate_limit.requests.allowed.${operation}`, 
                       opStats.requestsAllowed);
        metrics.counter(`rate_limit.requests.rejected.${operation}`, 
                       opStats.requestsRejected);
    });
}
```

## Configuration Examples

### Conservative (Production)

```typescript
new TokenBucketRateLimiter({
    enabled: true,
    limits: {
        scanSync: {
            maxTokens: 50,        // Lower burst
            refillRate: 50,
            refillInterval: 60000
        },
        scanAsync: {
            maxTokens: 25,
            refillRate: 25,
            refillInterval: 60000
        }
    }
});
```

### Aggressive (Development)

```typescript
new TokenBucketRateLimiter({
    enabled: true,
    limits: {
        scanSync: {
            maxTokens: 1000,      // High burst
            refillRate: 1000,
            refillInterval: 60000
        }
    }
});
```

### Disabled (Testing)

```typescript
new TokenBucketRateLimiter({
    enabled: false  // No rate limiting
});
```

## Testing

### Unit Tests

```typescript
describe('TokenBucketRateLimiter', () => {
    let rateLimiter: TokenBucketRateLimiter;

    beforeEach(() => {
        rateLimiter = new TokenBucketRateLimiter({
            limits: {
                test: {
                    maxTokens: 10,
                    refillRate: 5,
                    refillInterval: 1000
                }
            }
        });
    });

    it('should allow requests within limit', () => {
        for (let i = 0; i < 10; i++) {
            expect(rateLimiter.tryConsume('test')).toBe(true);
        }
        expect(rateLimiter.tryConsume('test')).toBe(false);
    });

    it('should refill tokens over time', async () => {
        // Consume all tokens
        for (let i = 0; i < 10; i++) {
            rateLimiter.tryConsume('test');
        }

        // Wait for refill
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Should have 5 new tokens
        expect(rateLimiter.getTokensAvailable('test')).toBe(5);
    });
});
```

### Integration Tests

```typescript
it('should handle burst traffic', async () => {
    const client = createClientWithRateLimiter({
        maxTokens: 5,
        refillRate: 5,
        refillInterval: 1000
    });

    // Burst of 5 requests should succeed
    const promises = Array(5).fill(null).map(() => 
        client.scanSync(testRequest)
    );
    
    await expect(Promise.all(promises)).resolves.toBeDefined();

    // 6th request should fail
    await expect(client.scanSync(testRequest))
        .rejects.toThrow('Rate limit exceeded');
});
```

## Best Practices

### 1. Configure Based on API Limits

```typescript
// Match your API tier limits
const rateLimiter = new TokenBucketRateLimiter({
    limits: {
        scanSync: {
            maxTokens: 100,      // API limit
            refillRate: 100,
            refillInterval: 60000
        }
    }
});
```

### 2. Monitor and Adjust

```typescript
// Track rejection rates
const stats = rateLimiter.getStats('scanSync');
if (stats.requestsRejected > stats.requestsAllowed * 0.1) {
    logger.warn('High rejection rate - consider adjusting limits');
}
```

### 3. Implement Graceful Degradation

```typescript
async function scanWithFallback(content: string) {
    // Try primary scan
    if (rateLimiter.tryConsume('scanSync')) {
        return await client.scanSync(request);
    }

    // Fallback to async scan
    if (rateLimiter.tryConsume('scanAsync')) {
        const { scan_id } = await client.scanAsync(request);
        return { scan_id, status: 'queued' };
    }

    // Final fallback
    return { status: 'rate_limited', retry_after: 60 };
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

```typescript
// Enable detailed logging
rateLimiter.on('consume', ({ operation, allowed, tokens }) => {
    logger.debug('Token consumption', {
        operation,
        allowed,
        tokens,
        remaining: rateLimiter.getTokensAvailable(operation)
    });
});
```

## Related Documentation

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Rate limiter integration
- [Cache Module]({{ site.baseurl }}/developers/src/airs/cache/) - Complementary optimization
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Environment settings
- [Monitoring]({{ site.baseurl }}/developers/src/utils/monitoring/) - Performance tracking