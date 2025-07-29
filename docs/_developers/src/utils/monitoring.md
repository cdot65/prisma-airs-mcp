---
layout: documentation
title: Monitoring Module
permalink: /developers/src/utils/monitoring/
category: developers
---

Privacy-focused error tracking and performance monitoring using Sentry. Opt-in design with automatic data sanitization to protect sensitive information.

## Core Purpose

- Provide opt-in error tracking
- Sanitize sensitive data automatically
- Capture performance metrics
- Enable debugging with breadcrumbs

## Configuration

### Environment Variables

| Variable                    | Default           | Description               |
|-----------------------------|-------------------|---------------------------|
| `MONITORING_ENABLED`        | `false`           | Enable/disable monitoring |
| `SENTRY_DSN`                | -                 | Sentry project DSN*       |
| `SENTRY_ENVIRONMENT`        | `NODE_ENV`        | Environment name          |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1`             | Performance sampling      |

*Required when monitoring is enabled

## Key Functions

### Check Status

```typescript
export function isMonitoringEnabled(): boolean {
    return process.env.MONITORING_ENABLED === 'true' && !!process.env.SENTRY_DSN;
}
```

### Setup Express

```typescript
// Before routes
setupExpressRequestHandler(app);

// After routes
setupExpressErrorHandler(app);
app.use(createErrorHandler());
```

### Capture Errors

```typescript
export function captureException(
    error: Error, 
    context?: Record<string, unknown>
): void {
    if (!isMonitoringEnabled()) return;
    
    Sentry.captureException(error, {
        extra: sanitizeData(context || {})
    });
}
```

### Add Breadcrumbs

```typescript
export function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>
): void {
    if (!isMonitoringEnabled()) return;
    
    Sentry.addBreadcrumb({
        message,
        category,
        level: 'info',
        data: sanitizeData(data || {})
    });
}
```

## Integration in Application

### Express Setup

```typescript
import { 
    setupExpressRequestHandler,
    setupExpressErrorHandler,
    createErrorHandler,
    logMonitoringStatus 
} from './utils/monitoring.js';

const app = express();

// Log status
logMonitoringStatus();

// Setup request handler (first)
setupExpressRequestHandler(app);

// Routes
app.use('/api', apiRoutes);

// Setup error handlers (last)
setupExpressErrorHandler(app);
app.use(createErrorHandler());
```

### Service Integration

```typescript
export class ScanService {
    async scanContent(content: string) {
        addBreadcrumb('Scan requested', 'scan', {
            contentSize: content.length
        });

        try {
            const result = await this.client.scan(content);
            return result;
        } catch (error) {
            captureException(error, {
                service: 'ScanService',
                operation: 'scanContent'
            });
            throw error;
        }
    }
}
```

## Data Sanitization

Automatic removal of sensitive data:

```typescript
const sensitiveKeys = [
    'token', 'key', 'secret', 'password', 
    'auth', 'api', 'credential', 'private'
];

// Example sanitization
{
    userId: '12345',
    apiKey: 'secret-key',     // → '[REDACTED]'
    password: 'pass123'       // → '[REDACTED]'
}
```

## Privacy Features

### What IS Captured

- Error messages and stack traces
- HTTP method, path, query params
- Custom breadcrumbs and context
- Application metadata

### What is NOT Captured

- Request/response bodies
- HTTP headers (auth headers)
- API keys or credentials
- Personal information
- File contents

## Error Response

When monitoring is enabled:

```json
{
    "error": "Internal server error",
    "errorId": "abc123def456",
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Best Practices

### Meaningful Breadcrumbs

```typescript
// Good
addBreadcrumb('Payment processed', 'payment', {
    amount: payment.amount,
    method: payment.method
});

// Bad
addBreadcrumb('Action', 'generic');
```

### Structured Context

```typescript
// Good
captureException(error, {
    component: 'PaymentService',
    operation: 'processPayment',
    paymentId: payment.id
});
```

### Environment Sampling

```bash
# Production - conservative
SENTRY_TRACES_SAMPLE_RATE=0.01  # 1%

# Staging - moderate
SENTRY_TRACES_SAMPLE_RATE=0.1   # 10%

# Development - full
SENTRY_TRACES_SAMPLE_RATE=1.0   # 100%
```

## Performance Monitoring

Custom sampling logic:

```typescript
tracesSampler(context) {
    // Skip health checks
    if (context.request?.url?.includes('/health')) {
        return 0;
    }
    
    // Lower rate for SSE
    if (context.request?.url?.includes('/sse')) {
        return 0.01; // 1%
    }
    
    return 0.1; // Default 10%
}
```

## Related Modules

- [Instrument]({{ site.baseurl }}/developers/src/instrument-file/) - Sentry initialization
- [Logger]({{ site.baseurl }}/developers/src/utils/logger/) - Logging integration
- [Main Application]({{ site.baseurl }}/developers/src/index-file/) - Express setup
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Environment config
