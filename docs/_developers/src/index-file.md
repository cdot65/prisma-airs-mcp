---
layout: documentation
title: Main Application Entry Point
permalink: /developers/src/index-file/
category: developers
---

# Main Application Module (src/index.ts)

The main application module serves as the entry point for the Prisma AIRS MCP server. It initializes the Express HTTP
server, sets up the MCP protocol handlers, configures middleware, and manages the application lifecycle.

## Overview

The `index.ts` file orchestrates:

- Express server initialization
- MCP protocol setup
- Middleware configuration
- Route definitions
- Error handling
- Monitoring integration
- Server startup

## Architecture

```
┌─────────────────────────────────────────┐
│           Application Start             │
│         (src/index.ts)                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Import instrument.ts            │
│     (Sentry initialization)             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Configure Express               │
│    • CORS                               │
│    • JSON parsing                       │
│    • Request logging                    │
│    • Monitoring setup                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Setup MCP Server                │
│    • Protocol handlers                  │
│    • Transport layer                    │
│    • Tool/Resource/Prompt handlers      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Define Routes                   │
│    • Health checks                      │
│    • MCP endpoints                      │
│    • SSE connections                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Start HTTP Server               │
│    • Listen on configured port          │
│    • Log startup information            │
└─────────────────────────────────────────┘
```

## Code Structure

### Imports and Initialization

```typescript
// IMPORTANT: This must be the very first import for Sentry to work properly
import './instrument.js';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import { getConfig } from './config';
import { getLogger } from './utils/logger.js';
import {
    setupExpressRequestHandler,
    setupExpressErrorHandler,
    createErrorHandler,
    logMonitoringStatus,
    addBreadcrumb,
} from './utils/monitoring.js';
```

**Key Points:**

- `instrument.js` must be imported first for monitoring
- All imports use ES modules with `.js` extensions
- Type imports are separated from value imports

### Server Creation Function

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

    // Log monitoring status
    logMonitoringStatus();
```

**Features:**

- Loads configuration
- Initializes logger
- Creates Express application
- Logs startup information

### Middleware Setup

```typescript
// Setup Sentry request handler (must be first)
setupExpressRequestHandler(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, _res, next) => {
    logger.debug('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
    });

    // Add monitoring breadcrumb for request tracking
    addBreadcrumb(`${req.method} ${req.path}`, 'http.request', {
        method: req.method,
        path: req.path,
        query: req.query,
    });

    next();
});
```

**Middleware Order:**

1. Sentry request handler (first)
2. CORS support
3. JSON body parsing (10MB limit)
4. Request logging
5. Monitoring breadcrumbs

### Health Check Endpoints

```typescript
// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: config.mcp.serverVersion,
    });
});

// Readiness probe endpoint
app.get('/ready', (_req: Request, res: Response) => {
    // TODO: Add actual readiness checks (AIRS connectivity, etc.)
    res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        version: config.mcp.serverVersion,
    });
});
```

**Purpose:**

- `/health` - Liveness probe for Kubernetes
- `/ready` - Readiness probe for load balancing

### MCP Server Setup

```typescript
// MCP Server instance
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

// Create HTTP transport
const transport = new HttpServerTransport({
    server: mcpServer,
    logger,
});
```

**Components:**

- MCP Server with metadata
- Capability declarations
- HTTP transport layer

### Main MCP Endpoint

```typescript
// Main MCP endpoint - handles JSON-RPC 2.0 messages with optional SSE streaming
app.post(
    '/',
    async (
        req: Request<unknown, unknown, TransportJsonRpcRequest>,
        res: Response<TransportJsonRpcResponse>,
    ) => {
        await transport.handleRequest(req as TransportStreamableRequest, res);
    },
);
```

**Features:**

- JSON-RPC 2.0 protocol
- Streaming support via SSE
- Type-safe request/response

### SSE Connection Endpoint

```typescript
// SSE endpoint for server-initiated streams
app.get('/', (req: Request, res: Response) => {
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
            endpoints: {
                messages: '/',
                health: '/health',
                ready: '/ready',
            },
        });
    }
});
```

**Behavior:**

- SSE for `Accept: text/event-stream`
- JSON metadata for regular GET requests

### Error Handling

```typescript
// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Setup Sentry error handler (must be last)
setupExpressErrorHandler(app);

// Custom error handling middleware (must be after Sentry)
app.use(createErrorHandler());
```

**Error Handler Order:**

1. 404 handler for undefined routes
2. Sentry error handler
3. Custom error handler

### Server Startup

```typescript
// Start HTTP server
app.listen(config.server.port, () => {
    logger.info(`MCP server listening on port ${config.server.port}`);
    logger.info(`Health check: http://localhost:${config.server.port}/health`);
    logger.info(`Ready check: http://localhost:${config.server.port}/ready`);
});
```

### Error Recovery

```typescript
// Handle startup errors
try {
    createServer();
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}
```

## Configuration Integration

The application uses centralized configuration:

```typescript
const config = getConfig();

// Server configuration
const port = config.server.port;
const environment = config.server.environment;
const logLevel = config.server.logLevel;

// MCP configuration
const serverName = config.mcp.serverName;
const serverVersion = config.mcp.serverVersion;
const protocolVersion = config.mcp.protocolVersion;
```

## Monitoring Integration

### Request Tracking

```typescript
app.use((req, res, next) => {
    // Add breadcrumb for each request
    addBreadcrumb(`${req.method} ${req.path}`, 'http.request', {
        method: req.method,
        path: req.path,
        query: req.query,
    });
    next();
});
```

### Error Capture

```typescript
// Sentry automatically captures errors
setupExpressErrorHandler(app);

// Custom error handler adds context
app.use(createErrorHandler());
```

## Environment Variables

Key environment variables used:

| Variable             | Default       | Description        |
|----------------------|---------------|--------------------|
| `PORT`               | `3000`        | HTTP server port   |
| `NODE_ENV`           | `development` | Environment mode   |
| `LOG_LEVEL`          | `info`        | Logging verbosity  |
| `MONITORING_ENABLED` | `false`       | Enable Sentry      |
| `SENTRY_DSN`         | -             | Sentry project DSN |

## Health Check Responses

### Healthy Response

```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
}
```

### Ready Response

```json
{
    "status": "ready",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
}
```

## Server Information Response

GET `/` returns:

```json
{
    "name": "prisma-airs-mcp",
    "version": "1.0.0",
    "protocolVersion": "2024-11-05",
    "endpoints": {
        "messages": "/",
        "health": "/health",
        "ready": "/ready"
    }
}
```

## Startup Sequence

1. **Import instrument.ts** - Initialize Sentry
2. **Load configuration** - Environment variables
3. **Create Express app** - HTTP server
4. **Setup middleware** - CORS, JSON, logging
5. **Create MCP server** - Protocol handlers
6. **Setup transport** - HTTP/SSE layer
7. **Define routes** - Endpoints
8. **Setup error handlers** - Error management
9. **Start server** - Begin listening

## Shutdown Handling

The application handles graceful shutdown:

```typescript
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
```

## Testing Considerations

### Unit Testing

```typescript
// Mock dependencies
jest.mock('./config');
jest.mock('./utils/logger');
jest.mock('./utils/monitoring');

// Test server creation
describe('Server', () => {
    it('should start on configured port', () => {
        // Test implementation
    });
});
```

### Integration Testing

```typescript
// Test with real server
import request from 'supertest';

describe('API Endpoints', () => {
    it('should respond to health check', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
    });
});
```

## Common Issues

### Port Already in Use

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

- Change PORT environment variable
- Kill process using the port
- Use dynamic port allocation

### Missing Environment Variables

```bash
Error: AIRS_API_KEY is required
```

**Solution:**

- Create `.env` file
- Set required variables
- Check configuration module

### Monitoring Not Working

**Checklist:**

- Verify `instrument.js` is imported first
- Check MONITORING_ENABLED=true
- Confirm SENTRY_DSN is set
- Verify Sentry initialization logs

## Best Practices

### 1. Environment Configuration

```typescript
// Use environment-specific configs
if (config.server.environment === 'production') {
    app.set('trust proxy', true);
    app.disable('x-powered-by');
}
```

### 2. Error Handling

```typescript
// Always have error handlers
app.use(createErrorHandler());

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    process.exit(1);
});
```

### 3. Graceful Shutdown

```typescript
// Handle shutdown signals
['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => shutdown(signal));
});
```

### 4. Request Validation

```typescript
// Validate request size
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        // Custom validation
    }
}));
```

## Related Documentation

- [Instrument Module]({{ site.baseurl }}/developers/src/instrument-file/) - Sentry initialization
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Environment setup
- [Transport]({{ site.baseurl }}/developers/src/transport/overview/) - HTTP/SSE handling
- [Monitoring]({{ site.baseurl }}/developers/src/utils/monitoring/) - Error tracking
- [Logger]({{ site.baseurl }}/developers/src/utils/logger/) - Logging system