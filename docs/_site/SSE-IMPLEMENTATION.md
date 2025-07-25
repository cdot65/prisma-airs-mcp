# SSE Implementation for Streamable HTTP Transport

This document describes the Server-Sent Events (SSE) implementation for the MCP server's Streamable HTTP transport.

## Overview

The Streamable HTTP transport extends the standard HTTP transport by adding support for Server-Sent Events (SSE), enabling:

- Server-to-client streaming of responses
- Long-running operation updates
- Real-time notifications
- Backwards compatibility with legacy SSE transport

## Architecture

### Components

1. **SSETransport** (`src/transport/sse.ts`)
   - Manages SSE connections and client state
   - Handles message formatting and delivery
   - Provides connection lifecycle management

2. **HttpServerTransport** (`src/transport/http.ts`)
   - Extended to support both standard JSON and SSE responses
   - Session management for stateful connections
   - Automatic detection of SSE-capable clients

## Protocol Support

### Client-to-Server (POST /)

Clients send standard JSON-RPC 2.0 requests with optional SSE support:

```http
POST / HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
Mcp-Session-Id: <optional-session-id>

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {...},
  "id": 1
}
```

### Server-to-Client Responses

The server can respond in two ways:

1. **Standard JSON Response** (default)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "result": {...},
  "id": 1
}
```

2. **SSE Stream** (when client accepts and method supports streaming)

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Mcp-Session-Id: <session-id>

event: connect
data: {"connected": true}

id: 1
event: message
data: {"jsonrpc":"2.0","result":{...},"id":1}
```

### Server-Initiated Streams (GET /)

Clients can establish persistent SSE connections:

```http
GET / HTTP/1.1
Accept: text/event-stream
Last-Event-ID: <optional-last-event-id>
Mcp-Session-Id: <optional-session-id>
```

## Features

### Session Management

- Automatic session creation with UUID v4
- Session persistence across requests
- Session ID returned in `Mcp-Session-Id` header

### Event Types

- `connect` - Initial connection confirmation
- `endpoint` - Legacy compatibility event
- `message` - JSON-RPC responses
- `notification` - Server-initiated notifications

### Streaming Decision Logic

The server determines whether to stream based on:

1. Client accepts `text/event-stream`
2. Method is configured as streamable
3. Response characteristics (size, duration, etc.)

Currently configured streamable methods:

- `tools/call` - Long-running tool executions
- `resources/read` - Large resource transfers

### Connection Management

- Automatic cleanup on client disconnect
- Configurable timeouts
- Graceful shutdown handling
- Multiple concurrent connections support

## Usage Examples

### JavaScript/Node.js Client

```javascript
const EventSource = require('eventsource');

// Establish SSE connection
const es = new EventSource('http://localhost:3000', {
  headers: {
    Accept: 'text/event-stream',
    'Mcp-Session-Id': 'my-session-123',
  },
});

es.addEventListener('message', (event) => {
  const response = JSON.parse(event.data);
  console.log('Received:', response);
});

// Send request expecting SSE response
const response = await fetch('http://localhost:3000', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: { tool: 'long-running-tool' },
    id: 1,
  }),
});

if (response.headers.get('content-type')?.includes('text/event-stream')) {
  // Handle SSE stream
  const reader = response.body.getReader();
  // Process stream...
}
```

### Testing

Use the provided example client:

```bash
# Install dependencies
npm install eventsource

# Run the example
node examples/sse-client.js
```

## Security Considerations

1. **Origin Validation**: Implement CORS and validate Origin headers
2. **Session Security**: Use cryptographically secure session IDs
3. **Rate Limiting**: Apply per-session rate limits
4. **Connection Limits**: Limit concurrent SSE connections per client
5. **Timeouts**: Implement appropriate connection timeouts

## Future Enhancements

1. **Streaming Tool Results**: Stream partial results for long-running tools
2. **Progress Updates**: Send progress notifications during processing
3. **Chunked Resources**: Stream large resources in chunks
4. **Bidirectional Streaming**: Full duplex communication via WebSockets
5. **Compression**: Support for SSE data compression

## Backwards Compatibility

The implementation supports legacy SSE clients by:

1. Sending `endpoint` events on connection
2. Supporting the `/messages` endpoint reference
3. Accepting connections without session IDs
4. Graceful fallback to standard JSON responses

## Configuration

Future configuration options may include:

```typescript
{
  sse: {
    enabled: true,
    maxConnections: 100,
    connectionTimeout: 300000, // 5 minutes
    heartbeatInterval: 30000,  // 30 seconds
    streamableMethod: ['tools/call', 'resources/read'],
    compressionThreshold: 1024 * 10 // 10KB
  }
}
```
