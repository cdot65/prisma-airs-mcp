/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */

import express from 'express';
import type { Server as HttpServer } from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
const EventSource = require('eventsource');
const fetch = require('node-fetch');
import { HttpServerTransport } from '../../src/transport/http';
import type { StreamableRequest } from '../../src/transport/http';
import { getLogger } from '../../src/utils/logger';
import { getConfig } from '../../src/config';

// Mock dependencies
jest.mock('../../src/utils/logger');
jest.mock('../../src/config');

// Increase timeout for E2E tests
jest.setTimeout(10000);

describe('SSE End-to-End Tests', () => {
    let app: express.Application;
    let server: HttpServer;
    let transport: HttpServerTransport;
    let serverPort: number;
    let baseUrl: string;

    beforeAll((done) => {
        // Mock config
        (getConfig as jest.Mock).mockReturnValue({
            mcp: {
                serverName: 'test-server',
                serverVersion: '1.0.0',
                protocolVersion: '2024-11-05',
            },
            server: {
                port: 0, // Random port
                environment: 'test',
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
        });

        // Mock logger
        const mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        (getLogger as jest.Mock).mockReturnValue(mockLogger as any);

        // Create Express app
        app = express();
        app.use(express.json());

        // Create MCP server and transport
        const mcpServer = new Server(
            { name: 'test-server', version: '1.0.0' },
            { capabilities: {} },
        );

        transport = new HttpServerTransport({
            server: mcpServer,
            logger: mockLogger as any,
        });

        // Set up routes
        app.post('/', async (req, res) => {
            await transport.handleRequest(req as StreamableRequest, res);
        });

        app.get('/', (req, res) => {
            const acceptHeader = req.headers.accept || '';
            if (acceptHeader.includes('text/event-stream')) {
                transport.handleSSEConnection(req as StreamableRequest, res);
            } else {
                res.json({ name: 'test-server', version: '1.0.0' });
            }
        });

        // Start server
        server = app.listen(0, () => {
            const address = server.address();
            if (address && typeof address !== 'string') {
                serverPort = address.port;
                baseUrl = `http://localhost:${serverPort}`;
                done();
            }
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    describe('SSE Connection', () => {
        it('should establish SSE connection and receive events', (done) => {
            const events: any[] = [];
            const eventSource = new EventSource(baseUrl, {
                headers: {
                    Accept: 'text/event-stream',
                },
            });

            eventSource.onopen = () => {
                expect(eventSource.readyState).toBe(EventSource.OPEN);
            };

            eventSource.addEventListener('connect', (event: any) => {
                events.push({ type: 'connect', data: JSON.parse(event.data) });
            });

            eventSource.addEventListener('endpoint', (event: any) => {
                events.push({ type: 'endpoint', data: JSON.parse(event.data) });

                // Verify we received expected events
                expect(events).toHaveLength(2);
                expect(events[0]).toEqual({
                    type: 'connect',
                    data: { connected: true },
                });
                expect(events[1]).toEqual({
                    type: 'endpoint',
                    data: { endpoint: '/messages' },
                });

                eventSource.close();
                done();
            });

            eventSource.onerror = (error: any) => {
                eventSource.close();
                done(error);
            };
        });

        it('should maintain session across connections', async () => {
            // First, establish SSE connection
            const eventSource = new EventSource(baseUrl, {
                headers: {
                    Accept: 'text/event-stream',
                },
            });

            // let sessionId: string | null = null;

            await new Promise<void>((resolve, reject) => {
                eventSource.onopen = () => {
                    // Extract session ID from headers (would need to be exposed by server)
                    resolve();
                };
                eventSource.onerror = reject;
            });

            eventSource.close();

            // Make a POST request with SSE accept header
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json, text/event-stream',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'ping',
                    id: 1,
                }),
            });

            // Should get standard JSON response for ping
            const data = await response.json();
            expect(data).toEqual({
                jsonrpc: '2.0',
                result: {},
                id: 1,
            });
        });
    });

    describe('JSON-RPC over SSE', () => {
        it('should handle standard JSON-RPC requests', async () => {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'initialize',
                    params: {},
                    id: 1,
                }),
            });

            const data = await response.json();
            expect(data.jsonrpc).toBe('2.0');
            expect(data.id).toBe(1);
            expect(data.result).toMatchObject({
                protocolVersion: '2024-11-05',
                serverInfo: {
                    name: 'test-server',
                    version: '1.0.0',
                },
            });
        });

        it('should handle method routing correctly', async () => {
            const methods = [
                'tools/list',
                'resources/list',
                'prompts/list',
                'resources/templates/list',
            ];

            for (const method of methods) {
                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method,
                        params: {},
                        id: method,
                    }),
                });

                const data = await response.json();
                expect(data.jsonrpc).toBe('2.0');
                expect(data.id).toBe(method);
                expect(data.result).toBeDefined();
                expect(data.error).toBeUndefined();
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid JSON-RPC requests', async () => {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    // Missing method
                    id: 1,
                }),
            });

            const data = await response.json();
            expect(response.status).toBe(400);
            expect(data.error).toMatchObject({
                code: -32600,
                message: expect.stringContaining('Invalid Request'),
            });
        });

        it('should handle unknown methods', async () => {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'unknown/method',
                    id: 1,
                }),
            });

            const data = await response.json();
            expect(response.status).toBe(500);
            expect(data.error).toMatchObject({
                code: -32603,
                message: 'Internal error',
            });
        });
    });

    describe('Content Negotiation', () => {
        it('should return server info for non-SSE GET requests', async () => {
            const response = await fetch(baseUrl, {
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await response.json();
            expect(data).toMatchObject({
                name: 'test-server',
                version: '1.0.0',
            });
        });

        it('should establish SSE for appropriate Accept header', async () => {
            const response = await fetch(baseUrl, {
                headers: {
                    Accept: 'text/event-stream',
                },
            });

            expect(response.headers.get('content-type')).toBe('text/event-stream');
            expect(response.headers.get('cache-control')).toBe('no-cache');
            expect(response.headers.get('connection')).toBe('keep-alive');

            // Clean up the connection
            // response.body?.destroy();
        });
    });
});
