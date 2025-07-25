import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Request, Response } from 'express';
import type { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { ResourceHandler } from '../resources';
import { ToolHandler } from '../tools';
import { PromptHandler } from '../prompts';
import { getConfig } from '../config';
import { SSETransport } from './sse.js';
import type {
  ResourcesListParams,
  ResourcesReadParams,
  ToolsListParams,
  ToolsCallParams,
  PromptsListParams,
  PromptsGetParams,
} from '../mcp/types.js';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number | null;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: JsonRpcError;
  id: string | number | null;
}

export interface HttpTransportOptions {
  server: Server;
  logger: Logger;
}

export interface StreamableRequest extends Request {
  headers: {
    accept?: string;
    'last-event-id'?: string;
    'mcp-session-id'?: string;
  } & Request['headers'];
}

export class HttpServerTransport {
  // @ts-expect-error - Will be used when implementing actual MCP handlers
  private server: Server;
  private logger: Logger;
  private resourceHandler: ResourceHandler;
  private toolHandler: ToolHandler;
  private promptHandler: PromptHandler;
  private config = getConfig();
  private sseTransport: SSETransport;
  private sessions: Map<string, { clientId: string; createdAt: Date }> = new Map();

  constructor(options: HttpTransportOptions) {
    this.server = options.server;
    this.logger = options.logger;
    this.resourceHandler = new ResourceHandler();
    this.toolHandler = new ToolHandler();
    this.promptHandler = new PromptHandler();
    this.sseTransport = new SSETransport(this.logger);
  }

  /**
   * Check if client accepts SSE
   */
  private acceptsSSE(req: StreamableRequest): boolean {
    const accept = req.headers.accept || '';
    return accept.includes('text/event-stream');
  }

  /**
   * Get or create session
   */
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

  /**
   * Handle SSE connection for server-initiated streams
   */
  handleSSEConnection(req: StreamableRequest, res: Response): void {
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

  /**
   * Handle incoming HTTP request and route to MCP server
   */
  async handleRequest(req: StreamableRequest, res: Response<JsonRpcResponse>): Promise<void> {
    const startTime = Date.now();
    const { method, params, id = null } = req.body as JsonRpcRequest;

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
        // Get or create session for streaming
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

        // For streaming responses, we might send additional events
        // This is where we'd implement streaming for long-running operations

        // End the stream after sending the response
        setTimeout(() => {
          this.sseTransport.disconnect(session.clientId);
        }, 100);
      } else {
        // Standard JSON response
        res.json({
          jsonrpc: '2.0',
          result,
          id,
        });
      }

      this.logger.debug('Request completed', {
        method,
        duration: Date.now() - startTime,
        streaming: shouldStream && acceptsSSE,
      });
    } catch (error) {
      const { method, id = null } = req.body as JsonRpcRequest;

      this.logger.error('Error handling request', {
        method,
        error: error instanceof Error ? error.message : String(error),
      });

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
  }

  /**
   * Route request to appropriate MCP handler
   */
  private async routeRequest(method: string, params: unknown): Promise<unknown> {
    // MCP method routing
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

  // Resource handlers
  private handleResourcesList(params: unknown): unknown {
    return this.resourceHandler.listResources(params as ResourcesListParams);
  }

  private async handleResourcesRead(params: unknown): Promise<unknown> {
    return this.resourceHandler.readResource(params as ResourcesReadParams);
  }

  // Tool handlers
  private handleToolsList(params: unknown): unknown {
    return this.toolHandler.listTools(params as ToolsListParams);
  }

  private async handleToolsCall(params: unknown): Promise<unknown> {
    return this.toolHandler.callTool(params as ToolsCallParams);
  }

  // Prompt handlers
  private handlePromptsList(params: unknown): unknown {
    return this.promptHandler.listPrompts(params as PromptsListParams);
  }

  private handlePromptsGet(params: unknown): unknown {
    return this.promptHandler.getPrompt(params as PromptsGetParams);
  }

  // Server handlers
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

  private handlePing(): unknown {
    return {};
  }

  private handleNotificationsInitialized(): unknown {
    // This is a notification, just acknowledge receipt
    return {};
  }

  private handleResourceTemplatesList(): unknown {
    // Return resource templates - these are templates for dynamic resources
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

  private handleCompletionComplete(params: unknown): unknown {
    // MCP Inspector compatibility - return empty completions
    const { argument } = params as { argument?: { name?: string; value?: string } };
    this.logger.debug('Handling completion request', { argument });

    return {
      completion: {
        values: [],
        hasMore: false,
      },
    };
  }

  /**
   * Determine if a response should be streamed
   */
  private shouldStreamResponse(method: string, _result: unknown): boolean {
    // Methods that might benefit from streaming
    const streamableMethods = [
      'tools/call', // Tool execution might be long-running
      'resources/read', // Large resources might benefit from streaming
    ];

    // Check if method supports streaming
    if (!streamableMethods.includes(method)) {
      return false;
    }

    // Check result size or type to determine if streaming would be beneficial
    // For now, we'll keep it simple and not stream by default
    // This can be enhanced based on specific use cases
    return false;
  }
}
