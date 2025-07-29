---
layout: documentation
title: MCP Types
permalink: /developers/src/types/mcp-types/
category: developers
---

# MCP Types (src/types/mcp.ts)

The MCP types module defines TypeScript interfaces for the Model Context Protocol. These types ensure type safety when
implementing MCP handlers and communicating with MCP clients.

## Overview

The MCP types provide:

- Protocol message interfaces
- Tool, resource, and prompt definitions
- Request/response structures
- Capability declarations
- Error types for protocol violations

All types are prefixed with 'Mcp' to avoid namespace conflicts.

## Resource Types

### McpResource

Represents a resource that can be accessed via URI.

```typescript
export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    size?: number;
}
```

### McpResourceTemplate

Template for dynamic resources.

```typescript
export interface McpResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
}
```

### Resource List Types

```typescript
export interface McpResourcesListParams {
    cursor?: string;
}

export interface McpResourcesListResult {
    resources: McpResource[];
    nextCursor?: string;
}
```

### Resource Read Types

```typescript
export interface McpResourcesReadParams {
    uri: string;
}

export interface McpResourcesReadResult {
    contents: McpResourceContent[];
}

export interface McpResourceContent {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string; // base64 encoded
}
```

## Tool Types

### McpTool

Defines a callable tool with its schema.

```typescript
export interface McpTool {
    name: string;
    title?: string;
    description?: string;
    inputSchema: {
        type: 'object';
        properties?: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
    };
    outputSchema?: {
        type: 'object';
        properties?: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
    };
    annotations?: {
        title?: string;
        readOnlyHint?: boolean;
        progressHint?: boolean;
    };
}
```

### Tool List Types

```typescript
export interface McpToolsListParams {
    cursor?: string;
}

export interface McpToolsListResult {
    tools: McpTool[];
    nextCursor?: string;
}
```

### Tool Call Types

```typescript
export interface McpToolsCallParams {
    name: string;
    arguments?: Record<string, unknown>;
}

export interface McpToolsCallResult {
    content: McpToolResultContent[];
    isError?: boolean;
}

export interface McpToolResultContent {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string; // base64 for images
    mimeType?: string;
    resource?: {
        uri: string;
        title?: string;
        mimeType?: string;
        text?: string;
        blob?: string;
    };
}
```

## Prompt Types

### McpPrompt

Defines a reusable prompt workflow.

```typescript
export interface McpPrompt {
    name: string;
    title?: string;
    description?: string;
    arguments?: McpPromptArgument[];
}

export interface McpPromptArgument {
    name: string;
    description?: string;
    required?: boolean;
}
```

### Prompt List Types

```typescript
export interface McpPromptsListParams {
    cursor?: string;
}

export interface McpPromptsListResult {
    prompts: McpPrompt[];
    nextCursor?: string;
}
```

### Prompt Get Types

```typescript
export interface McpPromptsGetParams {
    name: string;
    arguments?: Record<string, string>;
}

export interface McpPromptsGetResult {
    messages: McpPromptMessage[];
}

export interface McpPromptMessage {
    role: 'user' | 'assistant';
    content: McpPromptContent;
}

export interface McpPromptContent {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: {
        uri: string;
        title?: string;
        mimeType?: string;
        text?: string;
        blob?: string;
    };
}
```

## Protocol Types

### McpServerCapabilities

Server capability declarations.

```typescript
export interface McpServerCapabilities {
    resources?: {
        list?: boolean;
        read?: boolean;
        subscribe?: boolean;
    };
    tools?: {
        list?: boolean;
        call?: boolean;
    };
    prompts?: {
        list?: boolean;
        get?: boolean;
    };
    logging?: Record<string, unknown>;
}
```

### McpServerInfo

Server identification.

```typescript
export interface McpServerInfo {
    name: string;
    version?: string;
}
```

### McpInitializeResult

Initialization response.

```typescript
export interface McpInitializeResult {
    protocolVersion: string;
    capabilities: McpServerCapabilities;
    serverInfo?: McpServerInfo;
}
```

### McpInitializeParams

Initialization parameters.

```typescript
export interface McpInitializeParams {
    protocolVersion: string;
    capabilities?: {
        roots?: {
            listChanged?: boolean;
        };
        sampling?: Record<string, unknown>;
    };
    clientInfo?: {
        name: string;
        version?: string;
    };
}
```

### McpResourceTemplatesListResult

Resource template listing.

```typescript
export interface McpResourceTemplatesListResult {
    resourceTemplates: McpResourceTemplate[];
}
```

## Usage Examples

### Type Guards

```typescript
// Check if content is text
function isTextContent(content: McpToolResultContent): content is { type: 'text'; text: string } {
    return content.type === 'text' && typeof content.text === 'string';
}

// Check if content has resource
function hasResource(content: McpToolResultContent): content is { type: 'resource'; resource: any } {
    return content.type === 'resource' && !!content.resource;
}
```

### Creating Tool Results

```typescript
// Text result
const textResult: McpToolResultContent = {
    type: 'text',
    text: 'Operation completed successfully'
};

// Resource result
const resourceResult: McpToolResultContent = {
    type: 'resource',
    resource: {
        uri: 'airs://scan-results/123',
        title: 'Scan Results',
        mimeType: 'application/json',
        text: JSON.stringify(scanData)
    }
};

// Error result
const errorResult: McpToolsCallResult = {
    content: [{
        type: 'text',
        text: 'Error: Invalid input'
    }],
    isError: true
};
```

### Implementing Handlers

```typescript
import type { 
    McpToolsListParams, 
    McpToolsListResult,
    McpToolsCallParams,
    McpToolsCallResult 
} from './types';

class ToolHandler {
    listTools(params: McpToolsListParams): McpToolsListResult {
        return {
            tools: [
                {
                    name: 'example_tool',
                    description: 'An example tool',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            input: { type: 'string' }
                        },
                        required: ['input']
                    }
                }
            ]
        };
    }

    async callTool(params: McpToolsCallParams): Promise<McpToolsCallResult> {
        // Tool implementation
        return {
            content: [{
                type: 'text',
                text: `Executed ${params.name}`
            }]
        };
    }
}
```

## Type Relationships

```
McpTool
├── name: string
├── inputSchema: object schema
└── annotations?
    ├── readOnlyHint: boolean
    └── progressHint: boolean

McpToolResultContent
├── type: 'text' | 'image' | 'resource'
├── text?: string (when type='text')
├── data?: string (when type='image')
└── resource?: object (when type='resource')

McpPrompt
├── name: string
└── arguments?: McpPromptArgument[]
    ├── name: string
    └── required?: boolean
```

## Best Practices

### 1. Use Type Guards

```typescript
// Always check content type before accessing properties
if (content.type === 'text' && content.text) {
    console.log(content.text);
}
```

### 2. Provide Complete Schemas

```typescript
// Good - complete schema
inputSchema: {
    type: 'object',
    properties: {
        prompt: { 
            type: 'string',
            description: 'The prompt to analyze'
        }
    },
    required: ['prompt'],
    additionalProperties: false
}

// Bad - minimal schema
inputSchema: { type: 'object' }
```

### 3. Handle Optional Fields

```typescript
// Always check optional fields
const title = tool.title || tool.name;
const isReadOnly = tool.annotations?.readOnlyHint ?? false;
```

### 4. Use Consistent Naming

```typescript
// All types prefixed with Mcp
type ToolResult = McpToolsCallResult;  // Good
type ToolResult = ToolsCallResult;     // Bad - missing prefix
```

## Related Documentation

- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Transport layer types
- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - AIRS API types
- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Tool implementation
- [Resources Module]({{ site.baseurl }}/developers/src/resources/overview/) - Resource implementation
- [Prompts Module]({{ site.baseurl }}/developers/src/prompts/overview/) - Prompt implementation