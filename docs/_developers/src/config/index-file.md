---
layout: documentation
title: Configuration Implementation
permalink: /developers/src/config/index-file/
category: developers
---

# Configuration Implementation (src/config/index.ts)

The configuration implementation provides the core functionality for loading, validating, and accessing application
configuration. It uses Zod for schema validation and provides a type-safe configuration object.

The module is responsible for:
1. Loading configuration values from environment variables
2. Applying sensible defaults when environment variables are not set
3. Validating all configuration values at runtime using Zod schemas
4. Providing type-safe access to configuration throughout the application

## Overview

The `index.ts` file in the config module:

- Defines the configuration schema using Zod
- Loads environment variables with dotenv
- Provides default values for optional settings
- Validates configuration at runtime
- Exports a singleton configuration getter

## Code Structure

### Imports and Setup

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config } from '../types';

dotenv.config();
```

**Key Points:**

- Uses Zod for runtime type validation
- Loads .env file automatically
- Imports Config type for type safety

### Version Loading

The module loads version from version.json:

```typescript
// Read version from version.json if available
let versionFromFile = '1.0.0';
try {
    const versionJson = JSON.parse(readFileSync(join(process.cwd(), 'version.json'), 'utf-8')) as {
        version: string;
    };
    versionFromFile = versionJson.version;
} catch {
    // Fall back to default if file doesn't exist
}
```

### Schema Definition

The configuration schema is defined using Zod:

```typescript
const configSchema = z.object({
    // Server configuration
    server: z.object({
        port: z.number().min(1).max(65535),
        environment: z.enum(['development', 'production', 'test']),
        logLevel: z.enum(['error', 'warn', 'info', 'debug']),
    }),

    // Prisma AIRS configuration
    airs: z.object({
        apiUrl: z.string().refine((val) => {
            try {
                const _ = new URL(val);
                return true;
            } catch {
                return false;
            }
        }, 'Invalid URL'),
        apiKey: z.string().min(1),
        timeout: z.number().min(1000).default(30000),
        retryAttempts: z.number().min(0).default(3),
        retryDelay: z.number().min(100).default(1000),
        defaultProfileId: z.string().optional(),
        defaultProfileName: z.string().optional(),
    }),

    // Cache configuration
    cache: z.object({
        ttlSeconds: z.number().min(0).default(300),
        maxSize: z.number().min(0).default(1000),
        enabled: z.boolean().default(true),
    }),

    // Rate limiting configuration
    rateLimit: z.object({
        maxRequests: z.number().min(1).default(100),
        windowMs: z.number().min(1000).default(60000),
        enabled: z.boolean().default(true),
    }),

    // MCP configuration
    mcp: z.object({
        serverName: z.string().default('prisma-airs-mcp'),
        serverVersion: z.string().default('1.0.0'),
        protocolVersion: z.string().default('2024-11-05'),
    }),
});
```


### Configuration Loading

The configuration parsing function:

```typescript
function parseConfig(): Config {
    return configSchema.parse({
        server: {
            port: parseInt(process.env.PORT ?? '3000', 10),
            environment: process.env.NODE_ENV ?? 'development',
            logLevel: process.env.LOG_LEVEL ?? 'info',
        },
        airs: {
            apiUrl:
                process.env.AIRS_API_URL ?? 'https://service.api.aisecurity.paloaltonetworks.com',
            apiKey: process.env.AIRS_API_KEY ?? '',
            timeout: parseInt(process.env.AIRS_TIMEOUT ?? '30000', 10),
            retryAttempts: parseInt(process.env.AIRS_RETRY_ATTEMPTS ?? '3', 10),
            retryDelay: parseInt(process.env.AIRS_RETRY_DELAY ?? '1000', 10),
            defaultProfileId: process.env.AIRS_DEFAULT_PROFILE_ID,
            defaultProfileName: process.env.AIRS_DEFAULT_PROFILE_NAME,
        },
        cache: {
            ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS ?? '300', 10),
            maxSize: parseInt(process.env.CACHE_MAX_SIZE ?? '1000', 10),
            enabled: process.env.CACHE_ENABLED !== 'false',
        },
        rateLimit: {
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
            enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        },
        mcp: {
            serverName: process.env.MCP_SERVER_NAME ?? 'prisma-airs-mcp',
            serverVersion: process.env.MCP_SERVER_VERSION ?? versionFromFile,
            protocolVersion: process.env.MCP_PROTOCOL_VERSION ?? '2024-11-05',
        },
    });
}
```

### Singleton Pattern

The configuration is loaded once and cached:

```typescript
/**
 * Global configuration instance
 */
let config: Config | null = null;

/**
 * Get configuration instance
 */
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

## Validation Examples

### Required Fields

```typescript
// AIRS API key is required
airs: z.object({
    apiKey: z.string().min(1), // Must not be empty
})

// Throws error if missing:
// "Invalid configuration: airs.apiKey: String must contain at least 1 character(s)"
```

### Type Validation

```typescript
// Port must be between 1 and 65535
server: z.object({
    port: z.number().min(1).max(65535),
})

// Invalid: PORT="70000" 
// Error: "Number must be less than or equal to 65535"
```

### Enum Validation

```typescript
// Environment must be one of the allowed values
environment: z.enum(['development', 'production', 'test'])

// Invalid: NODE_ENV="staging"
// Error: "Invalid enum value"
```

## Error Handling

### Validation Error Format

When validation fails, Zod provides detailed error information:

```typescript
{
    issues: [
        {
            code: 'too_small',
            minimum: 1,
            type: 'string',
            inclusive: true,
            message: 'String must contain at least 1 character(s)',
            path: ['airs', 'apiKey']
        }
    ]
}
```

### Error Recovery

```typescript
try {
    const config = getConfig();
} catch (error) {
    // Log detailed error
    console.error('Configuration error:', error);
    
    // Provide helpful message
    if (error.message.includes('apiKey')) {
        console.error('\nPlease set AIRS_API_KEY environment variable');
        console.error('Example: AIRS_API_KEY=your-api-key npm start');
    }
    
    // Exit gracefully
    process.exit(1);
}
```

## Usage Examples

### Basic Access

```typescript
import { getConfig } from './config';

const config = getConfig();
console.log(`Server running on port ${config.server.port}`);
```

### Destructuring

```typescript
const { airs, cache, rateLimit } = getConfig();

if (cache.enabled) {
    console.log(`Cache TTL: ${cache.ttlSeconds}s`);
}
```

### Type Safety

```typescript
const config = getConfig();

// TypeScript knows these types
const port: number = config.server.port;
const apiKey: string = config.airs.apiKey;
const cacheEnabled: boolean = config.cache.enabled;

// TypeScript prevents errors
// config.server.port = "3000"; // Error: Type 'string' is not assignable to type 'number'
```

## Default Values

### Built-in Defaults

```typescript
// Server defaults
port: 3000
environment: 'development'
logLevel: 'info'

// AIRS defaults
apiUrl: 'https://service.api.aisecurity.paloaltonetworks.com'
timeout: 30000 // 30 seconds
retryAttempts: 3
retryDelay: 1000 // 1 second

// Cache defaults
enabled: true
ttlSeconds: 300 // 5 minutes
maxSize: 1000

// Rate limit defaults
enabled: true
maxRequests: 100
windowMs: 60000 // 1 minute
```

### Override Patterns

```typescript
// Override specific values
CACHE_TTL_SECONDS=600 npm start

// Disable features
CACHE_ENABLED=false RATE_LIMIT_ENABLED=false npm start

// Production settings
NODE_ENV=production LOG_LEVEL=warn npm start
```

## Testing Configuration

### Unit Tests

```typescript
describe('Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset environment
        process.env = { ...originalEnv };
        // Clear config cache
        config = null;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should load default configuration', () => {
        const config = getConfig();
        expect(config.server.port).toBe(3000);
        expect(config.cache.enabled).toBe(true);
    });

    it('should override with environment variables', () => {
        process.env.PORT = '4000';
        process.env.CACHE_ENABLED = 'false';
        
        const config = getConfig();
        expect(config.server.port).toBe(4000);
        expect(config.cache.enabled).toBe(false);
    });

    it('should validate required fields', () => {
        process.env.AIRS_API_KEY = '';
        
        expect(() => getConfig()).toThrow('Invalid configuration');
    });
});
```

### Integration Tests

```typescript
it('should work with real environment', () => {
    // Load from actual .env file
    dotenv.config({ path: '.env.test' });
    
    const config = getConfig();
    expect(config).toBeDefined();
    expect(config.airs.apiKey).toBeTruthy();
});
```

## Best Practices

### 1. Use Environment-Specific Files

```bash
# Development
.env.development

# Production
.env.production

# Testing
.env.test
```

### 2. Validate at Startup

```typescript
// In main application file
try {
    const config = getConfig();
    logger.info('Configuration loaded', {
        environment: config.server.environment,
        cacheEnabled: config.cache.enabled,
        rateLimitEnabled: config.rateLimit.enabled,
    });
} catch (error) {
    logger.error('Invalid configuration', error);
    process.exit(1);
}
```

### 3. Document Required Variables

```typescript
/**
 * Required environment variables:
 * - AIRS_API_KEY: API key for AIRS service
 * 
 * Optional variables:
 * - PORT: Server port (default: 3000)
 * - LOG_LEVEL: Logging level (default: info)
 * - CACHE_ENABLED: Enable caching (default: true)
 */
```

### 4. Type-Safe Access

```typescript
// Always use getConfig() for type safety
import { getConfig } from './config';

// Don't access process.env directly
// Bad: const apiKey = process.env.AIRS_API_KEY;
// Good: const apiKey = getConfig().airs.apiKey;
```

## Performance Considerations

### Singleton Caching

Configuration is parsed once and cached:

```typescript
// First call: loads and validates
const config1 = getConfig(); // ~5ms

// Subsequent calls: returns cached
const config2 = getConfig(); // ~0.1ms
```

### Validation Overhead

Zod validation is performed once during loading:

- Simple schemas: <1ms
- Complex schemas: 2-5ms
- Only runs on first access

## Troubleshooting

### Common Issues

1. **Missing .env File**
   ```bash
   # Create .env from template
   cp .env.example .env
   ```

2. **Invalid Types**
   ```bash
   # Check environment variable format
   echo $PORT  # Should be number
   echo $CACHE_ENABLED  # Should be true/false
   ```

3. **Required Fields**
   ```bash
   # Ensure required fields are set
   export AIRS_API_KEY=your-key
   ```

### Debug Configuration

```typescript
// Log raw configuration
console.log('Raw env:', {
    PORT: process.env.PORT,
    AIRS_API_KEY: process.env.AIRS_API_KEY ? '[SET]' : '[NOT SET]',
    CACHE_ENABLED: process.env.CACHE_ENABLED,
});

// Log parsed configuration
const config = getConfig();
console.log('Parsed config:', JSON.stringify(config, null, 2));
```

## Related Documentation

- [Configuration Overview]({{ site.baseurl }}/developers/src/config/overview/) - Module overview
- [Config Types]({{ site.baseurl }}/developers/src/types/config-types/) - Type definitions
- [Environment Setup]({{ site.baseurl }}/developers/environment/) - Setup guide
- [Docker Config]({{ site.baseurl }}/developers/docker/) - Container configuration