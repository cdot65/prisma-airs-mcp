/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { HttpServerTransport } from '../../../src/transport/http';
import type { StreamableRequest } from '../../../src/transport/http';
import { getLogger } from '../../../src/utils/logger';

// Mock dependencies
jest.mock('../../../src/utils/logger');
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

describe('HTTP Transport with SSE Integration', () => {
    let transport: HttpServerTransport;
    let mockServer: Server;
    let mockLogger: ReturnType<typeof getLogger>;
    let mockRequest: jest.Mocked<StreamableRequest>;
    let mockResponse: jest.Mocked<Response>;

    beforeEach(() => {
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } as any;

        (getLogger as jest.Mock).mockReturnValue(mockLogger);

        mockServer = new Server({ name: 'test-server', version: '1.0.0' }, { capabilities: {} });

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

    describe('Standard HTTP requests', () => {
        it('should handle standard JSON-RPC request', async () => {
            mockRequest.body = {
                jsonrpc: '2.0',
                method: 'ping',
                id: 1,
            };
            mockRequest.headers = {
                accept: 'application/json',
            };

            await transport.handleRequest(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                jsonrpc: '2.0',
                result: {},
                id: 1,
            });
        });

        it('should handle initialize request', async () => {
            mockRequest.body = {
                jsonrpc: '2.0',
                method: 'initialize',
                params: {},
                id: 1,
            };

            await transport.handleRequest(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith({
                jsonrpc: '2.0',
                result: expect.objectContaining({
                    protocolVersion: '2024-11-05',
                    capabilities: expect.any(Object),
                    serverInfo: {
                        name: 'test-server',
                        version: '1.0.0',
                    },
                }),
                id: 1,
            });
        });
    });

    describe('SSE support detection', () => {
        it('should detect SSE-capable clients', async () => {
            mockRequest.body = {
                jsonrpc: '2.0',
                method: 'ping',
                id: 1,
            };
            mockRequest.headers = {
                accept: 'application/json, text/event-stream',
            };

            await transport.handleRequest(mockRequest, mockResponse);

            // Should still return JSON for non-streamable methods
            expect(mockResponse.json).toHaveBeenCalled();
            expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
                'Content-Type',
                'text/event-stream',
            );
        });
    });

    describe('SSE connection handling', () => {
        it('should establish SSE connection', () => {
            mockRequest.headers = {
                accept: 'text/event-stream',
            };

            transport.handleSSEConnection(mockRequest, mockResponse);

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Mcp-Session-Id',
                expect.any(String),
            );
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'text/event-stream',
            );
            expect(mockResponse.write).toHaveBeenCalledWith(
                expect.stringContaining('event: connect'),
            );
            expect(mockResponse.write).toHaveBeenCalledWith(
                expect.stringContaining('event: endpoint'),
            );
        });

        it('should reuse existing session', () => {
            const sessionId = 'existing-session-123';
            mockRequest.headers = {
                accept: 'text/event-stream',
                'mcp-session-id': sessionId,
            };

            // First connection
            transport.handleSSEConnection(mockRequest, mockResponse);
            mockResponse.setHeader.mockClear();

            // Second connection with same session ID
            transport.handleSSEConnection(mockRequest, mockResponse);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', sessionId);
        });

        it('should handle Last-Event-ID header', () => {
            mockRequest.headers = {
                accept: 'text/event-stream',
                'last-event-id': '123',
            };

            transport.handleSSEConnection(mockRequest, mockResponse);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'SSE connection established',
                expect.objectContaining({
                    lastEventId: '123',
                }),
            );
        });
    });

    describe('Session management', () => {
        it('should create new session for requests', async () => {
            mockRequest.body = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {},
                id: 1,
            };
            mockRequest.headers = {
                accept: 'application/json, text/event-stream',
            };

            await transport.handleRequest(mockRequest, mockResponse);

            // Even though tools/call is streamable, it returns false by default
            // so we should get a standard JSON response
            expect(mockResponse.json).toHaveBeenCalled();
        });

        it('should handle session creation failure gracefully', () => {
            // Mock the getOrCreateSession to simulate a failure scenario
            const mockGetOrCreateSession = jest.spyOn(transport as any, 'getOrCreateSession');
            mockGetOrCreateSession.mockImplementation(() => {
                const sessionId = 'test-session';
                // Don't add to sessions map to simulate failure
                return sessionId;
            });

            mockRequest.headers = {
                accept: 'text/event-stream',
            };

            transport.handleSSEConnection(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to create session',
            });

            mockGetOrCreateSession.mockRestore();
        });
    });

    describe('Error handling', () => {
        it('should handle missing method', async () => {
            mockRequest.body = {
                jsonrpc: '2.0',
                params: {},
                id: 1,
            };

            await transport.handleRequest(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                jsonrpc: '2.0',
                error: {
                    code: -32600,
                    message: 'Invalid Request: missing or invalid method',
                },
                id: 1,
            });
        });

        it('should handle unknown method', async () => {
            mockRequest.body = {
                jsonrpc: '2.0',
                method: 'unknown/method',
                id: 1,
            };

            await transport.handleRequest(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal error',
                    data: 'Method not found: unknown/method',
                },
                id: 1,
            });
        });

        it('should handle request body parsing errors', async () => {
            mockRequest.body = null as any;

            await transport.handleRequest(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('Method routing', () => {
        const testMethods = [
            { method: 'resources/list', params: {} },
            { method: 'resources/read', params: { uri: 'test://resource' } },
            { method: 'tools/list', params: {} },
            { method: 'tools/call', params: { name: 'test-tool' } },
            { method: 'prompts/list', params: {} },
            { method: 'prompts/get', params: { name: 'test-prompt' } },
            { method: 'resources/templates/list', params: {} },
            { method: 'notifications/initialized', params: {} },
        ];

        testMethods.forEach(({ method, params }) => {
            it(`should route ${method} correctly`, async () => {
                mockRequest.body = {
                    jsonrpc: '2.0',
                    method,
                    params,
                    id: 1,
                };

                await transport.handleRequest(mockRequest, mockResponse);

                expect(mockResponse.json).toHaveBeenCalledWith({
                    jsonrpc: '2.0',
                    result: expect.any(Object),
                    id: 1,
                });
            });
        });
    });
});
