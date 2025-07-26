/**
 * Centralized Transport module type definitions
 * All types are prefixed with 'Transport' to avoid namespace conflicts
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Request } from 'express';
import type { Logger } from 'winston';

// JSON-RPC types
export interface TransportJsonRpcRequest {
    jsonrpc: '2.0';
    method: string;
    params?: unknown;
    id: string | number | null;
}

export interface TransportJsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}

export interface TransportJsonRpcResponse {
    jsonrpc: '2.0';
    result?: unknown;
    error?: TransportJsonRpcError;
    id: string | number | null;
}

// HTTP Transport types
export interface TransportHttpOptions {
    server: Server;
    logger: Logger;
}

export interface TransportStreamableRequest extends Request {
    headers: {
        accept?: string;
        'last-event-id'?: string;
        'mcp-session-id'?: string;
    } & Request['headers'];
}

// SSE (Server-Sent Events) types
export interface TransportSSEMessage {
    id?: string;
    event?: string;
    data: string;
    retry?: number;
}
