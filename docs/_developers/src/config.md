---
layout: documentation
title: Configuration Module (src/config/)
permalink: /developers/src/config/
category: developers
---

# Configuration Module Documentation

The configuration module provides centralized environment configuration management for the Prisma AIRS MCP server. It implements a singleton pattern with Zod schema validation, ensuring type-safe configuration access and runtime validation of all environment variables.

## Module Overview

The configuration module handles:

- Environment variable parsing with defaults
- Runtime validation using Zod schemas
- Type-safe configuration access
- Singleton pattern for consistent configuration
- Version detection from package.json

## Architecture

```typescript
/**
 * Configuration Management Module
 * 
 * This module is responsible for:
 * 1. Loading configuration values from environment variables
 * 2. Applying sensible defaults when environment variables are not set
 * 3. Validating all configuration values at runtime using Zod schemas
 * 4. Providing type-safe access to configuration throughout the application
 */
```

## Type System

All configuration types are defined in `src/types/config.ts` with the `Config` prefix:

```typescript
import type { Config } from '../types';

// Configuration structure
export interface Config {
    server: ConfigServerOptions;
    mcp: ConfigMcpOptions;
    airs: ConfigAirsOptions;
}
```

## Configuration Schema

### Complete Configuration Structure

```typescript
export interface Config {
    server: ConfigServerOptions;
    mcp: ConfigMcpOptions;
    airs: ConfigAirsOptions;
}

export interface ConfigServerOptions {
    port: number;
    environment: 'development' | 'production';
    corsOrigin: string;
}

export interface ConfigMcpOptions {
    serverName: string;
    serverVersion: string;
    protocolVersion: string;
}

export interface ConfigAirsOptions {
    apiUrl: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}
```

## Zod Schema Validation

The module uses Zod schemas for runtime validation:

```typescript
const configSchema = z.object({
    server: z.object({
        port: z.coerce.number().int().min(1).max(65535),
        environment: z.enum(['development', 'production']),
        corsOrigin: z.string().min(1),
    }),
    mcp: z.object({
        serverName: z.string().min(1),
        serverVersion: z.string().min(1),
        protocolVersion: z.string().min(1),
    }),
    airs: z.object({
        apiUrl: z.string().url(),
        apiKey: z.string().min(1),
        timeout: z.coerce.number().int().min(1000),
        retryAttempts: z.coerce.number().int().min(0),
        retryDelay: z.coerce.number().int().min(100),
    }),
});
```

## Environment Variables

### Server Configuration

```bash
# Server port (default: 3000)
# Valid range: 1-65535
PORT=3000

# Environment mode (default: development)
# Options: development, production
NODE_ENV=production

# CORS origin (default: *)
# Use specific origin in production
CORS_ORIGIN=https://app.example.com
```

### MCP Configuration

```bash
# MCP server name (default: prisma-airs-mcp-server)
MCP_SERVER_NAME=my-custom-server

# MCP protocol version (default: 2024-11-05)
# Should match MCP specification version
MCP_PROTOCOL_VERSION=2024-11-05
```

### AIRS Configuration

```bash
# Required: Prisma AIRS API endpoint
# Default: https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com

# Required: API authentication key
AIRS_API_KEY=your-api-key-here

# Request timeout in milliseconds (default: 30000)
# Minimum: 1000ms
AIRS_TIMEOUT=30000

# Number of retry attempts (default: 3)
# Minimum: 0 (no retries)
AIRS_RETRY_ATTEMPTS=3

# Initial retry delay in milliseconds (default: 1000)
# Minimum: 100ms
AIRS_RETRY_DELAY=1000
```

## Implementation Details

### Singleton Pattern

The configuration uses a singleton pattern to ensure consistent configuration across the application:

```typescript
let config: Config | null = null;

export function getConfig(): Config {
    if (config === null) {
        config = parseConfig();
    }
    return config;
}
```

### Configuration Parser

```typescript
function parseConfig(): Config {
    const config = {
        server: {
            port: parseInt(process.env.PORT || '3000', 10),
            environment: (process.env.NODE_ENV || 'development') as 'development' | 'production',
            corsOrigin: process.env.CORS_ORIGIN || '*',
        },
        mcp: {
            serverName: process.env.MCP_SERVER_NAME || 'prisma-airs-mcp-server',
            serverVersion: getVersion(),
            protocolVersion: process.env.MCP_PROTOCOL_VERSION || '2024-11-05',
        },
        airs: {
            apiUrl: process.env.AIRS_API_URL || 'https://service.api.aisecurity.paloaltonetworks.com',
            apiKey: process.env.AIRS_API_KEY || '',
            timeout: parseInt(process.env.AIRS_TIMEOUT || '30000', 10),
            retryAttempts: parseInt(process.env.AIRS_RETRY_ATTEMPTS || '3', 10),
            retryDelay: parseInt(process.env.AIRS_RETRY_DELAY || '1000', 10),
        },
    };

    try {
        return configSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Configuration validation failed:');
            error.errors.forEach((err) => {
                console.error(`  ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
}
```

### Version Detection

The module automatically detects the server version from package.json:

```typescript
function getVersion(): string {
    try {
        const packageJson = JSON.parse(
            fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
        );
        return packageJson.version || '1.0.0';
    } catch {
        return '1.0.0';
    }
}
```

## Usage Examples

### Basic Usage

```typescript
import { getConfig } from './config';

// Get configuration singleton
const config = getConfig();

// Access configuration values
console.log('Server port:', config.server.port);
console.log('API URL:', config.airs.apiUrl);
console.log('Environment:', config.server.environment);
```

### Using in Express Server

```typescript
import express from 'express';
import { getConfig } from './config';

const config = getConfig();
const app = express();

// Use configuration for server setup
app.listen(config.server.port, () => {
    console.log(`Server running on port ${config.server.port}`);
    console.log(`Environment: ${config.server.environment}`);
});
```

### Using in AIRS Client

```typescript
import { EnhancedPrismaAirsClient } from './airs';
import { getConfig } from './config';

const config = getConfig();

// Create AIRS client with configuration
const client = new EnhancedPrismaAirsClient({
    apiUrl: config.airs.apiUrl,
    apiKey: config.airs.apiKey,
    timeout: config.airs.timeout,
    maxRetries: config.airs.retryAttempts,
    retryDelay: config.airs.retryDelay,
});
```

## Configuration Validation

### Required Fields

The following fields are required and will cause startup failure if not provided:

1. **AIRS_API_KEY** - Must be a non-empty string
2. **AIRS_API_URL** - Must be a valid URL (defaults provided)

### Validation Examples

```bash
# Missing required API key
$ node dist/index.js
Configuration validation failed:
  airs.apiKey: String must contain at least 1 character(s)

# Invalid port number
$ PORT=70000 node dist/index.js
Configuration validation failed:
  server.port: Number must be less than or equal to 65535

# Invalid URL format
$ AIRS_API_URL=not-a-url node dist/index.js
Configuration validation failed:
  airs.apiUrl: Invalid url
```

## Best Practices

### 1. Environment-Specific Configuration

Use `.env` files for different environments:

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
AIRS_API_URL=https://dev-api.airs.example.com

# .env.production
NODE_ENV=production
LOG_LEVEL=error
AIRS_API_URL=https://api.airs.example.com
```

### 2. Secure API Keys

Never commit API keys to version control:

```bash
# .env.example (commit this)
AIRS_API_KEY=your-api-key-here

# .env (don't commit this)
AIRS_API_KEY=actual-secret-key
```

### 3. Validate Early

Configuration is validated on first access, ensuring failures happen at startup:

```typescript
// This will validate configuration immediately
const config = getConfig();
```

### 4. Type Safety

Always use the typed configuration object:

```typescript
// Good - type safe
const port: number = config.server.port;

// Bad - no type safety
const port = process.env.PORT; // string | undefined
```

### 5. Default Values

Provide sensible defaults for optional configuration:

```typescript
// Defaults are applied in parseConfig()
timeout: parseInt(process.env.AIRS_TIMEOUT || '30000', 10),
```

## Error Handling

### Validation Errors

Configuration validation errors are logged and cause immediate exit:

```typescript
try {
    return configSchema.parse(config);
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:');
        error.errors.forEach((err) => {
            console.error(`  ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
    }
    throw error;
}
```

### Missing Configuration

The singleton pattern ensures configuration is loaded once:

```typescript
export function getConfig(): Config {
    if (config === null) {
        config = parseConfig(); // Validates here
    }
    return config; // Always returns valid config
}
```

## Testing Configuration

### Unit Testing

Mock environment variables for testing:

```typescript
describe('Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should parse valid configuration', () => {
        process.env.AIRS_API_KEY = 'test-key';
        process.env.PORT = '8080';
        
        const config = getConfig();
        expect(config.server.port).toBe(8080);
        expect(config.airs.apiKey).toBe('test-key');
    });
});
```

### Integration Testing

Test with actual environment files:

```typescript
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

const config = getConfig();
// Test with real configuration
```

## Monitoring Configuration

Log configuration at startup (excluding secrets):

```typescript
import { getLogger } from './utils/logger';

const logger = getLogger();
const config = getConfig();

logger.info('Server configuration loaded', {
    server: {
        port: config.server.port,
        environment: config.server.environment,
    },
    mcp: {
        serverName: config.mcp.serverName,
        version: config.mcp.serverVersion,
    },
    airs: {
        apiUrl: config.airs.apiUrl,
        // Don't log sensitive data
        hasApiKey: !!config.airs.apiKey,
    },
});
```

## Next Steps

- [Types Module]({{ site.baseurl }}/developers/src/types/) - Configuration type definitions
- [Server Module]({{ site.baseurl }}/developers/src/index/) - Server initialization
- [AIRS Module]({{ site.baseurl }}/developers/src/airs/) - AIRS client configuration