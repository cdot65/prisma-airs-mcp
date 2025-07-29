---
layout: documentation
title: MCP Types
permalink: /developers/src/types/mcp-types/
category: developers
---

# MCP Types (src/types/mcp.ts)

TypeScript interfaces for Model Context Protocol. Defines structures for tools, resources, prompts, and protocol messages.

## Core Purpose

- Define MCP protocol interfaces
- Ensure type-safe handlers
- Support client communication
- Enable proper validation

## Type Categories

### Tool Types
```typescript
interface McpTool {
    name: string
    description?: string
    inputSchema: {
        type: 'object'
        properties?: Record<string, unknown>
        required?: string[]
    }
}

interface McpToolsCallResult {
    content: McpToolResultContent[]
    isError?: boolean
}

interface McpToolResultContent {
    type: 'text' | 'image' | 'resource'
    text?: string
    resource?: McpResourceContent
}
```

### Resource Types
```typescript
interface McpResource {
    uri: string
    name: string
    description?: string
    mimeType?: string
}

interface McpResourceContent {
    uri: string
    mimeType?: string
    text?: string
    blob?: string // base64
}
```

### Prompt Types
```typescript
interface McpPrompt {
    name: string
    description?: string
    arguments?: McpPromptArgument[]
}

interface McpPromptMessage {
    role: 'user' | 'assistant'
    content: McpPromptContent
}
```

## Integration in Application

- **Used By**: All handlers (tools, resources, prompts)
- **Pattern**: Request/response pairs
- **Validation**: Input schemas
- **Prefix**: All types use 'Mcp' prefix

## Protocol Features

### Capabilities
```typescript
interface McpServerCapabilities {
    resources?: { list?: boolean, read?: boolean }
    tools?: { list?: boolean, call?: boolean }
    prompts?: { list?: boolean, get?: boolean }
}
```

### Initialization
```typescript
interface McpInitializeResult {
    protocolVersion: string
    capabilities: McpServerCapabilities
    serverInfo?: McpServerInfo
}
```

## Usage Example

```typescript
// Define a tool
const scanTool: McpTool = {
    name: 'airs_scan_content',
    description: 'Scan content for threats',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: { type: 'string' }
        },
        required: ['prompt']
    }
};

// Return tool result
const result: McpToolsCallResult = {
    content: [{
        type: 'text',
        text: 'Scan complete'
    }, {
        type: 'resource',
        resource: {
            uri: 'airs://scan-results/123',
            mimeType: 'application/json',
            text: JSON.stringify(data)
        }
    }]
};
```

## Key Features

### Type Safety
- Strict interface definitions
- Optional field handling
- Content type unions

### Extensibility
- Schema-based validation
- Custom annotations
- Flexible content types

### Consistency
- Unified naming (Mcp prefix)
- Standard request/response
- Clear type hierarchy

## Related Modules

- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Tool implementations
- [Resources Module]({{ site.baseurl }}/developers/src/resources/overview/) - Resource handlers
- [Prompts Module]({{ site.baseurl }}/developers/src/prompts/overview/) - Prompt workflows
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Transport layer