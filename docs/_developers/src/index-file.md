---
layout: documentation
title: Main Application Entry Point
permalink: /developers/src/index-file/
category: developers
---

# Main Application Module (src/index.ts)

The entry point that bootstraps the Prisma AIRS MCP server, configuring Express HTTP server with MCP protocol handlers.

## Core Purpose

- Initializes monitoring (via instrument.ts import)
- Creates Express server with middleware
- Sets up MCP protocol endpoints
- Establishes HTTP and SSE routes
- Handles graceful error management

## Key Components

### Server Creation

```typescript
const createServer = (): void => {
    const config = getConfig();
    const logger = getLogger();
    const app = express();
    
    // Core middleware
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    
    // MCP transport layer
    const transport = new HttpServerTransport({
        server: new Server({ name: config.mcp.serverName }),
        logger,
    });
}
```

### Route Structure

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /ready` - Readiness probe  
- `POST /` - Main MCP message endpoint
- `GET /sse` - Server-sent events for streaming

### Error Flow

```
Request → Middleware → Routes → Handlers
           ↓ (on error)
        Sentry Handler → Custom Error Handler → Error Response
```

## Integration Points

- **Configuration**: Loads from `config/index.ts`
- **Monitoring**: Uses `utils/monitoring.ts` for error tracking
- **Transport**: `HttpServerTransport` handles MCP protocol
- **Logging**: Structured logging via `utils/logger.ts`

## Application Lifecycle

1. **Import instrument.ts** - Must be first for Sentry
2. **Load configuration** - Environment and defaults
3. **Setup middleware** - CORS, JSON parsing, monitoring
4. **Define routes** - Health checks and MCP endpoints
5. **Start server** - Listen on configured port

## Key Patterns

- Singleton server instance
- Graceful error handling with monitoring
- Health/readiness probes for container orchestration
- SSE support for real-time communication

## Related Modules

- [Instrument]({{ site.baseurl }}/developers/src/instrument-file/) - Monitoring initialization
- [HTTP Transport]({{ site.baseurl }}/developers/src/transport/http/) - Request handling
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - App settings