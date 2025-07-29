---
layout: documentation
title: Transport Types
permalink: /developers/src/types/transport-types/
category: developers
---

# Transport Types (src/types/transport.ts)

The transport types module defines TypeScript interfaces for the communication layer between MCP clients and servers.
These types ensure type safety for HTTP and SSE transport implementations.

## Overview

The transport types provide:

- HTTP transport request/response structures
- SSE event definitions
- Session management interfaces
- Connection state types
- Transport configuration options

## Core Transport Types

### TransportMessage

Base message structure for transport layer.

```typescript
export interface TransportMessage {
    /** Message type identifier */
    type: 'request' | 'response' | 'notification' | 'error';
    
    /** Payload data */
    payload: unknown;
    
    /** Optional message metadata */
    metadata?: MessageMetadata;
}

export interface MessageMetadata {
    /** Timestamp of message creation */
    timestamp: string;
    
    /** Message priority */
    priority?: 'low' | 'normal' | 'high';
    
    /** Compression applied */
    compressed?: boolean;
    
    /** Encoding format */
    encoding?: 'json' | 'msgpack' | 'protobuf';
}
```

### TransportRequest

HTTP transport request structure.

```typescript
export interface TransportRequest {
    /** HTTP method */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    
    /** Request path */
    path: string;
    
    /** Request headers */
    headers: Record<string, string | string[]>;
    
    /** Request body */
    body?: unknown;
    
    /** Query parameters */
    query?: Record<string, string | string[]>;
    
    /** Session information */
    session?: SessionInfo;
}
```

### TransportResponse

HTTP transport response structure.

```typescript
export interface TransportResponse {
    /** HTTP status code */
    status: number;
    
    /** Response headers */
    headers: Record<string, string | string[]>;
    
    /** Response body */
    body?: unknown;
    
    /** Response metadata */
    metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
    /** Processing duration in ms */
    duration?: number;
    
    /** Cache status */
    cached?: boolean;
    
    /** Rate limit info */
    rateLimit?: {
        limit: number;
        remaining: number;
        reset: string;
    };
}
```

## Session Types

### SessionInfo

Session management information.

```typescript
export interface SessionInfo {
    /** Unique session identifier */
    id: string;
    
    /** Client information */
    client?: ClientInfo;
    
    /** Session state data */
    state: Record<string, unknown>;
    
    /** Session creation time */
    created: string;
    
    /** Last activity time */
    lastActivity: string;
    
    /** Session expiry time */
    expires?: string;
}

export interface ClientInfo {
    /** Client identifier */
    id?: string;
    
    /** Client name/type */
    name?: string;
    
    /** Client version */
    version?: string;
    
    /** Client IP address */
    ip?: string;
    
    /** User agent string */
    userAgent?: string;
}
```

### SessionManager

Session management interface.

```typescript
export interface SessionManager {
    /** Create new session */
    create(client?: ClientInfo): SessionInfo;
    
    /** Get existing session */
    get(id: string): SessionInfo | undefined;
    
    /** Update session state */
    update(id: string, state: Partial<SessionInfo>): void;
    
    /** Delete session */
    delete(id: string): void;
    
    /** Clean expired sessions */
    cleanup(): void;
}
```

## SSE Types

### SSEEvent

Server-Sent Event structure.

```typescript
export interface SSEEvent {
    /** Event type/name */
    event?: string;
    
    /** Event data (will be JSON stringified) */
    data: unknown;
    
    /** Event ID for reconnection */
    id?: string;
    
    /** Retry interval in milliseconds */
    retry?: number;
}
```

### SSEConnection

SSE connection management.

```typescript
export interface SSEConnection {
    /** Connection ID */
    id: string;
    
    /** Associated session */
    sessionId?: string;
    
    /** Connection state */
    state: 'connecting' | 'open' | 'closing' | 'closed';
    
    /** Send event to client */
    send(event: SSEEvent): void;
    
    /** Close connection */
    close(): void;
    
    /** Connection metadata */
    metadata?: {
        created: string;
        lastPing?: string;
        messageCount: number;
    };
}
```

### SSEManager

SSE connection manager interface.

```typescript
export interface SSEManager {
    /** Register new connection */
    register(connection: SSEConnection): void;
    
    /** Get connection by ID */
    get(id: string): SSEConnection | undefined;
    
    /** Get all connections for session */
    getBySession(sessionId: string): SSEConnection[];
    
    /** Broadcast to all connections */
    broadcast(event: SSEEvent): void;
    
    /** Broadcast to session connections */
    broadcastToSession(sessionId: string, event: SSEEvent): void;
    
    /** Remove connection */
    remove(id: string): void;
}
```

## Transport Configuration

### TransportConfig

Transport layer configuration.

```typescript
export interface TransportConfig {
    /** HTTP server configuration */
    http?: HttpConfig;
    
    /** SSE configuration */
    sse?: SSEConfig;
    
    /** Session configuration */
    session?: SessionConfig;
    
    /** Security settings */
    security?: SecurityConfig;
}

export interface HttpConfig {
    /** Server port */
    port: number;
    
    /** Bind address */
    host?: string;
    
    /** Request timeout in ms */
    timeout?: number;
    
    /** Max request size */
    maxBodySize?: string;
    
    /** Enable compression */
    compression?: boolean;
}

export interface SSEConfig {
    /** Keep-alive interval in ms */
    keepAliveInterval?: number;
    
    /** Max connections per session */
    maxConnectionsPerSession?: number;
    
    /** Connection timeout in ms */
    connectionTimeout?: number;
    
    /** Enable compression */
    compression?: boolean;
}

export interface SessionConfig {
    /** Session TTL in seconds */
    ttl?: number;
    
    /** Max sessions */
    maxSessions?: number;
    
    /** Cleanup interval in ms */
    cleanupInterval?: number;
    
    /** Session storage backend */
    storage?: 'memory' | 'redis';
}

export interface SecurityConfig {
    /** Enable CORS */
    cors?: CorsConfig;
    
    /** Rate limiting */
    rateLimit?: RateLimitConfig;
    
    /** Authentication */
    auth?: AuthConfig;
}
```

## Error Types

### TransportError

Transport layer error class.

```typescript
export class TransportError extends Error {
    constructor(
        message: string,
        public code: TransportErrorCode,
        public statusCode?: number,
        public details?: unknown
    ) {
        super(message);
        this.name = 'TransportError';
    }
}

export enum TransportErrorCode {
    /** Connection errors */
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
    CONNECTION_CLOSED = 'CONNECTION_CLOSED',
    
    /** Session errors */
    SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    SESSION_INVALID = 'SESSION_INVALID',
    
    /** Protocol errors */
    PROTOCOL_ERROR = 'PROTOCOL_ERROR',
    INVALID_MESSAGE = 'INVALID_MESSAGE',
    UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
    
    /** Transport errors */
    TRANSPORT_ERROR = 'TRANSPORT_ERROR',
    TIMEOUT = 'TIMEOUT',
    PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE'
}
```

## Connection State Types

### ConnectionState

Connection state tracking.

```typescript
export interface ConnectionState {
    /** Current state */
    status: 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';
    
    /** State change timestamp */
    since: string;
    
    /** Error if in error state */
    error?: TransportError;
    
    /** Connection metrics */
    metrics?: ConnectionMetrics;
}

export interface ConnectionMetrics {
    /** Messages sent */
    messagesSent: number;
    
    /** Messages received */
    messagesReceived: number;
    
    /** Bytes sent */
    bytesSent: number;
    
    /** Bytes received */
    bytesReceived: number;
    
    /** Connection duration in ms */
    duration: number;
    
    /** Average latency in ms */
    avgLatency?: number;
}
```

## Type Guards and Validators

### Type validation helpers

```typescript
/** Check if valid transport message */
export function isTransportMessage(obj: unknown): obj is TransportMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'type' in obj &&
        'payload' in obj
    );
}

/** Check if SSE event */
export function isSSEEvent(obj: unknown): obj is SSEEvent {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'data' in obj
    );
}

/** Check if transport error */
export function isTransportError(error: unknown): error is TransportError {
    return error instanceof TransportError;
}

/** Validate session ID format */
export function isValidSessionId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{16,64}$/.test(id);
}
```

## Usage Examples

### HTTP Transport Implementation

```typescript
import { TransportRequest, TransportResponse } from '../types/transport';

class HttpTransport {
    async handleRequest(req: TransportRequest): Promise<TransportResponse> {
        const start = Date.now();
        
        try {
            // Process request
            const result = await this.processRequest(req);
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Response-Time': `${Date.now() - start}ms`
                },
                body: result,
                metadata: {
                    duration: Date.now() - start,
                    cached: false
                }
            };
        } catch (error) {
            if (isTransportError(error)) {
                return {
                    status: error.statusCode || 500,
                    headers: { 'Content-Type': 'application/json' },
                    body: {
                        error: {
                            code: error.code,
                            message: error.message
                        }
                    }
                };
            }
            throw error;
        }
    }
}
```

### SSE Connection Management

```typescript
import { SSEConnection, SSEEvent, SSEManager } from '../types/transport';

class SSEConnectionImpl implements SSEConnection {
    id: string;
    state: SSEConnection['state'] = 'connecting';
    
    constructor(private res: Response) {
        this.id = generateId();
        this.setupConnection();
    }
    
    send(event: SSEEvent): void {
        if (this.state !== 'open') {
            throw new TransportError(
                'Connection not open',
                TransportErrorCode.CONNECTION_CLOSED
            );
        }
        
        let message = '';
        if (event.event) message += `event: ${event.event}\n`;
        if (event.id) message += `id: ${event.id}\n`;
        if (event.retry) message += `retry: ${event.retry}\n`;
        message += `data: ${JSON.stringify(event.data)}\n\n`;
        
        this.res.write(message);
    }
    
    close(): void {
        this.state = 'closing';
        this.res.end();
        this.state = 'closed';
    }
}
```

### Session Management

```typescript
import { SessionInfo, SessionManager } from '../types/transport';

class InMemorySessionManager implements SessionManager {
    private sessions = new Map<string, SessionInfo>();
    
    create(client?: ClientInfo): SessionInfo {
        const session: SessionInfo = {
            id: generateSessionId(),
            client,
            state: {},
            created: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        
        this.sessions.set(session.id, session);
        return session;
    }
    
    get(id: string): SessionInfo | undefined {
        const session = this.sessions.get(id);
        if (session) {
            // Update last activity
            session.lastActivity = new Date().toISOString();
        }
        return session;
    }
    
    update(id: string, state: Partial<SessionInfo>): void {
        const session = this.sessions.get(id);
        if (session) {
            Object.assign(session, state);
            session.lastActivity = new Date().toISOString();
        }
    }
    
    delete(id: string): void {
        this.sessions.delete(id);
    }
    
    cleanup(): void {
        const now = Date.now();
        const ttl = 3600000; // 1 hour
        
        for (const [id, session] of this.sessions) {
            const lastActivity = new Date(session.lastActivity).getTime();
            if (now - lastActivity > ttl) {
                this.sessions.delete(id);
            }
        }
    }
}
```

## Best Practices

### 1. Use Proper Error Types

```typescript
// Good - specific error
throw new TransportError(
    'Session expired',
    TransportErrorCode.SESSION_EXPIRED,
    401
);

// Bad - generic error
throw new Error('Session expired');
```

### 2. Validate Session IDs

```typescript
// Always validate session IDs
if (!isValidSessionId(sessionId)) {
    throw new TransportError(
        'Invalid session ID format',
        TransportErrorCode.SESSION_INVALID,
        400
    );
}
```

### 3. Track Connection Metrics

```typescript
interface ConnectionTracker {
    metrics: ConnectionMetrics;
    
    trackMessage(direction: 'sent' | 'received', size: number): void {
        if (direction === 'sent') {
            this.metrics.messagesSent++;
            this.metrics.bytesSent += size;
        } else {
            this.metrics.messagesReceived++;
            this.metrics.bytesReceived += size;
        }
    }
}
```

### 4. Handle State Transitions

```typescript
class StatefulConnection {
    private state: ConnectionState = {
        status: 'idle',
        since: new Date().toISOString()
    };
    
    transition(newStatus: ConnectionState['status']): void {
        // Validate transition
        if (!this.isValidTransition(this.state.status, newStatus)) {
            throw new TransportError(
                `Invalid state transition: ${this.state.status} -> ${newStatus}`,
                TransportErrorCode.PROTOCOL_ERROR
            );
        }
        
        this.state = {
            status: newStatus,
            since: new Date().toISOString(),
            metrics: this.state.metrics
        };
    }
}
```

## Testing

### Mock Transport Types

```typescript
export const mockTransportRequest: TransportRequest = {
    method: 'POST',
    path: '/api/test',
    headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': 'test-session-123'
    },
    body: { test: true },
    session: {
        id: 'test-session-123',
        state: {},
        created: '2024-01-15T10:00:00Z',
        lastActivity: '2024-01-15T10:30:00Z'
    }
};

export const mockSSEEvent: SSEEvent = {
    event: 'progress',
    data: { percent: 50, message: 'Processing...' },
    id: 'evt-123'
};
```

### Type Testing

```typescript
import { expectType } from 'tsd';

// Test type inference
const req: TransportRequest = mockTransportRequest;
expectType<'GET' | 'POST' | 'PUT' | 'DELETE'>(req.method);
expectType<SessionInfo | undefined>(req.session);

// Test error types
const error = new TransportError('Test', TransportErrorCode.TIMEOUT);
expectType<TransportErrorCode>(error.code);
```

## Related Documentation

- [Transport Overview]({{ site.baseurl }}/developers/src/transport/overview/) - Transport module
- [HTTP Transport]({{ site.baseurl }}/developers/src/transport/http/) - HTTP implementation
- [SSE Transport]({{ site.baseurl }}/developers/src/transport/sse/) - SSE implementation
- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types