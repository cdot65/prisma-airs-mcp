---
layout: documentation
title: Configuration Overview
permalink: /developers/src/config/overview/
category: developers
---


The configuration module (`src/config/`) provides centralized configuration management for the Prisma AIRS MCP server.
It loads settings from environment variables, validates them using Zod schemas, and provides type-safe access throughout
the application.

## Module Structure

```text
src/config/
└── index.ts    # Configuration loader with validation
```

## Purpose

The configuration module serves as the single source of truth for all application settings:

- **Environment Variables**: Loads from process.env and .env files
- **Validation**: Ensures required settings are present and valid
- **Type Safety**: Provides typed configuration objects
- **Defaults**: Supplies sensible defaults where appropriate
- **Error Handling**: Clear error messages for missing/invalid config

## Architecture

```text
┌─────────────────────────────────────────┐
│         Environment Sources             │
│  • process.env                          │
│  • .env file (via dotenv)               │
│  • System environment                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Configuration Loader               │
│         (getConfig)                     │
├─────────────────────────────────────────┤
│  1. Read environment variables          │
│  2. Apply defaults                      │
│  3. Validate with Zod schema            │
│  4. Return typed config object          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Typed Configuration              │
│  ┌────────────┐  ┌────────────┐         │
│  │   Server   │  │    AIRS    │         │
│  └────────────┘  └────────────┘         │
│  ┌────────────┐  ┌────────────┐         │
│  │    MCP     │  │   Cache    │         │
│  └────────────┘  └────────────┘         │
│  ┌────────────┐                         │
│  │ Rate Limit │                         │
│  └────────────┘                         │
└─────────────────────────────────────────┘
```

## Configuration Categories

### Server Configuration

Basic server settings for the Express application:

```typescript
server: {
    port: number;              // HTTP port (default: 3000)
    environment: string;       // NODE_ENV (default: 'development')
    logLevel: string;         // Log verbosity (default: 'info')
}
```

### AIRS Configuration

Settings for AIRS API integration:

```typescript
airs: {
    apiUrl: string;           // AIRS API endpoint
    apiKey: string;           // Authentication key (required)
    timeout: number;          // Request timeout in ms
    maxRetries: number;       // Retry attempts
    defaultProfileName: string; // Default scan profile
}
```

### MCP Configuration

Model Context Protocol server metadata:

```typescript
mcp: {
    serverName: string;       // Server identifier
    serverVersion: string;    // Server version
    protocolVersion: string;  // MCP protocol version
}
```

### Cache Configuration

Response caching settings:

```typescript
cache: {
    enabled: boolean;         // Enable caching
    ttlSeconds: number;       // Time-to-live
    maxSize: number;         // Maximum entries
}
```

### Rate Limit Configuration

API rate limiting settings:

```typescript
rateLimit: {
    enabled: boolean;         // Enable rate limiting
    maxRequests: number;      // Requests per window
    windowMs: number;        // Time window in ms
}
```

## Environment Variables

### Required Variables

| Variable       | Description                 | Example        |
|----------------|-----------------------------|----------------|
| `AIRS_API_KEY` | AIRS API authentication key | `your-api-key` |

### Optional Variables

| Variable                    | Default                  | Description          |
|-----------------------------|--------------------------|----------------------|
| `PORT`                      | `3000`                   | HTTP server port     |
| `NODE_ENV`                  | `development`            | Environment mode     |
| `LOG_LEVEL`                 | `info`                   | Logging level        |
| `AIRS_API_URL`              | `https://service.api...` | AIRS endpoint        |
| `AIRS_TIMEOUT`              | `30000`                  | Request timeout (ms) |
| `AIRS_MAX_RETRIES`          | `3`                      | Retry attempts       |
| `AIRS_DEFAULT_PROFILE_NAME` | `Prisma AIRS`            | Default profile      |
| `CACHE_ENABLED`             | `true`                   | Enable caching       |
| `CACHE_TTL_SECONDS`         | `300`                    | Cache TTL            |
| `CACHE_MAX_SIZE`            | `1000`                   | Cache size limit     |
| `RATE_LIMIT_ENABLED`        | `true`                   | Enable rate limits   |
| `RATE_LIMIT_MAX_REQUESTS`   | `100`                    | Max requests         |
| `RATE_LIMIT_WINDOW_MS`      | `60000`                  | Rate limit window    |

## Usage Patterns

### Basic Usage

```typescript
import { getConfig } from './config';

// Get configuration
const config = getConfig();

// Access settings
console.log(`Server port: ${config.server.port}`);
console.log(`AIRS API: ${config.airs.apiUrl}`);
```

### In Services

```typescript
export class AIRSService {
    private config = getConfig();
    
    constructor() {
        this.client = new AIRSClient({
            apiKey: this.config.airs.apiKey,
            baseUrl: this.config.airs.apiUrl,
            timeout: this.config.airs.timeout,
        });
    }
}
```

### Conditional Features

```typescript
// Enable features based on config
if (getConfig().cache.enabled) {
    const cache = new Cache({
        ttl: getConfig().cache.ttlSeconds,
        maxSize: getConfig().cache.maxSize,
    });
}
```

## Validation

The configuration module uses Zod for runtime validation:

### Schema Definition

```typescript
const configSchema = z.object({
    server: z.object({
        port: z.number().int().positive(),
        environment: z.string(),
        logLevel: z.enum(['error', 'warn', 'info', 'debug']),
    }),
    airs: z.object({
        apiUrl: z.string().url(),
        apiKey: z.string().min(1),
        timeout: z.number().positive(),
        maxRetries: z.number().int().min(0),
        defaultProfileName: z.string(),
    }),
    // ... other schemas
});
```

### Validation Errors

Invalid configuration produces clear error messages:

```text
Configuration validation failed:
- server.port: Expected number, received string
- airs.apiKey: Required
- cache.ttlSeconds: Must be positive number
```

## Configuration Loading

### Load Order

1. **System Environment** - OS-level variables
2. **`.env` File** - Project-specific settings
3. **Defaults** - Built-in fallbacks
4. **Validation** - Schema checking

### Singleton Pattern

Configuration is loaded once and cached:

```typescript
let cachedConfig: Config | null = null;

export function getConfig(): Config {
    if (!cachedConfig) {
        cachedConfig = loadConfig();
    }
    return cachedConfig;
}
```

## Environment-Specific Settings

### Development

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
CACHE_TTL_SECONDS=60
RATE_LIMIT_ENABLED=false
```

### Production

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info
CACHE_TTL_SECONDS=300
RATE_LIMIT_ENABLED=true
```

### Testing

```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=error
CACHE_ENABLED=false
RATE_LIMIT_ENABLED=false
```

## Best Practices

### 1. Never Hardcode Secrets

```typescript
// Bad
const apiKey = 'abc123';

// Good
const apiKey = getConfig().airs.apiKey;
```

### 2. Use Type-Safe Access

```typescript
// TypeScript ensures correct property access
const config = getConfig();
const port = config.server.port; // Type: number
```

### 3. Validate Early

```typescript
// Validate config at startup
try {
    const config = getConfig();
    logger.info('Configuration loaded successfully');
} catch (error) {
    logger.error('Invalid configuration', error);
    process.exit(1);
}
```

### 4. Document Variables

```typescript
// Always document environment variables
/**
 * @env AIRS_API_KEY - Required. API key for AIRS service
 * @env CACHE_ENABLED - Optional. Enable response caching (default: true)
 */
```

## Error Handling

### Missing Required Variables

```typescript
try {
    const config = getConfig();
} catch (error) {
    if (error.message.includes('AIRS_API_KEY')) {
        console.error('Missing required AIRS_API_KEY environment variable');
        console.error('Please set AIRS_API_KEY in your .env file');
        process.exit(1);
    }
}
```

### Invalid Values

```typescript
// Zod provides detailed validation errors
{
    issues: [
        {
            path: ['server', 'port'],
            message: 'Expected number, received string'
        }
    ]
}
```

### Mock Configuration

```typescript
// Mock config in tests
jest.mock('./config', () => ({
    getConfig: () => ({
        server: { port: 3000, environment: 'test' },
        airs: { apiKey: 'test-key', apiUrl: 'http://test' },
        // ... other config
    })
}));
```

### Environment Override

```typescript
describe('Config Tests', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should load custom port', () => {
        process.env.PORT = '4000';
        const config = getConfig();
        expect(config.server.port).toBe(4000);
    });
});
```

## Security Considerations

1. **Secret Protection**: Never log API keys or sensitive config
2. **Environment Isolation**: Use separate configs per environment
3. **Access Control**: Limit who can view production configs
4. **Rotation**: Support key rotation without code changes

## Common Issues

### Config Not Loading

1. Check `.env` file exists
2. Verify `dotenv` is installed
3. Ensure correct working directory

### Type Errors

1. Run TypeScript compiler
2. Check schema matches usage
3. Verify all properties exist

### Validation Failures

1. Check environment variable names
2. Verify value formats (numbers, URLs)
3. Look for typos in variable names

## Related Documentation

- [Config Implementation]({{ site.baseurl }}/developers/src/config/index-file/) - Code details
- [Environment Setup]({{ site.baseurl }}/developers/environment/) - Setup guide
- [Types]({{ site.baseurl }}/developers/src/types/config-types/) - Type definitions
- [Docker Configuration]({{ site.baseurl }}/developers/docker/) - Container setup
