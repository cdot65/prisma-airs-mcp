# Centralized Types Directory

This directory contains all TypeScript type definitions used throughout the Prisma AIRS MCP server. Types have been extracted from their original modules and centralized here to improve code organization and prevent circular dependencies.

## Naming Convention

All types in this directory follow a specific naming convention to avoid namespace conflicts:

- Types are prefixed with the capitalized name of their originating module
- For example:
    - Types from `src/airs/` are prefixed with `Airs` (e.g., `AirsScanRequest`)
    - Types from `src/mcp/` are prefixed with `Mcp` (e.g., `McpResource`)
    - Types from `src/tools/` are prefixed with `Tools` (e.g., `ToolsScanContentArgs`)
    - Types from `src/transport/` are prefixed with `Transport` (e.g., `TransportJsonRpcRequest`)
    - Types from `src/config/` are prefixed with `Config` (e.g., `ConfigServer`)

## File Structure

- `airs.ts` - Types from the AIRS client module
- `mcp.ts` - Types for the Model Context Protocol
- `tools.ts` - Types for tool handler arguments
- `transport.ts` - Types for HTTP/SSE transport layer
- `config.ts` - Types for application configuration
- `index.ts` - Main export file that re-exports all types

## Usage

Import types from the centralized location:

```typescript
// Import specific types
import { AirsScanRequest, McpTool, ToolsScanContentArgs } from '@/types';

// Or import from specific module files
import { AirsScanRequest } from '@/types/airs';
import { McpTool } from '@/types/mcp';
```

## Migration Status

- [x] AIRS types migrated and prefixed
- [x] MCP types migrated and prefixed
- [x] Tools types migrated and prefixed
- [x] Transport types migrated and prefixed
- [x] Config types migrated and prefixed
- [ ] Module imports updated to use centralized types
- [ ] Original type definitions removed from modules

## Notes

- Original type definitions remain in their modules during the transition
- Constants (like `AIRS_API_VERSION`) are included with their related types
- Type aliases that reference other modules use dynamic imports to maintain relationships
