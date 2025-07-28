---
layout: documentation
title: Application Entry Point
permalink: /developers/src/
category: developers
---

# Server Bootstrap (src/index.ts)

The `src/index.ts` file serves as the main entry point for the Prisma AIRS MCP server. It bootstraps the Express HTTP
server, configures middleware, sets up MCP protocol handling, and establishes health check endpoints for production
deployments.

## Module Structure

```
src/index.ts          # Main application entry point
```

## File Overview

**Location**: `src/index.ts`  
**Purpose**: Application bootstrap and server initialization  
**Key Responsibilities**:

1. Express server configuration with middleware stack
2. MCP server instantiation with protocol capabilities
3. HTTP transport handler setup for JSON-RPC 2.0
4. Health and readiness endpoints for container orchestration
5. Dual-mode endpoint supporting both REST and SSE
6. Global error handling and graceful startup

## Architecture Flow

```
Application Start
       ↓
createServer() Function
       ↓
Configuration & Logger Init
       ↓
Express App + Middleware
       ↓
MCP Server Instance
       ↓
HTTP Transport Handler
       ↓
Route Registration
       ↓
Server Listen on Port
```

## Dependencies

### External Dependencies

| Package                     | Purpose                     | Usage                             |
|-----------------------------|-----------------------------|-----------------------------------|
| `@modelcontextprotocol/sdk` | MCP protocol implementation | Server class for MCP capabilities |
| `express`                   | Web framework               | HTTP server and routing           |
| `cors`                      | CORS middleware             | Enable cross-origin requests      |

### Internal Dependencies

| Module                | Import                                                                              | Purpose                    |
|-----------------------|-------------------------------------------------------------------------------------|----------------------------|
| `./types`             | `TransportJsonRpcRequest`, `TransportJsonRpcResponse`, `TransportStreamableRequest` | Type definitions           |
| `./transport/http.js` | `HttpServerTransport`                                                               | HTTP/SSE transport handler |
| `./config`            | `getConfig()`                                                                       | Configuration singleton    |
| `./utils/logger.js`   | `getLogger()`                                                                       | Logger instance            |

> **Note**: The codebase has migrated to centralized types in `./types` with prefixed naming

## Main Function: createServer()

The `createServer` function orchestrates the entire server initialization:

```typescript
const createServer = (): void => {
    const config = getConfig();
    const logger = getLogger();
    const app = express();

    // Log startup configuration
    logger.info('Starting MCP server', {
        environment: config.server.environment,
        port: config.server.port,
        version: config.mcp.serverVersion,
    });

    // ... middleware and route setup
};
```

**Key Steps**:

1. Retrieve configuration singleton
2. Initialize logger instance
3. Create Express application
4. Log startup information
5. Configure middleware pipeline
6. Register endpoints
7. Start HTTP listener

## Middleware Stack

The server configures middleware in this specific order:

### 1. CORS Middleware

```typescript
app.use(cors());
```

- **Purpose**: Enable cross-origin requests
- **Configuration**: Default (all origins allowed)
- **Use Case**: Browser-based MCP clients

### 2. JSON Body Parser

```typescript
app.use(express.json({limit: '10mb'}));
```

- **Purpose**: Parse JSON-RPC 2.0 payloads
- **Limit**: 10MB (supports large batch scans)
- **Content-Type**: `application/json`

### 3. Request Logger

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

- **Level**: Debug (development visibility)
- **Fields**: HTTP method, path, client IP
- **Purpose**: Request tracing and debugging

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

### Main MCP Endpoint (POST /)

```typescript
app.post(
    '/',
    async (req: Request<unknown, unknown, TransportJsonRpcRequest>,
           res: Response<TransportJsonRpcResponse>) => {
        await transport.handleRequest(req as TransportStreamableRequest, res);
    },
);
```

**Endpoint Details**:

- **Method**: POST
- **Path**: `/`
- **Purpose**: JSON-RPC 2.0 message handling
- **Request Type**: `TransportJsonRpcRequest`
- **Response Type**: `TransportJsonRpcResponse`
- **Handler**: Delegates to `HttpServerTransport`

**Example JSON-RPC Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "airs_scan_content",
    "arguments": {
      "prompt": "Check this content for security threats",
      "profile": "strict"
    }
  },
  "id": 1
}
```

**Supported Methods**:

- `initialize` - MCP session initialization
- `tools/list` - List available tools
- `tools/call` - Execute a tool
- `resources/list` - List resources
- `resources/read` - Read a resource
- `prompts/list` - List prompt templates
- `prompts/get` - Get prompt details

### MCP Smithery.ai Endpoint (/mcp)

**New in v1.0.4**: Dedicated `/mcp` endpoint for Smithery.ai compatibility.

```typescript
// POST /mcp - JSON-RPC 2.0 messages
app.post(
    '/mcp',
    async (req: Request<unknown, unknown, TransportJsonRpcRequest>,
           res: Response<TransportJsonRpcResponse>) => {
        await transport.handleRequest(req as TransportStreamableRequest, res);
    },
);

// GET /mcp - Server info or SSE streaming
app.get('/mcp', (req: Request, res: Response) => {
    const acceptHeader = req.headers.accept || '';

    if (acceptHeader.includes('text/event-stream')) {
        // Handle SSE connection
        transport.handleSSEConnection(req as TransportStreamableRequest, res);
    } else {
        // Return server information for non-SSE requests
        res.json({
            name: config.mcp.serverName,
            version: config.mcp.serverVersion,
            protocolVersion: config.mcp.protocolVersion,
            description: 'Model Context Protocol server for Prisma AIRS integration',
            capabilities: ['tools', 'resources', 'prompts'],
        });
    }
});

// DELETE /mcp - Session cleanup (Smithery.ai requirement)
app.delete('/mcp', (_req: Request, res: Response) => {
    // Handle session cleanup if needed
    res.status(204).send();
});
```

**Endpoint Details**:

- **Methods**: GET, POST, DELETE
- **Path**: `/mcp`
- **Purpose**: Smithery.ai platform compatibility
- **Behavior**: Mirrors root endpoint functionality

**Method Behaviors**:

| Method | Purpose                       | Response                |
|--------|-------------------------------|-------------------------|
| POST   | JSON-RPC 2.0 message handling | JSON-RPC response       |
| GET    | Server info or SSE streaming  | JSON info or SSE stream |
| DELETE | Session cleanup               | 204 No Content          |

**Why Duplicate Endpoints?**

- Smithery.ai requires `/mcp` path specifically
- Maintains backwards compatibility with root `/` endpoint
- Allows gradual migration for existing clients

### Dual-Mode Root Endpoint (GET /)

```typescript
app.get('/', (req: Request, res: Response) => {
    const acceptHeader = req.headers.accept || '';

    if (acceptHeader.includes('text/event-stream')) {
        // SSE mode for streaming
        transport.handleSSEConnection(req as TransportStreamableRequest, res);
    } else {
        // Info mode for discovery
        res.json({
            name: config.mcp.serverName,
            version: config.mcp.serverVersion,
            protocolVersion: config.mcp.protocolVersion,
            endpoints: {
                messages: '/',
                mcp: '/mcp',
                health: '/health',
                ready: '/ready',
            },
        });
    }
});
```

**Mode Selection**:

| Accept Header       | Response Type | Purpose            |
|---------------------|---------------|--------------------|
| `text/event-stream` | SSE stream    | Real-time updates  |
| Any other           | JSON          | Server information |

**Info Response Example**:

```json
{
  "name": "prisma-airs-mcp-server",
  "version": "1.0.0",
  "protocolVersion": "2024-11-05",
  "endpoints": {
    "messages": "/",
    "health": "/health",
    "ready": "/ready"
  }
}
```

## MCP Server Configuration

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

### Server Identity

- **Name**: Retrieved from `config.mcp.serverName`
- **Version**: Retrieved from `config.mcp.serverVersion`
- **Protocol**: MCP version `2024-11-05`

### Capability Registration

| Capability  | Description                        | Handler Module   |
|-------------|------------------------------------|------------------|
| `resources` | Static and dynamic resource access | `src/resources/` |
| `tools`     | Security scanning tools            | `src/tools/`     |
| `prompts`   | Workflow templates                 | `src/prompts/`   |

> **Note**: Empty objects `{}` indicate the capability is enabled. The transport layer connects these to actual
> handlers.

## Transport Layer Integration

```typescript
const transport = new HttpServerTransport({
    server: mcpServer,
    logger,
});
```

**HttpServerTransport Responsibilities**:

1. JSON-RPC 2.0 protocol handling
2. Request routing to MCP handlers
3. SSE connection management
4. Session state tracking
5. Error response formatting

See [Transport Documentation]({{ site.baseurl }}/developers/src/transport/) for implementation details.

## Error Handling Strategy

### 404 Not Found Handler

```typescript
app.use((_req: Request, res: Response) => {
    res.status(404).json({error: 'Not found'});
});
```

- Catches all unmatched routes
- Returns JSON error response
- HTTP status 404

### Global Error Handler

```typescript
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
    });
    res.status(500).json({error: 'Internal server error'});
});
```

- Catches all unhandled errors
- Logs full error details
- Returns generic error to client
- Prevents stack trace exposure

## Server Lifecycle

### HTTP Server Start

```typescript
app.listen(config.server.port, () => {
    logger.info(`MCP server listening on port ${config.server.port}`);
    logger.info(`Health check: http://localhost:${config.server.port}/health`);
    logger.info(`Ready check: http://localhost:${config.server.port}/ready`);
});
```

**Startup Logs**:

- Port binding confirmation
- Health endpoint URL
- Ready endpoint URL

### Startup Error Handling

```typescript
try {
    createServer();
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}
```

**Behavior**:

- Catches synchronous initialization errors
- Logs to stderr (bypasses logger)
- Exits with code 1 (failure)
- Ensures container restart in orchestration

## Type System

The application uses centralized types from `./types` with consistent prefixing:

### Core Types Used

| Type                         | Module    | Purpose                          |
|------------------------------|-----------|----------------------------------|
| `TransportJsonRpcRequest`    | `./types` | JSON-RPC 2.0 request format      |
| `TransportJsonRpcResponse`   | `./types` | JSON-RPC 2.0 response format     |
| `TransportStreamableRequest` | `./types` | Express Request with SSE headers |

### Type Definitions

**TransportJsonRpcRequest**:

```typescript
interface TransportJsonRpcRequest {
    jsonrpc: '2.0';
    method: string;
    params?: unknown;
    id: string | number | null;
}
```

**TransportStreamableRequest**:

```typescript
interface TransportStreamableRequest extends Request {
    headers: {
        accept?: string;
        'last-event-id'?: string;
        'mcp-session-id'?: string;
    } & Request['headers'];
}
```

## Configuration Usage

The server retrieves configuration via `getConfig()` singleton:

### Server Configuration

| Key         | Path                        | Default     | Usage              |
|-------------|-----------------------------|-------------|--------------------|
| Port        | `config.server.port`        | 3000        | HTTP listener port |
| Environment | `config.server.environment` | development | Runtime mode       |

### MCP Configuration

| Key         | Path                         | Default                | Usage          |
|-------------|------------------------------|------------------------|----------------|
| Server Name | `config.mcp.serverName`      | prisma-airs-mcp-server | Identity       |
| Version     | `config.mcp.serverVersion`   | 1.0.0                  | Server version |
| Protocol    | `config.mcp.protocolVersion` | 2024-11-05             | MCP version    |

## Logging Strategy

Structured logging via Winston:

- **Info Level**: Server lifecycle events
- **Debug Level**: Request details
- **Error Level**: Unhandled exceptions
- **Format**: JSON in production, colorized in development

## Best Practices

1. **Health Checks**: Always available for monitoring
2. **Request Limits**: 10MB JSON payload limit
3. **Error Isolation**: Errors don't crash the server
4. **Clean Startup**: Exits cleanly on initialization failure
5. **Type Safety**: Full TypeScript typing throughout

## Testing & Development

### Quick Tests

**1. Health Check**:

```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

**2. Server Info**:

```bash
curl http://localhost:3000/
# Returns server metadata and endpoints
```

**3. List Available Tools**:

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

**4. SSE Connection Test**:

```bash
curl -H "Accept: text/event-stream" \
     -H "Cache-Control: no-cache" \
     http://localhost:3000/
```

### Request Flow Examples

#### 1. Security Scan Flow

```
Client → POST / → HttpServerTransport → ToolHandler → AIRS Client → Response
```

1. Client sends `tools/call` with `airs_scan_content`
2. Transport validates JSON-RPC format
3. Routes to tool handler
4. AIRS API call executed
5. Results returned in JSON-RPC response

#### 2. SSE Streaming Flow

```
Client → GET / (SSE) → HttpServerTransport → SSE Manager → Event Stream
```

1. Client connects with `Accept: text/event-stream`
2. Transport establishes SSE connection
3. Server can push multiple events
4. Connection remains open
5. Client reconnects on disconnect

## Key Integration Points

| Component       | Integration             | Purpose                 |
|-----------------|-------------------------|-------------------------|
| Transport Layer | `HttpServerTransport`   | Protocol handling       |
| Configuration   | `getConfig()` singleton | Settings management     |
| Logging         | `getLogger()` singleton | Structured logging      |
| MCP SDK         | `Server` class          | Protocol implementation |
| Type System     | `./types` module        | Type safety             |

## Environment Variables

### Direct Usage

- `PORT` - Server port (overrides config)
- `NODE_ENV` - Runtime environment
- `LOG_LEVEL` - Logging verbosity

### Indirect (via Config)

- `AIRS_API_KEY` - Prisma AIRS authentication
- `AIRS_API_URL` - API endpoint
- See [Configuration Module]({{ site.baseurl }}/developers/src/config/) for complete list

## Related Documentation

- [Transport Module]({{ site.baseurl }}/developers/src/transport/) - HTTP/SSE implementation details
- [Configuration Module]({{ site.baseurl }}/developers/src/config/) - Settings and environment
- [Types Module]({{ site.baseurl }}/developers/src/types/) - Type definitions
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Security tool implementations

## Summary

The `src/index.ts` file provides a clean, well-structured entry point that:

- Initializes all server components in the correct order
- Provides comprehensive error handling
- Supports both REST and streaming protocols
- Includes production-ready health checks
- Maintains clear separation of concerns
