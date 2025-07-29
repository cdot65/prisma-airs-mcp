---
layout: documentation
title: Types Overview
permalink: /developers/src/types/overview/
category: developers
---

# Types Module Overview

The types module (`src/types/`) contains all TypeScript type definitions and interfaces used throughout the Prisma AIRS
MCP server. It provides a centralized location for type definitions, ensuring type safety and consistency across the
codebase.

## Module Structure

```
src/types/
├── airs.ts       # AIRS API request/response types
├── config.ts     # Configuration types
├── mcp.ts        # MCP protocol types
├── tools.ts      # Tool-specific types
├── transport.ts  # Transport layer types
└── index.ts      # Re-exports and common types
```

## Purpose

The types module serves several critical functions:

- **Type Safety**: Compile-time type checking for all data structures
- **API Contracts**: Defines interfaces for external APIs
- **Documentation**: Types serve as inline documentation
- **IntelliSense**: Enhanced IDE support and autocompletion
- **Consistency**: Single source of truth for data shapes

## Type Categories

### AIRS Types (`airs.ts`)

Types for Prisma AI Runtime Security API:

- Request types (sync/async scanning)
- Response types (results, threats)
- Error types
- Profile and threat definitions

**Example Types:**

- `ScanSyncRequest`
- `ScanSyncResponse`
- `ThreatCategory`
- `AIRSAPIError`

### Configuration Types (`config.ts`)

Application configuration structure:

- Server settings
- AIRS configuration
- MCP metadata
- Feature flags

**Example Types:**

- `Config`
- `ServerConfig`
- `AIRSConfig`
- `CacheConfig`

### MCP Types (`mcp.ts`)

Model Context Protocol definitions:

- Protocol messages
- Tool definitions
- Resource types
- Capability declarations

**Example Types:**

- `MCPRequest`
- `MCPResponse`
- `ToolDefinition`
- `ResourceType`

### Tool Types (`tools.ts`)

Tool-specific type definitions:

- Tool parameters
- Tool results
- Error responses

**Example Types:**

- `ScanContentParams`
- `ScanResult`
- `ToolError`

### Transport Types (`transport.ts`)

HTTP/SSE transport definitions:

- Request/response formats
- Streaming types
- Session management

**Example Types:**

- `TransportRequest`
- `SSEMessage`
- `SessionData`

## Type System Benefits

### 1. Compile-Time Safety

```typescript
// Type errors caught at compile time
const request: ScanSyncRequest = {
    tr_id: 'scan_123',
    request: [{
        prompt: 'test',
        // profile_name: 'default' // Error if required!
    }]
};
```

### 2. IDE Support

```typescript
// IntelliSense shows available properties
const config = getConfig();
config. // Shows: server, airs, mcp, cache, rateLimit
```

### 3. Refactoring Safety

```typescript
// Rename property in type definition
// All usages automatically flagged for update
interface Config {
    airsApiKey: string; // Renamed from apiKey
}
```

### 4. Documentation

```typescript
interface ThreatCategory {
    /** Unique identifier for the threat category */
    id: string;
    
    /** Human-readable category name */
    name: string;
    
    /** Severity level from 0-100 */
    severity: number;
    
    /** Detailed description of the threat */
    description?: string;
}
```

## Common Patterns

### Union Types

```typescript
// Result can be success or error
type ScanResult = 
    | { status: 'success'; data: ScanData }
    | { status: 'error'; error: string };
```

### Generic Types

```typescript
// Reusable response wrapper
interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

type ScanResponse = APIResponse<ScanData>;
```

### Discriminated Unions

```typescript
// Type-safe message handling
type MCPMessage =
    | { type: 'request'; id: string; method: string }
    | { type: 'response'; id: string; result?: any }
    | { type: 'notification'; method: string };

function handleMessage(msg: MCPMessage) {
    switch (msg.type) {
        case 'request':
            // TypeScript knows msg has 'method'
            break;
        case 'response':
            // TypeScript knows msg has 'result'
            break;
    }
}
```

### Utility Types

```typescript
// Make all properties optional
type PartialConfig = Partial<Config>;

// Make all properties required
type RequiredScan = Required<ScanRequest>;

// Pick specific properties
type ServerInfo = Pick<Config, 'server' | 'mcp'>;

// Exclude properties
type PublicConfig = Omit<Config, 'airs.apiKey'>;
```

## Type Organization

### Import/Export Strategy

```typescript
// types/index.ts - Central exports
export * from './airs';
export * from './config';
export * from './mcp';
export * from './tools';
export * from './transport';

// Usage in other files
import { ScanRequest, Config } from '../types';
```

### Naming Conventions

```typescript
// Interfaces: PascalCase with descriptive names
interface UserRequest { }

// Type aliases: PascalCase
type RequestStatus = 'pending' | 'complete';

// Enums: PascalCase with UPPER_CASE values
enum ThreatLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

// Constants: UPPER_CASE
const MAX_RETRIES = 3;
```

### Type vs Interface

```typescript
// Use interface for objects that can be extended
interface BaseRequest {
    id: string;
}

interface ScanRequest extends BaseRequest {
    content: string;
}

// Use type for unions, primitives, and aliases
type Status = 'success' | 'error';
type RequestHandler = (req: Request) => Response;
```

## Best Practices

### 1. Avoid `any`

```typescript
// Bad
function processData(data: any) { }

// Good
function processData(data: unknown) {
    // Validate and narrow type
    if (typeof data === 'object' && data !== null) {
        // Use data safely
    }
}
```

### 2. Use Const Assertions

```typescript
// Const assertion for literal types
const CONFIG = {
    MAX_SIZE: 1000,
    TIMEOUT: 30000,
} as const;

type ConfigKey = keyof typeof CONFIG;
// ConfigKey = "MAX_SIZE" | "TIMEOUT"
```

### 3. Branded Types

```typescript
// Prevent mixing different ID types
type UserId = string & { __brand: 'UserId' };
type ScanId = string & { __brand: 'ScanId' };

function getUser(id: UserId) { }
// getUser(scanId); // Error!
```

### 4. Exhaustive Checks

```typescript
type Status = 'pending' | 'success' | 'error';

function handleStatus(status: Status) {
    switch (status) {
        case 'pending': return 'waiting';
        case 'success': return 'done';
        case 'error': return 'failed';
        default:
            // This ensures all cases are handled
            const _exhaustive: never = status;
            return _exhaustive;
    }
}
```

## Type Validation

### Runtime Validation

```typescript
// Use Zod for runtime validation
import { z } from 'zod';

const ScanRequestSchema = z.object({
    tr_id: z.string(),
    request: z.array(z.object({
        prompt: z.string(),
        profile_name: z.string(),
    })),
});

// Derive TypeScript type from schema
type ScanRequest = z.infer<typeof ScanRequestSchema>;
```

### Type Guards

```typescript
// Custom type guard
function isScanError(result: unknown): result is ScanError {
    return (
        typeof result === 'object' &&
        result !== null &&
        'error' in result &&
        'code' in result
    );
}

// Usage
if (isScanError(response)) {
    console.error(response.error); // Type-safe access
}
```

## Common Issues

### Circular Dependencies

```typescript
// Avoid circular imports
// Bad: a.ts imports b.ts, b.ts imports a.ts

// Good: Extract shared types to separate file
// shared.ts
export interface SharedType { }

// a.ts
import { SharedType } from './shared';

// b.ts
import { SharedType } from './shared';
```

### Type Inference

```typescript
// Let TypeScript infer when possible
// Verbose
const numbers: Array<number> = [1, 2, 3];

// Better
const numbers = [1, 2, 3]; // TypeScript infers number[]

// But be explicit for function returns
function getNumbers(): number[] {
    return [1, 2, 3];
}
```

## Testing Types

### Type Testing

```typescript
// Test type compatibility
import { expectType } from 'tsd';

expectType<string>(getConfig().server.environment);
expectType<number>(getConfig().server.port);

// Test type errors
// @ts-expect-error
expectType<string>(getConfig().server.port);
```

### Mock Types

```typescript
// Create mock data matching types
const mockScanRequest: ScanSyncRequest = {
    tr_id: 'test_123',
    request: [{
        prompt: 'test content',
        profile_name: 'default',
    }],
};
```

## Type Documentation

### JSDoc Comments

```typescript
/**
 * Represents a scan request to the AIRS API
 * @example
 * const request: ScanRequest = {
 *   tr_id: 'scan_123',
 *   request: [{ prompt: 'content', profile_name: 'default' }]
 * };
 */
interface ScanRequest {
    /** Unique transaction ID for tracking */
    tr_id: string;
    
    /** Array of content items to scan */
    request: ScanItem[];
}
```

## Related Documentation

- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - AIRS API types
- [Config Types]({{ site.baseurl }}/developers/src/types/config-types/) - Configuration types
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Tool Types]({{ site.baseurl }}/developers/src/types/tools-types/) - Tool definitions
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Transport layer
- [TypeScript Guide]({{ site.baseurl }}/developers/typescript/) - Best practices