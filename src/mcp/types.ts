/**
 * MCP (Model Context Protocol) type definitions
 */

// Resource types
export interface Resource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    size?: number;
}

export interface ResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface ResourcesListParams {
    cursor?: string;
}

export interface ResourcesListResult {
    resources: Resource[];
    nextCursor?: string;
}

export interface ResourcesReadParams {
    uri: string;
}

export interface ResourcesReadResult {
    contents: ResourceContent[];
}

export interface ResourceContent {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string; // base64 encoded
}

// Tool types
export interface Tool {
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

export interface ToolsListParams {
    cursor?: string;
}

export interface ToolsListResult {
    tools: Tool[];
    nextCursor?: string;
}

export interface ToolsCallParams {
    name: string;
    arguments?: Record<string, unknown>;
}

export interface ToolsCallResult {
    content: ToolResultContent[];
    isError?: boolean;
}

export interface ToolResultContent {
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

// Prompt types
export interface Prompt {
    name: string;
    title?: string;
    description?: string;
    arguments?: PromptArgument[];
}

export interface PromptArgument {
    name: string;
    description?: string;
    required?: boolean;
}

export interface PromptsListParams {
    cursor?: string;
}

export interface PromptsListResult {
    prompts: Prompt[];
    nextCursor?: string;
}

export interface PromptsGetParams {
    name: string;
    arguments?: Record<string, string>;
}

export interface PromptsGetResult {
    messages: PromptMessage[];
}

export interface PromptMessage {
    role: 'user' | 'assistant';
    content: PromptContent;
}

export interface PromptContent {
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

// Server info types
export interface InitializeParams {
    protocolVersion: string;
    capabilities: ClientCapabilities;
    clientInfo: {
        name: string;
        version?: string;
    };
}

export interface InitializeResult {
    protocolVersion: string;
    capabilities: ServerCapabilities;
    serverInfo: {
        name: string;
        version?: string;
    };
}

export interface ClientCapabilities {
    experimental?: Record<string, unknown>;
    resources?: {
        subscribe?: boolean;
        listChanged?: boolean;
    };
    tools?: {
        listChanged?: boolean;
    };
    prompts?: {
        listChanged?: boolean;
    };
}

export interface ServerCapabilities {
    experimental?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    tools?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
}

// Notification types
export interface ResourcesListChangedNotification {
    method: 'notifications/resources/list_changed';
}

export interface ToolsListChangedNotification {
    method: 'notifications/tools/list_changed';
}

export interface PromptsListChangedNotification {
    method: 'notifications/prompts/list_changed';
}

// Error types
export interface MCPError {
    code: number;
    message: string;
    data?: unknown;
}

// MCP Error codes
export enum MCPErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
}
