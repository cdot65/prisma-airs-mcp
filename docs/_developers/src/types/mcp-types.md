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

## Core Protocol Types

### MCPRequest

Base request structure for all MCP methods.

```typescript
export interface MCPRequest {
    /** JSON-RPC version (always "2.0") */
    jsonrpc: "2.0";
    
    /** Method name (e.g., "tools/list", "resources/read") */
    method: string;
    
    /** Method parameters */
    params?: unknown;
    
    /** Request ID for correlation */
    id?: string | number;
}
```

### MCPResponse

Base response structure for MCP methods.

```typescript
export interface MCPResponse {
    /** JSON-RPC version (always "2.0") */
    jsonrpc: "2.0";
    
    /** Success result */
    result?: unknown;
    
    /** Error information */
    error?: MCPError;
    
    /** Request ID for correlation */
    id?: string | number;
}

export interface MCPError {
    /** Error code (JSON-RPC standard) */
    code: number;
    
    /** Human-readable error message */
    message: string;
    
    /** Additional error data */
    data?: unknown;
}
```

### MCPNotification

Server-initiated notifications.

```typescript
export interface MCPNotification {
    /** JSON-RPC version */
    jsonrpc: "2.0";
    
    /** Notification method */
    method: string;
    
    /** Notification parameters */
    params?: unknown;
    
    // Note: No ID for notifications
}
```

## Initialization Types

### InitializeRequest

Client initialization request.

```typescript
export interface InitializeRequest extends MCPRequest {
    method: "initialize";
    params: {
        /** Protocol version */
        protocolVersion: string;
        
        /** Client capabilities */
        capabilities: ClientCapabilities;
        
        /** Client information */
        clientInfo?: {
            name: string;
            version?: string;
        };
    };
}

export interface ClientCapabilities {
    /** Supported sampling methods */
    sampling?: Record<string, unknown>;
    
    /** Supported roots */
    roots?: {
        listChanged?: boolean;
    };
}
```

### InitializeResponse

Server initialization response.

```typescript
export interface InitializeResponse extends MCPResponse {
    result: {
        /** Protocol version */
        protocolVersion: string;
        
        /** Server capabilities */
        capabilities: ServerCapabilities;
        
        /** Server information */
        serverInfo?: {
            name: string;
            version?: string;
        };
    };
}

export interface ServerCapabilities {
    /** Resource capabilities */
    resources?: {
        list?: boolean;
        read?: boolean;
        subscribe?: boolean;
    };
    
    /** Tool capabilities */
    tools?: {
        list?: boolean;
        call?: boolean;
    };
    
    /** Prompt capabilities */
    prompts?: {
        list?: boolean;
        get?: boolean;
    };
    
    /** Logging capabilities */
    logging?: Record<string, unknown>;
}
```

## Tool Types

### ToolsListRequest

Request to list available tools.

```typescript
export interface ToolsListRequest extends MCPRequest {
    method: "tools/list";
    params?: {
        /** Optional cursor for pagination */
        cursor?: string;
    };
}
```

### ToolsListResponse

Response with available tools.

```typescript
export interface ToolsListResponse extends MCPResponse {
    result: {
        /** Available tools */
        tools: Tool[];
        
        /** Pagination cursor */
        nextCursor?: string;
    };
}

export interface Tool {
    /** Unique tool name */
    name: string;
    
    /** Human-readable description */
    description?: string;
    
    /** JSON Schema for input parameters */
    inputSchema: {
        type: "object";
        properties?: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
    };
}
```

### ToolsCallRequest

Request to execute a tool.

```typescript
export interface ToolsCallRequest extends MCPRequest {
    method: "tools/call";
    params: {
        /** Tool name to execute */
        name: string;
        
        /** Tool arguments */
        arguments?: Record<string, unknown>;
    };
}
```

### ToolsCallResponse

Tool execution result.

```typescript
export interface ToolsCallResponse extends MCPResponse {
    result: {
        /** Tool output content */
        content: Array<ToolContent>;
        
        /** Whether the tool encountered an error */
        isError?: boolean;
    };
}

export type ToolContent = 
    | TextContent
    | ImageContent
    | EmbeddedResource;

export interface TextContent {
    type: "text";
    text: string;
}

export interface ImageContent {
    type: "image";
    data: string;  // Base64 encoded
    mimeType: string;
}

export interface EmbeddedResource {
    type: "resource";
    resource: Resource;
}
```

## Resource Types

### ResourcesListRequest

Request to list available resources.

```typescript
export interface ResourcesListRequest extends MCPRequest {
    method: "resources/list";
    params?: {
        /** Optional cursor for pagination */
        cursor?: string;
    };
}
```

### ResourcesListResponse

Response with available resources.

```typescript
export interface ResourcesListResponse extends MCPResponse {
    result: {
        /** Available resources */
        resources: Resource[];
        
        /** Pagination cursor */
        nextCursor?: string;
    };
}

export interface Resource {
    /** Resource URI */
    uri: string;
    
    /** Human-readable name */
    name: string;
    
    /** Resource description */
    description?: string;
    
    /** MIME type */
    mimeType?: string;
}
```

### ResourcesReadRequest

Request to read a resource.

```typescript
export interface ResourcesReadRequest extends MCPRequest {
    method: "resources/read";
    params: {
        /** Resource URI */
        uri: string;
    };
}
```

### ResourcesReadResponse

Resource content response.

```typescript
export interface ResourcesReadResponse extends MCPResponse {
    result: {
        /** Resource content */
        contents: Array<ResourceContent>;
    };
}

export type ResourceContent = TextContent | BinaryContent;

export interface BinaryContent {
    type: "blob";
    blob: string;  // Base64 encoded
    mimeType?: string;
}
```

### ResourcesSubscribeRequest

Subscribe to resource changes.

```typescript
export interface ResourcesSubscribeRequest extends MCPRequest {
    method: "resources/subscribe";
    params: {
        /** Resource URI */
        uri: string;
    };
}
```

### ResourcesUnsubscribeRequest

Unsubscribe from resource changes.

```typescript
export interface ResourcesUnsubscribeRequest extends MCPRequest {
    method: "resources/unsubscribe";
    params: {
        /** Resource URI */
        uri: string;
    };
}
```

## Prompt Types

### PromptsListRequest

Request to list available prompts.

```typescript
export interface PromptsListRequest extends MCPRequest {
    method: "prompts/list";
    params?: {
        /** Optional cursor for pagination */
        cursor?: string;
    };
}
```

### PromptsListResponse

Response with available prompts.

```typescript
export interface PromptsListResponse extends MCPResponse {
    result: {
        /** Available prompts */
        prompts: Prompt[];
        
        /** Pagination cursor */
        nextCursor?: string;
    };
}

export interface Prompt {
    /** Unique prompt name */
    name: string;
    
    /** Human-readable description */
    description?: string;
    
    /** Prompt arguments */
    arguments?: Array<PromptArgument>;
}

export interface PromptArgument {
    /** Argument name */
    name: string;
    
    /** Argument description */
    description?: string;
    
    /** Whether required */
    required?: boolean;
}
```

### PromptsGetRequest

Request to get a prompt.

```typescript
export interface PromptsGetRequest extends MCPRequest {
    method: "prompts/get";
    params: {
        /** Prompt name */
        name: string;
        
        /** Prompt arguments */
        arguments?: Record<string, string>;
    };
}
```

### PromptsGetResponse

Prompt content response.

```typescript
export interface PromptsGetResponse extends MCPResponse {
    result: {
        /** User-facing prompt description */
        description?: string;
        
        /** Prompt messages */
        messages: Array<PromptMessage>;
    };
}

export interface PromptMessage {
    /** Message role */
    role: "user" | "assistant" | "system";
    
    /** Message content */
    content: TextContent | ImageContent | EmbeddedResource;
}
```

## Notification Types

### ResourcesListChangedNotification

Notification when resource list changes.

```typescript
export interface ResourcesListChangedNotification extends MCPNotification {
    method: "notifications/resources/list_changed";
}
```

### ToolsListChangedNotification

Notification when tool list changes.

```typescript
export interface ToolsListChangedNotification extends MCPNotification {
    method: "notifications/tools/list_changed";
}
```

### PromptsListChangedNotification

Notification when prompt list changes.

```typescript
export interface PromptsListChangedNotification extends MCPNotification {
    method: "notifications/prompts/list_changed";
}
```

## Type Guards

### Protocol validation helpers

```typescript
/** Check if request is valid MCP request */
export function isMCPRequest(obj: unknown): obj is MCPRequest {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'jsonrpc' in obj &&
        obj.jsonrpc === '2.0' &&
        'method' in obj &&
        typeof obj.method === 'string'
    );
}

/** Check if response has error */
export function hasError(response: MCPResponse): boolean {
    return response.error !== undefined;
}

/** Check if notification */
export function isNotification(msg: MCPRequest | MCPNotification): msg is MCPNotification {
    return !('id' in msg);
}

/** Extract method type */
export function getMethodType(method: string): 'tools' | 'resources' | 'prompts' | 'unknown' {
    const [type] = method.split('/');
    if (['tools', 'resources', 'prompts'].includes(type)) {
        return type as 'tools' | 'resources' | 'prompts';
    }
    return 'unknown';
}
```

## Usage Examples

### Handling MCP Requests

```typescript
import { MCPRequest, MCPResponse, ToolsListRequest } from '../types/mcp';

async function handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    // Validate request
    if (!isMCPRequest(request)) {
        return {
            jsonrpc: '2.0',
            error: {
                code: -32600,
                message: 'Invalid request'
            },
            id: request.id
        };
    }
    
    // Route by method
    switch (request.method) {
        case 'tools/list':
            return handleToolsList(request as ToolsListRequest);
        
        case 'tools/call':
            return handleToolsCall(request);
        
        default:
            return {
                jsonrpc: '2.0',
                error: {
                    code: -32601,
                    message: 'Method not found'
                },
                id: request.id
            };
    }
}
```

### Creating Tool Definitions

```typescript
const securityScanTool: Tool = {
    name: 'security_scan',
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
                enum: ['default', 'strict', 'permissive'],
                description: 'Security profile'
            }
        },
        required: ['content'],
        additionalProperties: false
    }
};
```

### Type-Safe Response Building

```typescript
function buildToolsListResponse(tools: Tool[]): ToolsListResponse {
    return {
        jsonrpc: '2.0',
        result: {
            tools,
            // nextCursor only if pagination needed
            ...(tools.length > 100 && { nextCursor: 'next-page' })
        }
    };
}
```

## Error Handling

### Standard JSON-RPC Error Codes

```typescript
export enum JsonRpcErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
}

function createError(
    code: JsonRpcErrorCode,
    message: string,
    data?: unknown
): MCPError {
    return { code, message, data };
}
```

## Best Practices

### 1. Validate Method Names

```typescript
const VALID_METHODS = [
    'initialize',
    'tools/list',
    'tools/call',
    'resources/list',
    'resources/read',
    'prompts/list',
    'prompts/get'
] as const;

type ValidMethod = typeof VALID_METHODS[number];

function isValidMethod(method: string): method is ValidMethod {
    return VALID_METHODS.includes(method as ValidMethod);
}
```

### 2. Use Discriminated Unions

```typescript
type MCPMessage = 
    | { type: 'request'; data: MCPRequest }
    | { type: 'response'; data: MCPResponse }
    | { type: 'notification'; data: MCPNotification };
```

### 3. Type-Safe Method Handlers

```typescript
type MethodHandler<T extends MCPRequest, R extends MCPResponse> = 
    (request: T) => Promise<R>;

const handlers: Record<string, MethodHandler<any, any>> = {
    'tools/list': handleToolsList,
    'tools/call': handleToolsCall,
    // ...
};
```

## Related Documentation

- [MCP Protocol Spec](https://modelcontextprotocol.io/docs) - Official specification
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Transport layer types
- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system overview
- [Protocol Guide]({{ site.baseurl }}/developers/protocol/) - MCP implementation guide