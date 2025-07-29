---
layout: documentation
title: SSE Transport
permalink: /developers/src/transport/sse/
category: developers
---

# SSE Transport (src/transport/sse.ts)

Server-Sent Events transport for real-time, unidirectional communication from server to MCP clients. Enables streaming responses and notifications.

## Core Purpose

- Manage SSE connections for clients
- Format and send SSE-compliant messages
- Handle JSON-RPC over SSE
- Support server notifications

## Key Components

### SSETransport Class

```typescript
export class SSETransport {
    private clients: Map<string, Response>
    private messageId: number
    
    // Main methods
    initializeSSE(): Sets up connection
    sendEvent(): Sends SSE message
    sendJsonRpcResponse(): Sends JSON-RPC
    broadcast(): Send to all clients
    disconnect(): Close connection
}
```

## SSE Message Format

### Structure
```
id: 123
event: message
retry: 5000
data: {"jsonrpc":"2.0","result":{}}

```

### Headers
| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Type` | `text/event-stream` | SSE stream |
| `Cache-Control` | `no-cache` | No caching |
| `Connection` | `keep-alive` | Persistent |
| `X-Accel-Buffering` | `no` | No buffering |

## Integration in Application

- **Used By**: HTTP transport for streaming
- **Protocol**: SSE over HTTP
- **Format**: JSON-RPC messages
- **Events**: connect, message, notification

## Event Types

### Standard Events
- **connect**: Initial connection
- **message**: JSON-RPC response
- **notification**: Server update
- **endpoint**: Legacy compatibility

### Custom Events
- **progress**: Operation progress
- **error**: Error notification
- **ping**: Keep-alive

## Connection Management

### Lifecycle
1. Initialize with headers
2. Send connect event
3. Handle messages
4. Clean up on close

### Features
- Auto-cleanup on disconnect
- Connection status tracking
- Broadcast capabilities

## Message Sending

```typescript
// Send event
sendEvent(clientId, {
    event: 'message',
    data: JSON.stringify(response)
});

// Broadcast to all
broadcast({
    event: 'notification',
    data: JSON.stringify(update)
});
```

## Client Integration

### JavaScript EventSource
```javascript
const source = new EventSource('/sse/connect');

source.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
});

source.addEventListener('error', (e) => {
    // Auto-reconnects
});
```

## Key Features

### Error Handling
- Connection error recovery
- Client cleanup on failure
- Structured error logging

### Performance
- O(1) client lookups
- Efficient broadcasting
- Optional keep-alive

### Security
- Session validation
- Connection limits
- Data sanitization

## Usage Example

```typescript
// Initialize connection
transport.initializeSSE(res, clientId);

// Send JSON-RPC response
transport.sendJsonRpcResponse(clientId, {
    jsonrpc: '2.0',
    result: data,
    id: requestId
});

// Send notification
transport.sendNotification(clientId, 
    'resources/changed',
    { uri: 'airs://scan-results/123' }
);

// Clean up
transport.disconnect(clientId);
```

## Related Modules

- [HTTP Transport]({{ site.baseurl }}/developers/src/transport/http/) - Main transport layer
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Type definitions
- [Logger]({{ site.baseurl }}/developers/src/utils/logger/) - Debug logging