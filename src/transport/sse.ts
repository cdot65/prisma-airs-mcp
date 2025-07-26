import type { Response } from 'express';
import type { Logger } from 'winston';
import type { TransportJsonRpcResponse, TransportSSEMessage } from '../types';

export class SSETransport {
    private clients: Map<string, Response> = new Map();
    private messageId = 0;

    constructor(private logger: Logger) {}

    /**
     * Initialize SSE connection
     */
    initializeSSE(res: Response, clientId: string): void {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

        // Store client connection
        this.clients.set(clientId, res);

        // Send initial connection event
        this.sendEvent(clientId, {
            event: 'connect',
            data: JSON.stringify({ connected: true }),
        });

        // Handle client disconnect
        res.on('close', () => {
            this.logger.debug('SSE client disconnected', { clientId });
            this.clients.delete(clientId);
        });
    }

    /**
     * Send an SSE event to a specific client
     */
    sendEvent(clientId: string, message: TransportSSEMessage): boolean {
        const res = this.clients.get(clientId);
        if (!res) {
            this.logger.warn('Attempted to send to disconnected client', { clientId });
            return false;
        }

        try {
            // Format SSE message
            const lines: string[] = [];

            if (message.id) {
                lines.push(`id: ${message.id}`);
            }

            if (message.event) {
                lines.push(`event: ${message.event}`);
            }

            if (message.retry) {
                lines.push(`retry: ${message.retry}`);
            }

            // Split data by newlines and prefix each line
            const dataLines = message.data.split('\n');
            dataLines.forEach((line) => {
                lines.push(`data: ${line}`);
            });

            // SSE messages end with double newline
            const sseMessage = lines.join('\n') + '\n\n';

            res.write(sseMessage);

            return true;
        } catch (error) {
            this.logger.error('Failed to send SSE event', {
                clientId,
                error: error instanceof Error ? error.message : String(error),
            });
            this.clients.delete(clientId);
            return false;
        }
    }

    /**
     * Send JSON-RPC response via SSE
     */
    sendJsonRpcResponse(clientId: string, response: TransportJsonRpcResponse): boolean {
        const messageId = String(++this.messageId);

        return this.sendEvent(clientId, {
            id: messageId,
            event: 'message',
            data: JSON.stringify(response),
        });
    }

    /**
     * Send server notification via SSE
     */
    sendNotification(clientId: string, method: string, params?: unknown): boolean {
        const notification = {
            jsonrpc: '2.0' as const,
            method,
            params,
        };

        return this.sendEvent(clientId, {
            event: 'notification',
            data: JSON.stringify(notification),
        });
    }

    /**
     * Broadcast a message to all connected clients
     */
    broadcast(message: TransportSSEMessage): void {
        const disconnectedClients: string[] = [];

        this.clients.forEach((_, clientId) => {
            if (!this.sendEvent(clientId, message)) {
                disconnectedClients.push(clientId);
            }
        });

        // Clean up disconnected clients
        disconnectedClients.forEach((clientId) => {
            this.clients.delete(clientId);
        });
    }

    /**
     * Check if a client is connected
     */
    isConnected(clientId: string): boolean {
        return this.clients.has(clientId);
    }

    /**
     * Get number of connected clients
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Disconnect a client
     */
    disconnect(clientId: string): void {
        const res = this.clients.get(clientId);
        if (res) {
            res.end();
            this.clients.delete(clientId);
        }
    }

    /**
     * Disconnect all clients
     */
    disconnectAll(): void {
        this.clients.forEach((res, clientId) => {
            res.end();
            this.logger.debug('Disconnected SSE client', { clientId });
        });
        this.clients.clear();
    }
}
