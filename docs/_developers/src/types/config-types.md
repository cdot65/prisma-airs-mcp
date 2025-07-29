---
layout: documentation
title: Configuration Types
permalink: /developers/src/types/config-types/
category: developers
---

# Configuration Types (src/types/config.ts)

The configuration types module defines the TypeScript interfaces for application configuration. These types ensure
type-safe access to configuration values throughout the application.

## Overview

The configuration types provide:

- Structured configuration interfaces
- Type safety for environment variables
- Clear documentation of available settings
- IntelliSense support in IDEs
- Validation schema foundation

## Main Configuration Interface

### Config

The root configuration interface that encompasses all settings.

```typescript
export interface Config {
    /** Server configuration */
    server: ServerConfig;
    
    /** AIRS API configuration */
    airs: AIRSConfig;
    
    /** MCP protocol configuration */
    mcp: MCPConfig;
    
    /** Cache configuration */
    cache: CacheConfig;
    
    /** Rate limiting configuration */
    rateLimit: RateLimitConfig;
}
```

## Server Configuration

### ServerConfig

Express server and application settings.

```typescript
export interface ServerConfig {
    /** HTTP server port number */
    port: number;
    
    /** Runtime environment (development, production, test) */
    environment: string;
    
    /** Logging level (error, warn, info, debug) */
    logLevel: LogLevel;
    
    /** Request timeout in milliseconds */
    requestTimeout?: number;
    
    /** Maximum request body size */
    maxRequestSize?: string;
    
    /** Enable CORS */
    enableCors?: boolean;
    
    /** Allowed CORS origins */
    corsOrigins?: string[];
}
```

**Usage Example:**

```typescript
const config: ServerConfig = {
    port: 3000,
    environment: 'production',
    logLevel: 'info',
    requestTimeout: 30000,
    maxRequestSize: '10mb',
    enableCors: true,
    corsOrigins: ['https://app.example.com']
};
```

## AIRS Configuration

### AIRSConfig

Settings for AIRS API integration.

```typescript
export interface AIRSConfig {
    /** AIRS API base URL */
    apiUrl: string;
    
    /** API authentication key */
    apiKey: string;
    
    /** Request timeout in milliseconds */
    timeout: number;
    
    /** Maximum retry attempts */
    maxRetries: number;
    
    /** Initial retry delay in milliseconds */
    retryDelay?: number;
    
    /** Default security profile name */
    defaultProfileName: string;
    
    /** Custom headers for API requests */
    customHeaders?: Record<string, string>;
    
    /** Enable request/response logging */
    debugLogging?: boolean;
}
```

**Security Note:** The `apiKey` should never be hardcoded and must be loaded from environment variables.

## MCP Configuration

### MCPConfig

Model Context Protocol server metadata.

```typescript
export interface MCPConfig {
    /** Server name identifier */
    serverName: string;
    
    /** Server version */
    serverVersion: string;
    
    /** MCP protocol version */
    protocolVersion: string;
    
    /** Server description */
    description?: string;
    
    /** Server capabilities */
    capabilities?: MCPCapabilities;
}

export interface MCPCapabilities {
    /** Supports tool operations */
    tools?: boolean;
    
    /** Supports resource operations */
    resources?: boolean;
    
    /** Supports prompt operations */
    prompts?: boolean;
    
    /** Supports logging */
    logging?: boolean;
    
    /** Custom capabilities */
    custom?: Record<string, boolean>;
}
```

## Cache Configuration

### CacheConfig

Response caching settings.

```typescript
export interface CacheConfig {
    /** Enable caching */
    enabled: boolean;
    
    /** Time-to-live in seconds */
    ttlSeconds: number;
    
    /** Maximum number of cached entries */
    maxSize: number;
    
    /** Cache key prefix */
    keyPrefix?: string;
    
    /** Cache statistics tracking */
    enableStats?: boolean;
    
    /** Cache cleanup interval in milliseconds */
    cleanupInterval?: number;
    
    /** Cache storage backend */
    backend?: 'memory' | 'redis';
    
    /** Redis connection options (if using Redis) */
    redis?: RedisConfig;
}

export interface RedisConfig {
    /** Redis host */
    host: string;
    
    /** Redis port */
    port: number;
    
    /** Redis password */
    password?: string;
    
    /** Redis database index */
    db?: number;
    
    /** Key prefix for Redis */
    keyPrefix?: string;
}
```

## Rate Limit Configuration

### RateLimitConfig

API rate limiting settings.

```typescript
export interface RateLimitConfig {
    /** Enable rate limiting */
    enabled: boolean;
    
    /** Maximum requests per window */
    maxRequests: number;
    
    /** Time window in milliseconds */
    windowMs: number;
    
    /** Rate limit by operation */
    perOperation?: OperationLimits;
    
    /** Skip rate limiting for certain IPs */
    skipIPs?: string[];
    
    /** Custom rate limit message */
    message?: string;
    
    /** Rate limit headers */
    headers?: boolean;
}

export interface OperationLimits {
    /** Limits for specific operations */
    [operation: string]: {
        maxRequests: number;
        windowMs: number;
    };
}
```

**Example with per-operation limits:**

```typescript
const rateLimitConfig: RateLimitConfig = {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000,
    perOperation: {
        scanSync: {
            maxRequests: 50,
            windowMs: 60000
        },
        scanAsync: {
            maxRequests: 20,
            windowMs: 60000
        }
    }
};
```

## Type Definitions

### LogLevel

Supported logging levels.

```typescript
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
```

### Environment

Application environments.

```typescript
export type Environment = 'development' | 'production' | 'test' | 'staging';
```

### ConfigKey

Union type of all configuration keys.

```typescript
export type ConfigKey = keyof Config;
```

### DeepPartial

Utility type for partial configuration.

```typescript
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Usage: Partial configuration for testing
type PartialConfig = DeepPartial<Config>;
```

## Configuration Validation

### ConfigSchema Type

Type for Zod validation schema.

```typescript
import { z } from 'zod';

export const ConfigSchema = z.object({
    server: z.object({
        port: z.number().int().positive(),
        environment: z.string(),
        logLevel: z.enum(['error', 'warn', 'info', 'debug'])
    }),
    airs: z.object({
        apiUrl: z.string().url(),
        apiKey: z.string().min(1),
        timeout: z.number().positive(),
        maxRetries: z.number().int().min(0),
        defaultProfileName: z.string()
    }),
    // ... other schemas
});

export type ValidatedConfig = z.infer<typeof ConfigSchema>;
```

## Usage Examples

### Type-Safe Configuration Access

```typescript
import { Config } from '../types/config';

function initializeServer(config: Config) {
    const { port, environment, logLevel } = config.server;
    
    // TypeScript ensures type safety
    console.log(`Starting server on port ${port}`);
    
    if (environment === 'production') {
        // Production-specific setup
    }
    
    // Type error if accessing non-existent property
    // console.log(config.server.invalid); // Error!
}
```

### Configuration Builder

```typescript
class ConfigBuilder {
    private config: DeepPartial<Config> = {};
    
    server(config: Partial<ServerConfig>): this {
        this.config.server = { ...this.config.server, ...config };
        return this;
    }
    
    airs(config: Partial<AIRSConfig>): this {
        this.config.airs = { ...this.config.airs, ...config };
        return this;
    }
    
    build(): Config {
        // Validate and return complete config
        return validateConfig(this.config);
    }
}

// Usage
const config = new ConfigBuilder()
    .server({ port: 3000, environment: 'production' })
    .airs({ apiKey: 'key', apiUrl: 'https://api.example.com' })
    .build();
```

### Environment-Specific Types

```typescript
interface EnvironmentConfig<E extends Environment> {
    base: Config;
    overrides: {
        [K in E]: DeepPartial<Config>;
    };
}

const environmentConfig: EnvironmentConfig<Environment> = {
    base: {
        // Base configuration
    },
    overrides: {
        development: {
            server: { logLevel: 'debug' },
            cache: { enabled: false }
        },
        production: {
            server: { logLevel: 'warn' },
            cache: { enabled: true, ttlSeconds: 3600 }
        },
        test: {
            server: { port: 0 }, // Random port
            rateLimit: { enabled: false }
        },
        staging: {
            server: { logLevel: 'info' }
        }
    }
};
```

## Type Guards

### Configuration validation helpers

```typescript
/** Check if config has required AIRS settings */
export function hasAIRSConfig(config: Partial<Config>): config is Config {
    return !!(
        config.airs?.apiKey &&
        config.airs?.apiUrl
    );
}

/** Check if caching is enabled */
export function isCacheEnabled(config: Config): boolean {
    return config.cache.enabled && config.cache.ttlSeconds > 0;
}

/** Check if rate limiting is enabled */
export function isRateLimitEnabled(config: Config): boolean {
    return config.rateLimit.enabled && config.rateLimit.maxRequests > 0;
}

/** Get environment-specific config */
export function getEnvironmentConfig(
    config: Config,
    env: Environment
): Config {
    // Apply environment-specific overrides
    return config;
}
```

## Best Practices

### 1. Use Interfaces Over Types

```typescript
// Good - Extensible
interface ServerConfig {
    port: number;
}

// Can extend
interface ExtendedServerConfig extends ServerConfig {
    host: string;
}
```

### 2. Document Configuration

```typescript
interface CacheConfig {
    /**
     * Time-to-live for cache entries in seconds
     * @default 300
     * @minimum 0
     * @maximum 86400
     */
    ttlSeconds: number;
}
```

### 3. Provide Defaults

```typescript
const DEFAULT_CONFIG: Config = {
    server: {
        port: 3000,
        environment: 'development',
        logLevel: 'info'
    },
    // ... other defaults
};
```

### 4. Validate at Runtime

```typescript
function loadConfig(partial: unknown): Config {
    // Validate with Zod
    const validated = ConfigSchema.parse(partial);
    
    // Apply defaults
    return {
        ...DEFAULT_CONFIG,
        ...validated
    };
}
```

## Testing

### Mock Configuration

```typescript
export const mockConfig: Config = {
    server: {
        port: 3000,
        environment: 'test',
        logLevel: 'error'
    },
    airs: {
        apiUrl: 'http://mock-api',
        apiKey: 'test-key',
        timeout: 5000,
        maxRetries: 0,
        defaultProfileName: 'test'
    },
    mcp: {
        serverName: 'test-server',
        serverVersion: '0.0.1',
        protocolVersion: '1.0'
    },
    cache: {
        enabled: false,
        ttlSeconds: 60,
        maxSize: 10
    },
    rateLimit: {
        enabled: false,
        maxRequests: 1000,
        windowMs: 1000
    }
};
```

### Type Testing

```typescript
import { expectType } from 'tsd';

// Test type inference
const config = getConfig();
expectType<number>(config.server.port);
expectType<string>(config.airs.apiKey);
expectType<boolean>(config.cache.enabled);

// Test type errors
// @ts-expect-error - port should be number
config.server.port = '3000';
```

## Related Documentation

- [Configuration Module]({{ site.baseurl }}/developers/src/config/overview/) - Configuration implementation
- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system overview
- [Environment Setup]({{ site.baseurl }}/developers/environment/) - Environment configuration
- [Validation]({{ site.baseurl }}/developers/validation/) - Runtime validation