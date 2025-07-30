---
layout: documentation
title: Transport Overview
permalink: /developers/src/transport/overview/
category: developers
---

The transport module (`src/transport/`) implements the communication layer between MCP clients and the server. It
handles HTTP requests, Server-Sent Events (SSE) for streaming, and manages the JSON-RPC 2.0 protocol used by MCP.

## Module Structure

```text
src/transport/
├── http.ts    # HTTP server transport implementation
└── sse.ts     # Server-Sent Events streaming support
```

## Architecture

```text
┌─────────────────────────────────────────┐
│           MCP Clients                   │
│    (Claude, IDEs, Custom Tools)         │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│     HTTP      │   │      SSE      │
│   Requests    │   │   Streaming   │
└───────┬───────┘   └───────┬───────┘
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        HttpServerTransport              │
│  • Request routing                      │
│  • Session management                   │
│  • Protocol handling                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          MCP Server Core                │
│  • Method dispatching                   │
│  • Response generation                  │
└─────────────────────────────────────────┘
```

## Transport Components

### HTTP Transport (`http.ts`)

The HTTP transport handles:

- JSON-RPC 2.0 request/response cycles
- Session management for stateful operations
- Request routing to appropriate handlers
- Error handling and response formatting

**Key Features:**

- Stateless HTTP endpoints
- Session tracking via headers
- Request validation
- Response streaming support

### SSE Transport (`sse.ts`)

Server-Sent Events provide:

- Real-time server-to-client communication
- Long-running operation updates
- Progress notifications
- Streaming responses

**Key Features:**

- Keep-alive connections
- Event-based messaging
- Automatic reconnection support
- Multiple client handling

## Protocol Flow

### Standard Request/Response

```text
Client                    Server
  │                         │
  ├──── HTTP POST ─────────>│
  │   JSON-RPC Request      │
  │                         │
  │<──── HTTP Response ─────┤
  │   JSON-RPC Response     │
  │                         │
```

### Streaming with SSE

```text
Client                    Server
  │                         │
  ├──── HTTP POST ─────────>│
  │   Accept: text/event-stream
  │                         │
  │<──── SSE Stream ────────┤
  │   event: data           │
  │   data: {...}           │
  │                         │
  │   event: data           │
  │   data: {...}           │
  │                         │
  │   event: done           │
  │                         │
```

## Request Handling

### Request Structure

```typescript
interface TransportRequest {
    jsonrpc: "2.0";
    method: string;
    params?: any;
    id?: string | number;
}
```

### Response Structure

```typescript
interface TransportResponse {
    jsonrpc: "2.0";
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id?: string | number;
}
```

## Session Management

The transport layer maintains session state for:

- Multi-step operations
- Client identification
- Request correlation
- Progress tracking

### Session Flow

```typescript
// 1. Client initiates session
POST / 
X-Session-ID: unique-session-id

// 2. Server maintains session state
sessions.set(sessionId, {
    client: clientInfo,
    state: {},
    created: Date.now()
});

// 3. Subsequent requests use same session
POST /
X-Session-ID: unique-session-id
```

## Error Handling

### JSON-RPC Error Codes

| Code   | Meaning          | Description        |
|--------|------------------|--------------------|
| -32700 | Parse error      | Invalid JSON       |
| -32600 | Invalid request  | Invalid JSON-RPC   |
| -32601 | Method not found | Unknown method     |
| -32602 | Invalid params   | Invalid parameters |
| -32603 | Internal error   | Server error       |

### Error Response Format

```json
{
    "jsonrpc": "2.0",
    "error": {
        "code": -32603,
        "message": "Internal server error",
        "data": {
            "details": "Additional error information"
        }
    },
    "id": "request-id"
}
```

## Streaming Support

### SSE Message Format

```text
event: message
data: {"type": "progress", "value": 50}

event: result
data: {"type": "complete", "result": {...}}

event: error
data: {"type": "error", "error": "Failed"}
```

### Streaming Implementation

```typescript
// Initialize SSE
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// Send events
function sendEvent(event: string, data: any) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Keep connection alive
const keepAlive = setInterval(() => {
    res.write(':keep-alive\n\n');
}, 30000);
```

## Security Features

### Request Validation

- JSON schema validation
- Method whitelist
- Parameter sanitization
- Size limits

### Authentication

```typescript
// Optional authentication via headers
const token = req.headers['authorization'];
if (token && !validateToken(token)) {
    throw new Error('Unauthorized');
}
```

### CORS Support

```typescript
// CORS headers for browser clients
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Session-ID'],
}));
```

## Performance Optimization

### Connection Pooling

- Reuse HTTP connections
- Efficient session management
- Resource cleanup

### Request Batching

```json
// Batch multiple operations
{
    "jsonrpc": "2.0",
    "method": "batch",
    "params": {
        "requests": [
            { "method": "tools/list" },
            { "method": "resources/list" }
        ]
    }
}
```

### Compression

```typescript
// Enable compression for responses
app.use(compression({
    threshold: 1024, // Only compress responses > 1KB
}));
```

## Client Integration

### HTTP Client Example

```typescript
const response = await fetch('http://server/mcp', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
    },
    body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'scan', arguments: {} },
        id: 'req-1'
    }),
});

const result = await response.json();
```

### SSE Client Example

```typescript
const eventSource = new EventSource('/mcp?session=' + sessionId);

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

eventSource.onerror = (error) => {
    console.error('SSE error:', error);
};
```

## Monitoring and Debugging

### Request Logging

```typescript
// Log all requests
transport.on('request', (req) => {
    logger.debug('Incoming request', {
        method: req.method,
        params: req.params,
        session: req.sessionId,
    });
});
```

### Performance Metrics

```typescript
// Track response times
const start = Date.now();
const response = await handleRequest(request);
const duration = Date.now() - start;

metrics.histogram('transport.request.duration', duration, {
    method: request.method,
});
```

### Debug Mode

```typescript
// Enable detailed logging
if (process.env.DEBUG_TRANSPORT) {
    transport.setDebugMode(true);
}
```

## Error Recovery

### Automatic Retry

```typescript
// Client-side retry logic
async function requestWithRetry(request, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await sendRequest(request);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(Math.pow(2, i) * 1000);
        }
    }
}
```

### Connection Recovery

```typescript
// SSE auto-reconnect
eventSource.onerror = () => {
    setTimeout(() => {
        eventSource = new EventSource(url);
        setupEventHandlers(eventSource);
    }, 5000);
};
```

## Testing

### Unit Testing

```typescript
describe('HttpServerTransport', () => {
    it('should handle valid requests', async () => {
        const transport = new HttpServerTransport({ server });
        const response = await transport.handleRequest({
            jsonrpc: '2.0',
            method: 'test',
            id: '1'
        });
        
        expect(response.jsonrpc).toBe('2.0');
        expect(response.id).toBe('1');
    });
});
```

### Integration Testing

```typescript
it('should handle SSE streaming', (done) => {
    const client = new EventSource('/test');
    const messages = [];
    
    client.onmessage = (event) => {
        messages.push(JSON.parse(event.data));
        if (messages.length === 3) {
            expect(messages).toHaveLength(3);
            client.close();
            done();
        }
    };
});
```

## Best Practices

### 1. Use Appropriate Transport

```typescript
// Short operations - HTTP
const result = await httpRequest('tools/call', params);

// Long operations - SSE
const stream = new EventSource('/stream');
stream.onmessage = handleProgress;
```

### 2. Handle Disconnections

```typescript
// Graceful SSE cleanup
req.on('close', () => {
    clearInterval(keepAlive);
    sessions.delete(sessionId);
});
```

### 3. Validate Input

```typescript
// Always validate requests
if (!isValidJsonRpc(request)) {
    throw new JsonRpcError(-32600, 'Invalid request');
}
```

### 4. Implement Timeouts

```typescript
// Prevent hanging requests
const timeout = setTimeout(() => {
    res.status(408).json({ error: 'Request timeout' });
}, 30000);
```

## Related Documentation

- [HTTP Transport]({{ site.baseurl }}/developers/src/transport/http/) - HTTP implementation
- [SSE Transport]({{ site.baseurl }}/developers/src/transport/sse/) - SSE implementation
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Type definitions
- [MCP Protocol]({{ site.baseurl }}/developers/protocol/) - Protocol specification
- [Client Libraries]({{ site.baseurl }}/developers/clients/) - Client integration
