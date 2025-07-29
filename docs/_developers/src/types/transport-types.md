---
layout: documentation
title: Transport Types
permalink: /developers/src/types/transport-types/
category: developers
---

TypeScript interfaces for transport layer communication. Defines HTTP, SSE, and session management types for MCP client-server interaction.

## Core Purpose

- Define transport layer interfaces
- Structure HTTP/SSE communication
- Enable session management
- Provide type-safe errors

## Key Interfaces

### Transport Message

```typescript
interface TransportMessage {
    type: 'request' | 'response' | 'notification' | 'error'
    payload: unknown
    metadata?: MessageMetadata
}
```

### HTTP Types

```typescript
interface TransportRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    headers: Record<string, string | string[]>
    body?: unknown
    session?: SessionInfo
}

interface TransportResponse {
    status: number
    headers: Record<string, string | string[]>
    body?: unknown
    metadata?: ResponseMetadata
}
```

### SSE Types

```typescript
interface SSEEvent {
    event?: string          // Event type
    data: unknown          // JSON payload
    id?: string           // Reconnection ID
    retry?: number        // Retry interval
}

interface SSEConnection {
    id: string
    state: 'connecting' | 'open' | 'closing' | 'closed'
    send(event: SSEEvent): void
    close(): void
}
```

### Session Management

```typescript
interface SessionInfo {
    id: string
    client?: ClientInfo
    state: Record<string, unknown>
    created: string
    lastActivity: string
}

interface SessionManager {
    create(client?: ClientInfo): SessionInfo
    get(id: string): SessionInfo | undefined
    update(id: string, state: Partial<SessionInfo>): void
    delete(id: string): void
    cleanup(): void
}
```

## Integration in Application

- **Used By**: HTTP/SSE transport implementations
- **Pattern**: Request/response with sessions
- **Validation**: Type guards for runtime checks
- **Errors**: TransportError with error codes

## Error Handling

```typescript
class TransportError extends Error {
    constructor(
        message: string,
        public code: TransportErrorCode,
        public statusCode?: number
    )
}

enum TransportErrorCode {
    CONNECTION_FAILED,
    SESSION_EXPIRED,
    PROTOCOL_ERROR,
    TIMEOUT
}
```

## Type Guards

```typescript
// Validate transport message
function isTransportMessage(obj: unknown): obj is TransportMessage {
    return obj && 'type' in obj && 'payload' in obj
}

// Validate session ID
function isValidSessionId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{16,64}$/.test(id)
}
```

## Usage Example

```typescript
// HTTP transport
async function handleRequest(
    req: TransportRequest
): Promise<TransportResponse> {
    try {
        const result = await processRequest(req);
        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: result
        };
    } catch (error) {
        if (isTransportError(error)) {
            return {
                status: error.statusCode || 500,
                headers: { 'Content-Type': 'application/json' },
                body: { error: { code: error.code } }
            };
        }
        throw error;
    }
}

// SSE connection
class SSEImpl implements SSEConnection {
    send(event: SSEEvent): void {
        let message = '';
        if (event.event) message += `event: ${event.event}\n`;
        message += `data: ${JSON.stringify(event.data)}\n\n`;
        this.response.write(message);
    }
}
```

## Key Features

### Type Safety

- Strict interface definitions
- Union types for states
- Optional field handling

### Session Support

- Client tracking
- State persistence
- Activity monitoring

### Error Codes

- Categorized errors
- HTTP status mapping
- Detailed diagnostics

## Related Modules

- [HTTP Transport]({{ site.baseurl }}/developers/src/transport/http/) - HTTP implementation
- [SSE Transport]({{ site.baseurl }}/developers/src/transport/sse/) - SSE implementation
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system
