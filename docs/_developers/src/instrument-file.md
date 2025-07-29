---
layout: documentation
title: Instrument Module
permalink: /developers/src/instrument-file/
category: developers
---

# Instrument Module (src/instrument.ts)

The instrument module handles early initialization of Sentry monitoring. It must be imported at the very beginning of
the application to properly instrument all modules and capture errors throughout the application lifecycle.

## Overview

The `instrument.ts` file provides:

- Early Sentry SDK initialization
- Privacy-focused configuration
- Comprehensive data sanitization
- Performance monitoring setup
- Custom sampling logic
- Error filtering rules

## Why Early Initialization?

Sentry must be initialized before other modules to:

1. **Instrument Node.js internals** - HTTP, console, etc.
2. **Capture startup errors** - Module loading failures
3. **Enable performance monitoring** - Transaction tracking
4. **Setup global handlers** - Uncaught exceptions

```typescript
// MUST be the first import in index.ts
import './instrument.js';

// Then other imports...
import express from 'express';
```

## Module Structure

```
┌─────────────────────────────────────────┐
│         Application Start               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Load Environment Variables         │
│         import 'dotenv/config'          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Check Monitoring Config            │
│   MONITORING_ENABLED && SENTRY_DSN      │
└─────────────┬─────────────┬─────────────┘
              │ Enabled     │ Disabled
              ▼             ▼
┌─────────────────┐   ┌───────────────────┐
│  Initialize     │   │   Log Disabled    │
│    Sentry       │   │     Reason        │
└─────────────────┘   └───────────────────┘
```

## Initialization Logic

### Environment Check

```typescript
// Only initialize if explicitly enabled via environment variables
if (process.env.MONITORING_ENABLED === 'true' && process.env.SENTRY_DSN) {
    Sentry.init({
        // Configuration
    });
} else {
    // Log why monitoring is disabled
    if (process.env.MONITORING_ENABLED !== 'true') {
        console.log('ℹ️  Sentry monitoring disabled: MONITORING_ENABLED is not true');
    } else if (!process.env.SENTRY_DSN) {
        console.log('ℹ️  Sentry monitoring disabled: No SENTRY_DSN provided');
    }
}
```

**Key Points:**

- Requires both `MONITORING_ENABLED=true` AND valid DSN
- Provides clear feedback when disabled
- Uses console.log for early initialization

## Sentry Configuration

### Basic Settings

```typescript
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    
    // Integrations
    integrations: [
        // HTTP integration is automatically added
        nodeProfilingIntegration(),
    ],
    
    // Server identification
    serverName: process.env.SENTRY_SERVER_NAME || 'prisma-airs-mcp',
    
    // Release tracking
    release: process.env.SENTRY_RELEASE,
});
```

### Performance Monitoring

```typescript
// Performance monitoring - conservative defaults
tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'), // 10%
profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'), // 10%
```

**Sampling Rates:**

- `tracesSampleRate`: Percentage of transactions to trace
- `profilesSampleRate`: Percentage of traces to profile
- Conservative defaults prevent performance impact

### Privacy Configuration

```typescript
// Privacy-first configuration
sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true', // Default: false
attachStacktrace: true,

// Maximum breadcrumbs to keep
maxBreadcrumbs: 50,
```

**Privacy Features:**

- No PII sent by default
- Stack traces included for debugging
- Limited breadcrumb history

## Data Sanitization

### beforeSend Hook

The `beforeSend` hook filters every event before sending:

```typescript
beforeSend(event) {
    // Remove authentication headers
    if (event.request?.headers) {
        delete event.request.headers['x-pan-token'];
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
    }

    // Remove request/response bodies
    if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
    }

    // Remove custom contexts
    if (event.contexts) {
        delete event.contexts.airs;
        delete event.contexts.scan;
        delete event.contexts.api;
    }

    // Remove sensitive extra data
    if (event.extra) {
        delete event.extra.airsResponse;
        delete event.extra.scanResult;
        delete event.extra.apiKey;
        delete event.extra.token;
    }

    // Don't send health check errors
    if (event.request?.url?.includes('/health') || 
        event.request?.url?.includes('/ready')) {
        return null; // Drop the event
    }

    return event;
}
```

**Sanitization Rules:**

1. Remove all authentication data
2. Remove request/response bodies
3. Remove custom contexts with potential PII
4. Filter out health check noise

### beforeBreadcrumb Hook

Filters breadcrumb data:

```typescript
beforeBreadcrumb(breadcrumb) {
    // Filter HTTP breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data) {
        // Remove auth headers
        if (breadcrumb.data.headers) {
            delete breadcrumb.data.headers['x-pan-token'];
            delete breadcrumb.data.headers['authorization'];
        }

        // Skip health checks
        if (breadcrumb.data.url?.includes('/health') ||
            breadcrumb.data.url?.includes('/ready')) {
            return null;
        }
    }

    // Sanitize console breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.message) {
        const sensitivePatterns = [
            /api[_-]?key/i,
            /token/i,
            /secret/i,
            /password/i,
            /credential/i,
        ];

        for (const pattern of sensitivePatterns) {
            if (pattern.test(breadcrumb.message)) {
                breadcrumb.message = '[REDACTED - Potential sensitive data]';
                break;
            }
        }
    }

    return breadcrumb;
}
```

## Error Filtering

### Ignored Errors

```typescript
// Don't send certain errors
ignoreErrors: [
    // Ignore client disconnection errors
    'ECONNRESET',
    'EPIPE',
    'ETIMEDOUT',
    // Ignore common client errors
    'NetworkError',
    'Failed to fetch',
],
```

**Purpose:**

- Reduce noise from network issues
- Filter client-side errors
- Focus on application errors

## Performance Sampling

### Custom Sampling Logic

```typescript
// Custom sampling for performance monitoring
tracesSampler(samplingContext) {
    // Don't trace health checks
    if (samplingContext.request?.url?.includes('/health') ||
        samplingContext.request?.url?.includes('/ready')) {
        return 0;
    }

    // Lower sampling for high-frequency endpoints
    if (samplingContext.request?.url?.includes('/sse')) {
        return 0.01; // 1% for SSE connections
    }

    // Use configured rate for everything else
    return parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');
}
```

**Sampling Strategy:**

- 0% for health checks (no value)
- 1% for SSE connections (high volume)
- 10% default for other endpoints

## Environment Variables

### Required for Monitoring

| Variable             | Description        | Example                         |
|----------------------|--------------------|---------------------------------|
| `MONITORING_ENABLED` | Enable monitoring  | `true`                          |
| `SENTRY_DSN`         | Sentry project DSN | `https://key@sentry.io/project` |

### Optional Configuration

| Variable                      | Default           | Description                |
|-------------------------------|-------------------|----------------------------|
| `SENTRY_ENVIRONMENT`          | `NODE_ENV`        | Environment name           |
| `SENTRY_TRACES_SAMPLE_RATE`   | `0.1`             | Transaction sampling (0-1) |
| `SENTRY_PROFILES_SAMPLE_RATE` | `0.1`             | Profile sampling (0-1)     |
| `SENTRY_RELEASE`              | -                 | Release version            |
| `SENTRY_SERVER_NAME`          | `prisma-airs-mcp` | Server identifier          |
| `SENTRY_SEND_DEFAULT_PII`     | `false`           | Send PII data              |

## Initialization Output

### When Enabled

```
✅ Sentry monitoring initialized for environment: production
```

### When Disabled

```
ℹ️  Sentry monitoring disabled: MONITORING_ENABLED is not true
```

or

```
ℹ️  Sentry monitoring disabled: No SENTRY_DSN provided
```

## Integration with Application

### Import Order

```typescript
// src/index.ts
import './instrument.js';  // MUST be first

// Then other imports
import express from 'express';
import { getConfig } from './config';
```

### Working with Monitoring Utils

```typescript
// The monitoring utils check if Sentry is initialized
import { captureException, addBreadcrumb } from './utils/monitoring';

// These work whether Sentry is enabled or not
captureException(new Error('Test'));
addBreadcrumb('Action performed', 'user');
```

## Security Considerations

### Data Privacy

1. **No PII by Default**: `sendDefaultPii: false`
2. **Header Sanitization**: Auth headers removed
3. **Body Removal**: Request/response bodies stripped
4. **Context Filtering**: Custom contexts removed
5. **URL Filtering**: Sensitive paths excluded

### API Key Protection

```typescript
// Never log API keys
if (event.extra?.apiKey) {
    delete event.extra.apiKey;
}

// Remove from headers
delete event.request.headers['x-pan-token'];
```

### Breadcrumb Sanitization

```typescript
// Detect and redact sensitive patterns
const sensitivePatterns = [/api[_-]?key/i, /token/i, /secret/i];
```

## Performance Impact

### Minimal Overhead

1. **Conditional Initialization**: Only when enabled
2. **Low Sampling Rates**: 10% default
3. **Filtered Events**: Health checks excluded
4. **Async Processing**: Non-blocking

### Resource Usage

- **Memory**: ~10-20MB for SDK
- **CPU**: <1% with default sampling
- **Network**: Batched event sending

## Testing Considerations

### Test Environment

```typescript
// Typically disabled in tests
MONITORING_ENABLED=false npm test
```

### Testing with Sentry

```typescript
// Enable for specific tests
describe('Error Handling', () => {
    beforeAll(() => {
        process.env.MONITORING_ENABLED = 'true';
        process.env.SENTRY_DSN = 'https://test@sentry.io/test';
        require('./instrument');
    });
});
```

### Mocking Sentry

```typescript
// Mock Sentry in tests
jest.mock('@sentry/node', () => ({
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
}));
```

## Troubleshooting

### Common Issues

1. **Sentry Not Initializing**
    - Check both MONITORING_ENABLED and SENTRY_DSN
    - Verify instrument.ts is imported first
    - Check console for initialization message

2. **Missing Errors**
    - Verify error isn't in ignoreErrors list
    - Check beforeSend isn't filtering it
    - Ensure captureException is called

3. **No Performance Data**
    - Check tracesSampleRate > 0
    - Verify endpoint isn't excluded
    - Look for health check filtering

### Debug Mode

```typescript
// Add debug logging
Sentry.init({
    debug: process.env.NODE_ENV === 'development',
    // ... other config
});
```

### Validation

```typescript
// Verify Sentry is working
if (process.env.MONITORING_ENABLED === 'true') {
    Sentry.captureMessage('Sentry initialization test');
}
```

## Best Practices

### 1. Environment-Specific Config

```typescript
// Use different DSNs per environment
SENTRY_DSN_DEV=https://key@sentry.io/dev-project
SENTRY_DSN_PROD=https://key@sentry.io/prod-project
```

### 2. Conservative Sampling

```typescript
// Production: low sampling
SENTRY_TRACES_SAMPLE_RATE=0.01  # 1%

// Staging: moderate sampling  
SENTRY_TRACES_SAMPLE_RATE=0.1   # 10%
```

### 3. Release Tracking

```typescript
// Set release version
SENTRY_RELEASE=v1.0.0

// Or use git commit
SENTRY_RELEASE=$(git rev-parse HEAD)
```

### 4. Custom Context

```typescript
// Add custom context after initialization
Sentry.setContext('server', {
    region: process.env.AWS_REGION,
    instance: process.env.INSTANCE_ID,
});
```

## Related Documentation

- [Monitoring Utils]({{ site.baseurl }}/developers/src/utils/monitoring/) - Monitoring utilities
- [Main Application]({{ site.baseurl }}/developers/src/index-file/) - Import location
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Environment setup
- [Error Handling]({{ site.baseurl }}/developers/error-handling/) - Error patterns