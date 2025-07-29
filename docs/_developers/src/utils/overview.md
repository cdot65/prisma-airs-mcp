---
layout: documentation
title: Utilities Overview
permalink: /developers/src/utils/overview/
category: developers
---

# Utilities Module Overview

The utilities module (`src/utils/`) provides essential support functions and services used throughout the Prisma AIRS
MCP server. These utilities handle cross-cutting concerns like logging, monitoring, and other common functionality.

## Module Structure

```
src/utils/
├── logger.ts       # Winston-based logging system
└── monitoring.ts   # Sentry error tracking and monitoring
```

## Purpose and Design

The utilities module follows these design principles:

1. **Separation of Concerns**: Each utility focuses on a specific functionality
2. **Reusability**: Utilities are designed to be used across the entire codebase
3. **Configuration**: Utilities respect environment configuration
4. **Performance**: Minimal overhead and lazy initialization
5. **Type Safety**: Full TypeScript support with proper types

## Module Components

### Logger (`logger.ts`)

A centralized logging system built on Winston that provides:

- Environment-aware formatting (JSON for production, colorized for development)
- Configurable log levels
- Structured logging with metadata
- Automatic inclusion of service name and version
- Silent mode for testing

**Key Features:**

- Singleton pattern for consistent logging
- Lazy initialization
- Structured data support
- Error stack trace logging

[Full Logger Documentation →]({{ site.baseurl }}/developers/src/utils/logger/)

### Monitoring (`monitoring.ts`)

Privacy-focused error tracking and monitoring using Sentry:

- Opt-in design (disabled by default)
- Comprehensive data sanitization
- Performance monitoring with sampling
- Breadcrumb tracking for debugging
- Integration with Express error handling

**Key Features:**

- Automatic sensitive data redaction
- Configurable sampling rates
- Error context without exposing secrets
- Sentry dashboard integration

[Full Monitoring Documentation →]({{ site.baseurl }}/developers/src/utils/monitoring/)

## Usage Patterns

### Logging Pattern

```typescript
import { getLogger } from './utils/logger';

export class MyService {
    private readonly logger = getLogger();
    
    async performOperation() {
        this.logger.info('Starting operation', { 
            timestamp: Date.now() 
        });
        
        try {
            const result = await this.doWork();
            this.logger.debug('Operation completed', { result });
            return result;
        } catch (error) {
            this.logger.error('Operation failed', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}
```

### Monitoring Pattern

```typescript
import { 
    captureException, 
    addBreadcrumb,
    isMonitoringEnabled 
} from './utils/monitoring';

export class SecurityService {
    async scanContent(content: string) {
        // Add breadcrumb for tracking
        addBreadcrumb('Scan initiated', 'security', {
            contentLength: content.length
        });
        
        try {
            const result = await this.performScan(content);
            return result;
        } catch (error) {
            // Capture exception with context
            if (isMonitoringEnabled()) {
                captureException(error, {
                    operation: 'scanContent',
                    contentLength: content.length
                });
            }
            throw error;
        }
    }
}
```

## Integration with Other Modules

### Configuration Integration

Both utilities integrate with the configuration module:

```typescript
// Logger uses config for environment and log level
const config = getConfig();
const { environment, logLevel } = config.server;

// Monitoring checks environment variables
const monitoringEnabled = process.env.MONITORING_ENABLED === 'true';
```

### Express Application Integration

```typescript
// Early in application startup
import './instrument'; // Monitoring initialization

// In main application
import { 
    setupExpressRequestHandler,
    setupExpressErrorHandler,
    createErrorHandler 
} from './utils/monitoring';
import { getLogger } from './utils/logger';

const logger = getLogger();
const app = express();

// Setup monitoring
setupExpressRequestHandler(app);

// ... routes ...

// Error handling
setupExpressErrorHandler(app);
app.use(createErrorHandler());
```

## Best Practices

### 1. Consistent Logger Usage

Always use the centralized logger instead of console:

```typescript
// Good
const logger = getLogger();
logger.info('Server started', { port: 3000 });

// Bad
console.log('Server started on port 3000');
```

### 2. Structured Logging

Use objects for contextual data:

```typescript
// Good - structured data
logger.error('Database error', {
    query: 'SELECT * FROM users',
    error: error.message,
    duration: Date.now() - startTime
});

// Bad - string concatenation
logger.error(`Database error: ${error.message} for query: ${query}`);
```

### 3. Privacy-First Monitoring

Never log sensitive data:

```typescript
// Good - sanitized
captureException(error, {
    userId: user.id,
    operation: 'login'
});

// Bad - exposes sensitive data
captureException(error, {
    userId: user.id,
    password: user.password,  // Never do this!
    apiKey: config.apiKey     // Never do this!
});
```

### 4. Appropriate Log Levels

Use the correct log level for the situation:

```typescript
logger.error('Critical failure - service down');
logger.warn('High memory usage detected');
logger.info('User logged in successfully');
logger.debug('Cache hit for key: user_123');
```

## Environment Configuration

### Logger Configuration

| Variable    | Default       | Description                                  |
|-------------|---------------|----------------------------------------------|
| `LOG_LEVEL` | `info`        | Minimum log level (error, warn, info, debug) |
| `NODE_ENV`  | `development` | Environment (affects formatting)             |

### Monitoring Configuration

| Variable                    | Default    | Description               |
|-----------------------------|------------|---------------------------|
| `MONITORING_ENABLED`        | `false`    | Enable Sentry monitoring  |
| `SENTRY_DSN`                | -          | Sentry project DSN        |
| `SENTRY_ENVIRONMENT`        | `NODE_ENV` | Environment name          |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1`      | Performance sampling rate |

## Future Enhancements

Potential additions to the utilities module:

### Additional Utilities

1. **Validation Utilities**
    - Input validation helpers
    - Schema validation wrappers
    - Common validation patterns

2. **Async Utilities**
    - Retry mechanisms with backoff
    - Timeout wrappers
    - Promise utilities

3. **Data Utilities**
    - Data transformation helpers
    - Sanitization functions
    - Encryption/decryption utilities

4. **Performance Utilities**
    - Performance timing helpers
    - Memory usage tracking
    - Request/response timing

### Logger Enhancements

- File rotation support
- External service integration (CloudWatch, Datadog)
- Correlation ID tracking
- Audit logging capabilities

### Monitoring Enhancements

- Custom error types with automatic grouping
- Performance budgets and alerting
- User session tracking (privacy-compliant)
- Release tracking automation

## Testing Utilities

When testing code that uses utilities:

```typescript
// Mock logger in tests
jest.mock('./utils/logger', () => ({
    getLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
    })
}));

// Disable monitoring in tests
process.env.MONITORING_ENABLED = 'false';
```

## Summary

The utilities module provides essential infrastructure for logging and monitoring throughout the application. By
centralizing these concerns, we ensure consistency, maintain privacy standards, and enable easy configuration across
different environments.

## Related Documentation

- [Logger Module]({{ site.baseurl }}/developers/src/utils/logger/) - Detailed logger documentation
- [Monitoring Module]({{ site.baseurl }}/developers/src/utils/monitoring/) - Detailed monitoring documentation
- [Configuration Module]({{ site.baseurl }}/developers/src/config/overview/) - Configuration system
- [Main Application]({{ site.baseurl }}/developers/src/index-file/) - Integration examples