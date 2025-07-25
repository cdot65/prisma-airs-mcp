# TypeScript Style Guide for Prisma AIRS MCP Server

## Overview

This document defines the TypeScript coding standards and best practices for the Prisma AIRS MCP Server project. All code must adhere to these conventions to ensure consistency, maintainability, and quality.

## Core Principles

1. **Type Safety First**: Leverage TypeScript's type system to catch errors at compile time
2. **Modern Syntax**: Use latest stable TypeScript features
3. **Functional Programming**: Prefer immutability and pure functions where appropriate
4. **Explicit Over Implicit**: Be clear about types and intentions
5. **Consistency**: Follow established patterns throughout the codebase

## TypeScript Configuration

### tsconfig.json Settings

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

## File Organization

### File Structure

```typescript
// 1. License/Copyright header (if applicable)

// 2. Imports - External dependencies
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// 3. Imports - Internal dependencies
import { MCPError } from '@/protocol/errors';
import { Logger } from '@/utils/logger';

// 4. Type definitions and interfaces
interface RequestContext {
  requestId: string;
  userId?: string;
}

// 5. Constants
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000;

// 6. Main implementation
export class RequestHandler {
  // Implementation
}

// 7. Helper functions (if needed)
function validateRequest(req: Request): void {
  // Validation logic
}

// 8. Exports (if not already exported inline)
```

## Naming Conventions

### Files and Directories

- **Files**: `kebab-case.ts`
  - ✅ `mcp-server.ts`
  - ✅ `request-handler.ts`
  - ❌ `MCPServer.ts`
  - ❌ `requestHandler.ts`

- **Test Files**: `*.test.ts` or `*.spec.ts`
  - ✅ `mcp-server.test.ts`
  - ✅ `request-handler.spec.ts`

- **Directories**: `kebab-case`
  - ✅ `prisma-airs/`
  - ❌ `prismaAirs/`

### Code Naming

```typescript
// Classes: PascalCase
class MCPServer {
  // ...
}

// Interfaces: PascalCase (NO "I" prefix)
interface ServerConfig {
  port: number;
  host: string;
}

// Type Aliases: PascalCase
type RequestHandler = (req: Request) => Promise<Response>;

// Enums: PascalCase with PascalCase values
enum LogLevel {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warning = 'WARNING',
  Error = 'ERROR',
}

// Constants: UPPER_SNAKE_CASE
const MAX_CONNECTION_ATTEMPTS = 5;
const DEFAULT_PORT = 8080;

// Functions/Methods: camelCase
function handleRequest(req: Request): void {
  // ...
}

// Variables: camelCase
const serverInstance = new MCPServer();
let isConnected = false;

// Private members: prefixed with underscore
class Example {
  private _internalState: string;
}

// Boolean variables: use is/has/should prefixes
const isActive = true;
const hasPermission = false;
const shouldRetry = true;
```

## Type Definitions

### Use Explicit Types

```typescript
// ✅ Good - Explicit return type
function calculateSum(a: number, b: number): number {
  return a + b;
}

// ❌ Bad - Implicit return type
function calculateSum(a: number, b: number) {
  return a + b;
}
```

### Prefer Interfaces Over Type Aliases for Objects

```typescript
// ✅ Good - Interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good - Type alias for unions/intersections
type Status = 'active' | 'inactive' | 'pending';
type ID = string | number;

// ❌ Bad - Type alias for simple object
type User = {
  id: string;
  name: string;
};
```

### Avoid `any` - Use `unknown` When Necessary

```typescript
// ✅ Good - Type-safe approach
function processData(data: unknown): void {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}

// ❌ Bad - Loses type safety
function processData(data: any): void {
  console.log(data.toUpperCase()); // No type checking
}
```

### Use Const Assertions

```typescript
// ✅ Good - Const assertion for literal types
const config = {
  host: 'localhost',
  port: 8080,
} as const;

// ✅ Good - For arrays
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type Method = (typeof ALLOWED_METHODS)[number]; // 'GET' | 'POST' | 'PUT' | 'DELETE'
```

## Modern TypeScript Features

### Use Optional Chaining and Nullish Coalescing

```typescript
// ✅ Good - Optional chaining
const userName = user?.profile?.name;

// ✅ Good - Nullish coalescing
const port = process.env.PORT ?? 8080;

// ❌ Bad - Old style
const userName = user && user.profile && user.profile.name;
const port = process.env.PORT || 8080; // Wrong for falsy values like 0
```

### Template Literal Types

```typescript
// ✅ Good - Type-safe event names
type EventName = `on${Capitalize<string>}`;
type MCPMethod = `mcp.${string}`;
```

### Discriminated Unions

```typescript
// ✅ Good - Type-safe discriminated unions
type Result<T> = { success: true; data: T } | { success: false; error: Error };

function handleResult<T>(result: Result<T>): void {
  if (result.success) {
    console.log(result.data); // TypeScript knows data exists
  } else {
    console.error(result.error); // TypeScript knows error exists
  }
}
```

## Async/Await Best Practices

### Always Use Async/Await Over Promises

```typescript
// ✅ Good - Async/await
async function fetchData(id: string): Promise<Data> {
  try {
    const response = await api.get(`/data/${id}`);
    return response.data;
  } catch (error) {
    throw new MCPError('Failed to fetch data', error);
  }
}

// ❌ Bad - Promise chains
function fetchData(id: string): Promise<Data> {
  return api
    .get(`/data/${id}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new MCPError('Failed to fetch data', error);
    });
}
```

### Proper Error Handling

```typescript
// ✅ Good - Explicit error handling
async function processRequest(req: Request): Promise<Response> {
  try {
    const data = await validateRequest(req);
    const result = await processData(data);
    return createResponse(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return createErrorResponse(400, error.message);
    }
    if (error instanceof MCPError) {
      return createErrorResponse(error.code, error.message);
    }
    // Unknown error - log and return generic error
    logger.error('Unexpected error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}
```

## Functional Programming Patterns

### Prefer Immutability

```typescript
// ✅ Good - Immutable operations
const updatedUsers = users.map((user) => ({
  ...user,
  lastActive: new Date(),
}));

const filteredItems = items.filter((item) => item.active);

// ❌ Bad - Mutating arrays
users.forEach((user) => {
  user.lastActive = new Date();
});
```

### Use Pure Functions

```typescript
// ✅ Good - Pure function
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad - Side effects
let total = 0;
function calculateTotal(items: Item[]): void {
  total = items.reduce((sum, item) => sum + item.price, 0);
}
```

## Error Handling

### Custom Error Classes

```typescript
// ✅ Good - Typed custom errors
export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// Usage
throw new MCPError('Invalid request', 400, { field: 'id' });
```

### Result Types

```typescript
// ✅ Good - Result type for operations that can fail
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function parseConfig(path: string): Promise<Result<Config>> {
  try {
    const data = await fs.readFile(path, 'utf-8');
    const config = JSON.parse(data) as Config;
    return { ok: true, value: config };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}
```

## Documentation

### JSDoc for Public APIs

````typescript
/**
 * Handles incoming MCP requests and routes them to appropriate handlers
 *
 * @param request - The incoming MCP request
 * @param context - Request context including auth and metadata
 * @returns Promise resolving to MCP response
 * @throws {MCPError} When request validation fails
 * @throws {AuthError} When authentication fails
 *
 * @example
 * ```typescript
 * const response = await handleMCPRequest(request, context);
 * ```
 */
export async function handleMCPRequest(
  request: MCPRequest,
  context: RequestContext,
): Promise<MCPResponse> {
  // Implementation
}
````

## Testing Conventions

### Test Structure

```typescript
// ✅ Good - Well-structured tests
describe('MCPServer', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer(testConfig);
  });

  afterEach(async () => {
    await server.close();
  });

  describe('handleRequest', () => {
    it('should process valid requests successfully', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await server.handleRequest(request);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
      });
    });

    it('should reject invalid requests with 400 error', async () => {
      // Test implementation
    });
  });
});
```

## Import/Export Guidelines

### Use Named Exports

```typescript
// ✅ Good - Named exports
export class MCPServer {}
export interface ServerConfig {}
export const DEFAULT_CONFIG = {};

// Import
import { MCPServer, ServerConfig, DEFAULT_CONFIG } from './mcp-server';

// ❌ Avoid - Default exports (except for React components)
export default class MCPServer {}
```

### Barrel Exports

```typescript
// ✅ Good - index.ts for public API
// src/protocol/index.ts
export { MCPServer } from './server';
export { MCPClient } from './client';
export type { MCPRequest, MCPResponse } from './types';
```

## Performance Considerations

### Lazy Loading

```typescript
// ✅ Good - Lazy load heavy dependencies
async function processLargeFile(path: string): Promise<void> {
  const { parseFile } = await import('./heavy-parser');
  return parseFile(path);
}
```

### Memoization

```typescript
// ✅ Good - Memoize expensive computations
import { memoize } from './utils/memoize';

const getCompiledSchema = memoize(async (schemaPath: string) => {
  const schema = await loadSchema(schemaPath);
  return compileSchema(schema);
});
```

## Security Best Practices

### Input Validation

```typescript
// ✅ Good - Use schema validation
import { z } from 'zod';

const RequestSchema = z.object({
  id: z.string().uuid(),
  method: z.string().min(1),
  params: z.record(z.unknown()).optional(),
});

function validateRequest(data: unknown): MCPRequest {
  return RequestSchema.parse(data);
}
```

### Avoid Dynamic Code Execution

```typescript
// ❌ Never use eval or Function constructor
const result = eval(userInput); // NEVER DO THIS

// ✅ Use safe alternatives
const operations = {
  add: (a: number, b: number) => a + b,
  subtract: (a: number, b: number) => a - b,
};

const result = operations[operation]?.(a, b);
```

## Code Organization Patterns

### Dependency Injection

```typescript
// ✅ Good - Dependency injection
export class MCPServer {
  constructor(
    private readonly config: ServerConfig,
    private readonly logger: Logger,
    private readonly airsClient: AIRSClient,
  ) {}
}

// Usage
const server = new MCPServer(config, logger, airsClient);
```

### Factory Pattern

```typescript
// ✅ Good - Factory for complex object creation
export class HandlerFactory {
  static createHandler(type: HandlerType): Handler {
    switch (type) {
      case HandlerType.Resource:
        return new ResourceHandler();
      case HandlerType.Tool:
        return new ToolHandler();
      case HandlerType.Prompt:
        return new PromptHandler();
      default:
        throw new Error(`Unknown handler type: ${type}`);
    }
  }
}
```

## Prettier Configuration

See `.prettierrc` in the project root for formatting rules.

## ESLint Configuration

See `.eslintrc.js` in the project root for linting rules.

## Enforcement

- All code must pass TypeScript compilation with strict mode
- All code must pass ESLint checks
- All code must be formatted with Prettier
- Pre-commit hooks will enforce these standards
- CI/CD pipeline will validate compliance

## References

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)
