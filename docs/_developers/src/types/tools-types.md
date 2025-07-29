---
layout: documentation
title: Tool Types
permalink: /developers/src/types/tools-types/
category: developers
---

# Tool Types (src/types/tools.ts)

TypeScript interfaces for MCP tools implementation. Defines parameter types, result structures, and error handling for tools.

## Core Purpose

- Define tool parameter types
- Structure tool results
- Standardize error handling
- Enable type-safe tools

## Tool Parameters

### Scan Content
```typescript
interface ToolsScanContentArgs {
    prompt?: string
    response?: string
    context?: string
    profileName?: string
    profileId?: string
    metadata?: {
        appName?: string
        appUser?: string
        aiModel?: string
        userIp?: string
    }
}
```

### Scan Async
```typescript
interface ToolsScanAsyncArgs {
    requests: Array<{
        reqId: number
        prompt?: string
        response?: string
        context?: string
        profileName?: string
        profileId?: string
    }>
}
```

### Get Results
```typescript
interface ToolsGetScanResultsArgs {
    scanIds: string[]
}

interface ToolsGetThreatReportsArgs {
    reportIds: string[]
}
```

## Integration in Application

- **Used By**: Tool handler implementations
- **Pattern**: Args validation and typing
- **Results**: Consistent response format
- **Errors**: Structured error handling

## Result Types

### Tool Result Content
```typescript
interface McpToolResultContent {
    type: 'text' | 'resource'
    text?: string
    resource?: McpResourceContent
}
```

### Success Pattern
```typescript
{
    content: [{
        type: 'text',
        text: 'Scan completed. Category: safe'
    }, {
        type: 'resource',
        resource: {
            uri: 'airs://scan-results/123',
            mimeType: 'application/json',
            text: JSON.stringify(data)
        }
    }]
}
```

### Error Pattern
```typescript
{
    content: [{
        type: 'text',
        text: 'Error: Invalid input'
    }],
    isError: true
}
```

## Type Safety Benefits

### Parameter Validation
```typescript
// At least one content field required
if (!args.prompt && !args.response && !args.context) {
    throw new Error('Content required');
}
```

### Profile Resolution
```typescript
// Type-safe profile selection
const profile = args.profileName 
    ?? args.profileId 
    ?? config.defaultProfile
    ?? 'Prisma AIRS';
```

### Result Construction
```typescript
// Type-safe result building
const result: McpToolsCallResult = {
    content: contents,
    isError: false
};
```

## Usage Example

```typescript
// Implement tool with types
async function scanContent(
    args: ToolsScanContentArgs
): Promise<McpToolsCallResult> {
    // Validate typed arguments
    const request: AirsScanRequest = {
        ai_profile: { 
            profile_name: args.profileName 
        },
        contents: [{
            prompt: args.prompt,
            response: args.response
        }]
    };
    
    // Return typed result
    return {
        content: [{
            type: 'text',
            text: 'Scan complete'
        }]
    };
}
```

## Related Modules

- [Tools Handler]({{ site.baseurl }}/developers/src/tools/index-file/) - Tool implementations
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - API types