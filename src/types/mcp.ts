/**
 * Centralized MCP (Model Context Protocol) type definitions
 * All types are prefixed with 'Mcp' to avoid namespace conflicts
 */

// Resource types
export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    size?: number;
}

export interface McpResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface McpResourcesListParams {
    cursor?: string;
}

export interface McpResourcesListResult {
    resources: McpResource[];
    nextCursor?: string;
}

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

// Tool types
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

export interface McpToolsListParams {
    cursor?: string;
}

export interface McpToolsListResult {
    tools: McpTool[];
    nextCursor?: string;
}

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

// Prompt types
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

export interface McpPromptsListParams {
    cursor?: string;
}

export interface McpPromptsListResult {
    prompts: McpPrompt[];
    nextCursor?: string;
}

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

// Server info types
export interface McpInitializeParams {
    protocolVersion: string;
    capabilities: McpClientCapabilities;
    clientInfo: {
        name: string;
        version?: string;
    };
}

export interface McpInitializeResult {
    protocolVersion: string;
    capabilities: McpServerCapabilities;
    serverInfo: {
        name: string;
        version?: string;
    };
}

export interface McpClientCapabilities {
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

export interface McpServerCapabilities {
    experimental?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    tools?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
}

// Notification types
export interface McpResourcesListChangedNotification {
    method: 'notifications/resources/list_changed';
}

export interface McpToolsListChangedNotification {
    method: 'notifications/tools/list_changed';
}

export interface McpPromptsListChangedNotification {
    method: 'notifications/prompts/list_changed';
}

// Error types
export interface McpError {
    code: number;
    message: string;
    data?: unknown;
}

// MCP Error codes
export enum McpErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
}
