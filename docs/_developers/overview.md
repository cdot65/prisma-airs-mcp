---
layout: documentation
title: Overview
description: Developer documentation for Prisma AIRS MCP server
permalink: /developers/
category: developers
---

## Introduction

The Prisma AIRS MCP server is a production-ready implementation of the Model Context Protocol that acts as an API bridge
between AI applications and Palo Alto Networks' Prisma AIRS security platform. It exposes security scanning capabilities
through standard MCP tools, resources, and prompts.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│            MCP Client (Claude, VSCode, AI App)          │
└─────────────────────────┬───────────────────────────────┘
                          │ JSON-RPC 2.0 / SSE
┌─────────────────────────▼───────────────────────────────┐
│                 Express HTTP Server                     │
│                    (Port 3000)                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Resources  │  │    Tools     │  │   Prompts    │    │
│  │  Handler    │  │   Handler    │  │   Handler    │    │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                │                 │            │
│  ┌──────▼────────────────▼─────────────────▼────────┐   │
│  │           HTTP Transport Handler                 │   │
│  │  • JSON-RPC routing  • SSE streaming support     │   │
│  │  • Session management • Error handling           │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │         Enhanced AIRS Client Module              │   │
│  │  • REST API Client   • Token Bucket Rate Limiter │   │
│  │  • LRU Cache         • Exponential Retry Logic   │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS (x-pan-token auth)
┌─────────────────────────▼───────────────────────────────┐
│                  Prisma AIRS API                        │
│                     (v1 endpoints)                      │
└─────────────────────────────────────────────────────────┘
```

## Source Code Documentation

Our source code is organized into modular components, each serving a specific purpose in the MCP server architecture.
Here's a high-level overview of each module:

### [Types Module]({{ site.baseurl }}/developers/src/types/) (`src/types/`)

The centralized type system providing TypeScript definitions for the entire application:

- **Purpose**: Single source of truth for all type definitions
- **Key Features**:
  - Module-prefixed naming convention (Airs*, Mcp*, Config\*, etc.)
  - Prevents circular dependencies
  - Enables type-safe development across all modules
- **Components**:
  - `airs.ts` - AIRS API types
  - `mcp.ts` - MCP protocol types
  - `config.ts` - Configuration types
  - `tools.ts` - Tool handler types
  - `transport.ts` - HTTP/SSE transport types

### [AIRS Module]({{ site.baseurl }}/developers/src/airs/) (`src/airs/`)

The core integration layer with Prisma AIRS security API:

- **Purpose**: Provides robust, production-ready API client with enterprise features
- **Key Features**:
  - REST API client with automatic retry logic
  - LRU caching system for performance optimization
  - Token bucket rate limiting to prevent API throttling
  - Singleton factory pattern for consistent client instances
- **Components**:
  - `client.ts` - Base API client with error handling
  - `cache.ts` - In-memory LRU cache implementation
  - `rate-limiter.ts` - Token bucket rate limiting
  - `index.ts` - Enhanced client orchestrating all features
  - `factory.ts` - Singleton pattern implementation

### [Transport Module]({{ site.baseurl }}/developers/src/transport/) (`src/transport/`)

Handles MCP protocol communication over HTTP and Server-Sent Events:

- **Purpose**: Implements the transport layer for MCP JSON-RPC 2.0 protocol
- **Key Features**:
  - HTTP server for standard request/response
  - SSE support for streaming operations
  - Session management for persistent connections
  - Request routing to appropriate handlers
- **Components**:
  - `http.ts` - Express-based HTTP transport
  - `sse.ts` - Server-Sent Events implementation

### [Tools Module]({{ site.baseurl }}/developers/src/tools/) (`src/tools/`)

Implements MCP tools for security scanning operations:

- **Purpose**: Exposes AIRS functionality as callable MCP tools
- **Available Tools**:
  - `airs_scan_content` - Synchronous content scanning
  - `airs_scan_async` - Batch asynchronous scanning
  - `airs_get_scan_results` - Retrieve scan results
  - `airs_get_threat_reports` - Get detailed threat analysis
  - `airs_clear_cache` - Cache management
- **Features**:
  - JSON Schema validation for inputs
  - Progress indicators for long operations
  - Resource references in responses

### [Resources Module]({{ site.baseurl }}/developers/src/resources/) (`src/resources/`)

Provides access to AIRS data through MCP resource URIs:

- **Purpose**: Implements MCP resource interface for data access
- **Resource Types**:
  - Static: Cache stats, rate limit status
  - Dynamic: Scan results, threat reports
- **URI Scheme**: `airs://{type}/{id}`
- **Features**:
  - RESTful resource access pattern
  - JSON content type for all resources
  - Automatic caching through AIRS client

### [Prompts Module]({{ site.baseurl }}/developers/src/prompts/) (`src/prompts/`)

Pre-defined conversation workflows for common security tasks:

- **Purpose**: Provides structured security analysis workflows
- **Available Prompts**:
  - `security_analysis` - Comprehensive threat analysis
  - `threat_investigation` - Deep dive into specific threats
  - `compliance_check` - Regulatory compliance verification
  - `incident_response` - Security incident handling guide
- **Features**:
  - Argument interpolation
  - Step-by-step workflows
  - Integration with tools and resources

### [Configuration Module]({{ site.baseurl }}/developers/src/config/) (`src/config/`)

Centralized configuration management with runtime validation:

- **Purpose**: Type-safe configuration with environment variable support
- **Key Features**:
  - Zod schema validation
  - Singleton pattern for consistency
  - Environment-based defaults
  - Runtime type checking
- **Configuration Areas**:
  - Server settings (port, environment)
  - AIRS API credentials and settings
  - MCP protocol configuration

### [Utils Module]({{ site.baseurl }}/developers/src/utils/) (`src/utils/`)

Shared utilities and cross-cutting concerns:

- **Purpose**: Common functionality used across modules
- **Components**:
  - `logger.ts` - Winston-based structured logging
- **Features**:
  - Environment-aware log levels
  - JSON formatting for production
  - Request ID tracking

### [Root Module]({{ site.baseurl }}/developers/src/) (`src/index.ts`)

The application entry point and Express server setup:

- **Purpose**: Initializes and orchestrates all components
- **Responsibilities**:
  - Express server configuration
  - Health and readiness endpoints
  - MCP endpoint routing
  - Graceful shutdown handling
- **Endpoints**:
  - `POST /` - Main MCP JSON-RPC endpoint
  - `GET /` - SSE streaming endpoint
  - `GET /health` - Health check
  - `GET /ready` - Readiness probe

## Key Design Patterns

### 1. Centralized Type System

All TypeScript types are centralized in `src/types/` with consistent module prefixing to prevent naming conflicts and
circular dependencies.

### 2. Layered Architecture

Clear separation of concerns with transport, business logic, and data access layers.

### 3. Singleton Pattern

Configuration and AIRS client use singleton pattern to ensure consistent state across the application.

### 4. Factory Pattern

AIRS client factory manages instance creation and lifecycle.

### 5. Handler Pattern

Separate handlers for tools, resources, and prompts implement the Strategy pattern for extensibility.

## Performance & Reliability Features

### Caching System

- LRU (Least Recently Used) eviction policy
- Configurable TTL (Time To Live)
- SHA-256 based cache key generation
- Automatic cache invalidation for incomplete results

### Rate Limiting

- Token bucket algorithm
- Per-operation rate limits
- Automatic request queuing
- Graceful degradation under load

### Error Handling

- Comprehensive error types for AIRS API and MCP protocol
- Automatic retry with exponential backoff
- Detailed error logging with context
- Client-friendly error messages

### Monitoring & Observability

- Health and readiness endpoints
- Structured JSON logging
- Performance metrics (cache hit rate, rate limit status)
- Request tracing with correlation IDs

## Security Considerations

- API keys stored server-side only
- Input validation on all endpoints
- No execution of arbitrary code
- Secure handling of sensitive scan results
- Rate limiting to prevent abuse

## Next Steps

- [Source Code Documentation]({{ site.baseurl }}/developers/src/) - Detailed documentation of each module
- [API Reference]({{ site.baseurl }}/developers/api/) - Complete API documentation
