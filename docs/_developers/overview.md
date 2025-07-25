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
│                    MCP Client (Claude)                  │
└─────────────────────────┬───────────────────────────────┘
                          │ JSON-RPC 2.0
┌─────────────────────────▼───────────────────────────────┐
│                    MCP Server (HTTP)                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Resources  │  │    Tools     │  │   Prompts    │    │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                │                  │           │
│  ┌──────▼────────────────▼──────────────────▼───────┐   │
│  │              MCP Server Implementation           │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │              AIRS Client Module                  │   │
│  │  • REST API Client   • Rate Limiter              │   │
│  │  • Response Cache    • Retry Logic               │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────┐
│                  Prisma AIRS API                        │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. MCP Server Implementation

The server exposes Prisma AIRS security capabilities through the MCP protocol.

```typescript
// Server initialization with MCP capabilities
const server = new Server({
  name: 'prisma-airs-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    resources: {},  // Scan results, cache stats, rate limits
    tools: {},      // Security scanning operations
    prompts: {}     // Interactive security workflows
  }
});
```

### 2. Transport Layer

HTTP-based transport for Kubernetes deployment compatibility.

```typescript
const transport = new HttpServerTransport({
  port: 3000,
  corsOptions: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

await transport.listen();
```

### 3. AIRS Client

Type-safe client for Prisma AIRS API integration.

```typescript
interface AIRSClientConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
  cache?: CacheConfig;
  rateLimit?: RateLimitConfig;
}

class PrismaAIRSClient {
  async scanContent(request: ScanRequest): Promise<ScanResponse> {
    // Implementation with retry logic and caching
  }
}
```

### 4. Resource Handlers

MCP resources provide access to AIRS data.

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'airs://cache-stats',
      name: 'Cache Statistics',
      mimeType: 'application/json'
    },
    {
      uri: 'airs://rate-limit-status',
      name: 'Rate Limit Status',
      mimeType: 'application/json'
    }
  ]
}));
```

### 5. Tool Handlers

MCP tools execute AIRS operations.

```typescript
const TOOLS = [
  {
    name: 'scan_content',
    description: 'Scan content for security threats',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        response: { type: 'string' },
        profile_name: { type: 'string' }
      }
    }
  }
];
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
  return typeof data === 'object' && 
         data !== null && 
         'scan_id' in data;
}
```

### Error Handling

Comprehensive error handling with MCP error codes:

```typescript
enum MCPErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603
}

class MCPError extends Error {
  constructor(
    public code: MCPErrorCode,
    message: string,
    public data?: unknown
  ) {
    super(message);
  }
}
```

### Caching System

TTL-based in-memory cache for performance:

```typescript
class AIRSCache {
  private cache: Map<string, CacheEntry>;
  
  set(key: string, value: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }
  
  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (!entry || entry.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }
}
```

### Rate Limiting

Token bucket algorithm for API protection:

```typescript
class AIRSRateLimiter {
  private buckets: Map<string, TokenBucket>;
  
  async checkLimit(key: string): Promise<boolean> {
    const bucket = this.getBucket(key);
    return bucket.consume(1);
  }
}
```

## API Usage Patterns

### Basic MCP Request

```typescript
// Example MCP request to the server
const request = {
  jsonrpc: "2.0",
  method: "tools/call",
  params: {
    name: "airs_scan_content",
    arguments: {
      prompt: "User input to scan",
      profileName: "Prisma AIRS"
    }
  },
  id: 1
};

// Send via HTTP POST to server endpoint
const response = await fetch('http://localhost:3000', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
});
```

### Using MCP Client Libraries

```typescript
// With any MCP-compatible client
try {
  const result = await mcpClient.callTool('airs_scan_content', {
    prompt: userInput,
    response: aiResponse,
    profileName: 'Prisma AIRS'
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

## Server Extension Points

### Custom Tools

```typescript
// Define new tool
const customTool = {
  name: 'custom_analysis',
  description: 'Custom security analysis',
  inputSchema: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      options: { type: 'object' }
    }
  },
  handler: async (params) => {
    // Custom implementation
    return { result: 'analysis' };
  }
};

// Register tool
server.addTool(customTool);
```

### Custom Resources

```typescript
// Add dynamic resource
server.addResourceProvider({
  pattern: /^airs:\/\/custom\/.*/,
  handler: async (uri) => {
    const id = uri.split('/').pop();
    return {
      uri,
      name: `Custom Resource ${id}`,
      mimeType: 'application/json',
      text: JSON.stringify({ id, data: 'custom' })
    };
  }
});
```

## Performance Considerations

### Connection Pooling

```typescript
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  timeout: 30000
});
```

### Request Batching

```typescript
// Batch multiple scans
const results = await client.callTool('scan_async', {
  contents: items.map(item => ({
    prompt: item.input,
    response: item.output
  }))
});
```

### Caching Strategy

- Cache scan results for 5 minutes by default
- Automatic cache eviction on memory pressure
- Cache key based on content hash

## Best Practices

1. **Error Handling**: Always handle MCP error responses properly
2. **Rate Limiting**: Implement backoff strategies
3. **Logging**: Use structured logging for debugging
4. **Monitoring**: Track metrics for performance
5. **Security**: Never log sensitive content

## Next Steps

- [AIRS Integration]({{ site.baseurl }}/developers/client) - How the server integrates with AIRS
- [MCP Resources]({{ site.baseurl }}/developers/resources) - Available server resources
- [MCP Tools]({{ site.baseurl }}/developers/tools) - Security scanning tools
- [MCP Prompts]({{ site.baseurl }}/developers/prompts) - Interactive workflows