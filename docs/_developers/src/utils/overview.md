---
layout: documentation
title: Utilities Overview
permalink: /developers/src/utils/overview/
category: developers
---

The utilities module provides essential support functions for logging and monitoring across the application.

## Module Structure

```text
src/utils/
├── logger.ts       # Winston logging system
└── monitoring.ts   # Sentry error tracking
```

## Core Purpose

- **Cross-cutting concerns**: Logging and monitoring
- **Centralized configuration**: Environment-aware
- **Reusable patterns**: Used throughout codebase
- **Privacy-focused**: Automatic data sanitization

## Module Components

### Logger (`logger.ts`)

Winston-based centralized logging:

- Environment-aware formatting
- Structured logging with metadata
- Singleton pattern
- Silent mode for testing

Key features:

- Development: Colorized simple format
- Production: JSON structured logs
- Automatic service metadata

[Full Logger Documentation →]({{ site.baseurl }}/developers/src/utils/logger/)

### Monitoring (`monitoring.ts`)

Sentry integration for error tracking:

- Opt-in design (disabled by default)
- Automatic sensitive data redaction
- Performance monitoring
- Breadcrumb tracking

Key features:

- Privacy-first approach
- Configurable sampling
- Express middleware integration

[Full Monitoring Documentation →]({{ site.baseurl }}/developers/src/utils/monitoring/)

## Integration in Application

### Logger Usage

```typescript
import { getLogger } from './utils/logger';

export class MyService {
    private readonly logger = getLogger();
    
    async performOperation() {
        this.logger.info('Starting operation');
        
        try {
            const result = await this.doWork();
            this.logger.debug('Completed', { result });
            return result;
        } catch (error) {
            this.logger.error('Failed', { error: error.message });
            throw error;
        }
    }
}
```

### Monitoring Usage

```typescript
import { captureException, addBreadcrumb } from './utils/monitoring';

export class ScanService {
    async scan(content: string) {
        addBreadcrumb('Scan started', 'scan', {
            contentLength: content.length
        });
        
        try {
            return await this.performScan(content);
        } catch (error) {
            captureException(error, {
                operation: 'scan',
                contentLength: content.length
            });
            throw error;
        }
    }
}
```

## Configuration

### Logger Environment

| Variable    | Default | Description      |
|-------------|---------|------------------|
| `LOG_LEVEL` | `info`  | Log level filter |
| `NODE_ENV`  | `dev`   | Environment mode |

### Monitoring Environment

| Variable             | Default | Description      |
|---------------------|---------|------------------|
| `MONITORING_ENABLED` | `false` | Enable Sentry    |
| `SENTRY_DSN`        | -       | Sentry DSN       |

## Best Practices

### Use Structured Logging

```typescript
// Good
logger.info('User action', { userId, action });

// Bad
logger.info(`User ${userId} performed ${action}`);
```

### Avoid Sensitive Data

```typescript
// Good
captureException(error, { userId: user.id });

// Bad
captureException(error, { password: user.password });
```

### Appropriate Log Levels

- `error`: Critical failures
- `warn`: Concerning conditions
- `info`: Important events
- `debug`: Detailed debugging

## Testing Support

```typescript
// Mock logger
jest.mock('./utils/logger', () => ({
    getLogger: () => ({
        info: jest.fn(),
        error: jest.fn()
    })
}));

// Disable monitoring
process.env.MONITORING_ENABLED = 'false';
```

## Future Enhancements

Potential additions:

- Validation utilities
- Retry mechanisms
- Data sanitization helpers
- Performance tracking

## Related Documentation

- [Logger Module]({{ site.baseurl }}/developers/src/utils/logger/) - Winston logging
- [Monitoring Module]({{ site.baseurl }}/developers/src/utils/monitoring/) - Sentry tracking
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Config system
- [Main Application]({{ site.baseurl }}/developers/src/index-file/) - Integration
