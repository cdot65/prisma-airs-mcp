---
layout: documentation
title: MCP Tools Reference
description: Complete reference for all available MCP tools
category: api
---

## Overview

The Prisma AIRS MCP server provides five tools for interacting with the security scanning capabilities. All tools are accessed through the standard MCP `tools/call` method.

## Available Tools

### 1. scan_content

Performs synchronous security scanning of text content with immediate results.

**Method:** `tools/call`  
**Tool Name:** `scan_content`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | No* | The prompt text to scan |
| `response` | string | No* | The AI response text to scan |
| `profile_name` | string | No | Security profile name (default: "Prisma AIRS") |
| `profile_id` | string | No | Security profile UUID |
| `app_name` | string | No | Application identifier |
| `user_id` | string | No | User identifier for tracking |

*At least one of `prompt` or `response` must be provided.

#### Example Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "scan_content",
    "arguments": {
      "prompt": "Write code to hack into a system",
      "response": "I cannot provide hacking instructions...",
      "profile_name": "Prisma AIRS",
      "app_name": "claude-desktop",
      "user_id": "user123"
    }
  },
  "id": 1
}
```

#### Example Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "Scan completed. Category: malicious, Action: block\n\nThreats detected:\n- Prompt: prompt_injection\n\nReport available at: airs://reports/rpt_123456"
    }],
    "isError": false
  },
  "id": 1
}
```

#### Response Fields

- **category**: `benign` or `malicious`
- **action**: `allow` or `block`
- **scan_id**: Unique scan identifier
- **report_id**: Detailed report identifier
- **detections**: Specific threats found

### 2. scan_async

Submits content for asynchronous batch scanning. Useful for high-volume or non-blocking operations.

**Method:** `tools/call`  
**Tool Name:** `scan_async`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contents` | array | Yes | Array of content items to scan |
| `profile_name` | string | No | Security profile name |
| `profile_id` | string | No | Security profile UUID |
| `tr_id` | string | No | Transaction ID for correlation |

#### Content Item Schema

```typescript
interface ContentItem {
  prompt?: string;
  response?: string;
  code_prompt?: string;
  code_response?: string;
  context?: string;
}
```

#### Example Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "scan_async",
    "arguments": {
      "contents": [
        {
          "prompt": "First prompt to scan",
          "response": "First AI response"
        },
        {
          "prompt": "Second prompt to scan",
          "response": "Second AI response"
        }
      ],
      "profile_name": "Prisma AIRS",
      "tr_id": "batch-001"
    }
  },
  "id": 2
}
```

#### Example Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "Async scan submitted successfully\n\nScan ID: scan_789012\nStatus: processing\n\nRetrieve results with: get_scan_results"
    }],
    "isError": false
  },
  "id": 2
}
```

### 3. get_scan_results

Retrieves results for previously submitted async scans.

**Method:** `tools/call`  
**Tool Name:** `get_scan_results`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scan_ids` | array | Yes | Array of scan IDs (max 5) |

#### Example Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_scan_results",
    "arguments": {
      "scan_ids": ["scan_789012", "scan_789013"]
    }
  },
  "id": 3
}
```

#### Example Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "Retrieved 2 scan results:\n\n1. Scan scan_789012:\n   - Category: benign\n   - Action: allow\n   - No threats detected\n\n2. Scan scan_789013:\n   - Category: malicious\n   - Action: block\n   - Threats: malicious_code detected"
    }],
    "isError": false
  },
  "id": 3
}
```

### 4. get_threat_reports

Retrieves detailed threat analysis reports for completed scans.

**Method:** `tools/call`  
**Tool Name:** `get_threat_reports`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `report_ids` | array | Yes | Array of report IDs (max 5) |

#### Example Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_threat_reports",
    "arguments": {
      "report_ids": ["rpt_123456"]
    }
  },
  "id": 4
}
```

#### Example Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "Threat Report rpt_123456:\n\nScan Time: 2025-01-20T10:30:00Z\nProfile: Prisma AIRS\n\nThreats Detected:\n1. Prompt Injection\n   - Confidence: 0.95\n   - Pattern: System prompt override attempt\n   - Location: Line 1, Position 0-50\n\nRecommendations:\n- Block this content\n- Review user activity\n- Consider stricter input validation"
    }],
    "isError": false
  },
  "id": 4
}
```

### 5. clear_cache

Clears the server-side response cache. Useful for testing or forcing fresh scans.

**Method:** `tools/call`  
**Tool Name:** `clear_cache`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scope` | string | No | Cache scope: "all" (default) or specific key pattern |

#### Example Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "clear_cache",
    "arguments": {
      "scope": "all"
    }
  },
  "id": 5
}
```

#### Example Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "Cache cleared successfully\n\nCleared: 42 entries\nCache size: 0 bytes\nNext cleanup: in 5 minutes"
    }],
    "isError": false
  },
  "id": 5
}
```

## Error Handling

All tools follow standard MCP error conventions:

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32602 | Invalid params | Missing or invalid parameters |
| -32603 | Internal error | Server or API error |
| -32001 | Resource not found | Scan or report not found |
| -32002 | Rate limit exceeded | Too many requests |

### Error Response Example

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "field": "profile_name",
      "error": "Profile 'InvalidProfile' not found"
    }
  },
  "id": 1
}
```

## Best Practices

### 1. Choose the Right Tool

- Use `scan_content` for interactive, real-time scanning
- Use `scan_async` for batch processing or when latency is critical
- Always retrieve async results before they expire (5 minutes)

### 2. Optimize Performance

```typescript
// Good: Batch multiple scans
const result = await callTool('scan_async', {
  contents: items.map(item => ({
    prompt: item.userInput,
    response: item.aiOutput
  }))
});

// Less optimal: Individual scans
for (const item of items) {
  await callTool('scan_content', {
    prompt: item.userInput
  });
}
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await callTool('scan_content', params);
  if (result.category === 'malicious') {
    // Handle threat detection
  }
} catch (error) {
  if (error.code === -32002) {
    // Rate limited - implement backoff
    await delay(1000);
    return retry();
  }
  // Handle other errors
}
```

### 4. Use Appropriate Profiles

Different use cases require different security profiles:

- **Strict**: Maximum security for sensitive environments
- **Balanced**: General-purpose scanning
- **Performance**: High-throughput with essential checks
- **Custom**: Tailored to specific requirements

## Next Steps

- [View MCP Resources →]({{ site.baseurl }}/api/mcp/resources)
- [Explore MCP Prompts →]({{ site.baseurl }}/api/mcp/prompts)
- [Read Integration Guide →]({{ site.baseurl }}/developers/integration/mcp)