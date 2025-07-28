import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Request, Response } from 'express';
import express from 'express';
import type {
    TransportJsonRpcRequest,
    TransportJsonRpcResponse,
    TransportStreamableRequest,
} from './types';
import { HttpServerTransport } from './transport/http.js';
import cors from 'cors';
import { getConfig } from './config';
import { getLogger } from './utils/logger.js';

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
        next();
    });

    // Smithery.ai configuration middleware - parse query params as env vars
    app.use('/mcp', (req, _res, next) => {
        if (req.query && Object.keys(req.query).length > 0) {
            logger.debug('Smithery configuration received', { query: req.query });
            
            // Parse dot-notation query params and set as env vars
            Object.entries(req.query).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    // Convert dot notation to underscore for env vars
                    // e.g., "server.port" becomes "SERVER_PORT"
                    const envKey = key.toUpperCase().replace(/\./g, '_');
                    process.env[envKey] = value;
                    logger.debug(`Set env var ${envKey}=${value}`);
                }
            });
        }
        next();
    });

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

    // Additional MCP endpoint for Smithery.ai compatibility
    app.post(
        '/mcp',
        async (
            req: Request<unknown, unknown, TransportJsonRpcRequest>,
            res: Response<TransportJsonRpcResponse>,
        ) => {
            await transport.handleRequest(req as TransportStreamableRequest, res);
        },
    );

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
                    mcp: '/mcp',
                    health: '/health',
                    ready: '/ready',
                },
            });
        }
    });

    // SSE endpoint for /mcp path (Smithery.ai compatibility)
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

    // DELETE endpoint for /mcp path (Smithery.ai requirement)
    app.delete('/mcp', (_req: Request, res: Response) => {
        // Handle session cleanup if needed
        // For now, just acknowledge the request
        res.status(204).send();
    });

    // 404 handler
    app.use((_req: Request, res: Response) => {
        res.status(404).json({ error: 'Not found' });
    });

    // Error handling middleware
    app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
        logger.error('Unhandled error', { error: err.message, stack: err.stack });
        res.status(500).json({ error: 'Internal server error' });
    });

    // Start HTTP server
    app.listen(config.server.port, () => {
        logger.info(`MCP server listening on port ${config.server.port}`);
        logger.info(
            `MCP endpoints: http://localhost:${config.server.port}/ and http://localhost:${config.server.port}/mcp`,
        );
        logger.info(`Health check: http://localhost:${config.server.port}/health`);
        logger.info(`Ready check: http://localhost:${config.server.port}/ready`);
    });
};

// Handle startup errors
try {
    createServer();
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}
