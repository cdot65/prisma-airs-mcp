---
layout: documentation
title: Logger Module
permalink: /developers/src/utils/logger/
category: developers
---

# Logger Module (src/utils/logger.ts)

Winston-based structured logging with environment-specific formatting. Provides centralized logging for debugging, monitoring, and error tracking.

## Core Purpose

- Provide structured logging system
- Environment-aware formatting
- Singleton pattern implementation
- Default metadata injection

## Logger Configuration

```typescript
export function createLogger(): winston.Logger {
    const config = getConfig();
    const { environment, logLevel } = config.server;

    const formats = [
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
    ];

    // Environment-specific formatting
    if (environment === 'development') {
        formats.push(winston.format.colorize(), winston.format.simple());
    } else {
        formats.push(winston.format.json());
    }

    return winston.createLogger({
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
}
```

## Usage Pattern

```typescript
import { getLogger } from '../utils/logger';

const logger = getLogger();

// Log levels
logger.error('Database connection failed', { error: err.message });
logger.warn('Rate limit approaching', { current: 90, max: 100 });
logger.info('Server started', { port: 3000 });
logger.debug('Cache hit', { key, size: data.length });
```

## Integration in Application

- **Pattern**: Singleton logger instance
- **Access**: `getLogger()` from any module
- **Config**: Reads from environment config
- **Metadata**: Auto-includes service info

## Environment Formats

### Development
```
2024-01-01T12:00:00.000Z info: Server started on port 3000
2024-01-01T12:00:01.000Z debug: Processing request {"requestId": "123"}
```

### Production
```json
{"level":"info","message":"Server started on port 3000","service":"prisma-airs-mcp","version":"1.0.0","timestamp":"2024-01-01T12:00:00.000Z"}
```

## Best Practices

### Include Context
```typescript
logger.error('Scan failed', {
    scanId,
    profileName,
    error: error.message,
    duration: Date.now() - startTime,
});
```

### Avoid Sensitive Data
```typescript
// Good - sanitized
logger.info('User login', {
    userId: user.id,
    email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
});
```

### Consistent Fields
```typescript
logger.info('Operation completed', {
    requestId: req.id,    // Always 'requestId'
    duration: elapsed,    // Always 'duration'
    userId: user.id,     // Always 'userId'
});
```

## Log Levels

| Level   | Usage                          | Example                                |
|---------|--------------------------------|----------------------------------------|
| `error` | Critical failures              | `logger.error('DB connection lost')`   |
| `warn`  | Concerning but handled         | `logger.warn('Rate limit near')`       |
| `info`  | Important events               | `logger.info('Server started')`        |
| `debug` | Detailed troubleshooting       | `logger.debug('Cache hit')`            |

## Implementation Example

```typescript
export class PrismaAIRSClient {
    private readonly logger = getLogger();

    async scanContent(request: AirsScanRequest) {
        this.logger.debug('Starting scan', { 
            profileName: request.ai_profile.profile_name 
        });

        try {
            const result = await this.makeRequest('/scan', request);
            this.logger.info('Scan completed', {
                scanId: result.scan_id,
                category: result.category,
                action: result.action
            });
            return result;
        } catch (error) {
            this.logger.error('Scan failed', {
                error: error.message,
                profileName: request.ai_profile.profile_name
            });
            throw error;
        }
    }
}
```

## Related Modules

- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Logger configuration source
- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - Example usage
- [Monitoring]({{ site.baseurl }}/developers/src/utils/monitoring/) - Sentry integration
- [Main Application]({{ site.baseurl }}/developers/src/index-file/) - Logger initialization
