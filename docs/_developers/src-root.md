---
layout: documentation
title: Root Module (src/)
permalink: /developers/src-root/
category: developers
---

# Root Module Documentation

The root module contains the main entry point for the MCP server application. This documentation covers the `src/index.ts` file which initializes and starts the Express HTTP server.

## src/index.ts

The main entry point that creates and configures the Express server with MCP capabilities.

### File Location

`src/index.ts`

### Purpose

This file serves as the application's entry point, responsible for:

1. Initializing the Express HTTP server
2. Setting up middleware for CORS, JSON parsing, and logging
3. Creating health check endpoints for Kubernetes deployments
4. Configuring the MCP server with transport handlers
5. Handling both standard HTTP and SSE connections
6. Implementing comprehensive error handling

### Overview

This file sets up:

- Express HTTP server with middleware
- Health and readiness endpoints
- MCP server instance with transport handler
- JSON-RPC 2.0 message handling
- Server-Sent Events (SSE) support
- Error handling and logging

### Dependencies

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Request, Response } from 'express';
import express from 'express';
import type {
    JsonRpcRequest,
    JsonRpcResponse,
    StreamableRequest,
} from './transport/http.js';
import { HttpServerTransport } from './transport/http.js';
import cors from 'cors';
import { getConfig } from './config';
import { getLogger } from './utils/logger.js';
```

**External Dependencies:**

- `@modelcontextprotocol/sdk` - Official MCP SDK for server implementation
- `express` - Web framework for HTTP server
- `cors` - CORS middleware for cross-origin support

**Internal Dependencies:**

- `./transport/http.js` - HTTP transport implementation
    - `HttpServerTransport` - Main transport handler class
    - `JsonRpcRequest` - Request type definition
    - `JsonRpcResponse` - Response type definition
    - `StreamableRequest` - Extended request type for SSE
- `./config` - Configuration management
- `./utils/logger.js` - Winston logger wrapper

### Main Function: createServer()

The `createServer` function orchestrates the entire server setup:

```typescript
const createServer = (): void => {
    const config = getConfig();
    const logger = getLogger();
    const app = express();

    // Server initialization...
};
```

**Note**: The codebase uses 4-space indentation throughout.

### Middleware Configuration

The server uses several Express middleware components in a specific order:

1. **CORS Middleware**

    ```typescript
    app.use(cors());
    ```

    - Enables Cross-Origin Resource Sharing
    - Allows MCP clients from different origins
    - Essential for browser-based MCP clients

2. **JSON Body Parser**

    ```typescript
    app.use(express.json({ limit: '10mb' }));
    ```

    - Parses JSON request bodies
    - 10MB limit accommodates large scan requests
    - Required for JSON-RPC 2.0 message parsing

3. **Request Logging Middleware**

    ```typescript
    app.use((req, _res, next) => {
        logger.debug('Incoming request', {
            method: req.method,
            path: req.path,
            ip: req.ip,
        });
        next();
    });
    ```

    - Logs all incoming requests
    - Debug level for development
    - Includes method, path, and client IP

### Endpoints

#### Health Check Endpoint

```typescript
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: config.mcp.serverVersion,
    });
});
```

**Purpose**: Kubernetes liveness probe  
**Method**: GET  
**Path**: `/health`  
**Response Example**:

```json
{
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "1.0.0"
}
```

#### Readiness Endpoint

```typescript
app.get('/ready', (_req: Request, res: Response) => {
    // TODO: Add actual readiness checks (AIRS connectivity, etc.)
    res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        version: config.mcp.serverVersion,
    });
});
```

**Purpose**: Kubernetes readiness probe  
**Method**: GET  
**Path**: `/ready`  
**Response**: Server readiness status  
**TODO**: Add AIRS connectivity checks  
**Note**: Currently returns ready immediately - should verify AIRS API connectivity

#### Main MCP Endpoint (POST /)

```typescript
app.post(
    '/',
    async (
        req: Request<unknown, unknown, JsonRpcRequest>,
        res: Response<JsonRpcResponse>,
    ) => {
        await transport.handleRequest(req as StreamableRequest, res);
    },
);
```

**Purpose**: Handles JSON-RPC 2.0 MCP messages  
**Method**: POST  
**Path**: `/`  
**Content-Type**: `application/json`

**Request Type**: `JsonRpcRequest`

```typescript
interface JsonRpcRequest {
    jsonrpc: '2.0';
    method: string;
    params?: unknown;
    id: string | number | null;
}
```

**Example Request**:

```json
{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
        "name": "airs_scan_content",
        "arguments": {
            "prompt": "Check this content"
        }
    },
    "id": 1
}
```

**Delegation**: All requests are forwarded to `HttpServerTransport.handleRequest()`

#### SSE/Info Endpoint (GET /)

```typescript
app.get('/', (req: Request, res: Response) => {
    const acceptHeader = req.headers.accept || '';

    if (acceptHeader.includes('text/event-stream')) {
        // Handle SSE connection
        transport.handleSSEConnection(req as StreamableRequest, res);
    } else {
        // Return server information for non-SSE requests
        res.json({
            name: config.mcp.serverName,
            version: config.mcp.serverVersion,
            protocolVersion: config.mcp.protocolVersion,
            endpoints: {
                messages: '/',
                health: '/health',
                ready: '/ready',
            },
        });
    }
});
```

**Purpose**: Dual-purpose endpoint based on Accept header  
**Method**: GET  
**Path**: `/`

**Behavior 1 - SSE Mode** (Accept: text/event-stream):

- Establishes Server-Sent Events connection
- Used for streaming responses
- Delegates to `transport.handleSSEConnection()`

**Behavior 2 - Info Mode** (Standard GET):

- Returns server metadata
- Example response:

```json
{
    "name": "prisma-airs-mcp",
    "version": "1.0.0",
    "protocolVersion": "0.1.0",
    "endpoints": {
        "messages": "/",
        "health": "/health",
        "ready": "/ready"
    }
}
```

### MCP Server Configuration

```typescript
const mcpServer = new Server(
    {
        name: config.mcp.serverName,
        version: config.mcp.serverVersion,
    },
    {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {},
        },
    },
);
```

**Server Metadata**:

- `name`: Server identifier from config (e.g., "prisma-airs-mcp")
- `version`: Server version from config (e.g., "1.0.0")

**Capabilities Declaration**:

- `resources: {}` - Enables resource listing and reading
    - Static: cache stats, rate limit status
    - Dynamic: scan results, threat reports
- `tools: {}` - Enables tool discovery and execution
    - 5 security scanning tools
- `prompts: {}` - Enables prompt templates
    - 4 security workflow prompts

**Note**: The actual handlers are registered by the transport layer

### Transport Handler

```typescript
const transport = new HttpServerTransport({
    server: mcpServer,
    logger,
});
```

The transport handler:

- Routes JSON-RPC requests to MCP handlers
- Manages SSE connections
- Handles session management

### Error Handling

#### 404 Handler

```typescript
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});
```

#### Global Error Handler

```typescript
app.use(
    (err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
        logger.error('Unhandled error', {
            error: err.message,
            stack: err.stack,
        });
        res.status(500).json({ error: 'Internal server error' });
    },
);
```

### Server Startup

```typescript
app.listen(config.server.port, () => {
    logger.info(`MCP server listening on port ${config.server.port}`);
    logger.info(`Health check: http://localhost:${config.server.port}/health`);
    logger.info(`Ready check: http://localhost:${config.server.port}/ready`);
});
```

### Startup Error Handling

```typescript
try {
    createServer();
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}
```

Ensures clean exit on startup failures.

## Type Definitions

### StreamableRequest

Extended Express Request type supporting SSE headers:

```typescript
interface StreamableRequest extends Request {
    headers: {
        accept?: string;
        'last-event-id'?: string;
        'mcp-session-id'?: string;
    } & Request['headers'];
}
```

### JsonRpcResponse

Standard JSON-RPC 2.0 response format:

```typescript
interface JsonRpcResponse {
    jsonrpc: '2.0';
    result?: unknown;
    error?: JsonRpcError;
    id: string | number | null;
}
```

## Configuration Dependencies

The server relies on configuration from:

- `config.server.port` - HTTP port (default: 3000)
- `config.server.environment` - Runtime environment
- `config.mcp.serverName` - MCP server name
- `config.mcp.serverVersion` - Server version
- `config.mcp.protocolVersion` - MCP protocol version

## Logging

Uses Winston logger with structured logging:

- Server startup information
- Request debugging
- Error tracking

## Best Practices

1. **Health Checks**: Always available for monitoring
2. **Request Limits**: 10MB JSON payload limit
3. **Error Isolation**: Errors don't crash the server
4. **Clean Startup**: Exits cleanly on initialization failure
5. **Type Safety**: Full TypeScript typing throughout

## Practical Examples

### Testing the Server

1. **Check Server Health**:

    ```bash
    curl http://localhost:3000/health
    ```

2. **Check Server Info**:

    ```bash
    curl http://localhost:3000/
    ```

3. **Send MCP Request**:

    ```bash
    curl -X POST http://localhost:3000/ \
      -H "Content-Type: application/json" \
      -d '{
        "jsonrpc": "2.0",
        "method": "tools/list",
        "id": 1
      }'
    ```

4. **Connect via SSE**:
    ```bash
    curl -H "Accept: text/event-stream" \
         http://localhost:3000/
    ```

### Common Request Flows

1. **Tool Execution Flow**:
    - Client sends POST to `/` with `tools/call` method
    - Transport handler routes to ToolHandler
    - Tool executes AIRS API call
    - Response returned as JSON-RPC result

2. **SSE Streaming Flow**:
    - Client connects with `Accept: text/event-stream`
    - Server establishes SSE connection
    - Long-running operations can stream updates
    - Connection remains open for multiple messages

## Integration Points

- **Transport Layer**: `HttpServerTransport` handles all MCP routing
- **Configuration**: Centralized via `getConfig()`
- **Logging**: Structured logging via `getLogger()`
- **MCP SDK**: Official `@modelcontextprotocol/sdk`

## Environment Variables

Key environment variables used:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging verbosity
- See [Configuration]({{ site.baseurl }}/developers/src-config/) for full list

## Next Steps

- [Transport Layer]({{ site.baseurl }}/developers/src-transport/) - HTTP and SSE transport implementation
- [Configuration]({{ site.baseurl }}/developers/src-config/) - Server configuration management
- [AIRS Module]({{ site.baseurl }}/developers/src-airs/) - AIRS API client integration
