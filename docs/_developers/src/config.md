---
layout: documentation
title: Configuration Module
permalink: /developers/src/config/
category: developers
---

# Configuration Management (src/config/)

The configuration module provides centralized, type-safe configuration management for the Prisma AIRS MCP server. It uses Zod for runtime validation, implements a singleton pattern, and supports environment-based configuration with sensible defaults.

## Module Structure

```
src/config/
└── index.ts    # Configuration parser, validator, and singleton
```

**Key Features**:

- 🔒 Type-safe configuration with TypeScript interfaces
- ✅ Runtime validation using Zod schemas
- 🔧 Environment variable support with defaults
- 📦 Singleton pattern for consistent access
- 🚀 Fast-fail on invalid configuration
- 📊 Automatic version detection

## Architecture

```
┌─────────────────────────────────────────┐
│         Environment Variables           │
│  (process.env, .env file via dotenv)    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          parseConfig()                  │
│  • Reads environment variables          │
│  • Applies defaults                     │
│  • Parses numeric values                │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│       Zod Schema Validation             │
│  • Type checking                        │
│  • Range validation                     │
│  • Required field checks                │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Singleton Config Instance          │
│  • Cached after first load              │
│  • Type-safe Config object              │
│  • Accessed via getConfig()             │
└─────────────────────────────────────────┘
```

## Configuration Structure

The complete configuration is defined in `src/types/config.ts`:

```typescript
interface Config {
    server: ConfigServer;
    airs: ConfigAirs;
    cache: ConfigCache;
    rateLimit: ConfigRateLimit;
    mcp: ConfigMcp;
}
```

### Server Configuration (`ConfigServer`)

Controls the HTTP server behavior:

| Field         | Type   | Default     | Environment Variable | Description                |
| ------------- | ------ | ----------- | -------------------- | -------------------------- |
| `port`        | number | 3000        | `PORT`               | HTTP server port (1-65535) |
| `environment` | enum   | development | `NODE_ENV`           | Runtime environment        |
| `logLevel`    | enum   | info        | `LOG_LEVEL`          | Logging verbosity          |

**Environment Values**:

- `development`, `production`, `test`

**Log Levels** (in order of verbosity):

- `error`, `warn`, `info`, `debug`

### AIRS Configuration (`ConfigAirs`)

Prisma AIRS API integration settings:

| Field                | Type    | Default          | Environment Variable        | Description               |
| -------------------- | ------- | ---------------- | --------------------------- | ------------------------- |
| `apiUrl`             | string  | [production URL] | `AIRS_API_URL`              | AIRS API endpoint         |
| `apiKey`             | string  | (required)       | `AIRS_API_KEY`              | Authentication token      |
| `timeout`            | number  | 30000            | `AIRS_TIMEOUT`              | Request timeout (ms)      |
| `retryAttempts`      | number  | 3                | `AIRS_RETRY_ATTEMPTS`       | Max retry attempts        |
| `retryDelay`         | number  | 1000             | `AIRS_RETRY_DELAY`          | Initial retry delay (ms)  |
| `defaultProfileId`   | string? | undefined        | `AIRS_DEFAULT_PROFILE_ID`   | Default scan profile ID   |
| `defaultProfileName` | string? | undefined        | `AIRS_DEFAULT_PROFILE_NAME` | Default scan profile name |

**Default API URL**: `https://service.api.aisecurity.paloaltonetworks.com`

### Cache Configuration (`ConfigCache`)

In-memory caching behavior:

| Field        | Type    | Default | Environment Variable | Description          |
| ------------ | ------- | ------- | -------------------- | -------------------- |
| `ttlSeconds` | number  | 300     | `CACHE_TTL_SECONDS`  | Cache TTL (seconds)  |
| `maxSize`    | number  | 1000    | `CACHE_MAX_SIZE`     | Max cache entries    |
| `enabled`    | boolean | true    | `CACHE_ENABLED`      | Enable/disable cache |

### Rate Limit Configuration (`ConfigRateLimit`)

API rate limiting settings:

| Field         | Type    | Default | Environment Variable      | Description                  |
| ------------- | ------- | ------- | ------------------------- | ---------------------------- |
| `maxRequests` | number  | 100     | `RATE_LIMIT_MAX_REQUESTS` | Max requests per window      |
| `windowMs`    | number  | 60000   | `RATE_LIMIT_WINDOW_MS`    | Time window (ms)             |
| `enabled`     | boolean | true    | `RATE_LIMIT_ENABLED`      | Enable/disable rate limiting |

### MCP Configuration (`ConfigMcp`)

Model Context Protocol settings:

| Field             | Type   | Default         | Environment Variable   | Description          |
| ----------------- | ------ | --------------- | ---------------------- | -------------------- |
| `serverName`      | string | prisma-airs-mcp | `MCP_SERVER_NAME`      | Server identifier    |
| `serverVersion`   | string | [auto-detected] | `MCP_SERVER_VERSION`   | Server version       |
| `protocolVersion` | string | 2024-11-05      | `MCP_PROTOCOL_VERSION` | MCP protocol version |

## Environment Variables

### Complete Example (.env file)

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Prisma AIRS API
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here
AIRS_TIMEOUT=30000
AIRS_RETRY_ATTEMPTS=3
AIRS_RETRY_DELAY=1000
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS

# Cache Settings
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000
CACHE_ENABLED=true

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_ENABLED=true

# MCP Protocol
MCP_SERVER_NAME=prisma-airs-mcp
MCP_PROTOCOL_VERSION=2024-11-05
```

### Minimal Configuration

Only one environment variable is required:

```bash
# Required
AIRS_API_KEY=your-api-key-here
```

All other values have sensible defaults.

## Implementation Details

### Singleton Pattern

```typescript
let config: Config | null = null;

export function getConfig(): Config {
    if (!config) {
        try {
            config = parseConfig();
        } catch (error) {
            // Handle validation errors
            if (error instanceof z.ZodError) {
                console.error('Configuration validation failed:', error.issues);
                throw new Error(
                    `Invalid configuration: ${error.issues.map((e) => e.message).join(', ')}`
                );
            }
            throw error;
        }
    }
    return config;
}
```

### Version Detection

The module automatically detects version from `version.json`:

```typescript
let versionFromFile = '1.0.0';
try {
    const versionJson = JSON.parse(
        readFileSync(join(process.cwd(), 'version.json'), 'utf-8')
    ) as { version: string };
    versionFromFile = versionJson.version;
} catch {
    // Fall back to default if file doesn't exist
}
```

### Validation Schema

Uses Zod for comprehensive validation:

```typescript
const configSchema = z.object({
    server: z.object({
        port: z.number().min(1).max(65535),
        environment: z.enum(['development', 'production', 'test']),
        logLevel: z.enum(['error', 'warn', 'info', 'debug']),
    }),
    // ... other schemas
});
```

## Usage Patterns

### Basic Usage

```typescript
import { getConfig } from './config';

// Get configuration (validated and cached)
const config = getConfig();

// Type-safe access
console.log(`Server running on port ${config.server.port}`);
console.log(`Environment: ${config.server.environment}`);
```

### Conditional Logic

```typescript
const config = getConfig();

if (config.server.environment === 'production') {
    // Production-specific logic
    logger.setLevel('error');
} else {
    // Development logic
    logger.setLevel('debug');
}
```

### Feature Flags

```typescript
const config = getConfig();

// Enable/disable features based on config
if (config.cache.enabled) {
    app.use(cacheMiddleware);
}

if (config.rateLimit.enabled) {
    app.use(rateLimitMiddleware);
}
```

## Error Handling

### Validation Failures

Configuration errors fail fast with clear messages:

```bash
# Missing required field
$ node dist/index.js
Configuration validation failed: [
  {
    "code": "too_small",
    "minimum": 1,
    "path": ["airs", "apiKey"],
    "message": "String must contain at least 1 character(s)"
  }
]

# Invalid value
$ PORT=99999 node dist/index.js
Configuration validation failed: [
  {
    "code": "too_big",
    "maximum": 65535,
    "path": ["server", "port"],
    "message": "Number must be less than or equal to 65535"
  }
]
```

### Common Issues

1. **Invalid URL Format**

    ```bash
    AIRS_API_URL=not-a-url
    # Error: Invalid URL
    ```

2. **Out of Range Values**

    ```bash
    CACHE_TTL_SECONDS=-1
    # Error: Number must be greater than or equal to 0
    ```

3. **Invalid Enum Values**
    ```bash
    NODE_ENV=staging
    # Error: Invalid enum value. Expected 'development' | 'production' | 'test'
    ```

## Best Practices

### 1. Use Environment Files

```bash
# Development
cp .env.example .env.development
dotenv -e .env.development -- npm run dev

# Production
dotenv -e .env.production -- npm start
```

### 2. Validate Early

```typescript
// In your main entry point
import { getConfig } from './config';

// This validates immediately
const config = getConfig();

// Now start your application
startServer(config);
```

### 3. Don't Access process.env Directly

```typescript
// ❌ Bad - No validation, no defaults
const port = process.env.PORT || '3000';

// ✅ Good - Validated, typed, with defaults
const config = getConfig();
const port = config.server.port;
```

### 4. Log Configuration (Safely)

```typescript
const config = getConfig();
logger.info('Configuration loaded', {
    server: config.server,
    mcp: config.mcp,
    cache: config.cache,
    rateLimit: config.rateLimit,
    airs: {
        apiUrl: config.airs.apiUrl,
        hasApiKey: !!config.airs.apiKey, // Don't log secrets!
        timeout: config.airs.timeout,
    },
});
```

## Testing

### Unit Testing

```typescript
import { getConfig } from './config';

describe('Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset module cache
        jest.resetModules();
        // Clone environment
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should load default configuration', () => {
        process.env.AIRS_API_KEY = 'test-key';

        const config = getConfig();

        expect(config.server.port).toBe(3000);
        expect(config.server.environment).toBe('development');
    });

    it('should override with environment variables', () => {
        process.env.PORT = '8080';
        process.env.NODE_ENV = 'production';
        process.env.AIRS_API_KEY = 'test-key';

        const config = getConfig();

        expect(config.server.port).toBe(8080);
        expect(config.server.environment).toBe('production');
    });
});
```

### Integration Testing

```typescript
// Load test environment
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { getConfig } from './config';

const config = getConfig();
// Use config in integration tests
```

## Docker Configuration

### Using Environment Variables

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Configuration via environment
ENV NODE_ENV=production
ENV LOG_LEVEL=error

# API key must be provided at runtime
# docker run -e AIRS_API_KEY=xxx myimage
```

### Using .env File

```bash
# Run with env file
docker run --env-file .env.production myimage
```

## Kubernetes Configuration

### ConfigMap Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prisma-airs-config
data:
  PORT: "3000"
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  CACHE_TTL_SECONDS: "300"
  RATE_LIMIT_MAX_REQUESTS: "100"
```

### Secret Example

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: prisma-airs-secrets
type: Opaque
stringData:
  AIRS_API_KEY: "your-api-key-here"
```

## Troubleshooting

### Debug Configuration Loading

```typescript
// Add debug logging
const config = parseConfig();
console.log('Loaded configuration:', JSON.stringify(config, null, 2));
```

### Check Environment Variables

```bash
# List all environment variables
env | grep -E '^(AIRS_|MCP_|CACHE_|RATE_)'

# Check specific variable
echo $AIRS_API_KEY
```

### Common Solutions

1. **Configuration not updating**: Module caches config - restart application
2. **Boolean parsing**: Use `!== 'false'` pattern for proper parsing
3. **Number parsing**: Always use `parseInt()` with radix 10
4. **URL validation**: Ensure protocol is included (https://)

## Related Documentation

- [Types Module]({{ site.baseurl }}/developers/src/types/) - Configuration type definitions
- [Application Entry Point]({{ site.baseurl }}/developers/src/) - How configuration is used at startup
- [AIRS Module]({{ site.baseurl }}/developers/src/airs/) - AIRS client configuration usage
