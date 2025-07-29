---
layout: documentation
title: AIRS Factory
permalink: /developers/src/airs/factory/
category: developers
---

# AIRS Factory Module (src/airs/factory.ts)

The factory module implements a singleton pattern for managing AIRS client instances. It ensures only one client
instance exists per configuration, provides clean lifecycle management, and supports test isolation through instance
reset capabilities.

## Overview

The factory module provides:

- Singleton pattern for AIRS client instances
- Lazy initialization of clients
- Configuration management
- Resource cleanup and reset functionality
- Test-friendly instance isolation
- Cache and rate limiter lifecycle management

## Architecture

```
┌─────────────────────────────────────────┐
│            AIRS Factory                 │
│         (Global Module)                 │
├─────────────────────────────────────────┤
│         Singleton Instance              │
│     ┌─────────────────────────┐        │
│     │  airsClient?: Client    │        │
│     │  cache?: Cache          │        │
│     │  rateLimiter?: Limiter  │        │
│     └─────────────────────────┘        │
├─────────────────────────────────────────┤
│           Public API                    │
│     ┌─────────────────────────┐        │
│     │  getAirsClient()        │        │
│     │  resetAirsClient()      │        │
│     └─────────────────────────┘        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Enhanced AIRS Client               │
│   (With Cache + Rate Limiting)          │
└─────────────────────────────────────────┘
```

## Factory Design Pattern

### Singleton Implementation

The factory ensures only one client instance exists:

```typescript
let airsClient: PrismaAIRSClientWithCache | null = null;

export function getAirsClient(): PrismaAIRSClientWithCache {
    if (!airsClient) {
        // Create new instance
        airsClient = createClient();
    }
    return airsClient;
}
```

### Benefits

1. **Resource Efficiency**: Single HTTP client instance
2. **Consistent State**: Shared cache and rate limits
3. **Configuration Control**: Centralized settings
4. **Memory Management**: Controlled instance lifecycle

## API Functions

### getAirsClient()

Gets or creates the singleton AIRS client instance.

```typescript
export function getAirsClient(): PrismaAIRSClientWithCache
```

**Returns:**

- `PrismaAIRSClientWithCache` - Enhanced client with caching and rate limiting

**Behavior:**

- Creates client on first call (lazy initialization)
- Returns existing client on subsequent calls
- Validates configuration before creation
- Initializes cache and rate limiter based on config

**Example:**

```typescript
import { getAirsClient } from './airs/factory';

// First call - creates client
const client = getAirsClient();

// Subsequent calls - returns same instance
const sameClient = getAirsClient();
console.log(client === sameClient); // true
```

### resetAirsClient()

Resets the singleton instance and cleans up resources.

```typescript
export function resetAirsClient(): void
```

**Behavior:**

- Clears the cache if it exists
- Resets rate limiter statistics
- Destroys the client instance
- Next `getAirsClient()` call creates new instance

**Example:**

```typescript
import { getAirsClient, resetAirsClient } from './airs/factory';

// Use client
const client = getAirsClient();
await client.scanSync(request);

// Reset for clean state
resetAirsClient();

// Next call creates new instance
const newClient = getAirsClient();
console.log(client === newClient); // false
```

## Client Creation Process

### Configuration Loading

The factory loads configuration from environment:

```typescript
function createClient(): PrismaAIRSClientWithCache {
    const config = getConfig();
    
    // Validate required configuration
    if (!config.airs.apiKey) {
        throw new Error('AIRS_API_KEY is required');
    }

    // Create base client
    const baseClient = new PrismaAIRSClient({
        apiKey: config.airs.apiKey,
        baseUrl: config.airs.apiUrl,
        timeout: config.airs.timeout,
        maxRetries: config.airs.maxRetries,
    });

    // Create enhanced client with optional features
    return new PrismaAIRSClientWithCache(baseClient, {
        cache: config.cache.enabled ? createCache(config) : undefined,
        rateLimiter: config.rateLimit.enabled ? createRateLimiter(config) : undefined,
    });
}
```

### Cache Creation

Cache is created based on configuration:

```typescript
function createCache(config: Config): PrismaAirsCache | undefined {
    if (!config.cache.enabled) {
        return undefined;
    }

    return new PrismaAirsCache({
        ttlSeconds: config.cache.ttlSeconds,
        maxSize: config.cache.maxSize,
    });
}
```

### Rate Limiter Creation

Rate limiter is configured per operation:

```typescript
function createRateLimiter(config: Config): TokenBucketRateLimiter | undefined {
    if (!config.rateLimit.enabled) {
        return undefined;
    }

    return new TokenBucketRateLimiter({
        enabled: true,
        limits: {
            scanSync: {
                maxTokens: config.rateLimit.maxRequests,
                refillRate: config.rateLimit.maxRequests,
                refillInterval: config.rateLimit.windowMs,
            },
            // ... other operations
        },
    });
}
```

## Usage Patterns

### Basic Usage

```typescript
// Simple usage - factory handles everything
import { getAirsClient } from './airs/factory';

export async function scanContent(content: string) {
    const client = getAirsClient();
    
    return await client.scanSync({
        tr_id: generateId(),
        request: [{
            prompt: content,
            profile_name: 'default'
        }]
    });
}
```

### Service Integration

```typescript
// Service class using factory
export class SecurityService {
    private get client() {
        return getAirsClient();
    }

    async checkContent(content: string): Promise<boolean> {
        const result = await this.client.scanSync({
            tr_id: `check_${Date.now()}`,
            request: [{ prompt: content, profile_name: 'strict' }]
        });

        return result.request_results[0].prompt_guard_result
            .high_risk_categories.length === 0;
    }
}
```

### Tool Implementation

```typescript
// MCP tool using factory
import { getAirsClient } from '../airs/factory';

export async function handleScanTool(params: ToolParams) {
    const client = getAirsClient();
    
    try {
        const result = await client.scanSync({
            tr_id: params.requestId,
            request: [{
                prompt: params.content,
                profile_name: params.profile || 'default'
            }]
        });
        
        return {
            success: true,
            result
        };
    } catch (error) {
        logger.error('Scan failed', error);
        throw error;
    }
}
```

## Testing with Factory

### Test Isolation

Always reset the client in tests:

```typescript
import { getAirsClient, resetAirsClient } from './airs/factory';

describe('MyService', () => {
    beforeEach(() => {
        // Ensure clean state
        resetAirsClient();
    });

    afterEach(() => {
        // Clean up after test
        resetAirsClient();
    });

    it('should scan content', async () => {
        const client = getAirsClient();
        // Test implementation
    });
});
```

### Mocking the Factory

```typescript
// Mock the entire factory
jest.mock('./airs/factory', () => ({
    getAirsClient: jest.fn().mockReturnValue({
        scanSync: jest.fn().mockResolvedValue(mockResponse),
        scanAsync: jest.fn().mockResolvedValue(mockAsyncResponse),
        getScanResults: jest.fn().mockResolvedValue(mockResults),
    }),
    resetAirsClient: jest.fn(),
}));
```

### Integration Testing

```typescript
describe('Integration Tests', () => {
    it('should use real client with test config', async () => {
        // Set test configuration
        process.env.AIRS_API_KEY = 'test-key';
        process.env.CACHE_ENABLED = 'false';
        process.env.RATE_LIMIT_ENABLED = 'false';

        const client = getAirsClient();
        
        // Test with real client
        const result = await client.scanSync(testRequest);
        expect(result).toBeDefined();
    });
});
```

## Configuration Examples

### Production Configuration

```bash
# High-performance production settings
AIRS_API_KEY=your-production-key
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
CACHE_ENABLED=true
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=10000
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Development Configuration

```bash
# Development with aggressive caching
AIRS_API_KEY=your-dev-key
CACHE_ENABLED=true
CACHE_TTL_SECONDS=3600  # 1 hour cache
CACHE_MAX_SIZE=1000
RATE_LIMIT_ENABLED=false  # No rate limits in dev
```

### Test Configuration

```bash
# Minimal test configuration
AIRS_API_KEY=test-key
CACHE_ENABLED=false
RATE_LIMIT_ENABLED=false
```

## Lifecycle Management

### Initialization Flow

```
1. Application starts
2. First API call triggers getAirsClient()
3. Factory loads configuration
4. Creates base client with API credentials
5. Wraps with cache (if enabled)
6. Wraps with rate limiter (if enabled)
7. Returns enhanced client
8. Subsequent calls return same instance
```

### Cleanup Flow

```
1. Test completes or app shuts down
2. resetAirsClient() called
3. Cache cleared (if exists)
4. Rate limiter reset (if exists)
5. Client instance destroyed
6. Next call creates fresh instance
```

## Error Handling

### Configuration Errors

```typescript
try {
    const client = getAirsClient();
} catch (error) {
    if (error.message.includes('AIRS_API_KEY')) {
        console.error('Missing API key configuration');
    }
}
```

### Runtime Errors

```typescript
// Factory doesn't handle runtime errors
try {
    const client = getAirsClient();
    await client.scanSync(request);
} catch (error) {
    // Handle API errors, rate limits, etc.
}
```

## Best Practices

### 1. Don't Store References

```typescript
// Bad - stores reference that might become stale
class Service {
    private client = getAirsClient();
}

// Good - always gets current instance
class Service {
    private get client() {
        return getAirsClient();
    }
}
```

### 2. Reset in Tests

```typescript
// Always reset in test lifecycle
beforeEach(() => resetAirsClient());
afterEach(() => resetAirsClient());
```

### 3. Handle Configuration Errors

```typescript
// Check configuration early
export async function initializeApp() {
    try {
        const client = getAirsClient();
        logger.info('AIRS client initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize AIRS client', error);
        process.exit(1);
    }
}
```

### 4. Don't Modify Singleton

```typescript
// Bad - modifying singleton state
const client = getAirsClient();
client.someProperty = 'value';  // Don't do this

// Good - use configuration
process.env.SOME_CONFIG = 'value';
resetAirsClient();  // Force recreation
const client = getAirsClient();
```

## Monitoring

### Client Status

```typescript
export function getClientStatus() {
    try {
        const client = getAirsClient();
        return {
            initialized: true,
            cacheEnabled: !!client.cache,
            rateLimiterEnabled: !!client.rateLimiter,
            cacheStats: client.cache?.getStats(),
            rateLimitStats: client.rateLimiter?.getStats(),
        };
    } catch (error) {
        return {
            initialized: false,
            error: error.message,
        };
    }
}
```

### Health Checks

```typescript
export async function checkAirsHealth() {
    try {
        const client = getAirsClient();
        
        // Simple health check
        await client.scanSync({
            tr_id: 'health_check',
            request: [{
                prompt: 'test',
                profile_name: 'default'
            }]
        });
        
        return { healthy: true };
    } catch (error) {
        return { 
            healthy: false, 
            error: error.message 
        };
    }
}
```

## Troubleshooting

### Common Issues

1. **"AIRS_API_KEY is required" Error**
    - Set the AIRS_API_KEY environment variable
    - Check .env file is loaded
    - Verify configuration module is working

2. **Stale Client Instance**
    - Call resetAirsClient() to force recreation
    - Check for stored references
    - Verify test cleanup

3. **Configuration Changes Not Applied**
    - Reset client after changing environment
    - Restart application for config changes
    - Check configuration loading order

### Debug Logging

```typescript
// Add debug logging to factory
export function getAirsClient(): PrismaAIRSClientWithCache {
    logger.debug('Getting AIRS client instance', {
        exists: !!airsClient,
        config: {
            cacheEnabled: getConfig().cache.enabled,
            rateLimitEnabled: getConfig().rateLimit.enabled,
        }
    });
    
    if (!airsClient) {
        logger.info('Creating new AIRS client instance');
        airsClient = createClient();
    }
    
    return airsClient;
}
```

## Related Documentation

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Client implementation
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Configuration system
- [Base Client]({{ site.baseurl }}/developers/src/airs/client/) - Core API client
- [Tools]({{ site.baseurl }}/developers/src/tools/overview/) - Factory usage in tools