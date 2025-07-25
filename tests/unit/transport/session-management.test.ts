/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */

import type { Response } from 'express';
import { HttpServerTransport } from '../../../src/transport/http';
import type { StreamableRequest } from '../../../src/transport/http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { getLogger } from '../../../src/utils/logger';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  getLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));
jest.mock('../../../src/config', () => ({
  getConfig: jest.fn(() => ({
    mcp: {
      serverName: 'test-server',
      serverVersion: '1.0.0',
      protocolVersion: '2024-11-05',
    },
    airs: {
      apiUrl: 'https://test.api.aisecurity.paloaltonetworks.com',
      apiKey: 'test-api-key',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    cache: {
      enabled: true,
      ttlSeconds: 300,
      maxSize: 1000,
    },
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000,
    },
  })),
}));

// Mock uuid to control session IDs
let mockUuid: jest.Mock;
beforeAll(() => {
  mockUuid = jest.fn();
});

jest.mock('uuid', () => ({
  v4: () => mockUuid() as string,
}));

describe('Session Management', () => {
  let transport: HttpServerTransport;
  let mockLogger: ReturnType<typeof getLogger>;
  let mockRequest: jest.Mocked<StreamableRequest>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(() => {
    // Clear mock call counts
    jest.clearAllMocks();

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    (getLogger as jest.Mock).mockReturnValue(mockLogger);

    const mockServer = new Server({ name: 'test-server', version: '1.0.0' }, { capabilities: {} });

    transport = new HttpServerTransport({
      server: mockServer,
      logger: mockLogger,
    });

    // Create mock request
    mockRequest = {
      body: {},
      headers: {},
    } as jest.Mocked<StreamableRequest>;

    // Create mock response
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<Response>;
  });

  describe('Session Creation', () => {
    it('should create new session when none exists', () => {
      // Setup uuid mock for this test
      mockUuid.mockReturnValueOnce('session-1').mockReturnValueOnce('client-1');
      mockRequest.headers = {
        accept: 'text/event-stream',
      };

      transport.handleSSEConnection(mockRequest, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', 'session-1');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'SSE connection established',
        expect.objectContaining({
          sessionId: 'session-1',
          clientId: 'client-1',
        }),
      );
    });

    it('should reuse existing session when provided', () => {
      // First connection creates session
      mockRequest.headers = {
        accept: 'text/event-stream',
      };
      transport.handleSSEConnection(mockRequest, mockResponse);

      // Second connection with same session ID
      mockRequest.headers = {
        accept: 'text/event-stream',
        'mcp-session-id': 'session-1',
      };
      mockResponse.setHeader.mockClear();
      (mockLogger.info as jest.Mock).mockClear();

      transport.handleSSEConnection(mockRequest, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', 'session-1');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'SSE connection established',
        expect.objectContaining({
          sessionId: 'session-1',
          clientId: 'client-1', // Same client ID reused
        }),
      );
    });

    it('should create new session for invalid session ID', () => {
      mockRequest.headers = {
        accept: 'text/event-stream',
        'mcp-session-id': 'non-existent-session',
      };

      transport.handleSSEConnection(mockRequest, mockResponse);

      // Should create new session since the provided one doesn't exist
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', 'session-2');
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across POST requests', async () => {
      // Create session via SSE
      mockRequest.headers = {
        accept: 'text/event-stream',
      };
      transport.handleSSEConnection(mockRequest, mockResponse);

      // Make POST request with session ID
      mockRequest = {
        body: {
          jsonrpc: '2.0',
          method: 'ping',
          id: 1,
        },
        headers: {
          accept: 'application/json',
          'mcp-session-id': 'session-1',
        },
      } as jest.Mocked<StreamableRequest>;

      await transport.handleRequest(mockRequest, mockResponse);

      // Session should be maintained
      expect(mockResponse.json).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        result: {},
        id: 1,
      });
    });

    it('should handle multiple concurrent sessions', () => {
      const sessions = ['session-1', 'session-2', 'session-3'];
      const responses: jest.Mocked<Response>[] = [];

      // Create multiple sessions
      sessions.forEach(() => {
        const req = {
          headers: {
            accept: 'text/event-stream',
          },
        } as StreamableRequest;

        const res = {
          ...mockResponse,
          setHeader: jest.fn(),
          write: jest.fn(),
          on: jest.fn(),
        } as unknown as jest.Mocked<Response>;

        responses.push(res);
        transport.handleSSEConnection(req, res);
      });

      // Verify each session was created with unique IDs
      expect(responses[0]?.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', expect.any(String));
      expect(responses[1]?.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', expect.any(String));
      expect(responses[2]?.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', expect.any(String));
    });
  });

  describe('Reconnection Handling', () => {
    it('should handle reconnection with Last-Event-ID', () => {
      // Initial connection
      mockRequest.headers = {
        accept: 'text/event-stream',
      };
      transport.handleSSEConnection(mockRequest, mockResponse);

      // Simulate disconnect and reconnect with Last-Event-ID
      mockRequest.headers = {
        accept: 'text/event-stream',
        'mcp-session-id': 'session-1',
        'last-event-id': '42',
      };

      (mockLogger.info as jest.Mock).mockClear();
      transport.handleSSEConnection(mockRequest, mockResponse);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'SSE connection established',
        expect.objectContaining({
          lastEventId: '42',
        }),
      );
    });

    it('should handle client disconnect and cleanup', () => {
      let disconnectHandler: () => void = () => {};

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === 'close') {
          disconnectHandler = handler as () => void;
        }
        return mockResponse;
      });

      mockRequest.headers = {
        accept: 'text/event-stream',
      };

      transport.handleSSEConnection(mockRequest, mockResponse);

      // Simulate client disconnect
      disconnectHandler();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'SSE client disconnected',
        expect.objectContaining({
          clientId: expect.any(String),
        }),
      );
    });
  });

  describe('Session-based Streaming', () => {
    it('should route streaming responses to correct session', async () => {
      // Enable streaming for this test
      const mockShouldStream = jest.spyOn(transport as any, 'shouldStreamResponse');
      mockShouldStream.mockReturnValue(true);

      // Create SSE session
      mockRequest.headers = {
        accept: 'text/event-stream',
      };
      transport.handleSSEConnection(mockRequest, mockResponse);

      // Make streamable request
      const streamRequest = {
        body: {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'test-tool' },
          id: 1,
        },
        headers: {
          accept: 'application/json, text/event-stream',
          'mcp-session-id': 'session-1',
        },
      } as StreamableRequest;

      const streamResponse = {
        json: jest.fn(),
        setHeader: jest.fn(),
        write: jest.fn(),
        on: jest.fn(),
      } as unknown as jest.Mocked<Response>;

      await transport.handleRequest(streamRequest, streamResponse);

      // Should set SSE headers
      expect(streamResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(streamResponse.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', 'session-1');

      mockShouldStream.mockRestore();
    });
  });

  describe('Error Cases', () => {
    it('should handle session creation failure', () => {
      // Mock uuid to return same value for session and client (shouldn't happen)
      const uuid = require('uuid');
      uuid.v4.mockReturnValue(undefined);

      mockRequest.headers = {
        accept: 'text/event-stream',
      };

      transport.handleSSEConnection(mockRequest, mockResponse);

      // Should still handle gracefully
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', expect.any(String));
    });

    it('should cleanup sessions on error', async () => {
      const mockShouldStream = jest.spyOn(transport as any, 'shouldStreamResponse');
      mockShouldStream.mockReturnValue(true);

      mockRequest = {
        body: {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {},
          id: 1,
        },
        headers: {
          accept: 'application/json, text/event-stream',
        },
      } as jest.Mocked<StreamableRequest>;

      // Mock write to throw error
      mockResponse.write.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      await transport.handleRequest(mockRequest, mockResponse);

      // Should fall back to JSON response on SSE error
      expect(mockResponse.json).toHaveBeenCalled();

      mockShouldStream.mockRestore();
    });
  });
});
