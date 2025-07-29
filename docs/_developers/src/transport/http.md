---
layout: documentation
title: HTTP Transport
permalink: /developers/src/transport/http/
category: developers
---

HTTP server transport layer for MCP protocol. Handles JSON-RPC routing, session management, SSE integration, and protocol compliance.

## Core Purpose

- Route JSON-RPC requests to handlers
- Manage client sessions
- Enable SSE streaming
- Handle protocol initialization

## Key Components

### HttpServerTransport Class

```typescript
export class HttpServerTransport {
    // Dependencies
    private resourceHandler: ResourceHandler
    private toolHandler: ToolHandler
    private promptHandler: PromptHandler
    private sseTransport: SSETransport
    private sessions: Map<string, Session>
    
    // Main methods
    handleRequest(): Routes and processes requests
    handleSSEConnection(): Manages SSE streams
}
```

## Request Routing

### Supported Methods

| Method | Handler | Purpose |
|--------|---------|---------|
| `resources/list` | ResourceHandler | List resources |
| `resources/read` | ResourceHandler | Read resource |
| `tools/list` | ToolHandler | List tools |
| `tools/call` | ToolHandler | Execute tool |
| `prompts/list` | PromptHandler | List prompts |
| `prompts/get` | PromptHandler | Get prompt |
| `initialize` | Internal | Protocol init |
| `ping` | Internal | Health check |

## Integration in Application

- **Used By**: Express server endpoints
- **Handlers**: Resources, Tools, Prompts
- **Protocol**: JSON-RPC 2.0 compliant
- **Streaming**: Optional SSE support

## Request Flow

1. Receive JSON-RPC request
2. Validate method and params
3. Route to appropriate handler
4. Execute handler logic
5. Return JSON-RPC response

## Session Management

### Session Headers

- Request: `Mcp-Session-Id`
- Response: `Mcp-Session-Id`

### Session Features

- UUID-based identification
- Client tracking
- SSE connection association

## Protocol Features

### Initialization Response

```typescript
{
    protocolVersion: "2024-11-05",
    capabilities: {
        resources: { read: true, list: true },
        tools: { list: true, call: true },
        prompts: { list: true, get: true }
    },
    serverInfo: { name, version }
}
```

### Resource Templates

```typescript
{
    uriTemplate: "airs://scan-results/{scanId}",
    name: "Scan Results",
    description: "Retrieve scan by ID"
}
```

## Error Handling

### JSON-RPC Error Codes

- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

### Error Integration

- Sentry exception capture
- Structured logging
- Generic client responses

## SSE Support

### Stream Detection

- Check Accept header for `text/event-stream`
- Identify streamable methods
- Initialize SSE connection

### Streaming Flow

1. Detect SSE capability
2. Create/retrieve session
3. Initialize SSE transport
4. Send response via events
5. Clean up connection

## Key Features

### Request Validation

- Method presence check
- Parameter type validation
- JSON-RPC structure verification

### Performance

- Efficient method routing
- Session caching
- Minimal async overhead

### Security

- Session isolation
- Error sanitization
- Input validation

## Usage Example

```typescript
// Handle incoming request
await transport.handleRequest(req, res);

// Establish SSE connection
transport.handleSSEConnection(req, res);

// Request automatically routed to:
// - ResourceHandler for resources/*
// - ToolHandler for tools/*
// - PromptHandler for prompts/*
```

## Related Modules

- [SSE Transport]({{ site.baseurl }}/developers/src/transport/sse/) - Streaming implementation
- [Resource Handler]({{ site.baseurl }}/developers/src/resources/overview/) - Resource operations
- [Tool Handler]({{ site.baseurl }}/developers/src/tools/overview/) - Tool execution
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Type definitions
