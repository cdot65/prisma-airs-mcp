---
layout: documentation
title: Types Module (src/types/)
permalink: /developers/src/types/
category: developers
---

# Types Module Documentation

The Types module provides a centralized location for all TypeScript type definitions used throughout the Prisma AIRS MCP server. This architectural decision ensures type consistency, prevents circular dependencies, and provides a single source of truth for all type definitions.

## Module Overview

The types module is organized into several files, each containing types for a specific domain:

```
src/types/
├── index.ts      # Central export point
├── airs.ts       # AIRS API types (Airs* prefix)
├── config.ts     # Configuration types (Config* prefix)
├── mcp.ts        # MCP protocol types (Mcp* prefix)
├── tools.ts      # Tool handler types (Tools* prefix)
├── transport.ts  # HTTP/SSE transport types (Transport* prefix)
└── README.md     # Type naming conventions
```

## Naming Conventions

All types are prefixed with their module name to avoid naming conflicts:

- **AIRS types**: `Airs*` (e.g., `AirsScanRequest`, `AirsScanResponse`)
- **Config types**: `Config*` (e.g., `Config`, `ConfigServerOptions`)
- **MCP types**: `Mcp*` (e.g., `McpTool`, `McpResource`)
- **Tools types**: `Tools*` (e.g., `ToolsScanContentArgs`)
- **Transport types**: `Transport*` (e.g., `TransportJsonRpcRequest`)

## Type Categories

### AIRS Types (`airs.ts`)

Types for interacting with the Prisma AIRS security API.

#### Core Request/Response Types

```typescript
// Synchronous scan request
export interface AirsScanRequest {
    prompt?: string;
    response?: string;
    profile_name?: string;
    scan_uuid?: string;
}

// Scan response with security findings
export interface AirsScanResponse {
    scan_id: string;
    scan_type: 'Prompt' | 'Response';
    scanned_text?: string;
    detected: boolean;
    findings?: AirsSecurityFinding[];
}

// Individual security finding
export interface AirsSecurityFinding {
    metric: string;
    severity: AirsSeverity;
    score: number;
    violated: boolean;
    findings_metadata?: AirsFindingMetadata[];
}
```

#### Asynchronous Operations

```typescript
// Async scan request
export interface AirsAsyncScanObject {
    scan_uuid: string;
    scan_type: 'Prompt' | 'Response';
    text: string;
    profile_name?: string;
}

// Async scan response
export interface AirsAsyncScanResponse {
    message: string;
    scan_ids: string[];
}

// Scan result retrieval
export interface AirsScanIdResult {
    scan_id: string;
    status: 'complete' | 'in_progress' | 'failed';
    result?: AirsScanResponse;
}
```

#### Configuration Types

```typescript
// Enhanced client configuration
export interface AirsEnhancedClientConfig extends AirsClientConfig {
    cache?: AirsCacheConfig;
    rateLimiter?: AirsRateLimiterConfig;
}

// Cache configuration
export interface AirsCacheConfig {
    ttlSeconds: number;
    maxSize: number;
    enabled?: boolean;
}

// Rate limiter configuration
export interface AirsRateLimiterConfig {
    maxRequests: number;
    windowMs: number;
    enabled?: boolean;
}
```

### MCP Types (`mcp.ts`)

Types implementing the Model Context Protocol specification.

#### Resource Management

```typescript
// Resource definition
export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

// Resource template for dynamic resources
export interface McpResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
}

// Resource operations
export interface McpResourcesListParams {
    cursor?: string;
}

export interface McpResourcesListResult {
    resources: McpResource[];
    nextCursor?: string;
}
```

#### Tool Definitions

```typescript
// Tool definition with JSON Schema
export interface McpTool {
    name: string;
    description?: string;
    inputSchema: {
        type: 'object';
        properties?: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
    };
}

// Tool execution
export interface McpToolsCallParams {
    name: string;
    arguments?: Record<string, unknown>;
}

export interface McpToolResultContent {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
}
```

#### Prompt Templates

```typescript
// Prompt definition
export interface McpPrompt {
    name: string;
    description?: string;
    arguments?: McpPromptArgument[];
}

// Prompt argument
export interface McpPromptArgument {
    name: string;
    description?: string;
    required?: boolean;
}

// Prompt message
export interface McpPromptMessage {
    role: 'user' | 'assistant';
    content: McpPromptContent;
}
```

### Transport Types (`transport.ts`)

Types for HTTP and SSE transport layers.

#### JSON-RPC Types

```typescript
// JSON-RPC 2.0 request
export interface TransportJsonRpcRequest {
    jsonrpc: '2.0';
    method: string;
    params?: unknown;
    id: string | number | null;
}

// JSON-RPC 2.0 response
export interface TransportJsonRpcResponse {
    jsonrpc: '2.0';
    result?: unknown;
    error?: TransportJsonRpcError;
    id: string | number | null;
}

// Express request with streaming support
export interface TransportStreamableRequest extends Request {
    headers: {
        accept?: string;
        'last-event-id'?: string;
        'mcp-session-id'?: string;
    } & Request['headers'];
}
```

#### Server-Sent Events

```typescript
// SSE message format
export interface TransportSSEMessage {
    id?: string;
    event?: string;
    data: string;
    retry?: number;
}
```

### Configuration Types (`config.ts`)

Types for application configuration.

```typescript
// Main configuration structure
export interface Config {
    server: ConfigServerOptions;
    mcp: ConfigMcpOptions;
    airs: ConfigAirsOptions;
}

// Server configuration
export interface ConfigServerOptions {
    port: number;
    environment: 'development' | 'production';
    corsOrigin: string;
}

// MCP configuration
export interface ConfigMcpOptions {
    serverName: string;
    serverVersion: string;
    protocolVersion: string;
}

// AIRS API configuration
export interface ConfigAirsOptions {
    apiUrl: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}
```

### Tool Handler Types (`tools.ts`)

Types specific to tool implementations.

```typescript
// Scan content arguments
export interface ToolsScanContentArgs {
    prompt?: string;
    response?: string;
    context?: string;
    profile?: string;
}

// Async scan arguments
export interface ToolsScanAsyncArgs {
    requests: ToolsAsyncScanRequestItem[];
}

// Scan request item
export interface ToolsAsyncScanRequestItem {
    type: 'prompt' | 'response';
    text: string;
    context?: string;
    profile?: string;
}

// Result retrieval arguments
export interface ToolsGetScanResultsArgs {
    scanIds: string[];
}
```

## Import Patterns

### Importing Types

Always use type imports for better tree-shaking:

```typescript
// Import specific types
import type { AirsScanRequest, AirsScanResponse } from '../types';

// Import namespaced types
import type * as Types from '../types';

// Use in code
const request: AirsScanRequest = {
    prompt: 'Check this content',
    profile_name: 'default'
};
```

### Type Guards

Create type guards for runtime type checking:

```typescript
import type { AirsScanResponse } from '../types';

function isAirsScanResponse(obj: unknown): obj is AirsScanResponse {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'scan_id' in obj &&
        'detected' in obj
    );
}
```

## Best Practices

### 1. Type Safety

- Always use strict type checking
- Avoid `any` types
- Use discriminated unions for variants
- Leverage TypeScript's type narrowing

### 2. Naming Consistency

- Follow the module prefix convention
- Use descriptive names
- Maintain consistency with API specifications
- Document complex types

### 3. Type Organization

- Group related types together
- Export types at appropriate granularity
- Use index.ts for public API
- Keep internal types private

### 4. Runtime Validation

- Use Zod schemas for runtime validation
- Create type guards for external data
- Validate at system boundaries
- Handle validation errors gracefully

## Integration Examples

### Using AIRS Types

```typescript
import type { AirsScanRequest, AirsScanResponse } from '../types';
import { EnhancedPrismaAirsClient } from '../airs';

async function scanContent(content: string): Promise<AirsScanResponse> {
    const client = new EnhancedPrismaAirsClient(config);
    
    const request: AirsScanRequest = {
        prompt: content,
        profile_name: 'strict'
    };
    
    return await client.scanSync(request);
}
```

### Implementing MCP Tools

```typescript
import type { McpTool, McpToolsCallParams, McpToolsCallResult } from '../types';

const scanTool: McpTool = {
    name: 'airs_scan_content',
    description: 'Scan content for security threats',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: { type: 'string' },
            response: { type: 'string' }
        },
        additionalProperties: false
    }
};

async function callTool(params: McpToolsCallParams): Promise<McpToolsCallResult> {
    // Implementation
}
```

### Transport Layer Usage

```typescript
import type { 
    TransportJsonRpcRequest, 
    TransportJsonRpcResponse,
    TransportStreamableRequest 
} from '../types';

class HttpServerTransport {
    async handleRequest(
        req: TransportStreamableRequest,
        res: Response<TransportJsonRpcResponse>
    ): Promise<void> {
        const { method, params, id } = req.body as TransportJsonRpcRequest;
        
        try {
            const result = await this.routeRequest(method, params);
            res.json({
                jsonrpc: '2.0',
                result,
                id
            });
        } catch (error) {
            res.json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal error'
                },
                id
            });
        }
    }
}
```

## Type Evolution

### Adding New Types

1. Add to appropriate module file
2. Follow naming conventions
3. Export from module file
4. Re-export from index.ts if public
5. Document complex types

### Modifying Existing Types

1. Consider backward compatibility
2. Update all usages
3. Run type checking
4. Update documentation
5. Test thoroughly

## Next Steps

- [AIRS Module]({{ site.baseurl }}/developers/src/airs/) - AIRS client implementation
- [Transport Module]({{ site.baseurl }}/developers/src/transport/) - HTTP/SSE transport
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Tool implementations
- [Config Module]({{ site.baseurl }}/developers/src/config/) - Configuration management