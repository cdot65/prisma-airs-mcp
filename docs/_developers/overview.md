---
layout: documentation
title: Overview
description: Developer documentation for Prisma AIRS MCP server
category: developers
---

## Introduction

The Prisma AIRS MCP server is a production-ready implementation of the Model Context Protocol that acts as an API bridge between AI applications and Palo Alto Networks' Prisma AIRS security platform. It exposes security scanning capabilities through standard MCP tools, resources, and prompts.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│            MCP Client (Claude, VSCode, AI App)          │
└─────────────────────────┬───────────────────────────────┘
                          │ JSON-RPC 2.0 / SSE
┌─────────────────────────▼───────────────────────────────┐
│                 Express HTTP Server                     │
│                    (Port 3000)                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Resources  │  │    Tools     │  │   Prompts    │    │
│  │  Handler    │  │   Handler    │  │   Handler    │    │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                │                 │            │
│  ┌──────▼────────────────▼─────────────────▼────────┐   │
│  │           HTTP Transport Handler                 │   │
│  │  • JSON-RPC routing  • SSE streaming support     │   │
│  │  • Session management • Error handling           │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │         Enhanced AIRS Client Module              │   │
│  │  • REST API Client   • Token Bucket Rate Limiter │   │
│  │  • LRU Cache         • Exponential Retry Logic   │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS (x-pan-token auth)
┌─────────────────────────▼───────────────────────────────┐
│                  Prisma AIRS API                        │
│                     (v1 endpoints)                      │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Express HTTP Server

The server uses Express.js to handle MCP requests via HTTP and optional SSE streaming.

```typescript
// Server initialization with health checks
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Main MCP endpoint - handles JSON-RPC 2.0
app.post('/', async (req, res) => {
    await transport.handleRequest(req, res);
});

// SSE endpoint for streaming
app.get('/', (req, res) => {
    if (req.headers.accept?.includes('text/event-stream')) {
        transport.handleSSEConnection(req, res);
    }
});
```

### 2. Transport Layer

Custom HTTP transport with SSE support and session management.

```typescript
export class HttpServerTransport {
    private sessions: Map<string, { clientId: string; createdAt: Date }>;
    private sseTransport: SSETransport;

    async handleRequest(req: Request, res: Response): Promise<void> {
        const { method, params, id } = req.body;
        const result = await this.routeRequest(method, params);

        // Optional SSE streaming for long operations
        if (this.shouldStreamResponse(method) && this.acceptsSSE(req)) {
            // Stream via SSE
        } else {
            res.json({ jsonrpc: '2.0', result, id });
        }
    }
}
```

### 3. Enhanced AIRS Client

Type-safe client with built-in caching and rate limiting.

```typescript
export interface EnhancedAIRSClientConfig extends AIRSClientConfig {
    cache?: {
        maxSize: number; // Max items in cache
        ttl: number; // Time-to-live in ms
    };
    rateLimiter?: {
        tokensPerInterval: number;
        interval: number; // ms
        maxBurst: number;
    };
}

export class EnhancedPrismaAIRSClient {
    async scanSync(request: ScanRequest): Promise<ScanResponse> {
        await this.rateLimiter?.waitForLimit('scan');

        const cacheKey = AIRSCache.generateScanKey('sync', request);
        const cached = this.cache?.get(cacheKey);
        if (cached) return cached;

        const response = await this.client.scanSync(request);
        this.cache?.set(cacheKey, response);
        return response;
    }
}
```

### 4. Resource Handlers

MCP resources provide access to AIRS data and system status.

```typescript
export class ResourceHandler {
    // Static resources
    listResources(): ResourcesListResult {
        return {
            resources: [
                {
                    uri: 'airs://cache-stats/current',
                    name: 'Cache Statistics',
                    mimeType: 'application/json',
                },
                {
                    uri: 'airs://rate-limit-status/current',
                    name: 'Rate Limit Status',
                    mimeType: 'application/json',
                },
            ],
        };
    }

    // Dynamic resources accessed via URI
    async readResource(
        params: ResourcesReadParams,
    ): Promise<ResourcesReadResult> {
        // Handles: airs://scan-results/{scanId}
        //          airs://threat-reports/{reportId}
    }
}
```

### 5. Tool Handlers

MCP tools execute AIRS security operations.

```typescript
export class ToolHandler {
    private static readonly TOOLS = {
        SCAN_CONTENT: 'airs_scan_content',
        SCAN_ASYNC: 'airs_scan_async',
        GET_SCAN_RESULTS: 'airs_get_scan_results',
        GET_THREAT_REPORTS: 'airs_get_threat_reports',
        CLEAR_CACHE: 'airs_clear_cache',
    };

    listTools(): ToolsListResult {
        return {
            tools: [
                {
                    name: 'airs_scan_content',
                    description: 'Analyze content for security threats',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            prompt: { type: 'string' },
                            response: { type: 'string' },
                            context: { type: 'string' },
                            profileName: { type: 'string' },
                            metadata: { type: 'object' },
                        },
                    },
                },
            ],
        };
    }
}
```

## Key Features

### Type Safety

All components use TypeScript with strict mode:

```typescript
// Strongly typed interfaces
interface ScanRequest {
    tr_id?: string;
    ai_profile: AiProfile;
    metadata?: Metadata;
    contents: ContentItem[];
}

// Type guards for runtime validation
function isScanResponse(data: unknown): data is ScanResponse {
    return typeof data === 'object' && data !== null && 'scan_id' in data;
}
```

### Error Handling

Comprehensive error handling with AIRS-specific and MCP error codes:

```typescript
// AIRS API errors
export class AIRSAPIError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public response?: AIRSErrorResponse,
    ) {
        super(message);
        this.name = 'AIRSAPIError';
    }
}

// MCP protocol errors
export enum MCPErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
}

// Automatic retry on rate limiting
if (response.status === 429 && retryCount < maxRetries) {
    const delay = calculateRetryDelay(response);
    await sleep(delay);
    return makeRequest(method, path, body, options, retryCount + 1);
}
```

### Caching System

LRU cache with TTL and size limits:

```typescript
export class AIRSCache {
    private cache = new Map<string, CacheEntry>();
    private accessOrder: string[] = [];

    set<T>(key: string, value: T, ttl?: number): void {
        // Evict least recently used if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const lru = this.accessOrder.shift();
            if (lru) this.cache.delete(lru);
        }

        const expiry = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { value, expiry });
        this.updateAccessOrder(key);
    }

    static generateScanKey(type: string, request: ScanRequest): string {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify({ type, request }));
        return `scan:${hash.digest('hex')}`;
    }
}
```

### Rate Limiting

Token bucket algorithm with configurable limits per operation:

```typescript
export class AIRSRateLimiter {
    private buckets = new Map<string, TokenBucket>();

    async waitForLimit(operation: string): Promise<void> {
        const bucket = this.getBucket(operation);

        while (!bucket.tryConsume(1)) {
            const waitTime = bucket.timeUntilNextToken();
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }

    private getBucket(operation: string): TokenBucket {
        const config = this.limits[operation] || this.defaultLimit;
        return new TokenBucket(
            config.tokensPerInterval,
            config.interval,
            config.maxBurst,
        );
    }
}
```

## API Usage Patterns

### Basic MCP Request

```typescript
// Example MCP request to the server
const request = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
        name: 'airs_scan_content',
        arguments: {
            prompt: 'User input to scan',
            profileName: 'Prisma AIRS',
        },
    },
    id: 1,
};

// Send via HTTP POST to server endpoint
const response = await fetch('http://localhost:3000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
});
```

### Using MCP Client Libraries

```typescript
// With any MCP-compatible client
try {
    const result = await mcpClient.callTool('airs_scan_content', {
        prompt: userInput,
        response: aiResponse,
        profileName: 'Prisma AIRS',
    });

    // Check response content
    const scanResult = result.content[0].text;
    if (scanResult.includes('malicious')) {
        // Handle threat detection
    }
} catch (error) {
    if (error.code === -32603) {
        // Server error - check logs
    }
}
```

### Resource Access

```typescript
// List available resources via MCP
const resources = await mcpClient.listResources();

// Read specific resource
const cacheStats = await mcpClient.readResource('airs://cache-stats');
console.log('Cache statistics:', cacheStats);
```

## Available MCP Operations

### Tools (5 available)

1. **airs_scan_content** - Synchronous content scanning
2. **airs_scan_async** - Batch asynchronous scanning
3. **airs_get_scan_results** - Retrieve scan results by ID
4. **airs_get_threat_reports** - Get detailed threat reports
5. **airs_clear_cache** - Clear the response cache

### Resources

**Static Resources:**

- `airs://cache-stats/current` - Cache performance metrics
- `airs://rate-limit-status/current` - Rate limiting status

**Dynamic Resources:**

- `airs://scan-results/{scanId}` - Individual scan results
- `airs://threat-reports/{reportId}` - Detailed threat reports

### Prompts (4 workflows)

1. **security_analysis** - Comprehensive security analysis
2. **threat_investigation** - Detailed threat investigation
3. **compliance_check** - Regulatory compliance checking
4. **incident_response** - Security incident response guide

## Performance Considerations

### Connection Management

- HTTP Keep-Alive for connection reuse
- Configurable request timeout (default 30s)
- Automatic retry with exponential backoff
- Session management for SSE connections

### Request Batching

```typescript
// Batch multiple scans for efficiency
const result = await mcpClient.callTool('airs_scan_async', {
    requests: [
        { reqId: 1, prompt: 'content1', profileName: 'Prisma AIRS' },
        { reqId: 2, prompt: 'content2', profileName: 'Prisma AIRS' },
    ],
});
```

### Caching Strategy

- **Default TTL**: 5 minutes for scan results
- **Cache Size**: Configurable max items (default 1000)
- **LRU Eviction**: Least recently used items removed first
- **Key Generation**: SHA-256 hash of request parameters
- **Skip Cache**: Async operations and incomplete results

## Best Practices

1. **Error Handling**: Check for both MCP protocol errors and AIRS API errors
2. **Rate Limiting**: Server implements automatic waiting - no manual backoff needed
3. **Caching**: Use `airs_clear_cache` tool when fresh results are required
4. **Batching**: Use async scanning for multiple items to reduce API calls
5. **Security**: API keys are handled server-side - never exposed to clients
6. **Monitoring**: Check health endpoint at `/health` and ready at `/ready`

## Configuration

Key environment variables:

```bash
# AIRS API Configuration
AIRS_API_URL=https://api.prismacloud.io/airs
AIRS_API_KEY=your-api-key
AIRS_DEFAULT_PROFILE_NAME="Prisma AIRS"

# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Cache Configuration
CACHE_ENABLED=true
CACHE_MAX_SIZE=1000
CACHE_TTL=300000  # 5 minutes

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_SCAN_TOKENS=10
RATE_LIMIT_SCAN_INTERVAL=60000  # 1 minute
```

## Next Steps

- [AIRS Client Integration]({{ site.baseurl }}/developers/client) - Deep dive into AIRS API client
- [MCP Resources]({{ site.baseurl }}/developers/resources) - Working with server resources
- [MCP Tools]({{ site.baseurl }}/developers/tools) - Available security scanning tools
- [API Reference]({{ site.baseurl }}/developers/api) - Complete API documentation
