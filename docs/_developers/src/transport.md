---
layout: documentation
title: Transport Module
permalink: /developers/src/transport/
category: developers
---

# HTTP Transport Layer (src/transport/)

The transport module implements the HTTP and Server-Sent Events (SSE) transport layer for the MCP server. It handles JSON-RPC 2.0 protocol communication, request routing, session management, and optional streaming responses.

## Module Structure

```
src/transport/
├── http.ts    # Main HTTP transport with JSON-RPC routing
└── sse.ts     # Server-Sent Events for streaming responses
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│        HTTP Client Request              │
│     (JSON-RPC 2.0 over HTTP)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      HttpServerTransport                │
│  • Request validation                   │
│  • Session management                   │
│  • Method routing                       │
│  • Response formatting                  │
└────┬────────────┴──────────┬────────────┘
     │ Standard Response     │ Streaming
     │                       │
     ▼                       ▼
┌──────────────┐       ┌──────────────────┐
│ JSON Response│       │   SSETransport   │
│  (immediate) │       │ (event stream)   │
└──────────────┘       └──────────────────┘
```

## Core Components

### 1. HttpServerTransport (http.ts)

The main transport handler that processes incoming requests and routes them to appropriate MCP handlers.

#### Class Structure

```typescript
export class HttpServerTransport {
    private server: Server;              // MCP SDK server instance
    private logger: Logger;              // Winston logger
    private resourceHandler: ResourceHandler;
    private toolHandler: ToolHandler;
    private promptHandler: PromptHandler;
    private config = getConfig();
    private sseTransport: SSETransport;
    private sessions: Map<string, { clientId: string; createdAt: Date }>;

    constructor(options: TransportHttpOptions);

    async handleRequest(req: TransportStreamableRequest, res: Response): Promise<void>;

    handleSSEConnection(req: TransportStreamableRequest, res: Response): void;
}
```

#### Key Responsibilities

1. **Request Validation**: Ensures valid JSON-RPC 2.0 format
2. **Method Routing**: Routes requests to appropriate handlers
3. **Session Management**: Tracks client sessions for streaming
4. **Response Mode Selection**: Chooses between standard JSON or SSE
5. **Error Handling**: Formats errors according to JSON-RPC spec

### 2. SSETransport (sse.ts)

Manages Server-Sent Events connections for streaming responses.

#### Class Structure

```typescript
export class SSETransport {
    private clients: Map<string, Response>;
    private messageId: number;

    initializeSSE(res: Response, clientId: string): void;

    sendEvent(clientId: string, message: TransportSSEMessage): boolean;

    sendJsonRpcResponse(clientId: string, response: TransportJsonRpcResponse): boolean;

    sendNotification(clientId: string, method: string, params?: unknown): boolean;

    broadcast(message: TransportSSEMessage): void;

    isConnected(clientId: string): boolean;

    disconnect(clientId: string): void;
}
```

## Request Flow

### 1. Standard JSON-RPC Request

```
Client → POST / → handleRequest() → routeRequest() → Handler → JSON Response
```

### 2. Streaming SSE Request

```
Client → GET / (Accept: text/event-stream) → handleSSEConnection() → SSE Stream
       → POST / → handleRequest() → routeRequest() → Handler → SSE Events
```

## Supported Methods

### Resource Methods

| Method                     | Handler                         | Purpose                  |
| -------------------------- | ------------------------------- | ------------------------ |
| `resources/list`           | `handleResourcesList()`         | List available resources |
| `resources/read`           | `handleResourcesRead()`         | Read resource content    |
| `resources/templates/list` | `handleResourceTemplatesList()` | List URI templates       |

### Tool Methods

| Method       | Handler             | Purpose              |
| ------------ | ------------------- | -------------------- |
| `tools/list` | `handleToolsList()` | List available tools |
| `tools/call` | `handleToolsCall()` | Execute a tool       |

### Prompt Methods

| Method         | Handler               | Purpose                   |
| -------------- | --------------------- | ------------------------- |
| `prompts/list` | `handlePromptsList()` | List available prompts    |
| `prompts/get`  | `handlePromptsGet()`  | Get prompt with arguments |

### System Methods

| Method                      | Handler                            | Purpose                     |
| --------------------------- | ---------------------------------- | --------------------------- |
| `initialize`                | `handleInitialize()`               | Initialize MCP session      |
| `ping`                      | `handlePing()`                     | Health check                |
| `notifications/initialized` | `handleNotificationsInitialized()` | Client ready notification   |
| `completion/complete`       | `handleCompletionComplete()`       | MCP Inspector compatibility |

## Type System

All transport types are centralized in `src/types/transport.ts`:

### Request/Response Types

```typescript
interface TransportJsonRpcRequest {
    jsonrpc: '2.0';
    method: string;
    params?: unknown;
    id: string | number | null;
}

interface TransportJsonRpcResponse {
    jsonrpc: '2.0';
    result?: unknown;
    error?: TransportJsonRpcError;
    id: string | number | null;
}

interface TransportJsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}
```

### SSE Types

```typescript
interface TransportSSEMessage {
    id?: string;      // Message ID for reconnection
    event?: string;   // Event type
    data: string;     // Message data (JSON string)
    retry?: number;   // Reconnection retry interval
}

interface TransportStreamableRequest extends Request {
    headers: {
        accept?: string;
        'last-event-id'?: string;
        'mcp-session-id'?: string;
    } & Request['headers'];
}
```

## Session Management

Sessions enable stateful connections for streaming responses:

```typescript
private getOrCreateSession(req: TransportStreamableRequest): string {
    const existingSessionId = req.headers['mcp-session-id'];

    if (existingSessionId && this.sessions.has(existingSessionId)) {
        return existingSessionId;
    }

    const sessionId = uuidv4();
    const clientId = uuidv4();
    this.sessions.set(sessionId, {clientId, createdAt: new Date()});

    return sessionId;
}
```

**Session Headers**:

- `Mcp-Session-Id`: Unique session identifier
- `Last-Event-Id`: For SSE reconnection

## Response Mode Selection

The transport automatically selects the appropriate response mode:

```typescript
private shouldStreamResponse(method: string, result: unknown): boolean {
    // Currently returns false for all methods
    // Can be extended for long-running operations
    return false;
}

private
acceptsSSE(req
:
TransportStreamableRequest
):
boolean
{
    const accept = req.headers.accept || '';
    return accept.includes('text/event-stream');
}
```

## SSE Implementation

### Connection Setup

```typescript
// Set SSE headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
```

### Event Format

```
event: message
id: 123
data: {"jsonrpc":"2.0","result":{...},"id":"req-123"}

event: notification
data: {"jsonrpc":"2.0","method":"tools/list_changed"}

```

### Event Types

| Event          | Purpose              | Payload                     |
| -------------- | -------------------- | --------------------------- |
| `connect`      | Initial connection   | `{ connected: true }`       |
| `endpoint`     | Legacy compatibility | `{ endpoint: '/messages' }` |
| `message`      | JSON-RPC response    | Full JSON-RPC response      |
| `notification` | Server notification  | JSON-RPC notification       |

## Error Handling

### JSON-RPC Error Codes

| Code   | Constant         | Description            |
| ------ | ---------------- | ---------------------- |
| -32700 | Parse error      | Invalid JSON           |
| -32600 | Invalid Request  | Missing/invalid method |
| -32601 | Method not found | Unknown method         |
| -32602 | Invalid params   | Invalid parameters     |
| -32603 | Internal error   | Server error           |

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request: missing or invalid method",
    "data": "Additional error details"
  },
  "id": "request-123"
}
```

## Handler Implementations

### Initialize Handler

```typescript
private async
handleInitialize(params
:
unknown
):
Promise < unknown > {
    return {
        protocolVersion: this.config.mcp.protocolVersion,
        capabilities: {
            experimental: {},
            prompts: {
                listChanged: false,
            },
            resources: {
                subscribe: false,
                listChanged: false,
            },
            tools: {
                listChanged: false,
            },
        },
        serverInfo: {
            name: this.config.mcp.serverName,
            version: this.config.mcp.serverVersion,
        },
    };
}
```

### Resource Templates Handler

```typescript
private async handleResourceTemplatesList(): Promise<unknown> {
    return {
        resourceTemplates: [
            {
                uriTemplate: 'airs://scan-results/{scanId}',
                name: 'Scan Results',
                description: 'Retrieve results for a specific scan by ID',
                mimeType: 'application/json',
            },
            {
                uriTemplate: 'airs://threat-reports/{reportId}',
                name: 'Threat Report',
                description: 'Retrieve detailed threat report by ID',
                mimeType: 'application/json',
            },
        ],
    };
}
```

## Usage Examples

### Basic JSON-RPC Request

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# Response
{
    "jsonrpc": "2.0",
    "result": {
        "tools": [...]
    },
    "id": 1
}
```

### SSE Connection

```bash
# Establish SSE connection
curl -H "Accept: text/event-stream" http://localhost:3000/

# Server sends:
event: endpoint
data: {"endpoint":"/messages"}

event: connect
data: {"connected":true}
```

### Tool Execution

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
        "name": "airs_scan_content",
        "arguments": {
            "prompt": "Check this content"
        }
    },
    "id": "scan-123"
  }'
```

## Performance Considerations

### Connection Management

- SSE connections are cleaned up on client disconnect
- Sessions are stored in-memory (consider Redis for scale)
- Automatic disconnection after response for non-persistent operations

### Streaming Decision

Currently, all responses are sent as standard JSON. The framework supports streaming for:

- Long-running tool executions
- Large resource reads
- Real-time notifications

### Request Logging

```typescript
this.logger.debug('Handling MCP request', {
    method,
    id,
    params: JSON.stringify(params),
});

this.logger.debug('Request completed', {
    method,
    duration: Date.now() - startTime,
    streaming: shouldStream && acceptsSSE,
});
```

## Security Considerations

1. **Input Validation**: All requests are validated for JSON-RPC format
2. **Error Sanitization**: Internal errors don't expose stack traces
3. **Session Isolation**: Each client gets a unique session
4. **Header Security**: Proper CORS and security headers at Express level
5. **Authentication**: Handled by AIRS client (API key not exposed)

## Testing Strategies

### Unit Tests

```typescript
describe('HttpServerTransport', () => {
    it('should route tools/list correctly', async () => {
        const transport = new HttpServerTransport({server, logger});
        const result = await transport.routeRequest('tools/list', {});
        expect(result).toHaveProperty('tools');
    });

    it('should handle invalid methods', async () => {
        const transport = new HttpServerTransport({server, logger});
        await expect(
            transport.routeRequest('invalid/method', {})
        ).rejects.toThrow('Method not found');
    });
});
```

### Integration Tests

```typescript
describe('Transport Integration', () => {
    it('should handle full request cycle', async () => {
        const response = await request(app)
            .post('/')
            .send({
                jsonrpc: '2.0',
                method: 'ping',
                id: 'test-1'
            });

        expect(response.status).toBe(200);
        expect(response.body.jsonrpc).toBe('2.0');
        expect(response.body.id).toBe('test-1');
    });
});
```

## Troubleshooting

### Common Issues

1. **SSE Connection Drops**

    - Check proxy timeout settings
    - Ensure `X-Accel-Buffering: no` header
    - Implement heartbeat mechanism

2. **Session Not Found**

    - Sessions are in-memory only
    - Check `Mcp-Session-Id` header
    - Verify session creation

3. **Method Routing Errors**
    - Verify method name in switch statement
    - Check handler registration
    - Review error logs

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm start
```

## Future Enhancements

1. **Streaming Implementation**

    - Add progress events for long operations
    - Implement chunked responses
    - Support cancellation

2. **Session Persistence**

    - Redis-backed sessions
    - Session expiration
    - Multi-instance support

3. **Enhanced Security**
    - Rate limiting per session
    - Request size limits
    - Method-specific timeouts

## Related Documentation

- [Application Entry Point]({{ site.baseurl }}/developers/src/) - Express server setup
- [Types Module]({{ site.baseurl }}/developers/src/types/) - Transport type definitions
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Tool handler implementation
- [Resources Module]({{ site.baseurl }}/developers/src/resources/) - Resource handler implementation
