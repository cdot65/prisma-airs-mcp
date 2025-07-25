# Claude Code Development Instructions

## Overview

This document provides specific instructions for Claude Code when working on the Prisma AIRS MCP Server project. Always reference this document when starting a development session.

## Starting Claude Code

### Direct CLI Usage

From the project root directory, start Claude Code with:

```bash
claude --add-dir "$(pwd)"
```

### Loading Project Context

Once Claude Code starts, request the essential context files:

```
Please read the following files to understand the project:
- .claude/instructions/CLAUDE.md (this file - development instructions)
- PRD.md (project requirements and specifications)
- .claude/context/TASKS.md (current task tracking)
- .claude/plans/PLAN.md (implementation strategy)
- .claude/conventions/typescript-style-guide.md (code style guide)
```

### Quick Context Command

Copy and paste this single command after starting Claude:

```
Read .claude/instructions/CLAUDE.md, PRD.md, .claude/context/TASKS.md, .claude/plans/PLAN.md, and .claude/conventions/typescript-style-guide.md to understand the Prisma AIRS MCP Server project, then let me know what you'd like to work on today.
```

## Essential Context Loading

When beginning work on this project, ALWAYS load the following context:

1. **MCP Documentation**: `.claude/documentation/mcp-full-documentation.txt`
   - Contains complete MCP protocol specification
   - Reference for all protocol implementation details

2. **Prisma AIRS API Documentation**: `.claude/context/prisma-airs-api/`
   - OpenAPI schema: `openapi-schema.yaml`
   - Developer documentation in subdirectories

3. **Project Documents**:
   - `PRD.md` - Product requirements and specifications
   - `TASKS.md` - Current task status and todo items
   - `PLAN.md` - Implementation strategy and architecture

## Development Commands

### Package Management (pnpm)

```bash
# Install dependencies
pnpm install

# Add new dependency
pnpm add <package>

# Add dev dependency
pnpm add -D <package>

# Run scripts
pnpm run <script>
```

### Common Development Tasks

```bash
# Start development server (with hot reload)
pnpm dev

# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run linting and auto-fix
pnpm run lint:fix

# Run type checking
pnpm run typecheck

# Format code
pnpm run format

# Run all validation checks
pnpm run validate

# Build for production
pnpm build

# Run production server
pnpm start
```

## Code Style Conventions

### IMPORTANT: Style Guide Compliance

All code MUST follow the TypeScript style guide located at:
`.claude/conventions/typescript-style-guide.md`

Key requirements:

- **Strict TypeScript**: All strict mode flags enabled
- **Modern Features**: Use ES2022+ features
- **Type Safety**: No `any` types, explicit return types
- **Immutability**: Prefer functional programming patterns
- **Error Handling**: Use typed custom errors and Result types

### Formatting and Linting

Before committing any code:

```bash
# Auto-fix linting issues
pnpm run lint:fix

# Format code with Prettier
pnpm run format

# Run type checking
pnpm run typecheck

# Validate all checks pass (lint + format + typecheck + test)
pnpm run validate
```

Configuration files:

- `eslint.config.js` - ESLint flat config (root directory)
- `.prettierrc` - Formatting rules
- `tsconfig.json` - TypeScript configuration

### Quick Reference

- Files: `kebab-case.ts`
- Classes/Interfaces/Types: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Private members: `_prefixedWithUnderscore`
- Booleans: `is/has/should` prefixes

## MCP Implementation Guidelines

### 1. Protocol Compliance

- Strictly follow MCP specification in `.claude/documentation/mcp-full-documentation.txt`
- Use exact JSON-RPC 2.0 format
- Implement all required protocol features

### 2. Error Handling

```typescript
// MCP error codes
enum MCPErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}

// Always return proper MCP errors
return {
  jsonrpc: '2.0',
  error: {
    code: MCPErrorCode.InvalidParams,
    message: 'Invalid parameters',
    data: { details: "Parameter 'x' is required" },
  },
  id: request.id,
};
```

### 3. Resource Implementation

```typescript
// Resources must follow this pattern
interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// Resource URIs should follow pattern: airs://{resource-type}/{id}
// Example: airs://policy/123
```

### 4. Tool Implementation

```typescript
// Tools must include full schema
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
```

## Prisma AIRS Integration

### API Client Usage

```typescript
// Always use the typed client
import { PrismaAIRSClient } from './clients/prisma-airs';

// Handle authentication properly
const client = new PrismaAIRSClient({
  apiKey: process.env.PRISMA_AIRS_API_KEY,
  baseUrl: process.env.PRISMA_AIRS_BASE_URL,
});

// Always handle errors
try {
  const result = await client.getPolicies();
} catch (error) {
  // Transform to MCP error
}
```

### Rate Limiting

- Respect API rate limits
- Implement exponential backoff
- Cache responses where appropriate

## Testing Requirements

### Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # API integration tests
├── e2e/           # End-to-end MCP protocol tests
└── fixtures/      # Test data and mocks
```

### Test Coverage

- Minimum 80% code coverage
- All MCP handlers must have tests
- All AIRS API calls must be tested
- Error cases must be covered

## Docker Development

### Building Images

```bash
# Development build
docker build -f docker/Dockerfile.dev -t prisma-airs-mcp:dev .

# Production build
docker build -f docker/Dockerfile -t prisma-airs-mcp:latest .
```

### Running Containers

```bash
# Development with hot reload
docker run -v $(pwd):/app -p 8080:8080 prisma-airs-mcp:dev

# Production
docker run -p 8080:8080 --env-file .env prisma-airs-mcp:latest
```

## Kubernetes Development

### Local Testing with Minikube

```bash
# Start minikube
minikube start

# Build image in minikube
eval $(minikube docker-env)
docker build -t prisma-airs-mcp:local .

# Apply manifests
kubectl apply -k k8s/

# Port forward for testing
kubectl port-forward svc/prisma-airs-mcp 8080:8080
```

## Environment Variables

Required environment variables:

```bash
# Prisma AIRS Configuration
AIRS_API_URL=https://api.prismaairs.example.com
AIRS_API_KEY=your-api-key-here

# Server Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Cache Configuration
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# MCP Configuration
MCP_SERVER_NAME=prisma-airs-mcp
MCP_SERVER_VERSION=1.0.0
```

**Note**: All environment variables are mandatory. The server will not start without them.

## Debugging Tips

1. **Enable Debug Logging**:

   ```bash
   LOG_LEVEL=debug pnpm dev
   ```

2. **Inspect MCP Messages**:
   - Log all incoming/outgoing JSON-RPC messages
   - Use correlation IDs for request tracking

3. **API Client Debugging**:
   - Enable request/response interceptors
   - Log all API calls with timing

## Common Issues and Solutions

### Issue: TypeScript compilation errors

**Solution**: Run `pnpm run typecheck` and fix all errors before proceeding

### Issue: MCP protocol validation fails

**Solution**: Check message format against `.claude/documentation/mcp-full-documentation.txt`

### Issue: AIRS API authentication fails

**Solution**: Verify API key is set correctly in environment variables

### Issue: Rate limiting errors

**Solution**: Check cache implementation and retry logic

### Issue: Deprecated Zod methods

**Solution**: Use custom refinements instead of deprecated validators (e.g., for URL validation)

### Issue: ESLint configuration errors

**Solution**: Ensure using flat config format in `eslint.config.js`

## Progress Tracking

Always update `TASKS.md` when:

- Starting a new task (mark as in_progress)
- Completing a task (mark as completed)
- Identifying new tasks (add to appropriate phase)
- Encountering blockers (note in blockers section)

## Code Review Checklist

Before marking any task as complete:

- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm run typecheck`)
- [ ] ESLint passes without errors (`pnpm run lint:fix`)
- [ ] Code is properly formatted (`pnpm run format`)
- [ ] All validation passes (`pnpm run validate`)
- [ ] Code follows TypeScript style guide
- [ ] Error handling is comprehensive
- [ ] Documentation is updated
- [ ] No hardcoded values
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Server endpoints tested manually (health, ready, ping, initialize)

## Additional Resources

- MCP GitHub: https://github.com/modelcontextprotocol/typescript-sdk
- MCP Docs: Stored locally at `.claude/documentation/mcp-full-documentation.txt`
- Prisma AIRS Docs: Check `.claude/context/prisma-airs-api/` directory
- TypeScript Style Guide: `.claude/conventions/typescript-style-guide.md`
- Linting Setup: `.claude/conventions/linting-setup.md`

## Current Implementation Status (Phase 7 Complete - DEPLOYED TO PRODUCTION!)

### Deployed Production Server

**PROJECT IS LIVE! 🎉**

**Latest Update (v1.2.1)**: Full MCP protocol compliance achieved!

- **Production URL**: https://airs.cdot.io/prisma-airs
- **Health Check**: https://airs.cdot.io/prisma-airs/health
- **Claude Integration**: Ready to use! See [CLAUDE_SETUP.md](../../CLAUDE_SETUP.md)
- **Namespace**: prisma-airs
- **Service Port**: 80
- **Ingress**: Traefik with TLS termination on port 443
- **MCP Compliance**: All endpoints validated with MCP Inspector

### Completed Components

1. **HTTP Transport** (`src/transport/http.ts`)
   - JSON-RPC 2.0 message routing
   - Full MCP method handling
   - Integrated with all handlers

2. **Configuration** (`src/config/index.ts`)
   - Zod-based validation
   - Type-safe access
   - All env vars mandatory

3. **Logging** (`src/utils/logger.ts`)
   - Winston with JSON format
   - Log levels by environment
   - Request/response logging

4. **Main Server** (`src/index.ts`)
   - Express setup on port 3000 (updated for production)
   - Health/ready endpoints
   - MCP message routing

5. **AIRS Client** (`src/airs/`)
   - Complete API client with retry logic
   - Token bucket rate limiting
   - TTL-based response caching
   - Factory pattern for singleton
   - Production API URL: https://service.api.aisecurity.paloaltonetworks.com

6. **MCP Resources** (`src/resources/`)
   - Cache statistics resource
   - Rate limit status resource
   - Dynamic scan result resources
   - Dynamic threat report resources

7. **MCP Tools** (`src/tools/`)
   - airs_scan_content - Synchronous content scanning
   - airs_scan_async - Asynchronous batch scanning
   - airs_get_scan_results - Retrieve scan results
   - airs_get_threat_reports - Get threat reports
   - airs_clear_cache - Clear response cache

8. **MCP Prompts** (`src/prompts/`)
   - security_analysis - Security analysis workflow
   - threat_investigation - Threat investigation workflow
   - compliance_check - Compliance validation workflow
   - incident_response - Incident response workflow

9. **Docker Containerization** (`docker/`)
   - Multi-stage production build (149MB)
   - Non-root user execution
   - Health check included
   - Multi-platform support (ARM64 for dev, AMD64 for production)

10. **Kubernetes Deployment** (`k8s/`)
    - Complete manifests with Kustomize
    - Production configuration with 3 replicas
    - Traefik IngressRoute with TLS
    - Secrets management scripts
    - Auto-deployment scripts

### Key Architectural Decisions

- **NO stdio transport** - HTTP only for K8s deployment
- **API Key only** - No API secret required
- **Mandatory env vars** - Server won't start without them
- **ESLint flat config** - Using new eslint.config.js format
- **Port 3000** - Changed from 3000 for production
- **Latest tag only** - No 'dev' tag deployment (ARM-specific)
- **Path routing** - /prisma-airs prefix stripped by Traefik

### Recent Protocol Fixes (v1.2.1)

- **Ping Response**: Changed from `{ pong: true }` to `{}` per MCP spec
- **Notifications**: Added `notifications/initialized` handler
- **Resource Templates**: Implemented `resources/templates/list` endpoint
- **Server Capabilities**: Added `subscribe: false` and `logging: {}`

### Production Configuration

```bash
# API Endpoint
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com

# Container Registry
ghcr.io/cdot65/prisma-airs-mcp:latest

# Ingress
Host: airs.cdot.io
Path: /prisma-airs
TLS: Wildcard certificate (*.cdot.io)
```

Remember: Always prioritize protocol compliance, code quality, and security in all implementations.
