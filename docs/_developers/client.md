---
layout: documentation
title: AIRS Client Integration
description: How the MCP server integrates with Prisma AIRS API
category: developers
---

## Overview

The AIRS Client module is the component within the MCP server that communicates with Palo Alto Networks' Prisma AIRS REST API. It handles authentication, request formatting, response processing, and includes resilience features like caching and retry logic.

## Integration Architecture

```typescript
// AIRS client within the MCP server
class PrismaAIRSClient {
    private readonly config: AIRSConfig;
    private readonly httpClient: AxiosInstance;
    private readonly cache: AIRSCache;
    private readonly rateLimiter: AIRSRateLimiter;

    constructor(config: AIRSConfig) {
        this.config = validateConfig(config);
        this.httpClient = this.createHttpClient();
        this.cache = new AIRSCache(config.cache);
        this.rateLimiter = new AIRSRateLimiter(config.rateLimit);
    }
}
```

## Configuration

### Client Configuration Options

```typescript
interface AIRSConfig {
    // Required
    apiUrl: string;
    apiKey: string;

    // Optional with defaults
    timeout?: number; // Default: 30000ms
    maxRetries?: number; // Default: 3
    retryDelay?: number; // Default: 1000ms

    // Sub-configurations
    cache?: CacheConfig;
    rateLimit?: RateLimitConfig;

    // Advanced options
    httpAgent?: http.Agent;
    httpsAgent?: https.Agent;
    proxy?: ProxyConfig;
}
```

### Example Configuration

```typescript
const client = new PrismaAIRSClient({
    apiUrl: 'https://service.api.aisecurity.paloaltonetworks.com',
    apiKey: process.env.AIRS_API_KEY!,
    timeout: 60000,
    maxRetries: 5,
    cache: {
        enabled: true,
        ttl: 300,
        maxSize: 1000,
    },
    rateLimit: {
        maxRequests: 100,
        windowMs: 60000,
    },
});
```

## Core Methods

### Synchronous Scanning

```typescript
async scanContent(request: ScanRequest): Promise<ScanResponse> {
  // Check rate limit
  await this.rateLimiter.checkLimit('scan');

  // Check cache
  const cacheKey = this.getCacheKey(request);
  const cached = this.cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Make API request with retry logic
  const response = await this.retryableRequest(
    () => this.httpClient.post('/v1/scan/sync/request', request)
  );

  // Cache successful response
  this.cache.set(cacheKey, response.data, this.config.cache?.ttl);

  return response.data;
}
```

### Asynchronous Scanning

```typescript
async scanAsync(request: AsyncScanRequest): Promise<AsyncScanResponse> {
  await this.rateLimiter.checkLimit('scan_async');

  const response = await this.retryableRequest(
    () => this.httpClient.post('/v1/scan/async/request', request)
  );

  return response.data;
}

async getScanResults(scanIds: string[]): Promise<ScanResult[]> {
  // Validate input
  if (scanIds.length > 5) {
    throw new Error('Maximum 5 scan IDs allowed per request');
  }

  const response = await this.retryableRequest(
    () => this.httpClient.get('/v1/scan/results', {
      params: { scan_ids: scanIds.join(',') }
    })
  );

  return response.data;
}
```

### Threat Reports

```typescript
async getThreatReports(reportIds: string[]): Promise<ThreatReport[]> {
  if (reportIds.length > 5) {
    throw new Error('Maximum 5 report IDs allowed per request');
  }

  const response = await this.retryableRequest(
    () => this.httpClient.get('/v1/scan/reports', {
      params: { report_ids: reportIds.join(',') }
    })
  );

  return response.data;
}
```

## Advanced Features

### Retry Logic

Exponential backoff with jitter for transient failures:

```typescript
private async retryableRequest<T>(
  requestFn: () => Promise<T>,
  retries = this.config.maxRetries
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error) &&
          error.response?.status >= 400 &&
          error.response?.status < 500) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      if (i < retries) {
        const delay = Math.min(
          this.config.retryDelay * Math.pow(2, i) +
          Math.random() * 1000,
          30000 // Max 30 seconds
        );

        await this.delay(delay);
      }
    }
  }

  throw lastError!;
}
```

### Request Interceptors

```typescript
private createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: this.config.apiUrl,
    timeout: this.config.timeout,
    headers: {
      'Content-Type': 'application/json',
      'x-pan-token': this.config.apiKey
    }
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add request ID for tracing
      config.headers['X-Request-ID'] = generateRequestId();

      // Log request (without sensitive data)
      logger.debug('AIRS API Request', {
        method: config.method,
        url: config.url,
        requestId: config.headers['X-Request-ID']
      });

      return config;
    },
    (error) => {
      logger.error('Request interceptor error', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      logger.debug('AIRS API Response', {
        status: response.status,
        requestId: response.config.headers['X-Request-ID']
      });
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error)) {
        logger.error('AIRS API Error', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
      }
      return Promise.reject(error);
    }
  );

  return client;
}
```

### Connection Pooling

```typescript
// Optimized HTTP agent configuration
const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
    scheduling: 'lifo',
});

const client = new PrismaAIRSClient({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    httpsAgent,
});
```

## Error Handling

### Error Types

```typescript
enum AIRSErrorCode {
    // Client errors
    INVALID_REQUEST = 'INVALID_REQUEST',
    AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    RATE_LIMITED = 'RATE_LIMITED',

    // Server errors
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

    // Network errors
    TIMEOUT = 'TIMEOUT',
    NETWORK_ERROR = 'NETWORK_ERROR',
}

class AIRSError extends Error {
    constructor(
        public code: AIRSErrorCode,
        message: string,
        public statusCode?: number,
        public details?: unknown,
    ) {
        super(message);
        this.name = 'AIRSError';
    }
}
```

### Error Handling Example

```typescript
try {
    const result = await client.scanContent({
        contents: [{ prompt: userInput }],
        ai_profile: { profile_name: 'Prisma AIRS' },
    });
} catch (error) {
    if (error instanceof AIRSError) {
        switch (error.code) {
            case AIRSErrorCode.RATE_LIMITED:
                // Handle rate limiting
                await delay(60000);
                break;

            case AIRSErrorCode.AUTHENTICATION_FAILED:
                // Handle auth failure
                throw new Error('Invalid API key');

            case AIRSErrorCode.TIMEOUT:
                // Retry with longer timeout
                break;

            default:
                // Log and handle generic error
                logger.error('AIRS API error', error);
        }
    }
}
```

## Performance Optimization

### Request Batching

```typescript
class BatchingClient extends PrismaAIRSClient {
    private batchQueue: ScanRequest[] = [];
    private batchTimer?: NodeJS.Timeout;

    async scanContentBatched(request: ScanRequest): Promise<ScanResponse> {
        return new Promise((resolve, reject) => {
            this.batchQueue.push({
                ...request,
                _resolve: resolve,
                _reject: reject,
            });

            if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => this.processBatch(), 100);
            }
        });
    }

    private async processBatch() {
        const batch = this.batchQueue.splice(0, 10); // Max 10 per batch
        this.batchTimer = undefined;

        try {
            const results = await this.scanAsync({
                contents: batch.flatMap((r) => r.contents),
            });

            // Distribute results back to callers
            batch.forEach((request, index) => {
                request._resolve(results[index]);
            });
        } catch (error) {
            batch.forEach((request) => request._reject(error));
        }
    }
}
```

### Caching Strategy

```typescript
// Content-based cache key generation
private getCacheKey(request: ScanRequest): string {
  const content = JSON.stringify({
    contents: request.contents,
    profile: request.ai_profile.profile_name || request.ai_profile.profile_id
  });

  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

// Cache with TTL and size management
class AIRSCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];

  set(key: string, value: any, ttl?: number): void {
    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldest = this.accessOrder.shift();
      if (oldest) this.cache.delete(oldest);
    }

    const expiry = Date.now() + (ttl || this.defaultTTL) * 1000;
    this.cache.set(key, { value, expiry });
    this.accessOrder.push(key);
  }
}
```

## Testing

### Mock Client for Testing

```typescript
class MockAIRSClient extends PrismaAIRSClient {
    private mockResponses = new Map<string, any>();

    setMockResponse(method: string, response: any): void {
        this.mockResponses.set(method, response);
    }

    async scanContent(request: ScanRequest): Promise<ScanResponse> {
        const mock = this.mockResponses.get('scanContent');
        if (mock) return mock;

        // Default mock response
        return {
            scan_id: 'mock-scan-123',
            report_id: 'mock-report-123',
            category: 'benign',
            action: 'allow',
            profile_name: 'Test Profile',
        };
    }
}
```

### Integration Testing

```typescript
describe('PrismaAIRSClient Integration', () => {
    let client: PrismaAIRSClient;

    beforeAll(() => {
        client = new PrismaAIRSClient({
            apiUrl: process.env.TEST_API_URL!,
            apiKey: process.env.TEST_API_KEY!,
        });
    });

    it('should scan content successfully', async () => {
        const result = await client.scanContent({
            contents: [{ prompt: 'Test content' }],
            ai_profile: { profile_name: 'Test Profile' },
        });

        expect(result).toHaveProperty('scan_id');
        expect(result.category).toMatch(/benign|malicious/);
    });
});
```

## Best Practices

1. **Singleton Pattern**: Use a single client instance
2. **Error Recovery**: Implement circuit breakers for failures
3. **Monitoring**: Track API latency and error rates
4. **Security**: Never log API keys or sensitive content
5. **Resource Management**: Close connections gracefully

## Next Steps

- [Resources]({{ site.baseurl }}/developers/resources) - Working with MCP resources
- [Tools]({{ site.baseurl }}/developers/tools) - Implementing MCP tools
- [Caching]({{ site.baseurl }}/developers/advanced/caching) - Advanced caching strategies
- [Rate Limiting]({{ site.baseurl }}/developers/advanced/rate-limiting) - Rate limit handling
