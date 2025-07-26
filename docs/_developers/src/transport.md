---
layout: documentation
title: Transport Module (src/transport/)
permalink: /developers/src/transport/
category: developers
---

# Transport Module Documentation

The transport module handles HTTP and Server-Sent Events (SSE) communication for the MCP server. It implements the JSON-RPC 2.0 protocol over HTTP with optional SSE streaming for long-running operations.

## Module Overview

The transport module consists of three files:

- **http.ts** - Main HTTP transport handler with JSON-RPC routing
- **sse.ts** - Server-Sent Events implementation for streaming responses
- **prompt.md** - Prompt engineering guidelines (documentation)

## HTTP Transport (http.ts)

### Overview

The HTTP transport handles incoming MCP requests, routes them to appropriate handlers, and manages client sessions for streaming responses.

### Key Components

#### HttpServerTransport Class

```typescript
export class HttpServerTransport {
    private server: Server;
    private logger: Logger;
    private resourceHandler: ResourceHandler;
    private toolHandler: ToolHandler;
    private promptHandler: PromptHandler;
    private sseTransport: SSETransport;
    private sessions: Map<string, { clientId: string; createdAt: Date }>;

    // Handle incoming JSON-RPC requests
    async handleRequest(req: StreamableRequest, res: Response): Promise<void>;

    // Handle SSE connections for streaming
    handleSSEConnection(req: StreamableRequest, res: Response): void;

    // Route requests to appropriate handlers
    private async routeRequest(
        method: string,
        params: unknown,
    ): Promise<unknown>;
}
```

### JSON-RPC Implementation

#### Request Format

```typescript
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    method: string;
    params?: unknown;
    id: string | number | null;
}
```

#### Response Format

```typescript
export interface JsonRpcResponse {
    jsonrpc: '2.0';
    result?: unknown;
    error?: JsonRpcError;
    id: string | number | null;
}

export interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}
```

### Supported Methods

The transport routes the following MCP methods:

#### Resource Methods

- `resources/list` - List available resources
- `resources/read` - Read resource content
- `resources/templates/list` - List resource URI templates

#### Tool Methods

- `tools/list` - List available tools
- `tools/call` - Execute a tool

#### Prompt Methods

- `prompts/list` - List available prompts
- `prompts/get` - Get prompt with arguments

#### Server Methods

- `initialize` - Initialize MCP connection
- `ping` - Health check
- `notifications/initialized` - Client initialized notification
- `completion/complete` - Completion support (MCP Inspector compatibility)

### Session Management

Sessions enable streaming responses via SSE:

```typescript
private getOrCreateSession(req: StreamableRequest): string {
    const existingSessionId = req.headers['mcp-session-id'];

    if (existingSessionId && this.sessions.has(existingSessionId)) {
        return existingSessionId;
    }

    const sessionId = uuidv4();
    const clientId = uuidv4();
    this.sessions.set(sessionId, { clientId, createdAt: new Date() });

    return sessionId;
}
```

### Request Routing

```typescript
private async routeRequest(method: string, params: unknown): Promise<unknown> {
    switch (method) {
        case 'resources/list':
            return this.resourceHandler.listResources(params);
        case 'tools/call':
            return this.toolHandler.callTool(params);
        // ... other methods
        default:
            throw new Error(`Method not found: ${method}`);
    }
}
```

### Error Handling

Standard JSON-RPC error codes:

```typescript
// Invalid request
{
    "jsonrpc": "2.0",
    "error": {
        "code": -32600,
        "message": "Invalid Request: missing or invalid method"
    },
    "id": null
}

// Internal error
{
    "jsonrpc": "2.0",
    "error": {
        "code": -32603,
        "message": "Internal error",
        "data": "Error details"
    },
    "id": "request-id"
}
```

## SSE Transport (sse.ts)

### Overview

The SSE transport enables server-to-client streaming for long-running operations and real-time updates.

### SSETransport Class

```typescript
export class SSETransport {
    private clients: Map<string, Response> = new Map();
    private messageId = 0;

    // Initialize SSE connection
    initializeSSE(res: Response, clientId: string): void;

    // Send SSE event
    sendEvent(clientId: string, message: SSEMessage): boolean;

    // Send JSON-RPC response via SSE
    sendJsonRpcResponse(clientId: string, response: JsonRpcResponse): boolean;

    // Send server notification
    sendNotification(
        clientId: string,
        method: string,
        params?: unknown,
    ): boolean;

    // Broadcast to all clients
    broadcast(message: SSEMessage): void;
}
```

### SSE Message Format

```typescript
export interface SSEMessage {
    id?: string; // Message ID for reconnection
    event?: string; // Event type
    data: string; // Message data (JSON string)
    retry?: number; // Reconnection retry interval
}
```

### SSE Event Types

1. **connect** - Initial connection confirmation
2. **message** - JSON-RPC response
3. **notification** - Server-initiated notification
4. **endpoint** - Legacy endpoint information

### SSE Headers

```typescript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
```

## Usage Examples

### Basic Request Handling

```typescript
// Express route handler
app.post('/messages', async (req, res) => {
    await transport.handleRequest(req, res);
});
```

### SSE Connection

```typescript
// SSE endpoint for streaming
app.get('/sse', (req, res) => {
    transport.handleSSEConnection(req, res);
});
```

### Client Request Example

```typescript
// JSON-RPC request
POST /messages
{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
        "name": "airs_scan_content",
        "arguments": {
            "prompt": "Scan this content"
        }
    },
    "id": "req-123"
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "content": [
            {
                "type": "text",
                "text": "Scan completed successfully"
            }
        ]
    },
    "id": "req-123"
}
```

### SSE Streaming Example

```typescript
// Client connects with SSE
GET /sse
Accept: text/event-stream

// Server sends events
event: connect
data: {"connected": true}

event: message
id: 1
data: {"jsonrpc":"2.0","result":{...},"id":"req-123"}

event: notification
data: {"jsonrpc":"2.0","method":"tools/list_changed"}
```

## Integration Points

### Handler Integration

The transport integrates with:

1. **ResourceHandler** - Resource operations
2. **ToolHandler** - Tool execution
3. **PromptHandler** - Prompt retrieval
4. **Config** - Server configuration
5. **Logger** - Request logging

### Initialize Response

```typescript
{
    "protocolVersion": "2024-11-05",
    "capabilities": {
        "resources": { "read": true, "list": true },
        "tools": { "list": true, "call": true },
        "prompts": { "list": true, "get": true }
    },
    "serverInfo": {
        "name": "prisma-airs-mcp",
        "version": "1.0.0"
    }
}
```

### Resource Templates

Dynamic resource URI templates:

```typescript
{
    "resourceTemplates": [
        {
            "uriTemplate": "airs://scan-results/{scanId}",
            "name": "Scan Results",
            "description": "Retrieve results for a specific scan by ID",
            "mimeType": "application/json"
        }
    ]
}
```

## Security Considerations

1. **Session Management** - Sessions are ephemeral and tied to connections
2. **Input Validation** - JSON-RPC requests are validated
3. **Error Handling** - Errors don't expose internal details
4. **CORS** - Should be configured at Express level
5. **Authentication** - Handled by AIRS API key in handlers

## Performance Optimization

### Streaming Decision

```typescript
private shouldStreamResponse(method: string, result: unknown): boolean {
    const streamableMethods = [
        'tools/call',      // Long-running operations
        'resources/read',  // Large resources
    ];

    return streamableMethods.includes(method);
}
```

### Connection Management

- SSE connections are cleaned up on disconnect
- Broadcast operations skip disconnected clients
- Sessions are memory-based (consider Redis for scale)

## Error Codes

Standard JSON-RPC 2.0 error codes:

| Code   | Message          | Description               |
| ------ | ---------------- | ------------------------- |
| -32700 | Parse error      | Invalid JSON              |
| -32600 | Invalid Request  | Invalid request structure |
| -32601 | Method not found | Unknown method            |
| -32602 | Invalid params   | Invalid method parameters |
| -32603 | Internal error   | Server error              |

## Testing

### Unit Testing

```typescript
// Test request routing
const transport = new HttpServerTransport({ server, logger });
const result = await transport.routeRequest('tools/list', {});
assert(result.tools.length > 0);
```

### Integration Testing

```typescript
// Test full request flow
const response = await request(app).post('/messages').send({
    jsonrpc: '2.0',
    method: 'ping',
    id: 'test-1',
});

assert(response.body.jsonrpc === '2.0');
assert(response.body.id === 'test-1');
```

## Troubleshooting

### Common Issues

1. **SSE Connection Drops**
    - Check proxy/load balancer timeout settings
    - Ensure X-Accel-Buffering header is set
    - Implement heartbeat/keepalive

2. **Session Not Found**
    - Sessions are in-memory only
    - Check Mcp-Session-Id header
    - Verify session creation logic

3. **Method Not Found**
    - Verify method name spelling
    - Check handler registration
    - Review routeRequest switch statement

## Best Practices

1. **Always validate JSON-RPC structure** before processing
2. **Use appropriate error codes** for different failure scenarios
3. **Log requests with context** for debugging
4. **Clean up resources** on disconnect
5. **Consider rate limiting** at transport level
6. **Implement request timeouts** for long operations

## Next Steps

- [Server Root]({{ site.baseurl }}/developers/src/) - Express server setup
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Tool handler implementation
- [Resources Module]({{ site.baseurl }}/developers/src/resources/) - Resource handler implementation
- [MCP Types]({{ site.baseurl }}/developers/src/types/) - Protocol type definitions
