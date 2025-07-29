---
layout: documentation
title: SSE Transport
permalink: /developers/src/transport/sse/
category: developers
---

# SSE Transport (src/transport/sse.ts)

The SSE (Server-Sent Events) transport module provides real-time, unidirectional communication from the server to
connected MCP clients. It enables streaming responses, notifications, and long-running operation updates.

## Overview

The SSETransport class:

- Manages SSE connections for multiple clients
- Formats and sends SSE-compliant messages
- Handles JSON-RPC responses over SSE
- Supports server-initiated notifications
- Provides connection lifecycle management

## Core Implementation

### SSETransport Class

```typescript
import type { Response } from 'express';
import type { Logger } from 'winston';
import type { TransportJsonRpcResponse, TransportSSEMessage } from '../types';

export class SSETransport {
    private clients: Map<string, Response> = new Map();
    private messageId = 0;

    constructor(private logger: Logger) {}
```

## Connection Management

### Initialize SSE Connection

```typescript
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
```

### SSE Headers

| Header              | Value               | Purpose                         |
|---------------------|---------------------|---------------------------------|
| `Content-Type`      | `text/event-stream` | Identifies SSE stream           |
| `Cache-Control`     | `no-cache`          | Prevents caching                |
| `Connection`        | `keep-alive`        | Maintains persistent connection |
| `X-Accel-Buffering` | `no`                | Disables proxy buffering        |

## Message Sending

### Send Event Method

```typescript
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
```

### SSE Message Format

```
id: 123
event: message
retry: 5000
data: {"jsonrpc":"2.0","result":{"success":true}}

```

## Message Types

### JSON-RPC Response

```typescript
sendJsonRpcResponse(clientId: string, response: TransportJsonRpcResponse): boolean {
    const messageId = String(++this.messageId);

    return this.sendEvent(clientId, {
        id: messageId,
        event: 'message',
        data: JSON.stringify(response),
    });
}
```

**Example SSE Output:**

```
id: 1
event: message
data: {"jsonrpc":"2.0","result":{"tools":[...]},"id":"req-123"}

```

### Server Notifications

```typescript
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
```

**Example Notification:**

```
event: notification
data: {"jsonrpc":"2.0","method":"resources/changed","params":{"uri":"airs://scan-results/123"}}

```

## Broadcasting

### Broadcast to All Clients

```typescript
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
```

**Use Cases:**

- System-wide notifications
- Resource updates
- Server status changes

## Connection Status

### Check Connection

```typescript
isConnected(clientId: string): boolean {
    return this.clients.has(clientId);
}
```

### Get Client Count

```typescript
getClientCount(): number {
    return this.clients.size;
}
```

## Connection Termination

### Disconnect Single Client

```typescript
disconnect(clientId: string): void {
    const res = this.clients.get(clientId);
    if (res) {
        res.end();
        this.clients.delete(clientId);
    }
}
```

### Disconnect All Clients

```typescript
disconnectAll(): void {
    this.clients.forEach((res, clientId) => {
        res.end();
        this.logger.debug('Disconnected SSE client', { clientId });
    });
    this.clients.clear();
}
```

## Event Types

### Standard Events

| Event          | Purpose             | Data Format                 |
|----------------|---------------------|-----------------------------|
| `connect`      | Initial connection  | `{"connected": true}`       |
| `message`      | JSON-RPC response   | JSON-RPC response object    |
| `notification` | Server notification | JSON-RPC notification       |
| `endpoint`     | Endpoint info       | `{"endpoint": "/messages"}` |

### Custom Events

```typescript
// Progress event
this.sendEvent(clientId, {
    event: 'progress',
    data: JSON.stringify({
        operation: 'scan',
        progress: 50,
        message: 'Scanning content...'
    })
});

// Error event
this.sendEvent(clientId, {
    event: 'error',
    data: JSON.stringify({
        code: 'SCAN_FAILED',
        message: 'Scan operation failed'
    })
});
```

## Error Handling

### Connection Error Handling

```typescript
try {
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
```

### Client Disconnect Detection

```typescript
res.on('close', () => {
    this.logger.debug('SSE client disconnected', { clientId });
    this.clients.delete(clientId);
});
```

## Best Practices

### 1. Message ID Management

```typescript
// Incrementing message IDs for ordering
private messageId = 0;

const messageId = String(++this.messageId);
```

### 2. Data Formatting

```typescript
// Handle multi-line data correctly
const dataLines = message.data.split('\n');
dataLines.forEach((line) => {
    lines.push(`data: ${line}`);
});
```

### 3. Connection Cleanup

```typescript
// Always clean up on errors
catch (error) {
    this.clients.delete(clientId);
    return false;
}
```

### 4. Reconnection Support

```typescript
// Set retry interval for automatic reconnection
if (message.retry) {
    lines.push(`retry: ${message.retry}`);
}
```

## Client Integration

### JavaScript EventSource

```javascript
const eventSource = new EventSource('/sse/connect', {
    headers: {
        'Mcp-Session-Id': sessionId
    }
});

eventSource.addEventListener('message', (event) => {
    const response = JSON.parse(event.data);
    console.log('Received:', response);
});

eventSource.addEventListener('notification', (event) => {
    const notification = JSON.parse(event.data);
    console.log('Notification:', notification);
});

eventSource.addEventListener('error', (event) => {
    console.error('SSE Error:', event);
    // EventSource will automatically reconnect
});
```

### Reconnection Handling

```javascript
let reconnectAttempts = 0;

eventSource.addEventListener('error', (event) => {
    if (eventSource.readyState === EventSource.CLOSED) {
        reconnectAttempts++;
        if (reconnectAttempts > 5) {
            eventSource.close();
            console.error('Max reconnection attempts reached');
        }
    }
});

eventSource.addEventListener('open', () => {
    reconnectAttempts = 0;
    console.log('SSE connection established');
});
```

## Testing

### Unit Tests

```typescript
describe('SSETransport', () => {
    let transport: SSETransport;
    let mockLogger: jest.Mocked<Logger>;
    let mockResponse: jest.Mocked<Response>;

    beforeEach(() => {
        mockLogger = createMockLogger();
        mockResponse = createMockResponse();
        transport = new SSETransport(mockLogger);
    });

    describe('initializeSSE', () => {
        it('should set correct headers', () => {
            transport.initializeSSE(mockResponse, 'client-123');

            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'text/event-stream'
            );
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'no-cache'
            );
        });

        it('should send connect event', () => {
            transport.initializeSSE(mockResponse, 'client-123');

            expect(mockResponse.write).toHaveBeenCalledWith(
                expect.stringContaining('event: connect')
            );
        });
    });

    describe('sendEvent', () => {
        it('should format SSE message correctly', () => {
            transport.initializeSSE(mockResponse, 'client-123');
            
            const sent = transport.sendEvent('client-123', {
                id: '1',
                event: 'test',
                data: 'test data'
            });

            expect(sent).toBe(true);
            expect(mockResponse.write).toHaveBeenCalledWith(
                'id: 1\nevent: test\ndata: test data\n\n'
            );
        });
    });
});
```

### Integration Tests

```typescript
it('should handle client lifecycle', async () => {
    const server = createTestServer();
    const transport = new SSETransport(logger);
    
    // Connect client
    const res = await request(server)
        .get('/sse/connect')
        .set('Accept', 'text/event-stream');
    
    expect(transport.getClientCount()).toBe(1);
    
    // Disconnect
    res.abort();
    await delay(100);
    
    expect(transport.getClientCount()).toBe(0);
});
```

## Performance Considerations

### Connection Management

```typescript
// Efficient client lookup
private clients: Map<string, Response> = new Map();

// O(1) operations
this.clients.get(clientId);
this.clients.has(clientId);
this.clients.delete(clientId);
```

### Message Buffering

```typescript
// Consider implementing message queue for high-volume scenarios
class BufferedSSETransport extends SSETransport {
    private messageQueue: Map<string, TransportSSEMessage[]> = new Map();
    
    queueMessage(clientId: string, message: TransportSSEMessage): void {
        const queue = this.messageQueue.get(clientId) || [];
        queue.push(message);
        this.messageQueue.set(clientId, queue);
    }
    
    flushQueue(clientId: string): void {
        const queue = this.messageQueue.get(clientId) || [];
        queue.forEach(message => this.sendEvent(clientId, message));
        this.messageQueue.delete(clientId);
    }
}
```

### Keep-Alive

```typescript
// Periodic keep-alive to maintain connection
private startKeepAlive(): void {
    setInterval(() => {
        this.broadcast({
            event: 'ping',
            data: new Date().toISOString()
        });
    }, 30000); // Every 30 seconds
}
```

## Security Considerations

### Authentication

```typescript
// Validate client before accepting connection
initializeSSE(res: Response, clientId: string, token?: string): void {
    if (!this.validateToken(token)) {
        res.status(401).end();
        return;
    }
    // ... continue with initialization
}
```

### Data Sanitization

```typescript
// Sanitize data before sending
private sanitizeData(data: string): string {
    // Remove any potential SSE control characters
    return data.replace(/[\r\n]/g, ' ');
}
```

### Connection Limits

```typescript
// Limit connections per client
private readonly MAX_CONNECTIONS_PER_CLIENT = 5;

private getClientConnectionCount(clientPrefix: string): number {
    let count = 0;
    this.clients.forEach((_, clientId) => {
        if (clientId.startsWith(clientPrefix)) count++;
    });
    return count;
}
```

## Monitoring and Debugging

### Connection Metrics

```typescript
getMetrics(): {
    totalConnections: number;
    messagesSent: number;
    errors: number;
} {
    return {
        totalConnections: this.clients.size,
        messagesSent: this.messageId,
        errors: this.errorCount,
    };
}
```

### Debug Logging

```typescript
this.logger.debug('SSE event sent', {
    clientId,
    event: message.event,
    dataSize: message.data.length,
    messageId: message.id
});
```

## Future Enhancements

### Planned Features

1. **Message History**
   ```typescript
   // Store recent messages for replay on reconnect
   private messageHistory: CircularBuffer<TransportSSEMessage>;
   ```

2. **Compression**
   ```typescript
   // Compress large messages
   res.setHeader('Content-Encoding', 'gzip');
   ```

3. **Binary Support**
   ```typescript
   // Base64 encode binary data
   data: Buffer.from(binaryData).toString('base64')
   ```

4. **Channel Support**
   ```typescript
   // Subscribe to specific channels
   subscribeToChannel(clientId: string, channel: string): void;
   ```

## Related Documentation

- [Transport Overview]({{ site.baseurl }}/developers/src/transport/overview/) - Module overview
- [HTTP Transport]({{ site.baseurl }}/developers/src/transport/http/) - HTTP implementation
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Type definitions
- [SSE Specification](https://www.w3.org/TR/eventsource/) - W3C EventSource spec