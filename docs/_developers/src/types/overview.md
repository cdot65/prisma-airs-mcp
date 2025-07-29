---
layout: documentation
title: Types Overview
permalink: /developers/src/types/overview/
category: developers
---

# Types Module Overview

The types module provides all TypeScript interfaces and type definitions for the Prisma AIRS MCP server, ensuring type safety and consistency.

## Module Structure

```
src/types/
├── airs.ts       # AIRS API types
├── config.ts     # Configuration types
├── mcp.ts        # MCP protocol types
├── tools.ts      # Tool parameter types
├── transport.ts  # Transport layer types
└── index.ts      # Central exports
```

## Core Purpose

- **Type Safety**: Compile-time validation
- **API Contracts**: Interface definitions
- **IntelliSense**: IDE support
- **Single Source**: Central type definitions

## Type Categories

### AIRS Types
Request/response interfaces for Prisma AIRS API:
- `AirsScanRequest`, `AirsScanResponse`
- `ThreatDetection`, `ThreatReport`
- `PrismaAirsApiError`

### Configuration Types
Application settings structure:
- `Config` - Main configuration
- `ServerConfig`, `AirsConfig`
- `CacheConfig`, `RateLimitConfig`

### MCP Types
Protocol message definitions:
- `McpTool`, `McpResource`, `McpPrompt`
- `McpToolsCallResult`
- `McpServerCapabilities`

### Tool Types
Tool parameter interfaces:
- `ToolsScanContentArgs`
- `ToolsScanAsyncArgs`
- `ToolsGetScanResultsArgs`

### Transport Types
HTTP/SSE communication:
- `TransportRequest`, `TransportResponse`
- `SSEEvent`, `SSEConnection`
- `SessionInfo`, `TransportError`

## Integration in Application

All modules import types from this central location:
```typescript
import { 
    Config, 
    AirsScanRequest,
    McpTool,
    TransportMessage 
} from './types'
```

## Key Patterns

### Union Types
```typescript
type ScanResult = 
    | { status: 'success'; data: ScanData }
    | { status: 'error'; error: string }
```

### Type Guards
```typescript
function isTransportError(error: unknown): error is TransportError {
    return error instanceof TransportError
}
```

### Generic Types
```typescript
interface Result<T, E = Error> {
    success: boolean
    data?: T
    error?: E
}
```

## Type Safety Benefits

### Compile-Time Checking
```typescript
// Error caught at compile time
const request: AirsScanRequest = {
    tr_id: 'scan_123',
    // Missing required 'ai_profile' field
}
```

### IDE Support
```typescript
const config = getConfig()
// IntelliSense shows all available properties
config.server.port
```

### Refactoring Safety
Type changes automatically propagate to all usage sites.

## Best Practices

1. **Avoid `any`** - Use `unknown` and type guards
2. **Explicit Returns** - Always type function returns
3. **Interface Extension** - Use for extensible objects
4. **Type Aliases** - Use for unions and primitives

## Common Types

```typescript
// Result wrapper
export type Result<T, E = Error> = 
    | { success: true; data: T }
    | { success: false; error: E }

// JSON values
export type JsonValue = 
    | string | number | boolean | null
    | { [key: string]: JsonValue }
    | JsonValue[]

// Maybe type
export type Maybe<T> = T | null | undefined
```

## Related Documentation

- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - API interfaces
- [Config Types]({{ site.baseurl }}/developers/src/types/config-types/) - Settings types
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Tool Types]({{ site.baseurl }}/developers/src/types/tools-types/) - Tool interfaces
- [Transport Types]({{ site.baseurl }}/developers/src/types/transport-types/) - Transport layer