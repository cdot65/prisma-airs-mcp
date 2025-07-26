# Prisma AIRS MCP Server - Architecture Documentation

## Project Overview

This project implements a Model Context Protocol (MCP) server that integrates with Prisma AI Runtime Security (AIRS) to provide AI security capabilities through the MCP interface. The server enables AI assistants and tools to scan content for security threats, retrieve scan results, and manage security-related resources.

## Architecture Components

### Core Components

#### 1. AIRS Client (`src/airs/`)
- **Purpose**: Handles communication with the Prisma AIRS API
- **Key Files**:
  - `types.ts`: TypeScript definitions for AIRS API requests/responses
  - `client.ts`: Core REST API client with retry logic and error handling
  - `index.ts`: Enhanced client with caching and rate limiting
  - `cache.ts`: In-memory caching for API responses
  - `rate-limiter.ts`: Token bucket rate limiting implementation
  - `factory.ts`: Singleton factory for client instances

#### 2. MCP Protocol (`src/mcp/`)
- **Purpose**: Defines MCP protocol types and interfaces
- **Key Files**:
  - `types.ts`: Complete MCP type definitions including:
    - Resources (list, read, templates)
    - Tools (list, call)
    - Prompts (list, get)
    - Server capabilities and initialization

#### 3. Transport Layer (`src/transport/`)
- **Purpose**: Handles HTTP and SSE transport for MCP communication
- **Key Files**:
  - `http.ts`: HTTP server transport with JSON-RPC 2.0 support
  - `sse.ts`: Server-Sent Events for streaming responses
  - Features:
    - Session management
    - Request routing
    - SSE streaming capabilities
    - Error handling

#### 4. MCP Handlers

##### Tools (`src/tools/`)
- **Available Tools**:
  1. `airs_scan_content`: Synchronous content scanning
  2. `airs_scan_async`: Asynchronous batch scanning
  3. `airs_get_scan_results`: Retrieve scan results by ID
  4. `airs_get_threat_reports`: Get detailed threat reports
  5. `airs_clear_cache`: Clear response cache

##### Resources (`src/resources/`)
- **Static Resources**:
  - `airs://cache-stats/current`: Cache performance metrics
  - `airs://rate-limit-status/current`: Rate limiting status
- **Dynamic Resources**:
  - `airs://scan-results/{scanId}`: Individual scan results
  - `airs://threat-reports/{reportId}`: Detailed threat reports

##### Prompts (`src/prompts/`)
- **Available Workflows**:
  1. `security_analysis`: Comprehensive security analysis
  2. `threat_investigation`: Detailed threat investigation
  3. `compliance_check`: Regulatory compliance checking
  4. `incident_response`: Security incident response guide

### Supporting Components

#### Configuration (`src/config/`)
- Environment-based configuration
- Supports defaults and overrides
- Key settings: AIRS API, server ports, MCP metadata

#### Logging (`src/utils/logger.ts`)
- Winston-based structured logging
- Environment-aware log levels
- JSON formatting for production

#### Server (`src/index.ts`)
- Express.js HTTP server
- Health and readiness endpoints
- CORS and JSON middleware
- Error handling

## API Integration

### AIRS API Endpoints
- **Sync Scan**: `POST /v1/scan/sync/request`
- **Async Scan**: `POST /v1/scan/async/request`
- **Get Results**: `GET /v1/scan/results?scan_ids=...`
- **Get Reports**: `GET /v1/scan/reports?report_ids=...`

### Security Features Detected
- **Prompt Threats**: URL categories, DLP, injection, toxic content, malicious code, agent threats, topic violations
- **Response Threats**: All prompt threats plus database security and ungrounded content

## Data Flow

1. **Client Request** → MCP Server (HTTP/SSE)
2. **MCP Server** → Route to appropriate handler (Tools/Resources/Prompts)
3. **Handler** → AIRS Client (with caching/rate limiting)
4. **AIRS Client** → Prisma AIRS API
5. **Response** → Transform and return via MCP protocol

## Key Design Patterns

1. **Singleton Pattern**: AIRS client factory ensures single instance
2. **Handler Pattern**: Separate handlers for tools, resources, and prompts
3. **Transport Abstraction**: Pluggable transport layer (HTTP/SSE)
4. **Caching Strategy**: In-memory LRU cache with TTL
5. **Rate Limiting**: Token bucket algorithm per operation type

## Error Handling

- Custom `AIRSAPIError` with status codes
- Retry logic for transient failures
- Graceful degradation with cached responses
- Structured error responses in MCP format

## Security Considerations

- API key authentication via `x-pan-token` header
- Input validation on all endpoints
- Rate limiting to prevent abuse
- No execution of arbitrary code
- Secure handling of sensitive data in scan results

## Performance Optimizations

1. **Caching**: Reduces API calls for repeated requests
2. **Rate Limiting**: Prevents API quota exhaustion
3. **Connection Pooling**: Reuses HTTP connections
4. **Streaming**: SSE support for long-running operations
5. **Batch Operations**: Async scanning for multiple requests

## Development Patterns

### Adding New Tools
1. Define tool in `tools/index.ts` `TOOLS` constant
2. Add input schema in `listTools()`
3. Implement handler method
4. Add case in `callTool()` switch

### Adding New Resources
1. Define resource type in `RESOURCE_TYPES`
2. Add to `listResources()` if static
3. Implement read handler
4. Add case in `readResource()` switch

### Adding New Prompts
1. Define prompt in `PROMPTS` constant
2. Add to `listPrompts()` with arguments
3. Implement prompt generation method
4. Add case in `getPrompt()` switch

## Testing Considerations

- Unit tests for individual components
- Integration tests for AIRS API communication
- Mock AIRS responses for consistent testing
- Test rate limiting and caching behavior
- Validate MCP protocol compliance

## Deployment Notes

- Configurable via environment variables
- Docker-ready with health checks
- Kubernetes-compatible with readiness probes
- Supports horizontal scaling (stateless design)
- Monitoring via structured logs