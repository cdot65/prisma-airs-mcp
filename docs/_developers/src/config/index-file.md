---
layout: documentation
title: Configuration Implementation
permalink: /developers/src/config/index-file/
category: developers
---

Environment-based configuration loader with Zod validation. Provides type-safe access to all application settings.

## Core Purpose

- Load settings from environment variables
- Validate configuration at startup
- Provide singleton access to config
- Apply sensible defaults

## Key Components

### Configuration Schema

```typescript
const configSchema = z.object({
    server: { port, environment, logLevel },
    airs: { apiUrl, apiKey, timeout, retryAttempts },
    cache: { enabled, ttlSeconds, maxSize },
    rateLimit: { enabled, maxRequests, windowMs },
    mcp: { serverName, serverVersion, protocolVersion }
});
```

### Singleton Getter

```typescript
export function getConfig(): Config {
    // Load once, validate, cache
    // Throw on validation errors
}
```

## Integration in Application

- **Used By**: All modules needing configuration
- **Pattern**: Singleton with lazy loading
- **Validation**: Fails fast on invalid config
- **Error Handling**: Clear messages for missing/invalid values

## Configuration Categories

### Server Settings

- Port, environment, log level
- Loaded from PORT, NODE_ENV, LOG_LEVEL

### AIRS API Settings

- API URL, key, timeouts
- Required: AIRS_API_KEY
- Optional: timeout, retry settings

### Feature Toggles

- Cache: enabled/disabled, TTL, size
- Rate Limiting: enabled/disabled, limits

## Key Features

### Validation

- Required fields must be present
- Type checking (numbers, enums)
- URL format validation
- Range constraints

### Defaults

```typescript
PORT=3000
NODE_ENV=development
CACHE_ENABLED=true
CACHE_TTL_SECONDS=300
RATE_LIMIT_ENABLED=true
```

### Error Messages

```typescript
// Missing API key
"Invalid configuration: airs.apiKey: String must contain at least 1 character(s)"

// Invalid port
"Number must be less than or equal to 65535"
```

## Usage Pattern

```typescript
import { getConfig } from './config';

// Get typed configuration
const config = getConfig();

// Access settings
const apiUrl = config.airs.apiUrl;
const cacheEnabled = config.cache.enabled;

// Type safety enforced
// config.server.port = "3000"; // TypeScript error
```

## Related Modules

- [Config Types]({{ site.baseurl }}/developers/src/types/config-types/) - Type definitions
- [Logger]({{ site.baseurl }}/developers/src/utils/logger/) - Uses log level config
- [AIRS Factory]({{ site.baseurl }}/developers/src/airs/factory/) - Primary consumer
