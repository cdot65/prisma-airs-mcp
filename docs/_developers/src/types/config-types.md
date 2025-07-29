---
layout: documentation
title: Configuration Types
permalink: /developers/src/types/config-types/
category: developers
---

# Configuration Types (src/types/config.ts)

TypeScript interfaces for application configuration. Ensures type-safe access to settings throughout the application.

## Core Purpose

- Define configuration structure
- Provide type safety for settings
- Enable IDE IntelliSense
- Support validation schemas

## Main Interface

```typescript
interface Config {
    server: ServerConfig
    airs: AirsConfig
    cache: CacheConfig
    rateLimit: RateLimitConfig
    mcp: McpConfig
}
```

## Configuration Categories

### Server Config
```typescript
interface ServerConfig {
    port: number
    environment: 'development' | 'production' | 'test'
    logLevel: 'error' | 'warn' | 'info' | 'debug'
}
```

### AIRS Config
```typescript
interface AirsConfig {
    apiUrl: string
    apiKey: string
    timeout: number
    retryAttempts: number
    retryDelay: number
    defaultProfileId?: string
    defaultProfileName?: string
}
```

### Cache Config
```typescript
interface CacheConfig {
    enabled: boolean
    ttlSeconds: number
    maxSize: number  // in MB
}
```

### Rate Limit Config
```typescript
interface RateLimitConfig {
    enabled: boolean
    maxRequests: number
    windowMs: number
}
```

### MCP Config
```typescript
interface McpConfig {
    serverName: string
    serverVersion: string
    protocolVersion: string
}
```

## Integration in Application

- **Used By**: Config module, all components
- **Pattern**: Singleton configuration object
- **Validation**: Zod schema validation
- **Loading**: Environment variables

## Type Safety Benefits

```typescript
// Compile-time checking
const port: number = config.server.port;
const apiKey: string = config.airs.apiKey;

// IDE autocomplete
config.cache.// ttlSeconds, maxSize, enabled

// Type errors caught
config.server.port = "3000"; // Error: string not assignable to number
```

## Usage Example

```typescript
import { Config } from './types';

function setupServer(config: Config) {
    const { port, environment } = config.server;
    
    if (environment === 'production') {
        // Production setup
    }
    
    return createServer(port);
}

// Type-safe access
const cacheEnabled = config.cache.enabled;
const rateLimits = config.rateLimit.maxRequests;
```

## Related Modules

- [Config Implementation]({{ site.baseurl }}/developers/src/config/index-file/) - Runtime loading
- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system
- [Validation]({{ site.baseurl }}/developers/src/config/overview/) - Schema validation