---
layout: documentation
title: Types Index
permalink: /developers/src/types/index-file/
category: developers
---

# Types Index (src/types/index.ts)

The types index file serves as the central export point for all TypeScript type definitions in the project. It
re-exports types from individual modules and provides utility types used throughout the application.

## Overview

The index file provides:

- Centralized type exports
- Utility type definitions
- Type composition helpers
- Common type aliases
- Type namespace organization

## Export Structure

### AIRS Types Export

```typescript
// Re-export all AIRS API types
export * from './airs';

// Named exports for common types
export type {
    ScanSyncRequest,
    ScanSyncResponse,
    ScanAsyncRequest,
    ScanAsyncResponse,
    GuardResult,
    ThreatCategory,
    ThreatType,
    GuardAction,
    ProfileName,
    AIRSAPIError
} from './airs';
```

### Configuration Types Export

```typescript
// Re-export configuration types
export * from './config';

// Named exports for common configs
export type {
    Config,
    ServerConfig,
    AIRSConfig,
    MCPConfig,
    CacheConfig,
    RateLimitConfig,
    LogLevel,
    Environment
} from './config';
```

### MCP Types Export

```typescript
// Re-export MCP protocol types
export * from './mcp';

// Named exports for protocol types
export type {
    MCPRequest,
    MCPResponse,
    MCPError,
    Tool,
    Resource,
    Prompt,
    ServerCapabilities,
    ClientCapabilities
} from './mcp';
```

### Tool Types Export

```typescript
// Re-export tool-specific types
export * from './tools';

// Named exports for tool types
export type {
    ScanContentParams,
    ScanContentResult,
    ScanAsyncParams,
    ScanAsyncResult,
    ToolError,
    ToolErrorCode,
    ToolDefinition
} from './tools';
```

### Transport Types Export

```typescript
// Re-export transport layer types
export * from './transport';

// Named exports for transport types
export type {
    TransportMessage,
    TransportRequest,
    TransportResponse,
    SessionInfo,
    SSEEvent,
    SSEConnection,
    TransportError,
    TransportErrorCode
} from './transport';
```

## Utility Types

### Generic Utility Types

```typescript
/** Make all properties optional recursively */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Make all properties required recursively */
export type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/** Make all properties readonly recursively */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** Extract keys of type T that have values of type V */
export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/** Omit multiple properties from type */
export type OmitMultiple<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/** Make specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
```

### Result Types

```typescript
/** Success result type */
export interface SuccessResult<T> {
    success: true;
    data: T;
    error?: never;
}

/** Error result type */
export interface ErrorResult<E = Error> {
    success: false;
    data?: never;
    error: E;
}

/** Combined result type */
export type Result<T, E = Error> = SuccessResult<T> | ErrorResult<E>;

/** Async result type */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
```

### JSON Types

```typescript
/** JSON primitive types */
export type JsonPrimitive = string | number | boolean | null;

/** JSON object type */
export type JsonObject = { [key: string]: JsonValue };

/** JSON array type */
export type JsonArray = JsonValue[];

/** JSON value type */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** Type-safe JSON stringify */
export type Jsonifiable = 
    | JsonPrimitive
    | { [key: string]: Jsonifiable }
    | Jsonifiable[];
```

### API Response Types

```typescript
/** Paginated response */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    links?: {
        first?: string;
        prev?: string;
        next?: string;
        last?: string;
    };
}

/** API error response */
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: unknown;
        timestamp: string;
        path?: string;
    };
}

/** API success response */
export interface ApiSuccessResponse<T> {
    data: T;
    metadata?: {
        timestamp: string;
        version?: string;
        [key: string]: unknown;
    };
}
```

## Type Aliases

### Common Aliases

```typescript
/** Nullable type */
export type Nullable<T> = T | null;

/** Maybe type (nullable or undefined) */
export type Maybe<T> = T | null | undefined;

/** Function type */
export type Fn<Args extends any[] = any[], Return = any> = (...args: Args) => Return;

/** Async function type */
export type AsyncFn<Args extends any[] = any[], Return = any> = (...args: Args) => Promise<Return>;

/** Class constructor type */
export type Constructor<T = {}> = new (...args: any[]) => T;

/** Record with string keys */
export type StringRecord<T> = Record<string, T>;

/** Record with number keys */
export type NumberRecord<T> = Record<number, T>;
```

### Event Types

```typescript
/** Event handler type */
export type EventHandler<T = any> = (event: T) => void | Promise<void>;

/** Event emitter interface */
export interface EventEmitter<Events extends Record<string, any>> {
    on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
    off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
    emit<K extends keyof Events>(event: K, data: Events[K]): void;
}
```

## Type Guards Collection

### Common Type Guards

```typescript
/** Check if value is defined */
export function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

/** Check if value is not null */
export function isNotNull<T>(value: T | null): value is T {
    return value !== null;
}

/** Check if value is not null or undefined */
export function isPresent<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/** Check if value is string */
export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

/** Check if value is number */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

/** Check if value is object */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Check if value is array */
export function isArray<T = unknown>(value: unknown): value is T[] {
    return Array.isArray(value);
}

/** Check if value is function */
export function isFunction(value: unknown): value is Function {
    return typeof value === 'function';
}

/** Check if value is promise */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
    return (
        value instanceof Promise ||
        (isObject(value) && isFunction(value.then))
    );
}
```

## Namespace Organization

### Types Namespace

```typescript
/** Main types namespace */
export namespace Types {
    // AIRS types
    export import AIRS = require('./airs');
    
    // Config types
    export import Config = require('./config');
    
    // MCP types
    export import MCP = require('./mcp');
    
    // Tool types
    export import Tools = require('./tools');
    
    // Transport types
    export import Transport = require('./transport');
}
```

## Usage Examples

### Importing Individual Types

```typescript
import { Config, MCPRequest, ScanSyncRequest } from '../types';

// Use types directly
const config: Config = loadConfig();
const request: MCPRequest = { jsonrpc: '2.0', method: 'test' };
```

### Using Utility Types

```typescript
import { DeepPartial, Result, Maybe } from '../types';

// Partial configuration
function updateConfig(partial: DeepPartial<Config>): void {
    // Update configuration with partial values
}

// Result type for error handling
function parseJson(text: string): Result<any> {
    try {
        return { success: true, data: JSON.parse(text) };
    } catch (error) {
        return { success: false, error: error as Error };
    }
}

// Maybe type for optional values
function findUser(id: string): Maybe<User> {
    return users.get(id) ?? null;
}
```

### Using Type Guards

```typescript
import { isString, isObject, isPresent } from '../types';

function processValue(value: unknown): void {
    if (isString(value)) {
        console.log('String:', value.toUpperCase());
    } else if (isObject(value)) {
        console.log('Object keys:', Object.keys(value));
    }
}

// Filter out null/undefined values
const values = [1, null, 'test', undefined, true];
const presentValues = values.filter(isPresent);
// TypeScript knows presentValues is (number | string | boolean)[]
```

### Using Namespace

```typescript
import { Types } from '../types';

// Access types through namespace
const config: Types.Config.Config = getConfig();
const request: Types.AIRS.ScanSyncRequest = createScanRequest();

// Check type categories
if (Types.AIRS.isAIRSAPIError(error)) {
    handleAIRSError(error);
}
```

## Type Composition

### Combining Types

```typescript
import { Config, MCPRequest, TransportRequest } from '../types';

/** Combined server request */
export interface ServerRequest {
    transport: TransportRequest;
    mcp: MCPRequest;
    config: Config;
}

/** Extended response type */
export interface ExtendedResponse<T> extends ApiSuccessResponse<T> {
    cached: boolean;
    timing: {
        start: number;
        end: number;
        duration: number;
    };
}
```

### Type Factories

```typescript
/** Create a typed event emitter */
export function createTypedEmitter<T extends Record<string, any>>(): EventEmitter<T> {
    // Implementation
}

/** Create a result factory */
export function createResult<T, E = Error>() {
    return {
        success: (data: T): SuccessResult<T> => ({ success: true, data }),
        error: (error: E): ErrorResult<E> => ({ success: false, error })
    };
}
```

## Best Practices

### 1. Use Named Exports

```typescript
// Good - specific imports
import { Config, MCPRequest } from '../types';

// Avoid - namespace imports for commonly used types
import * as Types from '../types';
```

### 2. Organize Related Types

```typescript
// Group related types in modules
export * from './airs';     // All AIRS-related types
export * from './config';   // All configuration types
export * from './mcp';      // All MCP protocol types
```

### 3. Document Type Exports

```typescript
/**
 * Core configuration types for the application
 * @module types/config
 */
export type { Config, ServerConfig } from './config';
```

### 4. Maintain Type Compatibility

```typescript
// Ensure backward compatibility
export type {
    // Current name
    Config,
    // Deprecated alias
    Config as Configuration
} from './config';
```

## Testing

### Type Export Testing

```typescript
import * as Types from '../types';
import { expectType } from 'tsd';

// Test that types are exported
expectType<Types.Config>(config);
expectType<Types.MCPRequest>(request);
expectType<Types.Result<string>>(result);

// Test utility types
type PartialConfig = Types.DeepPartial<Types.Config>;
expectType<PartialConfig>({ server: { port: 3000 } });
```

### Type Guard Testing

```typescript
import { isString, isObject, isPresent } from '../types';

describe('Type Guards', () => {
    test('isString', () => {
        expect(isString('test')).toBe(true);
        expect(isString(123)).toBe(false);
        expect(isString(null)).toBe(false);
    });
    
    test('isPresent', () => {
        expect(isPresent('value')).toBe(true);
        expect(isPresent(0)).toBe(true);
        expect(isPresent(null)).toBe(false);
        expect(isPresent(undefined)).toBe(false);
    });
});
```

## Related Documentation

- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system overview
- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - AIRS API types
- [Config Types]({{ site.baseurl }}/developers/src/types/config-types/) - Configuration types
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Tool Types]({{ site.baseurl }}/developers/src/types/tools-types/) - Tool types
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Transport types