---
layout: documentation
title: AIRS Client
permalink: /developers/src/airs/client/
category: developers
---

# AIRS Client Module (src/airs/client.ts)

The AIRS client module provides the core REST API client for communicating with the Prisma AI Runtime Security (AIRS)
service. It handles HTTP requests, retries, error handling, and type-safe API method implementations.

## Overview

The `PrismaAIRSClient` class is the foundation of all AIRS API interactions, providing:

- Type-safe API methods for all AIRS endpoints
- Automatic retry logic with exponential backoff
- Comprehensive error handling with custom error types
- Request/response logging for debugging
- Configurable timeouts and retry behavior

## Architecture

```
┌─────────────────────────────────────────┐
│         PrismaAIRSClient                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Configuration                 │ │
│  │  • API URL                        │ │
│  │  • API Key                        │ │
│  │  • Timeout                        │ │
│  │  • Retry Settings                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      HTTP Methods                  │ │
│  │  • makeRequest()                   │ │
│  │  • handleResponse()                │ │
│  │  • handleError()                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      API Methods                   │ │
│  │  • scanSync()                      │ │
│  │  • scanAsync()                     │ │
│  │  • getScanResults()                │ │
│  │  • getThreatReports()              │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Configuration

### Client Configuration Interface

```typescript
interface AIRSClientConfig {
    apiKey: string;         // Required: API authentication key
    baseUrl?: string;       // Optional: API base URL
    timeout?: number;       // Optional: Request timeout in ms
    maxRetries?: number;    // Optional: Maximum retry attempts
    retryDelay?: number;    // Optional: Initial retry delay in ms
}
```

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
    baseUrl: 'https://service.api.aisecurity.paloaltonetworks.com',
    timeout: 30000,        // 30 seconds
    maxRetries: 3,         // 3 retry attempts
    retryDelay: 1000,      // 1 second initial delay
};
```

## API Methods

### scanSync(request)

Performs synchronous content scanning with immediate results.

```typescript
async scanSync(request: ScanSyncRequest): Promise<ScanSyncResponse>
```

**Parameters:**

- `request: ScanSyncRequest` - Scan request containing content and profile

**Returns:**

- `ScanSyncResponse` - Scan results with threat details

**Example:**

```typescript
const result = await client.scanSync({
    tr_id: 'scan_123',
    request: [{
        prompt: 'User input to scan',
        profile_name: 'default',
        response: 'Optional AI response',
        context: 'Optional context'
    }]
});

// Check for threats
if (result.request_results[0].prompt_guard_result.high_risk_categories.length > 0) {
    console.log('Threats detected!');
}
```

### scanAsync(request)

Initiates asynchronous batch scanning for multiple requests.

```typescript
async scanAsync(request: ScanAsyncRequest): Promise<ScanAsyncResponse>
```

**Parameters:**

- `request: ScanAsyncRequest` - Batch scan request

**Returns:**

- `ScanAsyncResponse` - Scan ID for result retrieval

**Example:**

```typescript
const response = await client.scanAsync({
    requests: [
        {
            tr_id: 'batch_1',
            request: [{ prompt: 'Content 1', profile_name: 'strict' }]
        },
        {
            tr_id: 'batch_2',
            request: [{ prompt: 'Content 2', profile_name: 'strict' }]
        }
    ]
});

console.log('Scan ID:', response.scan_id);
```

### getScanResults(scanIds)

Retrieves results for completed scans by scan ID.

```typescript
async getScanResults(scanIds: string[]): Promise<ScanResult[]>
```

**Parameters:**

- `scanIds: string[]` - Array of scan IDs to retrieve

**Returns:**

- `ScanResult[]` - Array of scan results

**Example:**

```typescript
const results = await client.getScanResults(['scan_abc123', 'scan_def456']);

results.forEach(result => {
    console.log(`Scan ${result.scan_id}: ${result.status}`);
    if (result.status === 'complete') {
        console.log('Results:', result.scan_results);
    }
});
```

### getThreatReports(reportIds)

Retrieves detailed threat analysis reports.

```typescript
async getThreatReports(reportIds: string[]): Promise<ThreatReport[]>
```

**Parameters:**

- `reportIds: string[]` - Array of report IDs

**Returns:**

- `ThreatReport[]` - Detailed threat reports

**Example:**

```typescript
const reports = await client.getThreatReports(['report_123']);

reports.forEach(report => {
    console.log('Threat Category:', report.category);
    console.log('Severity:', report.severity);
    console.log('Details:', report.details);
});
```

## Error Handling

### Custom Error Class

The client uses a custom `AIRSAPIError` class for API-specific errors:

```typescript
export class AIRSAPIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AIRSAPIError';
    }
}
```

### Error Types

1. **Authentication Errors (401)**
   ```typescript
   try {
       await client.scanSync(request);
   } catch (error) {
       if (error.status === 401) {
           console.error('Invalid API key');
       }
   }
   ```

2. **Rate Limit Errors (429)**
   ```typescript
   if (error.status === 429) {
       const retryAfter = error.details?.retry_after;
       console.log(`Rate limited. Retry after ${retryAfter}s`);
   }
   ```

3. **Validation Errors (400)**
   ```typescript
   if (error.status === 400) {
       console.error('Invalid request:', error.details);
   }
   ```

4. **Server Errors (500+)**
   ```typescript
   if (error.status >= 500) {
       console.error('Server error. Retrying...');
   }
   ```

## Retry Logic

The client implements exponential backoff for transient failures:

```typescript
private async makeRequestWithRetry<T>(
    method: string,
    url: string,
    data?: unknown,
    retryCount = 0
): Promise<T> {
    try {
        return await this.makeRequest<T>(method, url, data);
    } catch (error) {
        if (retryCount >= this.config.maxRetries) {
            throw error;
        }

        // Retry for specific error types
        if (this.shouldRetry(error)) {
            const delay = this.config.retryDelay * Math.pow(2, retryCount);
            await this.sleep(delay);
            return this.makeRequestWithRetry(method, url, data, retryCount + 1);
        }

        throw error;
    }
}
```

### Retryable Conditions

- Network errors (ECONNRESET, ETIMEDOUT)
- 5xx server errors
- 429 rate limit errors (with backoff)

## Request/Response Handling

### Request Headers

All requests include standard headers:

```typescript
const headers = {
    'Content-Type': 'application/json',
    'x-pan-token': this.config.apiKey,
    'User-Agent': 'prisma-airs-mcp/1.0',
};
```

### Request Logging

Debug logging for troubleshooting:

```typescript
this.logger.debug('AIRS API request', {
    method,
    url,
    headers: { ...headers, 'x-pan-token': '[REDACTED]' },
    body: data,
});
```

### Response Processing

Successful responses are validated and typed:

```typescript
private async handleResponse<T>(response: Response): Promise<T> {
    const responseText = await response.text();
    
    if (!response.ok) {
        throw this.createError(response, responseText);
    }

    try {
        return JSON.parse(responseText) as T;
    } catch (error) {
        throw new AIRSAPIError('Invalid JSON response', response.status);
    }
}
```

## Usage Patterns

### Basic Usage

```typescript
import { PrismaAIRSClient } from './airs/client';

const client = new PrismaAIRSClient({
    apiKey: process.env.AIRS_API_KEY!,
});

// Simple scan
const result = await client.scanSync({
    tr_id: generateTransactionId(),
    request: [{
        prompt: userInput,
        profile_name: 'default'
    }]
});
```

### Advanced Configuration

```typescript
const client = new PrismaAIRSClient({
    apiKey: config.apiKey,
    baseUrl: 'https://custom.airs.endpoint.com',
    timeout: 60000,      // 60 second timeout
    maxRetries: 5,       // More retries
    retryDelay: 2000,    // 2 second initial delay
});
```

### Error Handling Pattern

```typescript
async function scanContentSafely(content: string) {
    try {
        return await client.scanSync({
            tr_id: generateId(),
            request: [{ prompt: content, profile_name: 'strict' }]
        });
    } catch (error) {
        if (error instanceof AIRSAPIError) {
            // Handle AIRS-specific errors
            logger.error('AIRS API error', {
                status: error.status,
                code: error.code,
                details: error.details
            });
            
            // Return safe default or rethrow
            if (error.status === 429) {
                throw new Error('Rate limited. Please try again later.');
            }
            
            throw new Error('Security scan failed');
        }
        
        // Handle other errors
        throw error;
    }
}
```

## Performance Considerations

### Connection Reuse

The client reuses HTTP connections via the native fetch API:

- Automatic connection pooling
- Keep-alive connections
- Efficient resource usage

### Timeout Configuration

Configure timeouts based on use case:

- **Interactive**: 10-30 seconds
- **Background**: 60+ seconds
- **Batch operations**: 120+ seconds

### Request Optimization

1. **Batch Operations**: Use async scanning for multiple items
2. **Parallel Requests**: Client is thread-safe
3. **Error Recovery**: Automatic retries reduce failures

## Testing

### Unit Testing

```typescript
describe('PrismaAIRSClient', () => {
    let client: PrismaAIRSClient;
    
    beforeEach(() => {
        client = new PrismaAIRSClient({
            apiKey: 'test-key',
            maxRetries: 0  // Disable retries for tests
        });
    });

    it('should scan content successfully', async () => {
        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify(mockResponse)
        });

        const result = await client.scanSync(mockRequest);
        expect(result).toBeDefined();
    });
});
```

### Integration Testing

```typescript
// Test with real API (requires valid key)
it('should scan real content', async () => {
    const client = new PrismaAIRSClient({
        apiKey: process.env.TEST_API_KEY!
    });

    const result = await client.scanSync({
        tr_id: 'test_' + Date.now(),
        request: [{
            prompt: 'Test content',
            profile_name: 'default'
        }]
    });

    expect(result.request_results).toHaveLength(1);
});
```

## Security Best Practices

1. **API Key Security**
    - Never hardcode API keys
    - Use environment variables
    - Rotate keys regularly

2. **Request Validation**
    - Validate input before sending
    - Sanitize error messages
    - Limit request sizes

3. **Response Handling**
    - Don't expose raw API responses
    - Sanitize threat details for users
    - Log security events

## Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm start
```

### Common Issues

1. **Connection Errors**
    - Check network connectivity
    - Verify API URL
    - Check firewall rules

2. **Authentication Failures**
    - Verify API key is correct
    - Check key permissions
    - Ensure key is active

3. **Timeout Errors**
    - Increase timeout value
    - Check request size
    - Verify API responsiveness

## Related Documentation

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Client with caching and rate limiting
- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - Type definitions
- [Factory]({{ site.baseurl }}/developers/src/airs/factory/) - Client instantiation
- [Tools]({{ site.baseurl }}/developers/src/tools/overview/) - Client usage in tools