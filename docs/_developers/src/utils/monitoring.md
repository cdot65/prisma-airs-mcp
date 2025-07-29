---
layout: documentation
title: Monitoring Module
permalink: /developers/src/utils/monitoring/
category: developers
---

# Monitoring Module (src/utils/monitoring.ts)

The monitoring module provides privacy-focused error tracking and performance monitoring using Sentry. It's designed to
be completely opt-in, with comprehensive data sanitization to protect sensitive information.

## Module Overview

The monitoring module integrates Sentry error tracking into the Express application with a focus on:

- **Privacy First**: All sensitive data is automatically sanitized
- **Opt-in Design**: Monitoring is disabled by default
- **Performance Tracking**: Optional performance monitoring with sampling
- **Contextual Debugging**: Breadcrumbs and error context without exposing secrets

## Architecture

```
┌─────────────────────────────────────────────┐
│            Application Code                 │
│         (Express Routes, Handlers)          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│          Monitoring Module                  │
│  • isMonitoringEnabled()                    │
│  • setupExpressRequestHandler()             │
│  • setupExpressErrorHandler()               │
│  • captureException()                       │
│  • addBreadcrumb()                          │
│  • createErrorHandler()                     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           Sentry SDK                        │
│  • Error capture                            │
│  • Performance monitoring                   │
│  • Breadcrumb tracking                      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        Sentry Dashboard                     │
│  • Error aggregation                        │
│  • Performance metrics                      │
│  • Alerting                                 │
└─────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

| Variable                      | Required | Default           | Description                |
|-------------------------------|----------|-------------------|----------------------------|
| `MONITORING_ENABLED`          | No       | `false`           | Enable/disable monitoring  |
| `SENTRY_DSN`                  | Yes*     | -                 | Sentry project DSN         |
| `SENTRY_ENVIRONMENT`          | No       | `NODE_ENV`        | Environment name           |
| `SENTRY_TRACES_SAMPLE_RATE`   | No       | `0.1`             | Performance sampling (0-1) |
| `SENTRY_PROFILES_SAMPLE_RATE` | No       | `0.1`             | Profile sampling (0-1)     |
| `SENTRY_RELEASE`              | No       | -                 | Release version            |
| `SENTRY_SERVER_NAME`          | No       | `prisma-airs-mcp` | Server identifier          |

*Required only when `MONITORING_ENABLED=true`

### Example Configuration

```bash
# .env file
MONITORING_ENABLED=true
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

## API Functions

### isMonitoringEnabled()

Checks if monitoring is enabled based on environment configuration.

```typescript
export function isMonitoringEnabled(): boolean {
    return process.env.MONITORING_ENABLED === 'true' && !!process.env.SENTRY_DSN;
}
```

**Returns**: `boolean` - True if monitoring is enabled and configured

**Usage**:

```typescript
if (isMonitoringEnabled()) {
    // Perform monitoring-specific operations
}
```

### setupExpressRequestHandler(app)

Sets up Sentry request tracking for Express applications. Must be called BEFORE all routes.

```typescript
export function setupExpressRequestHandler(_app: Express): void
```

**Parameters**:

- `app: Express` - Express application instance

**Note**: In Sentry v8+, this is handled automatically by the SDK, so this function just logs the status.

### setupExpressErrorHandler(app)

Sets up Sentry error handling middleware. Must be called AFTER all routes but BEFORE other error handlers.

```typescript
export function setupExpressErrorHandler(app: Express): void
```

**Parameters**:

- `app: Express` - Express application instance

**Usage**:

```typescript
// After all routes
app.use('/api', apiRoutes);

// Setup Sentry error handler
setupExpressErrorHandler(app);

// Then custom error handlers
app.use(customErrorHandler);
```

### captureException(error, context?)

Captures an exception with optional context, automatically sanitizing sensitive data.

```typescript
export function captureException(
    error: Error, 
    context?: Record<string, unknown>
): void
```

**Parameters**:

- `error: Error` - The error to capture
- `context?: Record<string, unknown>` - Optional context data

**Example**:

```typescript
try {
    await riskyOperation();
} catch (error) {
    captureException(error, {
        operation: 'riskyOperation',
        userId: user.id,
        // API keys, passwords, etc. will be auto-sanitized
    });
}
```

### addBreadcrumb(message, category, data?)

Adds a breadcrumb for debugging, helping track the sequence of events leading to an error.

```typescript
export function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>
): void
```

**Parameters**:

- `message: string` - Breadcrumb message
- `category: string` - Category (e.g., 'http', 'user', 'navigation')
- `data?: Record<string, unknown>` - Optional metadata

**Example**:

```typescript
addBreadcrumb('User authenticated', 'auth', {
    userId: user.id,
    method: 'oauth',
});
```

### startSpan(name, op)

Starts a performance monitoring span. Currently a placeholder for future enhancement.

```typescript
export function startSpan(name: string, op: string): void
```

**Parameters**:

- `name: string` - Span name
- `op: string` - Operation type

### createErrorHandler()

Creates a custom Express error handler middleware that integrates with Sentry.

```typescript
export function createErrorHandler(): ErrorRequestHandler
```

**Returns**: Express error handler middleware

**Features**:

- Logs errors locally with Winston
- Captures errors to Sentry with context
- Returns appropriate error responses
- Includes Sentry error ID in response

**Usage**:

```typescript
// After Sentry error handler
app.use(createErrorHandler());
```

### logMonitoringStatus()

Logs the current monitoring configuration status on startup.

```typescript
export function logMonitoringStatus(): void
```

**Output Examples**:

```
// When enabled
INFO: Monitoring enabled {
    provider: 'Sentry',
    environment: 'production',
    tracesSampleRate: '0.1',
    profilesSampleRate: '0.1'
}

// When disabled
INFO: Monitoring disabled {
    reason: 'MONITORING_ENABLED is not true'
}
```

## Data Sanitization

### Automatic Sanitization

The `sanitizeData()` function automatically removes sensitive information:

```typescript
const sensitiveKeys = [
    'token',
    'key',
    'secret',
    'password',
    'auth',
    'api',
    'credential',
    'private',
];
```

**Sanitization Rules**:

1. **Sensitive Keys**: Any key containing sensitive words is replaced with `[REDACTED]`
2. **Nested Objects**: Recursively sanitized
3. **Long Strings**: Truncated to 100 characters to prevent accidental exposure
4. **Arrays**: Passed through unchanged

**Example**:

```typescript
// Input
{
    userId: '12345',
    apiKey: 'secret-key-123',
    password: 'user-password',
    data: { nestedToken: 'xyz' },
    description: 'A'.repeat(200)
}

// Output
{
    userId: '12345',
    apiKey: '[REDACTED]',
    password: '[REDACTED]',
    data: { nestedToken: '[REDACTED]' },
    description: 'AAA...AAA...[truncated]'
}
```

## Integration Examples

### Express Application Setup

```typescript
// src/index.ts
import { 
    setupExpressRequestHandler,
    setupExpressErrorHandler,
    createErrorHandler,
    logMonitoringStatus,
    addBreadcrumb
} from './utils/monitoring.js';

const app = express();

// Log monitoring status
logMonitoringStatus();

// Setup request handler (must be first)
setupExpressRequestHandler(app);

// Middleware
app.use(cors());
app.use(express.json());

// Request tracking
app.use((req, res, next) => {
    addBreadcrumb(`${req.method} ${req.path}`, 'http.request', {
        method: req.method,
        path: req.path,
        query: req.query,
    });
    next();
});

// Routes
app.use('/api', apiRoutes);

// Setup error handlers (must be last)
setupExpressErrorHandler(app);
app.use(createErrorHandler());
```

### Error Handling in Route Handlers

```typescript
// Example route handler
app.post('/api/scan', async (req, res, next) => {
    try {
        addBreadcrumb('Starting scan', 'scan', {
            contentLength: req.body.content?.length,
        });

        const result = await scanContent(req.body);
        
        res.json(result);
    } catch (error) {
        // Error will be caught by error handlers
        next(error);
    }
});
```

### Service Layer Integration

```typescript
import { captureException, addBreadcrumb } from '../utils/monitoring.js';

export class ScanService {
    async scanContent(content: string): Promise<ScanResult> {
        addBreadcrumb('Scan requested', 'scan.start', {
            contentSize: content.length,
        });

        try {
            const result = await this.airsClient.scan(content);
            
            addBreadcrumb('Scan completed', 'scan.complete', {
                scanId: result.scanId,
                threatCount: result.threats.length,
            });

            return result;
        } catch (error) {
            captureException(error, {
                service: 'ScanService',
                operation: 'scanContent',
                contentSize: content.length,
            });
            throw error;
        }
    }
}
```

## Error Response Format

When monitoring is enabled, error responses include the Sentry error ID:

```json
{
    "error": "Internal server error",
    "errorId": "abc123def456",
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Users can reference the `errorId` when reporting issues.

## Privacy Considerations

### What IS Captured

- Error messages and stack traces
- HTTP method, path, and query parameters
- Custom breadcrumbs and context
- Performance metrics (if enabled)
- Application metadata (version, environment)

### What is NOT Captured

- Request/response bodies
- HTTP headers (especially auth headers)
- API keys, tokens, or credentials
- User personal information
- File contents or scan results
- Database queries or results

### Additional Privacy Features

1. **beforeSend Hook**: Filters events in `instrument.ts`
2. **No Default PII**: Personal information is not sent by default
3. **Sanitization**: Automatic removal of sensitive data
4. **Opt-in Design**: Disabled by default

## Performance Monitoring

### Sampling Configuration

Performance monitoring uses sampling to reduce overhead:

```typescript
// 10% of requests are traced
SENTRY_TRACES_SAMPLE_RATE=0.1

// 10% of traces include profiling
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

### Custom Sampling

The `instrument.ts` file implements custom sampling logic:

```typescript
tracesSampler(samplingContext) {
    // Don't trace health checks
    if (samplingContext.request?.url?.includes('/health')) {
        return 0;
    }
    
    // Lower sampling for high-frequency endpoints
    if (samplingContext.request?.url?.includes('/sse')) {
        return 0.01; // 1%
    }
    
    // Default sampling rate
    return 0.1; // 10%
}
```

## Troubleshooting

### Monitoring Not Working

1. **Check Configuration**:
   ```typescript
   console.log('Monitoring enabled:', isMonitoringEnabled());
   console.log('DSN present:', !!process.env.SENTRY_DSN);
   ```

2. **Verify Initialization Order**:
    - `instrument.ts` must be imported first
    - Request handler before routes
    - Error handler after routes

3. **Check Logs**:
   ```
   grep "Sentry" app.log
   ```

### Errors Not Appearing in Dashboard

1. **Verify DSN**: Ensure SENTRY_DSN is correct
2. **Check Environment**: Verify SENTRY_ENVIRONMENT matches dashboard filters
3. **Test Error**: Use Sentry.captureException(new Error('Test'))
4. **Network**: Check firewall/proxy settings

### Performance Impact

1. **Reduce Sampling**: Lower SENTRY_TRACES_SAMPLE_RATE
2. **Disable Profiling**: Set SENTRY_PROFILES_SAMPLE_RATE=0
3. **Filter Events**: Add more conditions to beforeSend

## Best Practices

### 1. Meaningful Breadcrumbs

```typescript
// Good - provides context
addBreadcrumb('Payment processed', 'payment', {
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
});

// Bad - too generic
addBreadcrumb('Action performed', 'action');
```

### 2. Structured Error Context

```typescript
// Good - structured context
captureException(error, {
    component: 'PaymentService',
    operation: 'processPayment',
    paymentId: payment.id,
    amount: payment.amount,
});

// Bad - unstructured
captureException(error, {
    data: `Payment ${payment.id} failed`,
});
```

### 3. Environment-Specific Configuration

```typescript
// Production - conservative sampling
SENTRY_TRACES_SAMPLE_RATE=0.01  # 1%

// Staging - moderate sampling
SENTRY_TRACES_SAMPLE_RATE=0.1   # 10%

// Development - full sampling
SENTRY_TRACES_SAMPLE_RATE=1.0   # 100%
```

## Testing

### Unit Testing

```typescript
import { isMonitoringEnabled, captureException } from './monitoring';

describe('Monitoring', () => {
    it('should not throw when disabled', () => {
        process.env.MONITORING_ENABLED = 'false';
        
        expect(() => {
            captureException(new Error('Test'));
        }).not.toThrow();
    });
});
```

### Integration Testing

```typescript
// Test with monitoring enabled
MONITORING_ENABLED=true SENTRY_DSN=https://test@sentry.io/123 npm test

// Test with monitoring disabled
MONITORING_ENABLED=false npm test
```

## Related Documentation

- [Instrument Module]({{ site.baseurl }}/developers/src/instrument-file/) - Sentry initialization
- [Logger Module]({{ site.baseurl }}/developers/src/utils/logger/) - Logging system
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Environment configuration
- [Main Application]({{ site.baseurl }}/developers/src/index-file/) - Integration example