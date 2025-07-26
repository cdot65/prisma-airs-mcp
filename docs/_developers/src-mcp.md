---
layout: documentation
title: MCP Types Module (src/mcp/)
permalink: /developers/src-mcp/
category: developers
---

# MCP Types Module Documentation

The MCP (Model Context Protocol) types module defines all TypeScript interfaces and types used for MCP protocol communication. These types ensure type safety across the entire MCP server implementation.

## Module Overview

The MCP types module consists of a single file (`types.ts`) that defines:

- Resource management types
- Tool definition and execution types
- Prompt template types
- Server initialization types
- Client/Server capability types
- Notification types
- Error handling types

## Type Categories

### Resource Types

Resources represent external data sources that can be accessed through the MCP server.

#### Core Resource Types

```typescript
export interface Resource {
    uri: string;              // Unique resource identifier
    name: string;             // Human-readable name
    description?: string;     // Optional description
    mimeType?: string;        // Content type
    size?: number;            // Size in bytes
}

export interface ResourceTemplate {
    uriTemplate: string;      // URI template with placeholders
    name: string;             // Template name
    description?: string;     // Template description
    mimeType?: string;        // Expected content type
}
```

#### Resource Operations

```typescript
// List resources with pagination
export interface ResourcesListParams {
    cursor?: string;          // Pagination cursor
}

export interface ResourcesListResult {
    resources: Resource[];    // List of resources
    nextCursor?: string;      // Next page cursor
}

// Read resource content
export interface ResourcesReadParams {
    uri: string;              // Resource URI to read
}

export interface ResourcesReadResult {
    contents: ResourceContent[];
}

export interface ResourceContent {
    uri: string;              // Content URI
    mimeType?: string;        // Content MIME type
    text?: string;            // Text content
    blob?: string;            // Base64 encoded binary
}
```

### Tool Types

Tools represent callable functions that the MCP server provides to AI models.

#### Tool Definition

```typescript
export interface Tool {
    name: string;             // Unique tool identifier
    title?: string;           // Display title
    description?: string;     // Tool description
    inputSchema: {            // JSON Schema for input
        type: 'object';
        properties?: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
    };
    outputSchema?: {          // JSON Schema for output
        type: 'object';
        properties?: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
    };
    annotations?: {           // UI hints
        title?: string;
        readOnlyHint?: boolean;
        progressHint?: boolean;
    };
}
```

#### Tool Operations

```typescript
// List available tools
export interface ToolsListParams {
    cursor?: string;
}

export interface ToolsListResult {
    tools: Tool[];
    nextCursor?: string;
}

// Execute a tool
export interface ToolsCallParams {
    name: string;                        // Tool name
    arguments?: Record<string, unknown>; // Tool arguments
}

export interface ToolsCallResult {
    content: ToolResultContent[];        // Result content
    isError?: boolean;                   // Error indicator
}

export interface ToolResultContent {
    type: 'text' | 'image' | 'resource'; // Content type
    text?: string;                       // Text content
    data?: string;                       // Base64 for images
    mimeType?: string;                   // Content MIME type
    resource?: {                         // Resource reference
        uri: string;
        title?: string;
        mimeType?: string;
        text?: string;
        blob?: string;
    };
}
```

### Prompt Types

Prompts are pre-defined conversation templates that can be filled with arguments.

#### Prompt Definition

```typescript
export interface Prompt {
    name: string;                 // Unique prompt identifier
    title?: string;               // Display title
    description?: string;         // Prompt description
    arguments?: PromptArgument[]; // Template arguments
}

export interface PromptArgument {
    name: string;                 // Argument name
    description?: string;         // Argument description
    required?: boolean;           // Is required?
}
```

#### Prompt Operations

```typescript
// List available prompts
export interface PromptsListParams {
    cursor?: string;
}

export interface PromptsListResult {
    prompts: Prompt[];
    nextCursor?: string;
}

// Get prompt with filled arguments
export interface PromptsGetParams {
    name: string;                         // Prompt name
    arguments?: Record<string, string>;   // Argument values
}

export interface PromptsGetResult {
    messages: PromptMessage[];            // Conversation messages
}

export interface PromptMessage {
    role: 'user' | 'assistant';           // Message role
    content: PromptContent;               // Message content
}

export interface PromptContent {
    type: 'text' | 'image' | 'resource';  // Content type
    text?: string;                        // Text content
    data?: string;                        // Base64 data
    mimeType?: string;                    // Content MIME type
    resource?: {                          // Resource reference
        uri: string;
        title?: string;
        mimeType?: string;
        text?: string;
        blob?: string;
    };
}
```

### Initialization Types

Types used during MCP server/client handshake.

```typescript
export interface InitializeParams {
    protocolVersion: string;      // MCP protocol version
    capabilities: ClientCapabilities;
    clientInfo: {
        name: string;             // Client name
        version?: string;         // Client version
    };
}

export interface InitializeResult {
    protocolVersion: string;      // Server protocol version
    capabilities: ServerCapabilities;
    serverInfo: {
        name: string;             // Server name
        version?: string;         // Server version
    };
}
```

### Capability Types

Define what features clients and servers support.

```typescript
export interface ClientCapabilities {
    experimental?: Record<string, unknown>;
    resources?: {
        subscribe?: boolean;      // Can subscribe to changes
        listChanged?: boolean;    // Supports list change notifications
    };
    tools?: {
        listChanged?: boolean;    // Supports tool list changes
    };
    prompts?: {
        listChanged?: boolean;    // Supports prompt list changes
    };
}

export interface ServerCapabilities {
    experimental?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    tools?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
}
```

### Notification Types

Notifications inform clients about server-side changes.

```typescript
export interface ResourcesListChangedNotification {
    method: 'notifications/resources/list_changed';
}

export interface ToolsListChangedNotification {
    method: 'notifications/tools/list_changed';
}

export interface PromptsListChangedNotification {
    method: 'notifications/prompts/list_changed';
}
```

### Error Types

Standard error handling for MCP protocol.

```typescript
export interface MCPError {
    code: number;         // Error code
    message: string;      // Error message
    data?: unknown;       // Additional error data
}

export enum MCPErrorCode {
    ParseError = -32700,      // Invalid JSON
    InvalidRequest = -32600,  // Invalid request structure
    MethodNotFound = -32601,  // Unknown method
    InvalidParams = -32602,   // Invalid method parameters
    InternalError = -32603,   // Internal server error
}
```

## Usage Examples

### Defining a Tool

```typescript
import type { Tool } from './mcp/types';

const scanTool: Tool = {
    name: 'scan_content',
    title: 'Scan Content',
    description: 'Scan content for security threats',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'Content to scan'
            },
            profile: {
                type: 'string',
                description: 'Security profile name'
            }
        },
        required: ['content'],
        additionalProperties: false
    },
    annotations: {
        progressHint: true  // Shows progress during execution
    }
};
```

### Handling Resources

```typescript
import type { Resource, ResourceContent } from './mcp/types';

// Define a resource
const scanReport: Resource = {
    uri: 'scan://report/12345',
    name: 'Scan Report #12345',
    description: 'Security scan results',
    mimeType: 'application/json'
};

// Return resource content
const content: ResourceContent = {
    uri: scanReport.uri,
    mimeType: 'application/json',
    text: JSON.stringify(scanResults)
};
```

### Creating Prompts

```typescript
import type { Prompt, PromptMessage } from './mcp/types';

const analyzePrompt: Prompt = {
    name: 'analyze_security',
    title: 'Analyze Security Threat',
    description: 'Analyze potential security threats in content',
    arguments: [
        {
            name: 'content',
            description: 'Content to analyze',
            required: true
        },
        {
            name: 'context',
            description: 'Additional context',
            required: false
        }
    ]
};

// Generate prompt messages
const messages: PromptMessage[] = [
    {
        role: 'user',
        content: {
            type: 'text',
            text: `Analyze this content for security threats: ${args.content}`
        }
    }
];
```

### Error Handling

```typescript
import { MCPError, MCPErrorCode } from './mcp/types';

// Create an error response
const error: MCPError = {
    code: MCPErrorCode.InvalidParams,
    message: 'Missing required parameter: content',
    data: {
        param: 'content',
        reason: 'required'
    }
};
```

## Type Safety Best Practices

1. **Import types explicitly** - Use `import type` for type-only imports
2. **Validate at boundaries** - Validate data when converting to/from MCP types
3. **Use discriminated unions** - Leverage TypeScript's type narrowing with the `type` field
4. **Define strict schemas** - Use `additionalProperties: false` in tool schemas
5. **Handle optional fields** - Always check optional fields before use

## Integration with Other Modules

The MCP types are used throughout the application:

- **Tool handlers** (`src/tools/`) - Implement the Tool interface
- **Resource handlers** (`src/resources/`) - Implement Resource interfaces
- **Prompt handlers** (`src/prompts/`) - Implement Prompt interfaces
- **Transport layer** (`src/transport/`) - Uses all types for request/response handling
- **Server initialization** (`src/index.ts`) - Uses initialization types

## MCP Protocol Compliance

These types follow the MCP specification:

- **JSON-RPC 2.0** - Error codes follow JSON-RPC standards
- **Protocol version** - Currently supports version '2024-11-05'
- **Content types** - Supports text, image, and resource content
- **Pagination** - Cursor-based pagination for list operations

## Common Patterns

### Content Type Handling

```typescript
function handleContent(content: ToolResultContent) {
    switch (content.type) {
        case 'text':
            return content.text;
        case 'image':
            return Buffer.from(content.data!, 'base64');
        case 'resource':
            return content.resource;
    }
}
```

### Schema Validation

```typescript
const toolSchema: Tool['inputSchema'] = {
    type: 'object',
    properties: {
        query: { type: 'string' },
        limit: { type: 'number', minimum: 1, maximum: 100 }
    },
    required: ['query'],
    additionalProperties: false
};
```

### Error Construction

```typescript
function createError(
    code: MCPErrorCode,
    message: string,
    data?: unknown
): MCPError {
    return { code, message, data };
}
```

## Next Steps

- [Tools Module]({{ site.baseurl }}/developers/src-tools/) - How tools implement these types
- [Resources Module]({{ site.baseurl }}/developers/src-resources/) - Resource implementation
- [Transport Module]({{ site.baseurl }}/developers/src-transport/) - Request/response handling