---
layout: documentation
title: AIRS Module Overview
permalink: /developers/src/airs/overview/
category: developers
---

# AIRS Integration Module Overview

The AIRS module (`src/airs/`) provides the integration layer with Palo Alto Networks Prisma AI Runtime Security (AIRS)
API. This module handles all communication with the AIRS service, including request management, caching, rate limiting,
and error handling.

## Module Structure

```
src/airs/
├── client.ts        # Core REST API client
├── index.ts         # Enhanced client with caching and rate limiting
├── cache.ts         # In-memory LRU cache implementation
├── rate-limiter.ts  # Token bucket rate limiting
└── factory.ts       # Singleton factory for client instances
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Tool/Resource                        │
│                 (Scan, Get Results, etc.)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   AIRS Factory                              │
│              (Singleton Management)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Enhanced AIRS Client                         │
│         (Caching + Rate Limiting Layer)                     │
├─────────────────────┴───────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │    Cache    │    │ Rate Limiter │    │  Base Client  │ │
│  └─────────────┘    └──────────────┘    └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    AIRS REST API                            │
│           (Prisma Cloud AI Security Service)                │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Base Client (`client.ts`)

The foundation of AIRS communication, providing:

- REST API request handling
- Automatic retry logic with exponential backoff
- Error handling and custom error types
- Request/response logging
- Type-safe API methods

**Key Features:**

- Configurable timeouts and retry attempts
- Structured error responses
- Support for all AIRS API endpoints
- Request ID tracking

[Full Client Documentation →]({{ site.baseurl }}/developers/src/airs/client/)

### Enhanced Client (`index.ts`)

Wraps the base client with additional capabilities:

- Response caching for improved performance
- Rate limiting to prevent API quota exhaustion
- Seamless integration with base client methods
- Configurable behavior through environment variables

**Key Features:**

- Transparent caching layer
- Token bucket rate limiting
- Cache bypass options
- Metrics and statistics

[Full Enhanced Client Documentation →]({{ site.baseurl }}/developers/src/airs/index-file/)

### Cache System (`cache.ts`)

In-memory LRU cache for API responses:

- Content-based cache key generation
- Configurable TTL (time-to-live)
- Maximum size limits
- Cache statistics and monitoring

**Key Features:**

- Deterministic cache keys
- Automatic expiration
- Memory-efficient storage
- Hit/miss tracking

[Full Cache Documentation →]({{ site.baseurl }}/developers/src/airs/cache/)

### Rate Limiter (`rate-limiter.ts`)

Token bucket implementation for API rate limiting:

- Per-operation rate limits
- Configurable bucket sizes
- Automatic token replenishment
- Non-blocking design

**Key Features:**

- Multiple rate limit buckets
- Burst capacity support
- Real-time availability checking
- Statistics tracking

[Full Rate Limiter Documentation →]({{ site.baseurl }}/developers/src/airs/rate-limiter/)

### Factory Pattern (`factory.ts`)

Singleton management for AIRS client instances:

- Ensures single client instance per configuration
- Supports client reset and reconfiguration
- Thread-safe initialization
- Resource cleanup

**Key Features:**

- Lazy initialization
- Configuration validation
- Clean shutdown support
- Test isolation capabilities

[Full Factory Documentation →]({{ site.baseurl }}/developers/src/airs/factory/)

## API Integration

### Supported Operations

1. **Synchronous Scanning**
    - Single content scanning
    - Immediate response
    - Cached results

2. **Asynchronous Scanning**
    - Batch content processing
    - Scan ID tracking
    - Background processing

3. **Result Retrieval**
    - Get scan results by ID
    - Batch result fetching
    - Status checking

4. **Threat Reports**
    - Detailed threat analysis
    - Report retrieval by ID
    - Threat categorization

### Request Flow

```typescript
// 1. Client requests scan
const result = await airsClient.scanSync({
    tr_id: generateId(),
    request: [{
        prompt: userInput,
        profile_name: 'default'
    }]
});

// 2. Rate limiter checks availability
// 3. Cache checks for existing result
// 4. Base client makes API request
// 5. Response is cached
// 6. Result returned to caller
```

## Configuration

### Environment Variables

| Variable                  | Default  | Description             |
|---------------------------|----------|-------------------------|
| `AIRS_API_URL`            | Required | AIRS API endpoint URL   |
| `AIRS_API_KEY`            | Required | API authentication key  |
| `CACHE_ENABLED`           | `true`   | Enable response caching |
| `CACHE_TTL_SECONDS`       | `300`    | Cache time-to-live      |
| `CACHE_MAX_SIZE`          | `1000`   | Maximum cache entries   |
| `RATE_LIMIT_ENABLED`      | `true`   | Enable rate limiting    |
| `RATE_LIMIT_MAX_REQUESTS` | `100`    | Max requests per window |
| `RATE_LIMIT_WINDOW_MS`    | `60000`  | Rate limit window (ms)  |

### Configuration Example

```bash
# .env file
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here

# Optional performance tuning
CACHE_TTL_SECONDS=600
RATE_LIMIT_MAX_REQUESTS=200
```

## Usage Patterns

### Basic Usage

```typescript
import { getAirsClient } from './airs/factory';

const client = getAirsClient();

// Synchronous scan
const result = await client.scanSync({
    tr_id: 'scan_123',
    request: [{
        prompt: 'Check this content for threats',
        profile_name: 'strict'
    }]
});
```

### Advanced Usage

```typescript
// Bypass cache for fresh results
const freshResult = await client.scanSync(request, {
    bypassCache: true
});

// Async scanning for large batches
const { scan_id } = await client.scanAsync({
    requests: multipleRequests
});

// Retrieve results later
const results = await client.getScanResults([scan_id]);
```

### Error Handling

```typescript
import { AIRSAPIError } from './airs/client';

try {
    const result = await client.scanSync(request);
} catch (error) {
    if (error instanceof AIRSAPIError) {
        console.error(`AIRS API Error: ${error.message}`);
        console.error(`Status: ${error.status}`);
        console.error(`Details: ${error.details}`);
    } else {
        console.error('Unexpected error:', error);
    }
}
```

## Performance Optimization

### Caching Strategy

The cache system uses content-based keys:

- Identical requests return cached results
- Different transaction IDs don't affect caching
- Profile names are part of the cache key

### Rate Limiting Strategy

Token bucket algorithm provides:

- Burst capacity for traffic spikes
- Steady-state rate limiting
- Per-operation limits

### Best Practices

1. **Use Caching**: Leave caching enabled for production
2. **Monitor Rate Limits**: Check rate limit status regularly
3. **Handle Errors**: Implement proper error handling
4. **Log Requests**: Use debug logging for troubleshooting
5. **Clean Shutdown**: Reset client in tests

## Monitoring and Debugging

### Cache Statistics

```typescript
const stats = client.getCacheStats();
console.log('Cache hit rate:', stats.hitRate);
console.log('Cache size:', stats.size);
```

### Rate Limit Status

```typescript
const status = client.getRateLimitStatus();
console.log('Available tokens:', status.availableTokens);
console.log('Next refill:', status.nextRefill);
```

### Debug Logging

Enable debug logs:

```bash
LOG_LEVEL=debug npm start
```

## Testing

### Unit Testing

```typescript
import { resetAirsClient } from './airs/factory';

beforeEach(() => {
    resetAirsClient(); // Clean state
});

afterEach(() => {
    resetAirsClient(); // Cleanup
});
```

### Integration Testing

```typescript
// Test with real API (requires valid key)
const client = getAirsClient();
const result = await client.scanSync(testRequest);

// Test with mocked responses
jest.mock('./airs/client');
```

## Error Handling

### Common Errors

1. **Authentication Errors** (401)
    - Invalid API key
    - Expired credentials

2. **Rate Limit Errors** (429)
    - Quota exceeded
    - Too many requests

3. **Validation Errors** (400)
    - Invalid request format
    - Missing required fields

4. **Server Errors** (500+)
    - AIRS service issues
    - Temporary outages

### Error Recovery

```typescript
// Automatic retry for transient errors
const client = new PrismaAIRSClient({
    maxRetries: 3,
    retryDelay: 1000
});

// Manual retry logic
async function scanWithRetry(request, maxAttempts = 3) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await client.scanSync(request);
        } catch (error) {
            if (i === maxAttempts - 1) throw error;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}
```

## Security Considerations

1. **API Key Protection**
    - Store in environment variables
    - Never commit to version control
    - Rotate regularly

2. **Request Sanitization**
    - Validate input before sending
    - Limit request sizes
    - Sanitize error messages

3. **Response Handling**
    - Don't expose raw API errors
    - Sanitize threat details
    - Log security events

## Future Enhancements

1. **Performance**
    - Redis cache backend
    - Connection pooling
    - Request batching

2. **Features**
    - WebSocket support
    - Streaming responses
    - Bulk operations

3. **Monitoring**
    - Prometheus metrics
    - OpenTelemetry tracing
    - Custom dashboards

## Related Documentation

- [Base Client]({{ site.baseurl }}/developers/src/airs/client/) - Core API client
- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Caching and rate limiting
- [Cache System]({{ site.baseurl }}/developers/src/airs/cache/) - Response caching
- [Rate Limiter]({{ site.baseurl }}/developers/src/airs/rate-limiter/) - API rate limiting
- [Factory]({{ site.baseurl }}/developers/src/airs/factory/) - Client management
- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - AIRS tool implementations