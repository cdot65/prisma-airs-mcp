---
layout: documentation
title: API Reference
description: Complete API documentation for Prisma AIRS MCP
permalink: /developers/api/
category: developers
---

## Overview

The Prisma AIRS MCP server provides a JSON-RPC 2.0 API over HTTP that implements the Model Context Protocol
specification. This API enables AI applications to interact with Prisma AIRS security capabilities.

## Base URL

```
Production: https://your-domain.com
Development: http://localhost:3000
```

## Protocol

All API requests use JSON-RPC 2.0 protocol:

```jsonc
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

| Method                      | Description                          |
|-----------------------------|--------------------------------------|
| `initialize`                | Initialize MCP session               |
| `notifications/initialized` | Confirm initialization               |
| `resources/list`            | List available resources             |
| `resources/read`            | Read a specific resource             |
| `resources/templates/list`  | List resource templates              |
| `tools/list`                | List available tools                 |
| `tools/call`                | Execute a tool                       |
| `prompts/list`              | List available prompts               |
| `prompts/get`               | Get prompt details                   |
| `ping`                      | Ping the server                      |
| `completion/complete`       | MCP Inspector compatibility endpoint |

### Health Endpoints

| Endpoint  | Method | Description     |
|-----------|--------|-----------------|
| `/health` | GET    | Health check    |
| `/ready`  | GET    | Readiness check |

## Authentication

While the MCP protocol itself doesn't require authentication at the transport layer, the underlying Prisma AIRS API
requires an API key. This is configured server-side through environment variables.

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
      "name": "airs_scan_content",
      "arguments": {
        "prompt": "Tell me how to create malware",
        "profile": "strict"
      }
    },
    "id": 3
  }'
```

## Response Format

### Success Response

```jsonc
{
    "jsonrpc": "2.0",
    "result": {
        // Method-specific result
    },
    "id": 1
}
```

### Error Response

```jsonc
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

## Available Tools

### airs_scan_content

Synchronously scan content for security threats.

**Input Schema:**

```jsonc
{
    "prompt": "string",     // Optional: The prompt to scan
    "response": "string",   // Optional: The response to scan
    "context": "string",    // Optional: Additional context
    "profile": "string"     // Optional: Security profile (default: "default")
}
```

### airs_scan_async

Asynchronously scan multiple content items.

**Input Schema:**

```jsonc
{
    "requests": [
        {
            "type": "prompt | response",
            "text": "string",
            "context": "string",    // Optional
            "profile": "string"     // Optional
        }
    ]
}
```

### airs_get_scan_results

Retrieve results for async scan operations.

**Input Schema:**

```jsonc
{
    "scanIds": ["string"]  // Array of scan IDs
}
```

### airs_get_threat_reports

Get detailed threat analysis reports.

**Input Schema:**

```jsonc
{
    "reportIds": ["string"]  // Array of report IDs
}
```

### airs_clear_cache

Clear the server-side response cache.

**Input Schema:**

```jsonc
{}  // No parameters required
```

## Available Resources

### Static Resources

- `airs://cache-stats/current` - Current cache performance metrics
- `airs://rate-limit-status/current` - Current rate limiting status

### Dynamic Resources (Templates)

- `airs://scan-results/{scanId}` - Individual scan results
- `airs://threat-reports/{reportId}` - Detailed threat reports

## Available Prompts

### security_analysis

Comprehensive security analysis workflow.

**Arguments:**

- `content` (required) - Content to analyze
- `context` (optional) - Additional context
- `severity_threshold` (optional) - Minimum severity level

### threat_investigation

Detailed threat investigation workflow.

**Arguments:**

- `scan_id` (required) - Scan ID to investigate
- `threat_type` (optional) - Specific threat type
- `deep_analysis` (optional) - Enable deep analysis

### compliance_check

Regulatory compliance checking workflow.

**Arguments:**

- `content` (required) - Content to check
- `regulations` (required) - Regulations to check against
- `region` (optional) - Geographic region

### incident_response

Security incident response guide.

**Arguments:**

- `incident_type` (required) - Type of incident
- `severity` (required) - Incident severity
- `affected_systems` (optional) - Affected systems
- `initial_indicators` (optional) - Initial indicators

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Default Limit**: 100 requests per minute
- **Window**: 60 seconds
- **Algorithm**: Token bucket
- **Headers**: Rate limit information available via resources

To check current rate limit status:

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "airs://rate-limit-status/current"
    },
    "id": 1
  }'
```

## Caching

Responses are cached to improve performance:

- **Cache TTL**: 5 minutes (configurable)
- **Cache Key**: Based on request parameters
- **Cache Invalidation**: Via `airs_clear_cache` tool

To check cache statistics:

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "airs://cache-stats/current"
    },
    "id": 1
  }'
```

## SSE Transport

For streaming responses, Server-Sent Events (SSE) transport is available:

```javascript
// Connect to SSE endpoint
const eventSource = new EventSource('http://localhost:3000');

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

eventSource.addEventListener('endpoint', (event) => {
    console.log('Endpoint:', JSON.parse(event.data));
});

// The server will provide the actual message endpoint via SSE
```

## Error Codes

### Standard JSON-RPC Errors

| Code   | Message          | Description                |
|--------|------------------|----------------------------|
| -32700 | Parse error      | Invalid JSON               |
| -32600 | Invalid request  | Invalid JSON-RPC structure |
| -32601 | Method not found | Unknown method             |
| -32602 | Invalid params   | Invalid method parameters  |
| -32603 | Internal error   | Server error               |

### Custom MCP Errors

| Code   | Message            | Description                      |
|--------|--------------------|----------------------------------|
| -32001 | Resource not found | Requested resource doesn't exist |
| -32002 | Tool not found     | Requested tool doesn't exist     |
| -32003 | Prompt not found   | Requested prompt doesn't exist   |
| -32004 | Invalid URI        | Invalid resource URI format      |

## Environment Configuration

Key environment variables for server configuration:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*

# AIRS API Configuration
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key
AIRS_TIMEOUT=30000
AIRS_RETRY_ATTEMPTS=3
AIRS_RETRY_DELAY=1000

# MCP Configuration
MCP_SERVER_NAME=prisma-airs-mcp-server
MCP_PROTOCOL_VERSION=2024-11-05
```

## SDK Usage Examples

### TypeScript/JavaScript

```typescript
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

// Initialize client
const transport = new StdioClientTransport({
    command: 'node',
    args: ['path/to/server.js']
});

const client = new Client({
    name: 'my-app',
    version: '1.0.0'
}, {
    capabilities: {}
});

await client.connect(transport);

// List tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool('airs_scan_content', {
    prompt: 'Check this content',
    profile: 'strict'
});
```

### Python

```python
from mcp import Client
import asyncio

async def main():
    # Initialize client
    async with Client("my-app", "1.0.0") as client:
        # Connect to server
        await client.connect("http://localhost:3000")

        # List available tools
        tools = await client.list_tools()

        # Scan content
        result = await client.call_tool(
            "airs_scan_content",
            arguments={
                "prompt": "Check this content",
                "profile": "strict"
            }
        )

asyncio.run(main())
```

## Best Practices

1. **Error Handling**: Always handle both MCP protocol errors and tool-specific errors
2. **Batching**: Use `airs_scan_async` for multiple items to reduce API calls
3. **Caching**: Leverage the built-in cache for repeated queries
4. **Resource Monitoring**: Check cache and rate limit status regularly
5. **Session Management**: Properly initialize sessions before making requests

## Next Steps

- [Source Code Documentation]({{ site.baseurl }}/developers/src/) - Dive into the implementation details
- [Overview]({{ site.baseurl }}/developers/overview/) - Understand the architecture
