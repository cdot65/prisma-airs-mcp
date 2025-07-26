---
layout: documentation
title: Configuration Module (src/config/)
permalink: /developers/src-config/
category: developers
---

# Configuration Module Documentation

The configuration module provides centralized environment configuration management for the Prisma AIRS MCP server. It uses Zod for schema validation and type safety, ensuring all configuration values are properly validated at startup.

## Module Overview

The configuration module consists of a single file that handles:

- Environment variable parsing
- Schema validation using Zod
- Type-safe configuration access
- Default value management
- Version detection from version.json

## Configuration Schema

### Complete Configuration Structure

```typescript
export type Config = {
    // Server configuration
    server: {
        port: number; // Server port (1-65535)
        environment: 'development' | 'production' | 'test';
        logLevel: 'error' | 'warn' | 'info' | 'debug';
    };

    // Prisma AIRS configuration
    airs: {
        apiUrl: string; // Valid URL required
        apiKey: string; // Required, non-empty
        timeout: number; // Min 1000ms, default 30000ms
        retryAttempts: number; // Min 0, default 3
        retryDelay: number; // Min 100ms, default 1000ms
        defaultProfileId?: string; // Optional
        defaultProfileName?: string; // Optional
    };

    // Cache configuration
    cache: {
        ttlSeconds: number; // Min 0, default 300
        maxSize: number; // Min 0, default 1000
        enabled: boolean; // Default true
    };

    // Rate limiting configuration
    rateLimit: {
        maxRequests: number; // Min 1, default 100
        windowMs: number; // Min 1000ms, default 60000ms
        enabled: boolean; // Default true
    };

    // MCP configuration
    mcp: {
        serverName: string; // Default 'prisma-airs-mcp'
        serverVersion: string; // Default from version.json or '1.0.0'
        protocolVersion: string; // Default '2024-11-05'
    };
};
```

## Environment Variables

### Server Configuration

```bash
# Server port (default: 3000)
PORT=3000

# Environment mode (default: development)
# Options: development, production, test
NODE_ENV=production

# Log level (default: info)
# Options: error, warn, info, debug
LOG_LEVEL=debug
```

### AIRS Configuration

```bash
# Required: Prisma AIRS API endpoint
AIRS_API_URL=https://api.prismacloud.io/airs

# Required: API authentication key
AIRS_API_KEY=your-api-key-here

# Request timeout in milliseconds (default: 30000)
AIRS_TIMEOUT=30000

# Number of retry attempts (default: 3)
AIRS_RETRY_ATTEMPTS=3

# Initial retry delay in milliseconds (default: 1000)
AIRS_RETRY_DELAY=1000

# Optional: Default security profile
AIRS_DEFAULT_PROFILE_ID=uuid-of-profile
AIRS_DEFAULT_PROFILE_NAME="Prisma AIRS"
```

### Cache Configuration

```bash
# Cache time-to-live in seconds (default: 300)
CACHE_TTL_SECONDS=300

# Maximum cache size in bytes (default: 1000)
CACHE_MAX_SIZE=10485760

# Enable/disable caching (default: true)
CACHE_ENABLED=true
```

### Rate Limiting Configuration

```bash
# Maximum requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100

# Time window in milliseconds (default: 60000)
RATE_LIMIT_WINDOW_MS=60000

# Enable/disable rate limiting (default: true)
RATE_LIMIT_ENABLED=true
```

### MCP Configuration

```bash
# MCP server name (default: prisma-airs-mcp)
MCP_SERVER_NAME=prisma-airs-mcp

# Server version (default: from version.json)
MCP_SERVER_VERSION=1.0.0

# MCP protocol version (default: 2024-11-05)
MCP_PROTOCOL_VERSION=2024-11-05
```

## Implementation Details

### Version Detection

The module automatically detects the server version from `version.json`:

```typescript
// Read version from version.json if available
let versionFromFile = '1.0.0';
try {
    const versionJson = JSON.parse(
        readFileSync(join(process.cwd(), 'version.json'), 'utf-8'),
    ) as { version: string };
    versionFromFile = versionJson.version;
} catch {
    // Fall back to default if file doesn't exist
}
```

### Configuration Parsing

The configuration is parsed and validated using Zod:

```typescript
function parseConfig(): Config {
    return configSchema.parse({
        server: {
            port: parseInt(process.env.PORT ?? '3000', 10),
            environment: process.env.NODE_ENV ?? 'development',
            logLevel: process.env.LOG_LEVEL ?? 'info',
        },
        // ... other configuration sections
    });
}
```

### Singleton Pattern

The configuration uses a singleton pattern for efficiency:

```typescript
let config: Config | null = null;

export function getConfig(): Config {
    if (!config) {
        try {
            config = parseConfig();
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error('Configuration validation failed:', error.issues);
                throw new Error(
                    `Invalid configuration: ${error.issues.map((e) => e.message).join(', ')}`,
                );
            }
            throw error;
        }
    }
    return config;
}
```

## Usage Examples

### Basic Usage

```typescript
import { getConfig } from './config';

// Get configuration instance
const config = getConfig();

// Access configuration values
console.log(`Server running on port ${config.server.port}`);
console.log(`AIRS API URL: ${config.airs.apiUrl}`);
console.log(`Cache enabled: ${config.cache.enabled}`);
```

### Using in Other Modules

```typescript
// In AIRS client factory
import { getConfig } from '../config';

export function getAIRSClient() {
    const config = getConfig();

    return new EnhancedPrismaAIRSClient({
        apiUrl: config.airs.apiUrl,
        apiKey: config.airs.apiKey,
        timeout: config.airs.timeout,
        // ... other settings
    });
}
```

### Error Handling

```typescript
try {
    const config = getConfig();
    // Use configuration
} catch (error) {
    console.error('Failed to load configuration:', error);
    process.exit(1);
}
```

## Validation Rules

### URL Validation

The AIRS API URL is validated to ensure it's a valid URL:

```typescript
apiUrl: z.string().refine((val) => {
    try {
        const _ = new globalThis.URL(val);
        return true;
    } catch {
        return false;
    }
}, 'Invalid URL');
```

### Numeric Ranges

All numeric values have minimum (and sometimes maximum) constraints:

- Port: 1-65535
- Timeouts: minimum 1000ms
- Retry attempts: minimum 0
- Retry delay: minimum 100ms
- Cache TTL: minimum 0 seconds
- Rate limit window: minimum 1000ms

### Boolean Parsing

Boolean environment variables use negative checking:

```typescript
enabled: process.env.CACHE_ENABLED !== 'false';
```

This means any value other than 'false' (including undefined) is treated as true.

## Best Practices

1. **Always use getConfig()** - Never access process.env directly
2. **Handle validation errors** - Configuration errors should fail fast at startup
3. **Use type safety** - Import the Config type for type-safe access
4. **Set required values** - Ensure AIRS_API_URL and AIRS_API_KEY are always set
5. **Use appropriate defaults** - The module provides sensible defaults for optional values

## Integration with Other Modules

The configuration module is used throughout the application:

- **Server initialization** - Port and environment settings
- **Logger setup** - Log level configuration
- **AIRS client** - API connection settings
- **Cache system** - TTL and size limits
- **Rate limiter** - Request limits and windows
- **MCP server** - Protocol and version information

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
LOG_LEVEL=debug
CACHE_ENABLED=true
RATE_LIMIT_ENABLED=false
```

### Production

```bash
NODE_ENV=production
LOG_LEVEL=warn
CACHE_ENABLED=true
RATE_LIMIT_ENABLED=true
CACHE_MAX_SIZE=104857600  # 100MB
```

### Testing

```bash
NODE_ENV=test
LOG_LEVEL=error
CACHE_ENABLED=false
RATE_LIMIT_ENABLED=false
```

## Troubleshooting

### Common Issues

1. **Invalid URL Error**
    - Ensure AIRS_API_URL includes protocol (https://)
    - Check for trailing slashes (they're automatically removed)

2. **Missing Required Fields**
    - AIRS_API_URL and AIRS_API_KEY are required
    - Set them in environment or .env file

3. **Type Conversion Errors**
    - Ensure numeric values are valid integers
    - Check for typos in boolean values

### Debug Configuration

To debug configuration issues:

```typescript
import { getConfig } from './config';

try {
    const config = getConfig();
    console.log('Configuration loaded:', JSON.stringify(config, null, 2));
} catch (error) {
    console.error('Configuration error:', error);
}
```

## Next Steps

- [AIRS Module]({{ site.baseurl }}/developers/src-airs/) - How AIRS client uses configuration
- [Server Root]({{ site.baseurl }}/developers/src-root/) - Server initialization with config
- [Utils Module]({{ site.baseurl }}/developers/src-utils/) - Logger configuration usage
