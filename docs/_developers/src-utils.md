---
layout: documentation
title: Utils Module (src/utils/)
permalink: /developers/src-utils/
category: developers
---

# Utils Module Documentation

The utils module provides utility functions used throughout the Prisma AIRS MCP server. Currently, it contains the logging system implementation using Winston.

## Module Overview

The utils module consists of a single file:

- **logger.ts** - Winston logger configuration and initialization

## Logger Implementation

### Overview

The logger module provides a centralized logging system using Winston, with environment-specific formatting and configuration derived from the application's config module.

### Logger Configuration

The logger is configured based on environment settings:

```typescript
// Configuration sources
const config = getConfig();
const { environment, logLevel } = config.server;

// Logger setup
logger = winston.createLogger({
    level: logLevel,              // From LOG_LEVEL env var
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
        winston.format.colorize(),    // Colorized output
        winston.format.simple()        // Simple format
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
]
```

## API Functions

### createLogger()

Creates and configures a Winston logger instance:

```typescript
export function createLogger(): winston.Logger
```

**Features:**
- Singleton pattern - returns existing logger if already created
- Configures format based on environment
- Sets log level from configuration
- Adds default metadata (service name and version)
- Includes timestamp and error stack traces

**Usage:**
```typescript
import { createLogger } from './utils/logger';

const logger = createLogger();
logger.info('Application started');
```

### getLogger()

Gets the logger instance, creating it if necessary:

```typescript
export function getLogger(): winston.Logger
```

**Features:**
- Lazy initialization
- Ensures logger is always available
- Most commonly used function

**Usage:**
```typescript
import { getLogger } from './utils/logger';

const logger = getLogger();
logger.debug('Processing request', { requestId: '123' });
logger.error('Operation failed', { error: error.message });
```

## Log Levels

The logger supports standard Winston log levels, configured via the `LOG_LEVEL` environment variable:

| Level | Usage | Example |
|-------|-------|---------|
| `error` | Error conditions that need attention | `logger.error('Database connection failed')` |
| `warn` | Warning conditions | `logger.warn('Rate limit approaching')` |
| `info` | Informational messages | `logger.info('Server started')` |
| `debug` | Debug information | `logger.debug('Request details', { body })` |

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
            dataSize: JSON.stringify(data).length 
        });

        try {
            const result = await this.performOperation(data);
            this.logger.debug('Operation completed', { result });
            return result;
        } catch (error) {
            this.logger.error('Operation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
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
    action: 'block'
});

// Log with nested objects
logger.debug('API request', {
    method: 'POST',
    url: '/scan',
    headers: { 'content-type': 'application/json' },
    body: { truncated: true }
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
            input: sanitizedInput 
        }
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
    duration: Date.now() - startTime
});

// Bad - no context
logger.error('Scan failed');
```

### 3. Avoid Logging Sensitive Data

```typescript
// Good - sanitized
logger.info('User login', {
    userId: user.id,
    email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
});

// Bad - exposes sensitive data
logger.info('User login', {
    userId: user.id,
    password: user.password  // Never log passwords!
});
```

### 4. Use Consistent Field Names

```typescript
// Consistent field naming across the application
logger.info('Operation completed', {
    requestId: req.id,      // Always use 'requestId'
    duration: elapsed,      // Always use 'duration' for time
    userId: user.id,        // Always use 'userId'
});
```

## Performance Considerations

1. **Log Level Filtering** - Debug logs are only evaluated when LOG_LEVEL includes them
2. **Lazy Evaluation** - Use functions for expensive computations:
   ```typescript
   logger.debug('Large data', () => ({
       data: expensiveSerializationFunction()
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

## Future Enhancements

Potential additions to the utils module:

1. **File Rotation** - Add file transport with rotation
2. **External Services** - Send logs to CloudWatch, Datadog, etc.
3. **Request ID Tracking** - Automatic request ID propagation
4. **Performance Metrics** - Built-in performance logging
5. **Audit Logging** - Separate audit log transport

## Next Steps

- [Configuration Module]({{ site.baseurl }}/developers/src-config/) - How logger gets its configuration
- [Server Root]({{ site.baseurl }}/developers/src-root/) - Logger initialization on startup
- [AIRS Module]({{ site.baseurl }}/developers/src-airs/) - Example logger usage