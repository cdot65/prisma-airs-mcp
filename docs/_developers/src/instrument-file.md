---
layout: documentation
title: Instrument Module
permalink: /developers/src/instrument-file/
category: developers
---

Early initialization of Sentry monitoring. Must be the first import to properly instrument Node.js internals.

## Core Purpose

- Initialize Sentry SDK before all other modules
- Configure privacy-focused error tracking
- Setup performance monitoring with sampling
- Filter sensitive data from all events

## Key Features

### Conditional Initialization

```typescript
if (process.env.MONITORING_ENABLED === 'true' && process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || 'development',
        // Privacy-first configuration
        sendDefaultPii: false,
        // Performance sampling
        tracesSampleRate: 0.1,  // 10%
        profilesSampleRate: 0.1 // 10%
    });
}
```

### Data Sanitization

The `beforeSend` hook removes:

- Authentication headers (`x-pan-token`, `authorization`)
- Request/response bodies
- Custom contexts with AIRS data
- Health check requests

### Custom Sampling

```typescript
tracesSampler(samplingContext) {
    // Skip health checks
    if (samplingContext.request?.url?.includes('/health')) return 0;
    // Reduce SSE sampling
    if (samplingContext.request?.url?.includes('/sse')) return 0.01;
    // Default rate
    return 0.1;
}
```

## Integration with Application

- **Required First**: Must be imported before Express/HTTP modules
- **Environment Variables**: Controlled via `MONITORING_ENABLED` and `SENTRY_DSN`
- **Privacy By Default**: No PII sent unless explicitly enabled
- **Performance Impact**: Minimal with 10% sampling rate

## Configuration Options

| Variable | Default | Purpose |
|----------|---------|---------|
| `MONITORING_ENABLED` | `false` | Enable/disable monitoring |
| `SENTRY_DSN` | - | Sentry project identifier |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Performance sampling (0-1) |
| `SENTRY_ENVIRONMENT` | `NODE_ENV` | Environment name |

## Related Modules

- [Main Application]({{ site.baseurl }}/developers/src/index-file/) - Imports this module first
- [Monitoring Utils]({{ site.baseurl }}/developers/src/utils/monitoring/) - Runtime error capture
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Environment setup
