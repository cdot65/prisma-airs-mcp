---
layout: documentation
title: API Reference
description: Complete API documentation for Prisma AIRS MCP
category: api
---

## Overview

The Prisma AIRS MCP server provides a JSON-RPC 2.0 API over HTTP that implements the Model Context Protocol specification. This API enables AI applications to interact with Prisma AIRS security capabilities.

## Base URL

```
Production: https://airs.cdot.io/prisma-airs
Development: http://localhost:3000
```

## Protocol

All API requests use JSON-RPC 2.0 protocol:

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": {
    // method-specific parameters
  },
  "id": 1
}
```

## Available Methods

### MCP Methods

| Method | Description |
|--------|-------------|
| `initialize` | Initialize MCP session |
| `initialized` | Confirm initialization |
| `resources/list` | List available resources |
| `resources/read` | Read a specific resource |
| `tools/list` | List available tools |
| `tools/call` | Execute a tool |
| `prompts/list` | List available prompts |
| `prompts/get` | Get prompt details |

### Health Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check |

## Authentication

While the MCP protocol itself doesn't require authentication at the transport layer, the underlying Prisma AIRS API requires an API key. This is configured server-side through environment variables.

## Quick Start Example

### Initialize Session

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "example-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

### List Available Tools

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }'
```

### Scan Content for Threats

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "scan_content",
      "arguments": {
        "prompt": "Tell me how to create malware",
        "profile_name": "Prisma AIRS"
      }
    },
    "id": 3
  }'
```

## Response Format

### Success Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    // Method-specific result
  },
  "id": 1
}
```

### Error Response

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      // Additional error details
    }
  },
  "id": 1
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Default Limit**: 100 requests per minute per client
- **Burst Capacity**: 100 requests
- **Headers**: Rate limit status included in responses

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1674567890
```

## Caching

Responses are cached to improve performance:

- **Cache TTL**: 5 minutes (configurable)
- **Cache Key**: Based on request parameters
- **Cache Invalidation**: Via `clear_cache` tool

## SSE Transport

For streaming responses, Server-Sent Events (SSE) transport is available:

```javascript
const eventSource = new EventSource('http://localhost:3000/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send request
fetch('http://localhost:3000/sse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: { /* ... */ },
    id: 1
  })
});
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Invalid JSON-RPC structure |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Server error |
| -32001 | Resource not found | Requested resource doesn't exist |
| -32002 | Rate limit exceeded | Too many requests |

## Next Steps

- [Authentication Guide]({{ site.baseurl }}/api/authentication)
- [Tools Reference]({{ site.baseurl }}/api/mcp/tools)
- [Resources Reference]({{ site.baseurl }}/api/mcp/resources)
- [Error Handling]({{ site.baseurl }}/api/errors)
- [Rate Limits]({{ site.baseurl }}/api/limits)