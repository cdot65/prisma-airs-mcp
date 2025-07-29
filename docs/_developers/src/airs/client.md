---
layout: documentation
title: AIRS Client
permalink: /developers/src/airs/client/
category: developers
---

The AIRS client module provides the core REST API client for communicating with the Prisma AI Runtime Security (AIRS)
service. It handles HTTP requests, retries, error handling, and type-safe API method implementations.

## Overview

The `PrismaAirsClient` class is the foundation of all AIRS API interactions, providing:

- Type-safe API methods for all AIRS endpoints
- Automatic retry logic with exponential backoff
- Comprehensive error handling with custom error types
- Request/response logging for debugging
- Configurable timeouts and retry behavior

## Architecture

```text
┌─────────────────────────────────────────┐
│         PrismaAirsClient                │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Configuration                │  │
│  │  • API URL                        │  │
│  │  • API Key                        │  │
│  │  • Timeout                        │  │
│  │  • Retry Settings                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      HTTP Methods                 │  │
│  │  • makeRequest()                  │  │
│  │  • parseResponse()                │  │
│  │  • handleAPIError()               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      API Methods                  │  │
│  │  • scanSync()                     │  │
│  │  • scanAsync()                    │  │
│  │  • getScanResults()               │  │
│  │  • getThreatScanReports()         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Configuration

### Client Configuration Interface

```typescript
interface AirsClientConfig {
    apiKey: string;         // Required: API authentication key
    apiUrl: string;         // Required: API base URL
    timeout?: number;       // Optional: Request timeout in ms
    maxRetries?: number;    // Optional: Maximum retry attempts
    retryDelay?: number;    // Optional: Initial retry delay in ms
}
```

### Default Configuration

```typescript
// Defaults are applied in the constructor
const defaults = {
    timeout: 30000,        // 30 seconds
    maxRetries: 3,         // 3 retry attempts
    retryDelay: 1000,      // 1 second initial delay
};
```

## API Methods

### scanSync(request, options?)

Performs synchronous content scanning with immediate results.

```typescript
/**
 * Send a synchronous scan request
 */
async scanSync(
    request: AirsScanRequest,
    options?: AirsRequestOptions,
): Promise<AirsScanResponse> {
    return this.makeRequest<AirsScanResponse>('POST', '/scan/sync/request', request, options);
}
```

**Parameters:**

- `request: AirsScanRequest` - Scan request containing content and profile
- `options?: AirsRequestOptions` - Optional request configuration (headers, signal)

**Returns:**

- `AirsScanResponse` - Scan results with threat details

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

### scanAsync(requests, options?)

Initiates asynchronous batch scanning for multiple requests.

```typescript
/**
 * Send an asynchronous scan request
 */
async scanAsync(
    requests: AirsAsyncScanObject[],
    options?: AirsRequestOptions,
): Promise<AirsAsyncScanResponse> {
    return this.makeRequest<AirsAsyncScanResponse>(
        'POST',
        '/scan/async/request',
        requests,
        options,
    );
}
```

**Parameters:**

- `requests: AirsAsyncScanObject[]` - Array of scan objects to process
- `options?: AirsRequestOptions` - Optional request configuration

**Returns:**

- `AirsAsyncScanResponse` - Response containing scan IDs for result retrieval

**Example:**

```typescript
const response = await client.scanAsync([
    {
        tr_id: 'batch_1',
        request: [{prompt: 'Content 1', profile_name: 'strict'}]
    },
    {
        tr_id: 'batch_2',
        request: [{prompt: 'Content 2', profile_name: 'strict'}]
    }
]);

// Response contains scan IDs for each request
response.scan_ids.forEach(scanId => {
    console.log('Scan ID:', scanId);
});
```

### getScanResults(scanIds, options?)

Retrieves results for completed scans by scan ID.

```typescript
/**
 * Get scan results by scan IDs
 */
async getScanResults(
    scanIds: string[],
    options?: AirsRequestOptions,
): Promise<AirsScanIdResult[]> {
    if (scanIds.length === 0) {
        throw new PrismaAirsApiError('No scan IDs provided', AirsErrorCode.BadRequest);
    }

    if (scanIds.length > AIRS_MAX_SCAN_IDS) {
        throw new PrismaAirsApiError(
            `Too many scan IDs: maximum ${AIRS_MAX_SCAN_IDS} allowed`,
            AirsErrorCode.BadRequest,
        );
    }

    const params = new URLSearchParams();
    params.append('scan_ids', scanIds.join(','));

    return this.makeRequest<AirsScanIdResult[]>(
        'GET',
        `/scan/results?${params.toString()}`,
        undefined,
        options,
    );
}
```

**Parameters:**

- `scanIds: string[]` - Array of scan IDs to retrieve (max: 100)
- `options?: AirsRequestOptions` - Optional request configuration

**Returns:**

- `AirsScanIdResult[]` - Array of scan results

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

### getThreatScanReports(reportIds, options?)

Retrieves detailed threat analysis reports.

```typescript
/**
 * Get threat scan reports by report IDs
 */
async getThreatScanReports(
    reportIds: string[],
    options?: AirsRequestOptions,
): Promise<AirsThreatScanReportObject[]> {
    if (reportIds.length === 0) {
        throw new PrismaAirsApiError('No report IDs provided', AirsErrorCode.BadRequest);
    }

    if (reportIds.length > AIRS_MAX_REPORT_IDS) {
        throw new PrismaAirsApiError(
            `Too many report IDs: maximum ${AIRS_MAX_REPORT_IDS} allowed`,
            AirsErrorCode.BadRequest,
        );
    }

    const params = new URLSearchParams();
    params.append('report_ids', reportIds.join(','));

    return this.makeRequest<AirsThreatScanReportObject[]>(
        'GET',
        `/scan/reports?${params.toString()}`,
        undefined,
        options,
    );
}
```

**Parameters:**

- `reportIds: string[]` - Array of report IDs (max: 100)
- `options?: AirsRequestOptions` - Optional request configuration

**Returns:**

- `AirsThreatScanReportObject[]` - Detailed threat reports

**Example:**

```typescript
const reports = await client.getThreatScanReports(['report_123']);

reports.forEach(report => {
    console.log('Report ID:', report.report_id);
    console.log('Category:', report.category);
    console.log('Severity:', report.severity);
    console.log('Details:', report.details);
});
```

## Error Handling

### Custom Error Class

The client uses a custom `PrismaAirsApiError` class for API-specific errors:

```typescript
export class PrismaAirsApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public response?: AirsErrorResponse
    ) {
        super(message);
        this.name = 'PrismaAirsApiError';
    }
}
```

### Error Types

1. **Authentication Errors (401)**

    ```typescript
    try {
        await client.scanSync(request);
    } catch (error) {
        if (error instanceof PrismaAirsApiError && error.statusCode === 401) {
            console.error('Invalid API key');
        }
    }
    ```

2. **Rate Limit Errors (429)**

   ```typescript
   if (error instanceof PrismaAirsApiError && error.statusCode === 429) {
       const retryAfter = error.response?.error?.retry_after;
       console.log(`Rate limited. Retry after ${retryAfter?.interval} ${retryAfter?.unit}`);
   }
   ```

3. **Validation Errors (400)**

   ```typescript
   if (error instanceof PrismaAirsApiError && error.statusCode === 400) {
       console.error('Invalid request:', error.response?.error?.message);
   }
   ```

4. **Server Errors (500+)**

   ```typescript
   if (error instanceof PrismaAirsApiError && error.statusCode >= 500) {
       console.error('Server error. Will retry automatically...');
   }
   ```

## Retry Logic

The client implements exponential backoff for transient failures:

```typescript
/**
 * Make an HTTP request with retry logic and error handling
 */
private async makeRequest<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: AirsRequestOptions,
    retryCount = 0,
): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
        [AIRS_AUTH_HEADER]: this.config.apiKey,
        'Content-Type': AIRS_CONTENT_TYPE,
        Accept: AIRS_CONTENT_TYPE,
        ...options?.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
        this.logger.debug('Making AIRS API request', {
            method,
            url,
            retryCount,
        });

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: options?.signal || controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();

        // Parse response
        const responseData = this.parseResponse(responseText, url, response.status);

        if (!response.ok) {
            const errorResponse = responseData as AirsErrorResponse;

            // Handle rate limiting with retry
            if (
                response.status === Number(AirsErrorCode.TooManyRequests) &&
                retryCount < this.config.maxRetries
            ) {
                const retryAfter = errorResponse.error?.retry_after;
                const delay = retryAfter
                    ? this.calculateRetryDelay(retryAfter)
                    : this.config.retryDelay * Math.pow(2, retryCount);

                this.logger.warn('Rate limited, retrying after delay', {
                    url,
                    retryCount,
                    delay,
                });

                await this.sleep(delay);
                return this.makeRequest<T>(method, path, body, options, retryCount + 1);
            }

            // Handle other errors
            this.handleAPIError(errorResponse, response.status, url);
        }

        this.logger.debug('AIRS API request successful', {
            url,
            status: response.status,
        });

        return responseData as T;
    } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout and network errors with retry
        if (
            (error instanceof Error && error.name === 'AbortError') ||
            (error instanceof TypeError && error.message.includes('fetch'))
        ) {
            if (retryCount < this.config.maxRetries) {
                const delay = this.config.retryDelay * Math.pow(2, retryCount);

                this.logger.warn('Request failed, retrying', {
                    url,
                    retryCount,
                    delay,
                    error: error.message,
                });

                await this.sleep(delay);
                return this.makeRequest<T>(method, path, body, options, retryCount + 1);
            }
        }

        // Re-throw PrismaAirsApiError as-is
        if (error instanceof PrismaAirsApiError) {
            throw error;
        }

        // Wrap other errors
        this.logger.error('Unexpected error during API request', {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw new PrismaAirsApiError(
            error instanceof Error ? error.message : 'Unknown error',
            0,
        );
    }
}
```

### Retryable Conditions

- Network errors (AbortError, fetch failures)
- Timeout errors
- 429 rate limit errors (with server-specified or exponential backoff)

## Request/Response Handling

### Request Headers

All requests include standard headers:

```typescript
const headers: Record<string, string> = {
    [AIRS_AUTH_HEADER]: this.config.apiKey,  // 'x-pan-token'
    'Content-Type': AIRS_CONTENT_TYPE,       // 'application/json'
    Accept: AIRS_CONTENT_TYPE,
    ...options?.headers,  // Allow custom headers
};
```

### Request Logging

Debug logging for troubleshooting:

```typescript
this.logger.debug('Making AIRS API request', {
    method,
    url,
    retryCount,
});
```

### Response Processing

Responses are parsed and validated:

```typescript
/**
 * Parse response text to JSON
 */
private parseResponse(responseText: string, url: string, status: number): unknown {
    try {
        return responseText ? JSON.parse(responseText) : {};
    } catch {
        this.logger.error('Failed to parse API response', {
            url,
            status,
            responseText,
        });
        throw new PrismaAirsApiError('Invalid JSON response from API', status);
    }
}
```

## Usage Patterns

### Basic Usage

```typescript
import {PrismaAirsClient} from './airs/client';

const client = new PrismaAirsClient({
    apiKey: process.env.AIRS_API_KEY!,
    apiUrl: process.env.AIRS_API_URL!,
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
const client = new PrismaAirsClient({
    apiKey: config.apiKey,
    apiUrl: 'https://custom.airs.endpoint.com',
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
            request: [{prompt: content, profile_name: 'strict'}]
        });
    } catch (error) {
        if (error instanceof PrismaAirsApiError) {
            // Handle AIRS-specific errors
            logger.error('AIRS API error', {
                statusCode: error.statusCode,
                message: error.message,
                response: error.response
            });

            // Return safe default or rethrow
            if (error.statusCode === 429) {
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
describe('PrismaAirsClient', () => {
    let client: PrismaAirsClient;

    beforeEach(() => {
        client = new PrismaAirsClient({
            apiKey: 'test-key',
            apiUrl: 'https://test.api.com',
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
    const client = new PrismaAirsClient({
        apiKey: process.env.TEST_API_KEY!,
        apiUrl: process.env.TEST_API_URL!
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
