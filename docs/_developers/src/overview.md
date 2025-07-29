---
layout: documentation
title: Source Code Overview
permalink: /developers/src/overview/
category: developers
---

# Source Code Structure Overview

The Prisma AIRS MCP server is organized into a modular architecture where each directory serves a specific purpose. This
guide provides an overview of the source code structure and helps you navigate the codebase effectively.

## Directory Structure

```
src/
├── airs/           # AIRS API integration layer
├── config/         # Configuration management
├── prompts/        # MCP prompt handlers
├── resources/      # MCP resource handlers
├── tools/          # MCP tool implementations
├── transport/      # HTTP/SSE transport layer
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and helpers
├── index.ts        # Application entry point
└── instrument.ts   # Sentry monitoring initialization
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP Clients                          │
│              (Claude, IDEs, Custom Tools)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/SSE
┌─────────────────────▼───────────────────────────────────────┐
│                    Transport Layer                          │
│                 (HTTP Server, SSE Streams)                  │
├─────────────────────────────────────────────────────────────┤
│                     MCP Protocol                            │
│              (Tools, Resources, Prompts)                    │
├─────────────────────────────────────────────────────────────┤
│                  Business Logic Layer                       │
│    ┌──────────┐  ┌───────────┐  ┌──────────────┐         │
│    │  Tools   │  │ Resources │  │   Prompts    │         │
│    └──────────┘  └───────────┘  └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    AIRS Integration                         │
│    ┌──────────┐  ┌───────────┐  ┌──────────────┐         │
│    │  Client  │  │   Cache   │  │ Rate Limiter │         │
│    └──────────┘  └───────────┘  └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                   Support Systems                           │
│    ┌──────────┐  ┌───────────┐  ┌──────────────┐         │
│    │  Config  │  │  Logging  │  │  Monitoring  │         │
│    └──────────┘  └───────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Module Descriptions

### Core Modules

#### `/airs/` - AIRS Integration

Handles all communication with the Prisma AI Runtime Security API. Includes client implementation, caching, rate
limiting, and factory pattern for singleton management.

**Key Components:**

- REST API client with retry logic
- In-memory LRU cache
- Token bucket rate limiter
- Singleton factory pattern

#### `/transport/` - Transport Layer

Implements the HTTP server and Server-Sent Events (SSE) support for MCP protocol communication.

**Key Components:**

- Express.js HTTP server
- SSE streaming for long-running operations
- Session management
- JSON-RPC 2.0 protocol handling

#### `/types/` - Type Definitions

Central location for all TypeScript type definitions, ensuring type safety across the application.

**Categories:**

- AIRS API types
- MCP protocol types
- Configuration types
- Tool and transport types

### MCP Implementation

#### `/tools/` - Tool Handlers

Implements MCP tools that clients can invoke to perform operations.

**Available Tools:**

- `airs_scan_content` - Synchronous content scanning
- `airs_scan_async` - Asynchronous batch scanning
- `airs_get_scan_results` - Retrieve scan results
- `airs_get_threat_reports` - Get threat reports
- `airs_clear_cache` - Clear response cache

#### `/resources/` - Resource Handlers

Provides access to server resources through the MCP protocol.

**Resource Types:**

- Static resources (cache stats, rate limit status)
- Dynamic resources (scan results, threat reports)

#### `/prompts/` - Prompt Handlers

Pre-configured security analysis workflows that guide users through common tasks.

**Available Prompts:**

- Security analysis
- Threat investigation
- Compliance checking
- Incident response

### Support Systems

#### `/config/` - Configuration Management

Centralized configuration system using environment variables with validation.

**Features:**

- Environment-based configuration
- Zod schema validation
- Default values with overrides
- Type-safe access

#### `/utils/` - Utilities

Common utility functions and helpers used throughout the application.

**Components:**

- **logger.ts** - Winston-based logging system
- **monitoring.ts** - Sentry error tracking and monitoring

### Entry Points

#### `/index.ts` - Main Application

The primary entry point that:

- Initializes the Express server
- Sets up MCP protocol handlers
- Configures middleware
- Starts the HTTP server

#### `/instrument.ts` - Monitoring Setup

Early initialization for Sentry monitoring that must be imported before other modules.

## Development Workflow

### Adding New Features

1. **New Tool**: Add to `/tools/index.ts`
2. **New Resource**: Add to `/resources/index.ts`
3. **New Prompt**: Add to `/prompts/index.ts`
4. **New Type**: Add to appropriate file in `/types/`
5. **New Utility**: Add to `/utils/`

### Code Organization Principles

1. **Single Responsibility**: Each module has a focused purpose
2. **Type Safety**: All APIs have TypeScript definitions
3. **Error Handling**: Consistent error handling patterns
4. **Logging**: Structured logging throughout
5. **Testing**: Unit tests alongside implementation

## Navigation Guide

### By Feature Area

- **Security Scanning**: Start with `/tools/` and `/airs/`
- **API Integration**: Focus on `/airs/client.ts`
- **Protocol Implementation**: See `/transport/` and MCP handlers
- **Configuration**: Check `/config/` and `/types/config.ts`
- **Monitoring**: Review `/utils/monitoring.ts` and `/instrument.ts`

### By Task

- **Understanding Request Flow**: index.ts → transport → handlers → AIRS
- **Adding Monitoring**: utils/monitoring.ts → instrument.ts
- **Debugging Issues**: utils/logger.ts → check logs
- **Performance Tuning**: airs/cache.ts and airs/rate-limiter.ts

## Best Practices

### Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Write descriptive function and variable names
- Add JSDoc comments for public APIs

### Error Handling

- Use custom error types where appropriate
- Always log errors with context
- Return meaningful error messages to clients
- Implement retry logic for transient failures

### Security

- Never log sensitive data (API keys, tokens)
- Validate all input data
- Use environment variables for secrets
- Implement rate limiting for all endpoints

## Next Steps

Explore specific modules:

- [AIRS Integration]({{ site.baseurl }}/developers/src/airs/overview/) - API client and supporting systems
- [Transport Layer]({{ site.baseurl }}/developers/src/transport/overview/) - HTTP and SSE implementation
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Environment and settings
- [Utilities]({{ site.baseurl }}/developers/src/utils/overview/) - Logging and monitoring