---
layout: documentation
title: HTTP Transport
permalink: /developers/src/transport/http/
category: developers
---

# HTTP Transport (src/transport/http.ts)

The HTTP transport module implements the HTTP server transport layer for the MCP protocol. It handles JSON-RPC request
routing, session management, SSE integration, and protocol compliance.

## Overview

The HttpServerTransport class:

- Routes JSON-RPC requests to appropriate MCP handlers
- Manages client sessions for stateful operations
- Integrates SSE for streaming responses
- Handles protocol initialization and capabilities
- Provides error handling with Sentry integration

## Core Implementation

### HttpServerTransport Class

```typescript
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Response } from 'express';
import type { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';

export class HttpServerTransport {
    private server: Server;
    private logger: Logger;
    private resourceHandler: ResourceHandler;
    private toolHandler: ToolHandler;
    private promptHandler: PromptHandler;
    private config = getConfig();
    private sseTransport: SSETransport;
    private sessions: Map<string, { clientId: string; createdAt: Date }> = new Map();

    constructor(options: TransportHttpOptions) {
        this.server = options.server;
        this.logger = options.logger;
        this.resourceHandler = new ResourceHandler();
        this.toolHandler = new ToolHandler();
        this.promptHandler = new PromptHandler();
        this.sseTransport = new SSETransport(this.logger);
    }
```

## Request Handling

### Main Request Handler

```typescript
async handleRequest(
    req: TransportStreamableRequest,
    res: Response<TransportJsonRpcResponse>,
): Promise<void> {
    const startTime = Date.now();
    const { method, params, id = null } = req.body as TransportJsonRpcRequest;

    this.logger.debug('Handling MCP request', {
        method,
        id,
        params: JSON.stringify(params),
    });

    try {
        // Validate JSON-RPC request
        if (!method) {
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32600,
                    message: 'Invalid Request: missing or invalid method',
                },
                id,
            });
            return;
        }

        // Route the request based on method
        const result = await this.routeRequest(method, params);

        // Check if we should stream the response
        const shouldStream = this.shouldStreamResponse(method, result);
        const acceptsSSE = this.acceptsSSE(req);

        if (shouldStream && acceptsSSE) {
            // Handle streaming response
            await this.handleStreamingResponse(req, res, result, id);
        } else {
            // Standard JSON response
            res.json({
                jsonrpc: '2.0',
                result,
                id,
            });
        }
    } catch (error) {
        // Error handling with Sentry integration
        this.handleRequestError(error, req, res);
    }
}
```

## Request Routing

### Method Router

```typescript
private async routeRequest(method: string, params: unknown): Promise<unknown> {
    switch (method) {
        // Resource methods
        case 'resources/list':
            return this.handleResourcesList(params);
        case 'resources/read':
            return this.handleResourcesRead(params);

        // Tool methods
        case 'tools/list':
            return this.handleToolsList(params);
        case 'tools/call':
            return this.handleToolsCall(params);

        // Prompt methods
        case 'prompts/list':
            return this.handlePromptsList(params);
        case 'prompts/get':
            return this.handlePromptsGet(params);

        // Server info
        case 'initialize':
            return this.handleInitialize(params);
        case 'ping':
            return this.handlePing();

        // Notifications
        case 'notifications/initialized':
            return this.handleNotificationsInitialized();

        // Resource templates
        case 'resources/templates/list':
            return this.handleResourceTemplatesList();

        // Completion methods (for MCP Inspector compatibility)
        case 'completion/complete':
            return this.handleCompletionComplete(params);

        default:
            throw new Error(`Method not found: ${method}`);
    }
}
```

### Supported Methods

| Method                     | Handler         | Description              |
|----------------------------|-----------------|--------------------------|
| `resources/list`           | ResourceHandler | List available resources |
| `resources/read`           | ResourceHandler | Read resource by URI     |
| `tools/list`               | ToolHandler     | List available tools     |
| `tools/call`               | ToolHandler     | Execute a tool           |
| `prompts/list`             | PromptHandler   | List available prompts   |
| `prompts/get`              | PromptHandler   | Get prompt content       |
| `initialize`               | Internal        | Protocol initialization  |
| `ping`                     | Internal        | Health check             |
| `resources/templates/list` | Internal        | List resource templates  |

## Session Management

### Session Creation

```typescript
private getOrCreateSession(req: TransportStreamableRequest): string {
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

### Session Headers

- **Request**: `Mcp-Session-Id` - Existing session ID
- **Response**: `Mcp-Session-Id` - Created or existing session ID

## SSE Integration

### SSE Connection Handler

```typescript
handleSSEConnection(req: TransportStreamableRequest, res: Response): void {
    const sessionId = this.getOrCreateSession(req);
    const session = this.sessions.get(sessionId);

    if (!session) {
        res.status(500).json({ error: 'Failed to create session' });
        return;
    }

    // Set session header
    res.setHeader('Mcp-Session-Id', sessionId);

    // Initialize SSE connection
    this.sseTransport.initializeSSE(res, session.clientId);

    this.logger.info('SSE connection established', {
        sessionId,
        clientId: session.clientId,
        lastEventId: req.headers['last-event-id'],
    });

    // Send initial endpoint event for backwards compatibility
    this.sseTransport.sendEvent(session.clientId, {
        event: 'endpoint',
        data: JSON.stringify({ endpoint: '/messages' }),
    });
}
```

### SSE Detection

```typescript
private acceptsSSE(req: TransportStreamableRequest): boolean {
    const accept = req.headers.accept || '';
    return accept.includes('text/event-stream');
}
```

## Protocol Handlers

### Initialize Handler

```typescript
private handleInitialize(_params: unknown): unknown {
    return {
        protocolVersion: this.config.mcp.protocolVersion,
        capabilities: {
            resources: {
                read: true,
                list: true,
                subscribe: false,
            },
            tools: {
                list: true,
                call: true,
            },
            prompts: {
                list: true,
                get: true,
            },
            logging: {},
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
private handleResourceTemplatesList(): unknown {
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
                name: 'Threat Reports',
                description: 'Retrieve detailed threat report by ID',
                mimeType: 'application/json',
            },
        ],
    };
}
```

## Error Handling

### Request Error Handler

```typescript
private handleRequestError(
    error: unknown,
    req: TransportStreamableRequest,
    res: Response
): void {
    const { method, id = null } = req.body as TransportJsonRpcRequest;

    this.logger.error('Error handling request', {
        method,
        error: error instanceof Error ? error.message : String(error),
    });

    // Capture exception in Sentry
    if (error instanceof Error) {
        captureException(error, {
            method,
            requestId: id,
            params,
        });
    }

    // Send error response
    res.status(500).json({
        jsonrpc: '2.0',
        error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : undefined,
        },
        id,
    });
}
```

### JSON-RPC Error Codes

| Code   | Meaning          | Description                |
|--------|------------------|----------------------------|
| -32600 | Invalid Request  | Invalid JSON-RPC structure |
| -32601 | Method not found | Unknown method name        |
| -32602 | Invalid params   | Invalid method parameters  |
| -32603 | Internal error   | Server error               |

## Streaming Support

### Stream Detection

```typescript
private shouldStreamResponse(method: string, _result: unknown): boolean {
    // Methods that might benefit from streaming
    const streamableMethods = [
        'tools/call',      // Tool execution might be long-running
        'resources/read',  // Large resources might benefit from streaming
    ];

    // Check if method supports streaming
    if (!streamableMethods.includes(method)) {
        return false;
    }

    // Future: Check result size or type to determine if streaming would be beneficial
    return false;
}
```

### Streaming Response Handler

```typescript
private async handleStreamingResponse(
    req: TransportStreamableRequest,
    res: Response,
    result: unknown,
    id: string | number | null
): Promise<void> {
    const sessionId = this.getOrCreateSession(req);
    const session = this.sessions.get(sessionId);

    if (!session) {
        throw new Error('Failed to create session for streaming');
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Mcp-Session-Id', sessionId);

    // Initialize SSE if not already connected
    if (!this.sseTransport.isConnected(session.clientId)) {
        this.sseTransport.initializeSSE(res, session.clientId);
    }

    // Send the response via SSE
    this.sseTransport.sendJsonRpcResponse(session.clientId, {
        jsonrpc: '2.0',
        result,
        id,
    });

    // End the stream after sending the response
    setTimeout(() => {
        this.sseTransport.disconnect(session.clientId);
    }, 100);
}
```

## Integration Points

### Handler Integration

```typescript
// Resource handlers
private handleResourcesList(params: unknown): unknown {
    return this.resourceHandler.listResources(params as McpResourcesListParams);
}

private async handleResourcesRead(params: unknown): Promise<unknown> {
    return this.resourceHandler.readResource(params as McpResourcesReadParams);
}

// Tool handlers
private handleToolsList(params: unknown): unknown {
    return this.toolHandler.listTools(params as McpToolsListParams);
}

private async handleToolsCall(params: unknown): Promise<unknown> {
    return this.toolHandler.callTool(params as McpToolsCallParams);
}

// Prompt handlers
private handlePromptsList(params: unknown): unknown {
    return this.promptHandler.listPrompts(params as McpPromptsListParams);
}

private handlePromptsGet(params: unknown): unknown {
    return this.promptHandler.getPrompt(params as McpPromptsGetParams);
}
```

## Best Practices

### 1. Request Validation

```typescript
// Always validate required fields
if (!method) {
    res.status(400).json({
        jsonrpc: '2.0',
        error: {
            code: -32600,
            message: 'Invalid Request: missing or invalid method',
        },
        id,
    });
    return;
}
```

### 2. Logging Context

```typescript
this.logger.debug('Handling MCP request', {
    method,
    id,
    params: JSON.stringify(params),
    duration: Date.now() - startTime,
    streaming: shouldStream && acceptsSSE,
});
```

### 3. Error Recovery

```typescript
// Always return proper error responses
try {
    const result = await this.routeRequest(method, params);
    // ... success handling
} catch (error) {
    // Structured error response
    this.handleRequestError(error, req, res);
}
```

### 4. Session Cleanup

```typescript
// Consider implementing session cleanup
private cleanupSessions(): void {
    const now = Date.now();
    const sessionTimeout = 3600000; // 1 hour
    
    for (const [sessionId, session] of this.sessions) {
        if (now - session.createdAt.getTime() > sessionTimeout) {
            this.sessions.delete(sessionId);
            this.sseTransport.disconnect(session.clientId);
        }
    }
}
```

## Testing

### Unit Tests

```typescript
describe('HttpServerTransport', () => {
    let transport: HttpServerTransport;
    let mockLogger: jest.Mocked<Logger>;
    let mockServer: jest.Mocked<Server>;

    beforeEach(() => {
        mockLogger = createMockLogger();
        mockServer = createMockServer();
        transport = new HttpServerTransport({
            server: mockServer,
            logger: mockLogger,
        });
    });

    describe('handleRequest', () => {
        it('should route valid requests', async () => {
            const req = createMockRequest({
                method: 'tools/list',
                id: '1',
            });
            const res = createMockResponse();

            await transport.handleRequest(req, res);

            expect(res.json).toHaveBeenCalledWith({
                jsonrpc: '2.0',
                result: expect.objectContaining({ tools: expect.any(Array) }),
                id: '1',
            });
        });

        it('should handle invalid methods', async () => {
            const req = createMockRequest({
                method: 'invalid/method',
                id: '2',
            });
            const res = createMockResponse();

            await transport.handleRequest(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: -32603,
                        message: 'Internal error',
                    }),
                })
            );
        });
    });
});
```

## Performance Considerations

### Request Optimization

- Route methods efficiently with switch statement
- Avoid unnecessary async operations for sync methods
- Cache initialization response

### Session Management

- Use Map for O(1) session lookups
- Implement session timeout and cleanup
- Limit session storage size

### SSE Efficiency

- Only initialize SSE when needed
- Clean up connections promptly
- Batch events when possible

## Security Considerations

### Input Validation

- Validate JSON-RPC structure
- Sanitize method names
- Validate parameter types

### Session Security

- Use cryptographically secure UUIDs
- Implement session expiration
- Validate session headers

### Error Disclosure

- Don't expose internal errors to clients
- Log detailed errors internally
- Return generic error messages

## Related Documentation

- [Transport Overview]({{ site.baseurl }}/developers/src/transport/overview/) - Module overview
- [SSE Transport]({{ site.baseurl }}/developers/src/transport/sse/) - SSE implementation
- [MCP Protocol]({{ site.baseurl }}/developers/protocol/) - Protocol specification
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Type definitions