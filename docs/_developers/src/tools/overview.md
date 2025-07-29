---
layout: documentation
title: Tools Overview
permalink: /developers/src/tools/overview/
category: developers
---

# Tools Module Overview

The tools module (`src/tools/`) implements the MCP tool handlers that enable AI assistants and clients to interact with
the Prisma AIRS security scanning service. Tools are the primary way clients perform actions through the MCP protocol.

## Module Structure

```
src/tools/
└── index.ts    # Tool definitions and handlers
```

## Available Tools

The module provides five main tools for security operations:

### 1. airs_scan_content

Performs synchronous content scanning with immediate results.

**Purpose**: Real-time security analysis of text content
**Use Case**: Interactive applications requiring immediate feedback

### 2. airs_scan_async

Initiates asynchronous batch scanning for multiple items.

**Purpose**: Bulk content processing without blocking
**Use Case**: Large-scale content analysis, background processing

### 3. airs_get_scan_results

Retrieves results from previously initiated scans.

**Purpose**: Check status and get results of async scans
**Use Case**: Polling for batch scan completion

### 4. airs_get_threat_reports

Fetches detailed threat analysis reports.

**Purpose**: Deep dive into detected security issues
**Use Case**: Incident investigation, detailed threat analysis

### 5. airs_clear_cache

Clears the response cache for fresh results.

**Purpose**: Force new scans bypassing cache
**Use Case**: Testing, troubleshooting, or when fresh results are critical

## Architecture

```
┌─────────────────────────────────────────┐
│          MCP Client Request             │
│         (Tool Invocation)               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Tool Handler Router             │
│        (tools/list, tools/call)         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Tool Implementation              │
│  ┌─────────────┐  ┌─────────────┐     │
│  │   Validate  │  │   Execute   │     │
│  │   Inputs    │  │   Tool      │     │
│  └─────────────┘  └─────────────┘     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          AIRS Client                    │
│    (With Cache & Rate Limiting)         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         AIRS API Service                │
│    (External Security Service)          │
└─────────────────────────────────────────┘
```

## Tool Definitions

Each tool is defined with metadata and input schemas:

```typescript
const TOOLS = {
    airs_scan_content: {
        name: 'airs_scan_content',
        description: 'Scan content for security threats using Prisma AIRS',
        inputSchema: {
            type: 'object',
            properties: {
                content: { 
                    type: 'string', 
                    description: 'Content to scan' 
                },
                prompt: { 
                    type: 'string', 
                    description: 'Optional prompt context' 
                },
                response: { 
                    type: 'string', 
                    description: 'Optional AI response' 
                },
                profileName: { 
                    type: 'string', 
                    description: 'Security profile name' 
                }
            },
            required: [],
            additionalProperties: false
        }
    },
    // ... other tools
};
```

## Request/Response Flow

### Tool List Request

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": "1"
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "tools": [
            {
                "name": "airs_scan_content",
                "description": "Scan content for security threats",
                "inputSchema": { ... }
            },
            // ... other tools
        ]
    },
    "id": "1"
}
```

### Tool Call Request

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
        "name": "airs_scan_content",
        "arguments": {
            "content": "Check this text for threats",
            "profileName": "strict"
        }
    },
    "id": "2"
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "toolResult": {
            "request_results": [{
                "prompt_guard_result": {
                    "high_risk_categories": [],
                    "medium_risk_categories": [],
                    "low_risk_categories": []
                }
            }]
        }
    },
    "id": "2"
}
```

## Tool Implementation Details

### Input Validation

Each tool validates its inputs before execution:

```typescript
// At least one content field is required
if (!content && !prompt && !response && !context) {
    throw new Error('At least one of prompt, response, or context is required');
}

// Profile name defaults if not provided
const profile = profileName || config.airs.defaultProfileName;
```

### Error Handling

Tools implement comprehensive error handling:

```typescript
try {
    const result = await client.scanSync(request);
    return { toolResult: result };
} catch (error) {
    logger.error('Scan failed', { error });
    
    // Return structured error
    return {
        isError: true,
        toolResult: {
            error: error.message,
            code: error.code || 'SCAN_FAILED'
        }
    };
}
```

### Caching Integration

Tools automatically benefit from response caching:

```typescript
// First call - makes API request
await callTool('airs_scan_content', { content: 'test' });

// Second identical call - returns cached result
await callTool('airs_scan_content', { content: 'test' });

// Force fresh scan
await callTool('airs_scan_content', { 
    content: 'test',
    bypassCache: true  // If implemented
});
```

## Usage Examples

### Basic Content Scanning

```typescript
const result = await toolHandler.callTool({
    name: 'airs_scan_content',
    arguments: {
        content: 'User provided text to analyze',
        profileName: 'default'
    }
});

if (result.toolResult.request_results[0].prompt_guard_result.high_risk_categories.length > 0) {
    console.log('High risk content detected!');
}
```

### Batch Processing

```typescript
// Start async scan
const { toolResult } = await toolHandler.callTool({
    name: 'airs_scan_async',
    arguments: {
        requests: [
            { content: 'First item', profileName: 'strict' },
            { content: 'Second item', profileName: 'strict' }
        ]
    }
});

const scanId = toolResult.scan_id;

// Check results later
const results = await toolHandler.callTool({
    name: 'airs_get_scan_results',
    arguments: { scanIds: [scanId] }
});
```

### Cache Management

```typescript
// Clear cache before critical scan
await toolHandler.callTool({
    name: 'airs_clear_cache',
    arguments: {}
});

// Now perform fresh scan
const freshResult = await toolHandler.callTool({
    name: 'airs_scan_content',
    arguments: { content: 'Critical content' }
});
```

## Security Profiles

Tools support different security profiles for varied use cases:

- **default**: Balanced security checks
- **strict**: Maximum security, may flag more content
- **permissive**: Minimal restrictions, for trusted content

```typescript
// Strict profile for user-generated content
{ content: userInput, profileName: 'strict' }

// Permissive for internal content
{ content: systemMessage, profileName: 'permissive' }
```

## Performance Considerations

### Caching Benefits

- Identical requests return instantly from cache
- Reduces API calls and costs
- Configurable TTL for freshness

### Rate Limiting

- Prevents API quota exhaustion
- Automatic retry with backoff
- Per-operation limits

### Async vs Sync

- Use sync for interactive applications
- Use async for batch processing
- Async allows higher throughput

## Error Scenarios

### Common Errors

1. **Missing Content**
   ```json
   {
       "error": "At least one of prompt, response, or context is required",
       "code": "INVALID_INPUT"
   }
   ```

2. **Rate Limited**
   ```json
   {
       "error": "Rate limit exceeded. Please try again later.",
       "code": "RATE_LIMIT_EXCEEDED"
   }
   ```

3. **API Error**
   ```json
   {
       "error": "AIRS API error: Invalid scan format",
       "code": "API_ERROR"
   }
   ```

### Error Recovery

Tools implement automatic retry for transient failures:

- Network errors
- Temporary API outages
- Rate limit backoff

## Testing Tools

### Unit Testing

```typescript
describe('Tool Handler', () => {
    it('should scan content successfully', async () => {
        const result = await handler.callTool({
            name: 'airs_scan_content',
            arguments: { content: 'test' }
        });
        
        expect(result.toolResult).toBeDefined();
        expect(result.isError).toBeFalsy();
    });
});
```

### Integration Testing

```typescript
it('should handle tool workflow', async () => {
    // Clear cache
    await handler.callTool({ name: 'airs_clear_cache' });
    
    // Scan content
    const scan = await handler.callTool({
        name: 'airs_scan_content',
        arguments: { content: 'test content' }
    });
    
    expect(scan.toolResult.request_results).toHaveLength(1);
});
```

## Best Practices

### 1. Choose the Right Tool

```typescript
// Interactive UI - use sync
airs_scan_content

// Background job - use async
airs_scan_async + airs_get_scan_results
```

### 2. Handle Errors Gracefully

```typescript
const result = await callTool(params);
if (result.isError) {
    // Log error details
    logger.error('Tool error', result.toolResult);
    
    // Provide user-friendly message
    return 'Unable to scan content. Please try again.';
}
```

### 3. Use Appropriate Profiles

```typescript
// User content - strict
profileName: 'strict'

// System content - default
profileName: 'default'

// Trusted content - permissive
profileName: 'permissive'
```

### 4. Monitor Performance

```typescript
// Track tool execution time
const start = Date.now();
const result = await callTool(params);
const duration = Date.now() - start;

metrics.histogram('tool.duration', duration, {
    tool: params.name
});
```

## Related Documentation

- [Tool Implementation]({{ site.baseurl }}/developers/src/tools/index-file/) - Code details
- [AIRS Client]({{ site.baseurl }}/developers/src/airs/overview/) - Underlying client
- [MCP Protocol]({{ site.baseurl }}/developers/protocol/) - Protocol specification
- [Tool Types]({{ site.baseurl }}/developers/src/types/tools-types/) - Type definitions
- [API Reference]({{ site.baseurl }}/developers/api/) - Complete API docs