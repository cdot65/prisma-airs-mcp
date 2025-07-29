---
layout: documentation
title: Types Index
permalink: /developers/src/types/index-file/
category: developers
---

Central export point for all TypeScript type definitions. Re-exports types from modules and provides common utility types.

## Core Purpose

- Centralize type exports
- Provide utility types
- Enable single import path
- Organize type system

## Export Categories

### Module Re-exports

```typescript
// AIRS API types
export * from './airs-types'

// Configuration types  
export * from './config-types'

// MCP protocol types
export * from './mcp-types'

// Tool types
export * from './tools-types'

// Transport types
export * from './transport-types'
```

### Common Types

```typescript
// JSON types
export type JsonValue = 
    | string | number | boolean | null
    | { [key: string]: JsonValue }
    | JsonValue[]

// Result types
export type Result<T, E = Error> = 
    | { success: true; data: T }
    | { success: false; error: E }

// Maybe type
export type Maybe<T> = T | null | undefined
```

## Integration in Application

- **Import Path**: Single source for all types
- **Type Safety**: Compile-time validation
- **IntelliSense**: IDE autocomplete support
- **Organization**: Logical grouping

## Usage Patterns

### Single Import

```typescript
import { 
    Config, 
    AirsScanRequest,
    McpTool,
    TransportMessage 
} from './types'
```

### Type Guards

```typescript
// Check if value exists
function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined
}

// Check result success
function isSuccess<T>(result: Result<T>): result is SuccessResult<T> {
    return result.success === true
}
```

### Utility Types

```typescript
// Make properties optional
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object 
        ? DeepPartial<T[P]> 
        : T[P]
}

// Extract function return type
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never
```

## Key Features

### Type Organization

- Grouped by domain (AIRS, MCP, etc.)
- Consistent naming conventions
- Clear export structure

### Developer Experience

- Single import location
- Type safety throughout
- Clear documentation

### Extensibility

- Easy to add new types
- Maintains backward compatibility
- Supports module growth

## Related Modules

- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - API interfaces
- [Config Types]({{ site.baseurl }}/developers/src/types/config-types/) - Settings types
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system
