---
layout: documentation
title: Logger Module
permalink: /developers/src/utils/logger/
category: developers
---

# Logger Module (src/utils/logger.ts)

The logger module provides a centralized logging system using Winston, with environment-specific formatting and
configuration derived from the application's config module.

## Module Structure

```
src/utils/
└── logger.ts    # Winston logger configuration and initialization
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Application Module              │
│    (any module in the codebase)         │
└─────────────────┬───────────────────────┘
                  │
                  │ getLogger()
                  ▼
┌─────────────────────────────────────────┐
│          Logger Singleton               │
│  • Lazy initialization                  │
│  • Environment-aware formatting         │
│  • Configured log levels                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Winston Logger                  │
│  • Timestamp formatting                 │
│  • Error stack traces                   │
│  • Default metadata                     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐ ┌────────▼──────┐
│  Development   │ │  Production   │
│  • Colorized   │ │  • JSON       │
│  • Simple      │ │  • Structured │
└────────────────┘ └───────────────┘
```

## Logger Implementation

### Overview

The logger module provides a centralized logging system using Winston, with environment-specific formatting and
configuration derived from the application's config module.

### Logger Configuration

The logger is configured based on environment settings:

```typescript
// Configuration sources
const config = getConfig();
const { environment, logLevel } = config.server;

// Logger setup
logger = winston.createLogger({
    level: logLevel, // From LOG_LEVEL env var
    format: winston.format.combine(...formats),
    defaultMeta: {
        service: config.mcp.serverName,
        version: config.mcp.serverVersion,
    },
    transports: [
        new winston.transports.Console({
            silent: environment === 'test',
        }),
    ],
});
```

### Environment-Specific Formatting

#### Development Environment

In development, logs are formatted for human readability:

```typescript
if (environment === 'development') {
    formats.push(
        winston.format.colorize(), // Colorized output
        winston.format.simple(), // Simple format
    );
}
```

Example output:

```
2024-01-01T12:00:00.000Z info: Server started on port 3000
2024-01-01T12:00:01.000Z debug: Processing request {"requestId": "123"}
2024-01-01T12:00:02.000Z error: Failed to scan content {"error": "Invalid input"}
```

#### Production Environment

In production, logs are formatted as JSON for parsing by log aggregation systems:

```typescript
else {
    formats.push(winston.format.json());
}
```

Example output:

```json
{"level":"info","message":"Server started on port 3000","service":"prisma-airs-mcp","version":"1.0.0","timestamp":"2024-01-01T12:00:00.000Z"}
{"level":"error","message":"Failed to scan content","error":"Invalid input","service":"prisma-airs-mcp","version":"1.0.0","timestamp":"2024-01-01T12:00:02.000Z"}
```

### Test Environment

In test environment, console output is silenced:

```typescript
transports: [
    new winston.transports.Console({
        silent: environment === 'test',
    }),
];
```

## API Functions

### createLogger()

Creates and configures a Winston logger instance:

```typescript
export function createLogger(): winston.Logger {
    if (logger) {
        return logger;
    }

    const config = getConfig();
    const { environment, logLevel } = config.server;

    const formats = [
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
    ];

    if (environment === 'development') {
        formats.push(winston.format.colorize(), winston.format.simple());
    } else {
        formats.push(winston.format.json());
    }

    logger = winston.createLogger({
        level: logLevel,
        format: winston.format.combine(...formats),
        defaultMeta: {
            service: config.mcp.serverName,
            version: config.mcp.serverVersion,
        },
        transports: [
            new winston.transports.Console({
                silent: environment === 'test',
            }),
        ],
    });

    return logger;
}
```

**Features:**

- Singleton pattern - returns existing logger if already created
- Configures format based on environment
- Sets log level from configuration
- Adds default metadata (service name and version)
- Includes timestamp and error stack traces

### getLogger()

Gets the logger instance, creating it if necessary:

```typescript
export function getLogger(): winston.Logger {
    if (!logger) {
        return createLogger();
    }
    return logger;
}
```

**Features:**

- Lazy initialization
- Ensures logger is always available
- Most commonly used function throughout the codebase

**Usage Example:**

```typescript
import { getLogger } from '../utils/logger';

const logger = getLogger();
logger.debug('Processing request', { requestId: '123' });
logger.error('Operation failed', { error: error.message });
```

## Log Levels

The logger supports standard Winston log levels, configured via the `LOG_LEVEL` environment variable:

| Level   | Usage                                | Example                                      |
|---------|--------------------------------------|----------------------------------------------|
| `error` | Error conditions that need attention | `logger.error('Database connection failed')` |
| `warn`  | Warning conditions                   | `logger.warn('Rate limit approaching')`      |
| `info`  | Informational messages               | `logger.info('Server started')`              |
| `debug` | Debug information                    | `logger.debug('Request details', { body })`  |

## Default Metadata

All log entries automatically include:

```typescript
defaultMeta: {
    service: config.mcp.serverName,    // e.g., "prisma-airs-mcp"
    version: config.mcp.serverVersion,  // e.g., "1.0.0"
}
```

## Usage Examples

### Basic Logging

```typescript
import { getLogger } from '../utils/logger';

class ExampleService {
    private readonly logger = getLogger();

    async processRequest(data: unknown) {
        this.logger.info('Processing request', {
            dataSize: JSON.stringify(data).length,
        });

        try {
            const result = await this.performOperation(data);
            this.logger.debug('Operation completed', { result });
            return result;
        } catch (error) {
            this.logger.error('Operation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    }
}
```

### Structured Logging

```typescript
// Log with structured data
logger.info('Scan completed', {
    scanId: 'scan_12345',
    duration: 1500,
    threatCount: 3,
    action: 'block',
});

// Log with nested objects
logger.debug('API request', {
    method: 'POST',
    url: '/scan',
    headers: { 'content-type': 'application/json' },
    body: { truncated: true },
});
```

### Error Logging

```typescript
// Log errors with stack traces
try {
    await riskyOperation();
} catch (error) {
    logger.error('Operation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof APIError ? error.code : undefined,
        context: {
            operation: 'riskyOperation',
            input: sanitizedInput,
        },
    });
}
```

## Integration Examples

### AIRS Client Integration

```typescript
// From src/airs/client.ts
export class PrismaAIRSClient {
    private readonly logger: Logger;

    constructor(config: AIRSClientConfig) {
        this.logger = getLogger();

        this.logger.info('Prisma AIRS client initialized', {
            baseUrl: this.baseUrl,
            timeout: this.config.timeout,
            maxRetries: this.config.maxRetries,
        });
    }

    async makeRequest() {
        this.logger.debug('Making AIRS API request', {
            method,
            url,
            retryCount,
        });
    }
}
```

### Tool Handler Integration

```typescript
// From src/tools/index.ts
export class ToolHandler {
    private readonly logger: Logger;

    constructor() {
        this.logger = getLogger();
    }

    async callTool(params: ToolsCallParams) {
        this.logger.debug('Calling tool', {
            name: params.name,
            hasArguments: !!params.arguments,
        });
    }
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// Error - Something failed that shouldn't have
logger.error('Database connection lost', { error: err.message });

// Warn - Something concerning but handled
logger.warn('Rate limit near threshold', { current: 90, max: 100 });

// Info - Important business events
logger.info('User authenticated', { userId: user.id });

// Debug - Detailed troubleshooting info
logger.debug('Cache hit', { key, size: data.length });
```

### 2. Include Contextual Data

```typescript
// Good - includes context
logger.error('Scan failed', {
    scanId,
    profileName,
    error: error.message,
    duration: Date.now() - startTime,
});

// Bad - no context
logger.error('Scan failed');
```

### 3. Avoid Logging Sensitive Data

```typescript
// Good - sanitized
logger.info('User login', {
    userId: user.id,
    email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
});

// Bad - exposes sensitive data
logger.info('User login', {
    userId: user.id,
    password: user.password, // Never log passwords!
});
```

### 4. Use Consistent Field Names

```typescript
// Consistent field naming across the application
logger.info('Operation completed', {
    requestId: req.id, // Always use 'requestId'
    duration: elapsed, // Always use 'duration' for time
    userId: user.id, // Always use 'userId'
});
```

## Performance Considerations

1. **Log Level Filtering** - Debug logs are only evaluated when LOG_LEVEL includes them
2. **Lazy Evaluation** - Use functions for expensive computations:
    ```typescript
    logger.debug('Large data', () => ({
        data: expensiveSerializationFunction(),
    }));
    ```
3. **Test Environment** - Logs are completely silent in test environment

## Troubleshooting

### Common Issues

1. **No Log Output**

    - Check `LOG_LEVEL` environment variable
    - Verify `NODE_ENV` is set correctly
    - Ensure logger is initialized

2. **Wrong Format**

    - Development uses colorized simple format
    - Production uses JSON format
    - Check `NODE_ENV` setting

3. **Missing Metadata**
    - Default metadata comes from config
    - Ensure config is loaded before logger

### Debug Logger Issues

```typescript
// Check logger configuration
const logger = getLogger();
console.log('Log level:', logger.level);
console.log('Transports:', logger.transports.length);
console.log('Environment:', process.env.NODE_ENV);
```

## Type System

The logger module uses standard Winston types:

| Type                    | Module    | Purpose                      |
|-------------------------|-----------|------------------------------|
| `winston.Logger`        | `winston` | Logger instance type         |
| `winston.LoggerOptions` | `winston` | Logger configuration options |

## Dependencies

### External Dependencies

| Module    | Purpose           |
|-----------|-------------------|
| `winston` | Logging framework |

### Internal Dependencies

| Module      | Import        | Purpose              |
|-------------|---------------|----------------------|
| `../config` | `getConfig()` | Configuration access |

## Future Enhancements

Potential additions to the utils module:

1. **Additional Utilities**:

    - Error helpers and custom error classes
    - Validation utilities
    - Data sanitization functions
    - Retry helpers
    - Async utilities

2. **Logger Enhancements**:
    - File rotation transport
    - External service integration (CloudWatch, Datadog)
    - Request ID tracking
    - Performance metrics logging
    - Separate audit log transport

## Related Documentation

- [Configuration Module]({{ site.baseurl }}/developers/src/config/) - How logger gets its configuration
- [Application Entry Point]({{ site.baseurl }}/developers/src/) - Logger initialization on startup
- [AIRS Module]({{ site.baseurl }}/developers/src/airs/) - Example logger usage in production
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Logger usage patterns

## Summary

The utils module currently provides a simple but powerful logging system that adapts to different environments. The
singleton pattern ensures consistent logging throughout the application, while environment-specific formatting makes
logs suitable for both development debugging and production monitoring.
