/* eslint-disable @typescript-eslint/unbound-method */

import type { Response } from 'express';
import { SSETransport } from '../../../src/transport/sse';
import { getLogger } from '../../../src/utils/logger';

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  getLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('SSETransport', () => {
  let sseTransport: SSETransport;
  let mockResponse: jest.Mocked<Response>;
  let mockLogger: ReturnType<typeof getLogger>;

  beforeEach(() => {
    mockLogger = getLogger();
    sseTransport = new SSETransport(mockLogger);

    // Create mock response
    mockResponse = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<Response>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSSE', () => {
    it('should set correct headers', () => {
      const clientId = 'test-client-123';

      sseTransport.initializeSSE(mockResponse, clientId);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
    });

    it('should send initial connect event', () => {
      const clientId = 'test-client-123';

      sseTransport.initializeSSE(mockResponse, clientId);

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: connect\ndata: {"connected":true}\n\n'),
      );
    });

    it('should register close handler', () => {
      const clientId = 'test-client-123';

      sseTransport.initializeSSE(mockResponse, clientId);

      expect(mockResponse.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle client disconnect', () => {
      const clientId = 'test-client-123';
      let closeHandler: () => void = () => {};

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === 'close') {
          closeHandler = handler as () => void;
        }
        return mockResponse;
      });

      sseTransport.initializeSSE(mockResponse, clientId);
      expect(sseTransport.isConnected(clientId)).toBe(true);

      // Trigger close event
      closeHandler();

      expect(sseTransport.isConnected(clientId)).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith('SSE client disconnected', { clientId });
    });
  });

  describe('sendEvent', () => {
    it('should format and send SSE event', () => {
      const clientId = 'test-client-123';
      sseTransport.initializeSSE(mockResponse, clientId);

      // Clear previous writes
      mockResponse.write.mockClear();

      const result = sseTransport.sendEvent(clientId, {
        id: '123',
        event: 'test-event',
        data: 'test data',
        retry: 5000,
      });

      expect(result).toBe(true);
      expect(mockResponse.write).toHaveBeenCalledWith(
        'id: 123\nevent: test-event\nretry: 5000\ndata: test data\n\n',
      );
    });

    it('should handle multi-line data', () => {
      const clientId = 'test-client-123';
      sseTransport.initializeSSE(mockResponse, clientId);
      mockResponse.write.mockClear();

      sseTransport.sendEvent(clientId, {
        event: 'multi-line',
        data: 'line1\nline2\nline3',
      });

      expect(mockResponse.write).toHaveBeenCalledWith(
        'event: multi-line\ndata: line1\ndata: line2\ndata: line3\n\n',
      );
    });

    it('should return false for disconnected client', () => {
      const result = sseTransport.sendEvent('non-existent-client', {
        data: 'test',
      });

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Attempted to send to disconnected client', {
        clientId: 'non-existent-client',
      });
    });

    it('should handle write errors', () => {
      const clientId = 'test-client-123';
      sseTransport.initializeSSE(mockResponse, clientId);

      mockResponse.write.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const result = sseTransport.sendEvent(clientId, {
        data: 'test',
      });

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to send SSE event', {
        clientId,
        error: 'Write failed',
      });
      expect(sseTransport.isConnected(clientId)).toBe(false);
    });
  });

  describe('sendJsonRpcResponse', () => {
    it('should send JSON-RPC response as SSE event', () => {
      const clientId = 'test-client-123';
      sseTransport.initializeSSE(mockResponse, clientId);
      mockResponse.write.mockClear();

      const response = {
        jsonrpc: '2.0' as const,
        result: { data: 'test' },
        id: 1,
      };

      sseTransport.sendJsonRpcResponse(clientId, response);

      expect(mockResponse.write).toHaveBeenCalledWith(expect.stringContaining('event: message'));
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(response)),
      );
    });
  });

  describe('sendNotification', () => {
    it('should send notification as SSE event', () => {
      const clientId = 'test-client-123';
      sseTransport.initializeSSE(mockResponse, clientId);
      mockResponse.write.mockClear();

      sseTransport.sendNotification(clientId, 'test/notification', { foo: 'bar' });

      const expectedData = JSON.stringify({
        jsonrpc: '2.0',
        method: 'test/notification',
        params: { foo: 'bar' },
      });

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: notification'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(expect.stringContaining(expectedData));
    });
  });

  describe('broadcast', () => {
    it('should send message to all connected clients', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';
      const mockResponse2 = {
        ...mockResponse,
        write: jest.fn(),
      } as unknown as jest.Mocked<Response>;

      sseTransport.initializeSSE(mockResponse, client1);
      sseTransport.initializeSSE(mockResponse2, client2);

      // Clear initialization writes
      mockResponse.write.mockClear();
      mockResponse2.write.mockClear();

      sseTransport.broadcast({
        event: 'broadcast',
        data: 'test message',
      });

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: broadcast\ndata: test message'),
      );
      expect(mockResponse2.write).toHaveBeenCalledWith(
        expect.stringContaining('event: broadcast\ndata: test message'),
      );
    });

    it('should clean up disconnected clients during broadcast', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';
      const mockResponse2 = {
        ...mockResponse,
        write: jest.fn(),
      } as unknown as jest.Mocked<Response>;

      sseTransport.initializeSSE(mockResponse, client1);
      sseTransport.initializeSSE(mockResponse2, client2);

      // Make client1 fail on write
      mockResponse.write.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      sseTransport.broadcast({
        event: 'broadcast',
        data: 'test',
      });

      expect(sseTransport.isConnected(client1)).toBe(false);
      expect(sseTransport.isConnected(client2)).toBe(true);
    });
  });

  describe('connection management', () => {
    it('should track connected clients', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';

      expect(sseTransport.getClientCount()).toBe(0);

      sseTransport.initializeSSE(mockResponse, client1);
      expect(sseTransport.getClientCount()).toBe(1);
      expect(sseTransport.isConnected(client1)).toBe(true);

      sseTransport.initializeSSE(mockResponse, client2);
      expect(sseTransport.getClientCount()).toBe(2);
      expect(sseTransport.isConnected(client2)).toBe(true);
    });

    it('should disconnect specific client', () => {
      const clientId = 'test-client';
      sseTransport.initializeSSE(mockResponse, clientId);

      sseTransport.disconnect(clientId);

      expect(mockResponse.end).toHaveBeenCalled();
      expect(sseTransport.isConnected(clientId)).toBe(false);
    });

    it('should disconnect all clients', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';
      const mockResponse2 = {
        ...mockResponse,
        end: jest.fn(),
      } as unknown as jest.Mocked<Response>;

      sseTransport.initializeSSE(mockResponse, client1);
      sseTransport.initializeSSE(mockResponse2, client2);

      sseTransport.disconnectAll();

      expect(mockResponse.end).toHaveBeenCalled();
      expect(mockResponse2.end).toHaveBeenCalled();
      expect(sseTransport.getClientCount()).toBe(0);
    });
  });
});
