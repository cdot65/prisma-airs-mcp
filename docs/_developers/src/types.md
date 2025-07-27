---
layout: documentation
title: Types Module
permalink: /developers/src/types/
category: developers
---

# Type Definitions (src/types/)

The Types module provides a centralized location for all TypeScript type definitions used throughout the Prisma AIRS MCP
server. This architectural decision ensures type consistency, prevents circular dependencies, and provides a single
source of truth for all type definitions.

## Module Structure

```
src/types/
├── index.ts      # Central export point (re-exports all types)
├── airs.ts       # AIRS API types (Airs* prefix)
├── config.ts     # Configuration types (Config* prefix)
├── mcp.ts        # MCP protocol types (Mcp* prefix)
├── tools.ts      # Tool handler types (Tools* prefix)
└── transport.ts  # HTTP/SSE transport types (Transport* prefix)
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│        Application Modules              │
│  (tools, resources, transport, etc.)    │
└─────────────────┬───────────────────────┘
                  │
                  │ import type {...} from '../types'
                  ▼
┌─────────────────────────────────────────┐
│         src/types/index.ts              │
│    Central re-export of all types       │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┬──────────────┬────────────┐
        │                   │             │              │            │
┌───────▼────────┐ ┌────────▼──────┐ ┌────▼────┐ ┌───────▼──────┐ ┌───▼────────┐
│   airs.ts      │ │  config.ts    │ │mcp.ts   │ │ tools.ts     │ │transport   │
│ • Airs* types  │ │ • Config*     │ │• Mcp*   │ │ • Tools*     │ │• Transport*│
└────────────────┘ └───────────────┘ └─────────┘ └──────────────┘ └────────────┘
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
    tr_id?: string;                    // Transaction ID
    ai_profile: AirsAiProfile;         // Security profile
    metadata?: AirsMetadata;           // Request metadata
    contents: AirsContentItem[];       // Content to scan
}

// AI Profile configuration
export interface AirsAiProfile {
    profile_id?: string;
    profile_name?: string;
}

// Content item for scanning
export interface AirsContentItem {
    prompt?: string;
    response?: string;
    code_prompt?: string;
    code_response?: string;
    context?: string;
}

// Scan response with security findings
export interface AirsScanResponse {
    report_id: string;
    scan_id: string;
    tr_id?: string;
    profile_id?: string;
    profile_name?: string;
    category: 'malicious' | 'benign';
    action: 'block' | 'allow';
    prompt_detected?: AirsPromptDetected;
    response_detected?: AirsResponseDetected;
    ml_metadata?: AirsMlMetadata;
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

Types for application configuration with comprehensive settings.

```typescript
// Main configuration structure
export interface Config {
    server: ConfigServer;
    airs: ConfigAirs;
    cache: ConfigCache;
    rateLimit: ConfigRateLimit;
    mcp: ConfigMcp;
}

// Server configuration
export interface ConfigServer {
    port: number;
    environment: 'development' | 'production' | 'test';
    logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// Prisma AIRS configuration
export interface ConfigAirs {
    apiUrl: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    defaultProfileId?: string;
    defaultProfileName?: string;
}

// Cache configuration
export interface ConfigCache {
    ttlSeconds: number;
    maxSize: number;
    enabled: boolean;
}

// Rate limiting configuration
export interface ConfigRateLimit {
    maxRequests: number;
    windowMs: number;
    enabled: boolean;
}

// MCP protocol configuration
export interface ConfigMcp {
    serverName: string;
    serverVersion: string;
    protocolVersion: string;
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
    profileName?: string;
    profileId?: string;
    metadata?: {
        appName?: string;
        appUser?: string;
        aiModel?: string;
        userIp?: string;
    };
}

// Async scan request item
export interface ToolsAsyncScanRequestItem {
    reqId: number;
    prompt?: string;
    response?: string;
    context?: string;
    profileName?: string;
    profileId?: string;
}

// Async scan arguments
export interface ToolsScanAsyncArgs {
    requests: ToolsAsyncScanRequestItem[];
}

// Get scan results arguments
export interface ToolsGetScanResultsArgs {
    scanIds: string[];
}

// Get threat reports arguments
export interface ToolsGetThreatReportsArgs {
    reportIds: string[];
}

// Type alias for scan responses with threat detection
export type ToolsScanResponseWithDetected = AirsScanResponse;
```

## Import Patterns

### Importing Types

Always use type imports for better tree-shaking:

```typescript
// Import specific types
import type {AirsScanRequest, AirsScanResponse} from '../types';

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
import type {AirsScanResponse} from '../types';

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
import type {AirsScanRequest, AirsScanResponse} from '../types';
import {EnhancedPrismaAirsClient} from '../airs';

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
import type {McpTool, McpToolsCallParams, McpToolsCallResult} from '../types';

const scanTool: McpTool = {
    name: 'airs_scan_content',
    description: 'Scan content for security threats',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {type: 'string'},
            response: {type: 'string'}
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
        const {method, params, id} = req.body as TransportJsonRpcRequest;

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

1. **Choose the correct file** based on module domain
2. **Follow naming conventions** - prefix with module name
3. **Export from module file** - add export statement
4. **Update index.ts** - already re-exports with `export *`
5. **Document complex types** - add JSDoc comments

Example:

```typescript
// In airs.ts
/**
 * New feature configuration
 */
export interface AirsNewFeature {
    enabled: boolean;
    options: Record<string, unknown>;
}
```

### Modifying Existing Types

1. **Check usage** - search for all references
2. **Consider compatibility** - avoid breaking changes
3. **Update incrementally** - use optional properties
4. **Run type checking** - `npm run typecheck`
5. **Test thoroughly** - ensure no runtime errors

## Benefits of Centralized Types

1. **Single Source of Truth** - All types in one location
2. **Prevents Circular Dependencies** - Modules import from types, not each other
3. **Consistent Naming** - Enforced prefixing prevents conflicts
4. **Easy Discovery** - All types accessible via single import
5. **Better Refactoring** - Change once, update everywhere

## Type Safety Patterns

### Using Type Guards

```typescript
import type {AirsScanResponse} from '../types';

function isAirsScanResponse(obj: unknown): obj is AirsScanResponse {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'scan_id' in obj &&
        'category' in obj &&
        'action' in obj
    );
}
```

### Discriminated Unions

```typescript
// In transport.ts
export type TransportMessage =
    | { type: 'request'; data: TransportJsonRpcRequest }
    | { type: 'response'; data: TransportJsonRpcResponse }
    | { type: 'error'; data: TransportJsonRpcError };
```

### Utility Types

```typescript
// Making all properties optional
export type PartialAirsConfig = Partial<AirsClientConfig>;

// Picking specific properties
export type AirsCredentials = Pick<AirsClientConfig, 'apiUrl' | 'apiKey'>;

// Omitting properties
export type PublicAirsConfig = Omit<AirsClientConfig, 'apiKey'>;
```

## Dependencies

The types module has no runtime dependencies and only development dependencies:

| Module         | Purpose                                        |
| -------------- | ---------------------------------------------- |
| TypeScript     | Type checking and compilation                  |
| @types/node    | Node.js type definitions                       |
| @types/express | Express type definitions (for transport types) |

## Related Documentation

- [AIRS Module]({{ site.baseurl }}/developers/src/airs/) - AIRS client implementation
- [Transport Module]({{ site.baseurl }}/developers/src/transport/) - HTTP/SSE transport
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Tool implementations
- [Config Module]({{ site.baseurl }}/developers/src/config/) - Configuration management
- [Resources Module]({{ site.baseurl }}/developers/src/resources/) - Resource handlers
- [Prompts Module]({{ site.baseurl }}/developers/src/prompts/) - Prompt templates

## Summary

The centralized types module is a critical architectural component that ensures type safety, consistency, and
maintainability across the entire Prisma AIRS MCP server codebase. By following the established naming conventions and
import patterns, developers can easily work with strongly-typed interfaces throughout the application.
