---
layout: documentation
title: Tools Module (src/tools/)
permalink: /developers/src-tools/
category: developers
---

# Tools Module Documentation

The tools module provides MCP tool handlers for Prisma AIRS operations. Tools are callable functions that AI models can use to perform security scans, retrieve results, and manage the system cache.

## Module Overview

The tools module consists of two files:

- **index.ts** - Main tool handler implementation with all tool logic
- **types.ts** - TypeScript interfaces for tool arguments and responses

## Available Tools

### 1. airs_scan_content

**Purpose:** Analyze prompt and/or response content for security threats  
**Progress:** Shows progress indicator during execution

#### Input Schema

```typescript
interface ScanContentArgs {
    prompt?: string;          // The prompt content to scan
    response?: string;        // The response content to scan
    context?: string;         // Additional context for the scan
    profileName?: string;     // Security profile name (defaults to "Prisma AIRS")
    profileId?: string;       // Security profile ID
    metadata?: {              // Additional metadata
        appName?: string;
        appUser?: string;
        aiModel?: string;
        userIp?: string;
    };
}
```

#### Example Usage

```typescript
// Scan both prompt and response
{
    "name": "airs_scan_content",
    "arguments": {
        "prompt": "How can I extract passwords from a database?",
        "response": "Here's a SQL injection example...",
        "context": "User conversation about database security",
        "profileName": "Prisma AIRS",
        "metadata": {
            "appName": "ChatBot",
            "aiModel": "gpt-4"
        }
    }
}
```

#### Response Format

```typescript
{
    "content": [
        {
            "type": "text",
            "text": "Scan completed. Category: malicious, Action: block"
        },
        {
            "type": "resource",
            "resource": {
                "uri": "airs://scan-result/scan_12345",
                "mimeType": "application/json",
                "text": "{ ... detailed scan results ... }"
            }
        },
        {
            "type": "text",
            "text": "Threats detected: prompt_injection, response_malicious_code"
        }
    ]
}
```

### 2. airs_scan_async

**Purpose:** Submit multiple scan requests for asynchronous processing  
**Progress:** Shows progress indicator during submission

#### Input Schema

```typescript
interface ScanAsyncArgs {
    requests: Array<{
        reqId: number;           // Unique identifier (required)
        prompt?: string;         // Prompt to scan
        response?: string;       // Response to scan
        context?: string;        // Additional context
        profileName?: string;    // Security profile name
        profileId?: string;      // Security profile ID
    }>;
}
```

#### Example Usage

```typescript
{
    "name": "airs_scan_async",
    "arguments": {
        "requests": [
            {
                "reqId": 1,
                "prompt": "First prompt to scan",
                "profileName": "Prisma AIRS"
            },
            {
                "reqId": 2,
                "response": "Second response to scan",
                "profileName": "Prisma AIRS"
            }
        ]
    }
}
```

#### Response Format

```typescript
{
    "content": [
        {
            "type": "text",
            "text": "Async scan submitted. Scan ID: scan_batch_123"
        },
        {
            "type": "text",
            "text": "Report ID: rpt_batch_123"
        }
    ]
}
```

### 3. airs_get_scan_results

**Purpose:** Retrieve results for previously submitted scans  
**Read-only:** This tool only reads data

#### Input Schema

```typescript
interface GetScanResultsArgs {
    scanIds: string[];    // Array of scan IDs (max 5)
}
```

#### Example Usage

```typescript
{
    "name": "airs_get_scan_results",
    "arguments": {
        "scanIds": ["scan_12345", "scan_67890"]
    }
}
```

#### Response Format

```typescript
{
    "content": [
        {
            "type": "text",
            "text": "Retrieved 2 scan results"
        },
        {
            "type": "resource",
            "resource": {
                "uri": "airs://scan-result/scan_12345",
                "mimeType": "application/json",
                "text": "{ ... scan result ... }"
            }
        },
        {
            "type": "resource",
            "resource": {
                "uri": "airs://scan-result/scan_67890",
                "mimeType": "application/json",
                "text": "{ ... scan result ... }"
            }
        }
    ]
}
```

### 4. airs_get_threat_reports

**Purpose:** Retrieve detailed threat scan reports  
**Read-only:** This tool only reads data

#### Input Schema

```typescript
interface GetThreatReportsArgs {
    reportIds: string[];    // Array of report IDs (max 5)
}
```

#### Example Usage

```typescript
{
    "name": "airs_get_threat_reports",
    "arguments": {
        "reportIds": ["rpt_12345", "rpt_67890"]
    }
}
```

#### Response Format

```typescript
{
    "content": [
        {
            "type": "text",
            "text": "Retrieved 2 threat reports"
        },
        {
            "type": "resource",
            "resource": {
                "uri": "airs://threat-report/rpt_12345",
                "mimeType": "application/json",
                "text": "{ ... detailed threat report ... }"
            }
        }
    ]
}
```

### 5. airs_clear_cache

**Purpose:** Clear the AIRS response cache  
**No arguments required**

#### Example Usage

```typescript
{
    "name": "airs_clear_cache",
    "arguments": {}
}
```

#### Response Format

```typescript
{
    "content": [
        {
            "type": "text",
            "text": "Cache cleared successfully"
        }
    ]
}
```

## Implementation Details

### ToolHandler Class

```typescript
export class ToolHandler {
    // Tool name constants
    private static readonly TOOLS = {
        SCAN_CONTENT: 'airs_scan_content',
        SCAN_ASYNC: 'airs_scan_async',
        GET_SCAN_RESULTS: 'airs_get_scan_results',
        GET_THREAT_REPORTS: 'airs_get_threat_reports',
        CLEAR_CACHE: 'airs_clear_cache',
    } as const;

    // List available tools
    listTools(params: ToolsListParams): ToolsListResult

    // Execute a tool
    async callTool(params: ToolsCallParams): Promise<ToolsCallResult>
}
```

### Profile Configuration

Tools use a cascading profile selection strategy:

1. Tool argument `profileName` or `profileId`
2. Environment variable `AIRS_DEFAULT_PROFILE_ID`
3. Environment variable `AIRS_DEFAULT_PROFILE_NAME`
4. Fallback to "Prisma AIRS"

```typescript
// Profile selection logic
if (typedArgs.profileName) {
    scanRequest.ai_profile.profile_name = typedArgs.profileName;
} else if (typedArgs.profileId) {
    scanRequest.ai_profile.profile_id = typedArgs.profileId;
} else if (config.airs.defaultProfileId) {
    scanRequest.ai_profile.profile_id = config.airs.defaultProfileId;
} else if (config.airs.defaultProfileName) {
    scanRequest.ai_profile.profile_name = config.airs.defaultProfileName;
} else {
    scanRequest.ai_profile.profile_name = 'Prisma AIRS';
}
```

### Threat Summarization

The module automatically summarizes detected threats:

```typescript
private summarizeThreats(result: ScanResponseWithDetected): string {
    const threats: string[] = [];
    
    // Check prompt threats
    if (result.prompt_detected?.injection) threats.push('prompt_injection');
    if (result.prompt_detected?.dlp) threats.push('prompt_dlp');
    // ... other threat types
    
    // Check response threats
    if (result.response_detected?.malicious_code) threats.push('response_malicious_code');
    if (result.response_detected?.ungrounded) threats.push('response_ungrounded');
    // ... other threat types
    
    return threats.join(', ') || 'unknown threats';
}
```

## Error Handling

All tools implement comprehensive error handling:

```typescript
try {
    // Tool execution
} catch (error) {
    return this.createErrorResult(error);
}

// Error result format
{
    "content": [{
        "type": "text",
        "text": "API Error (429): Rate limit exceeded"
    }],
    "isError": true
}
```

### Common Error Scenarios

1. **Missing Required Arguments**
   ```
   At least one of prompt, response, or context is required
   ```

2. **Invalid Array Arguments**
   ```
   scanIds must be an array
   ```

3. **API Errors**
   ```
   API Error (401): Invalid API key
   ```

4. **Rate Limiting**
   ```
   API Error (429): Too many requests
   ```

## Integration with Resources

Tools create resource references for detailed results:

```typescript
// After successful scan
contents.push({
    type: 'resource',
    resource: ResourceHandler.createResourceReference(
        'scan-result',
        result.scan_id,
        'Scan Result Details',
        result
    )
});
```

This allows AI models to:
1. Get summary information immediately
2. Access detailed results through resource URIs
3. Navigate between related data

## Best Practices

### 1. Input Validation

Always validate required fields:

```typescript
if (!Array.isArray(typedArgs.scanIds)) {
    throw new Error('scanIds must be an array');
}
```

### 2. Transaction IDs

Generate unique transaction IDs for tracking:

```typescript
scanRequest.tr_id = Date.now().toString();
```

### 3. Resource References

Include resource references for detailed data:

```typescript
// Don't return entire response in text
// Do create resource reference
resource: ResourceHandler.createResourceReference(...)
```

### 4. Error Context

Provide meaningful error messages:

```typescript
if ('statusCode' in error) {
    message = `API Error (${error.statusCode}): ${message}`;
}
```

## Testing Tools

### Unit Testing

```typescript
// Test tool listing
const tools = handler.listTools({});
assert(tools.tools.length === 5);
assert(tools.tools[0].name === 'airs_scan_content');

// Test tool execution
const result = await handler.callTool({
    name: 'airs_scan_content',
    arguments: { prompt: 'test content' }
});
assert(result.content.length > 0);
assert(!result.isError);
```

### Integration Testing

```typescript
// Test with actual AIRS client
const handler = new ToolHandler();
const result = await handler.callTool({
    name: 'airs_scan_content',
    arguments: {
        prompt: 'SQL injection test',
        profileName: 'Test Profile'
    }
});

// Verify resource creation
const resourceContent = result.content.find(c => c.type === 'resource');
assert(resourceContent?.resource?.uri.startsWith('airs://'));
```

## Performance Considerations

1. **Caching** - Scan results are cached by the AIRS client
2. **Rate Limiting** - Tools respect AIRS API rate limits
3. **Async Scanning** - Use `airs_scan_async` for batch operations
4. **Resource Size** - Large results are returned as resources, not inline

## Security Considerations

1. **Authentication** - Tools inherit AIRS API authentication
2. **Input Sanitization** - All inputs are passed to AIRS for validation
3. **Profile Enforcement** - Security profiles control scanning behavior
4. **Metadata Privacy** - Sensitive metadata should be handled carefully

## Next Steps

- [Resources Module]({{ site.baseurl }}/developers/src-resources/) - How resources work with tools
- [MCP Types]({{ site.baseurl }}/developers/src-mcp/) - Tool type definitions
- [AIRS Module]({{ site.baseurl }}/developers/src-airs/) - Client used by tools
- [Prompts Module]({{ site.baseurl }}/developers/src-prompts/) - Prompts that use these tools