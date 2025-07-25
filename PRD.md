# Product Requirements Document (PRD)

## Prisma AIRS MCP Server

### Project Overview

This project implements a Model Context Protocol (MCP) server that provides seamless integration with Palo Alto Networks' Prisma AIRS (AI Runtime Security) solution via their REST API. The server enables AI applications to interact with Prisma AIRS capabilities through standardized MCP interfaces.

### Technology Stack

- **Language**: TypeScript
- **SDK**: @modelcontextprotocol/sdk (Official MCP SDK)
- **Package Manager**: pnpm
- **Transport Protocol**: HTTP (Express-based)
- **Container Platform**: Docker
- **Orchestration**: Kubernetes with Kustomize
- **Ingress Controller**: Traefik
- **Additional Libraries**:
  - Express.js for HTTP server
  - Zod for validation
  - Winston for logging
  - Jest for testing
  - ESLint & Prettier for code quality

### Project Structure

```
prisma-airs-mcp/
├── .claude/                    # Claude Code context directory
│   ├── documentation/         # MCP and project documentation
│   │   └── mcp-full-documentation.txt
│   ├── instructions/          # Development instructions for Claude
│   │   └── CLAUDE.md         # Main Claude Code instructions
│   ├── context/              # Additional context files
│   │   ├── TASKS.md          # Task tracking and progress
│   │   └── prisma-airs-api/  # Prisma AIRS API documentation
│   │       ├── openapi-schema.yaml
│   │       └── developer-docs/
│   ├── plans/                # Implementation plans
│   │   └── PLAN.md           # Detailed implementation strategy
│   └── conventions/          # Code style and conventions
│       ├── typescript-style-guide.md
│       ├── .prettierrc
│       ├── .prettierignore
│       └── linting-setup.md
├── src/                      # Source code
│   ├── transport/           # HTTP transport implementation
│   │   └── http.ts         # HTTP/JSON-RPC handler
│   ├── config/              # Configuration management
│   │   └── index.ts        # Zod-based config
│   ├── utils/               # Utility functions
│   │   └── logger.ts       # Winston logger setup
│   ├── mcp/                 # MCP type definitions
│   │   └── types.ts        # Protocol types
│   ├── airs/                # Prisma AIRS client
│   │   ├── client.ts       # API client with retry logic
│   │   ├── cache.ts        # TTL-based caching
│   │   ├── rate-limiter.ts # Token bucket rate limiting
│   │   ├── factory.ts      # Client factory
│   │   └── types.ts        # AIRS API types
│   ├── tools/               # MCP tools
│   │   ├── index.ts        # Tool handlers
│   │   └── types.ts        # Tool argument types
│   ├── resources/           # MCP resources
│   │   └── index.ts        # Resource handlers
│   ├── prompts/             # MCP prompts
│   │   └── index.ts        # Prompt handlers
│   └── index.ts            # Main server entry point
├── tests/                    # Test files
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── k8s/                      # Kubernetes manifests
│   ├── base/               # Base resources
│   ├── overlays/           # Environment-specific configs
│   └── scripts/            # Deployment scripts
├── docker/                   # Docker configuration
│   ├── Dockerfile          # Production multi-stage build
│   └── Dockerfile.dev      # Development build
├── docs/                     # Documentation
│   ├── CLAUDE-INTEGRATION.md # Claude Desktop setup guide
│   ├── KUBERNETES.md       # K8s deployment guide
│   ├── DEPLOYMENT.md       # General deployment docs
│   └── DEPLOYMENT-WORKFLOW.md # Complete deployment workflow guide
├── scripts/                  # Helper scripts
│   ├── deploy-production.sh # Full production deployment with versioning
│   ├── deploy-quick.sh     # Quick deployment for dev/staging
│   ├── rollback.sh         # Kubernetes rollback script
│   └── docker-publish.sh   # Docker registry publishing
├── .env.example             # Environment variables template
├── claude_desktop_config.json # Claude Desktop configuration
├── CLAUDE_SETUP.md          # Quick Claude integration guide
├── eslint.config.js         # ESLint flat config
├── jest.config.js           # Jest configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
└── PRD.md                    # This document

```

### Core Requirements

#### 1. MCP Server Implementation

- Implement a fully compliant MCP server using the official TypeScript SDK
- Support Streamable HTTP transport for communication
- Implement the following MCP capabilities:
  - **Resources**: Expose Prisma AIRS data and configurations
  - **Tools**: Provide executable functions for AIRS operations
  - **Prompts**: Offer pre-configured prompts for common AIRS workflows

#### 2. Prisma AIRS Integration

- Complete REST API integration with Prisma AIRS
- Authentication and authorization handling
- Error handling and retry mechanisms
- Rate limiting compliance
- Response caching where appropriate

#### 3. Containerization & Deployment

- Docker container optimized for production use
- Multi-stage build process for minimal image size
- Health check endpoints
- Graceful shutdown handling
- Environment-based configuration

#### 4. Kubernetes Integration

- Kustomize-based deployment configuration
- Service exposure via ClusterIP
- Traefik IngressRoute configuration:
  - Path prefix: `/prisma-airs`
  - Proper path rewriting/stripping as needed
  - TLS termination with wildcard certificate
  - HTTP to HTTPS redirect
- ConfigMaps for non-sensitive configuration
- Secrets for sensitive data (API keys, credentials)
- Namespace: `prisma-airs`

### Development Guidelines

#### For Claude Code Development

1. **Context Loading**: Always check the following directories for relevant context:
   - `.claude/documentation/` - Contains MCP full documentation
   - `.claude/context/prisma-airs-api/` - Contains Prisma AIRS OpenAPI schema and developer docs
   - Review `.claude/instructions/CLAUDE.md` for specific development instructions

2. **Task Management**:
   - Use `.claude/context/TASKS.md` to track implementation progress
   - Reference `.claude/plans/PLAN.md` for the overall implementation strategy
   - Update both files as work progresses

3. **Documentation Sources**:
   - Primary MCP documentation: `.claude/documentation/mcp-full-documentation.txt`
   - Prisma AIRS API specs: `.claude/context/prisma-airs-api/openapi-schema.yaml`
   - Additional context: Check `.claude/context/` directory

### API Endpoints

The MCP server will expose the following endpoints:

- `POST /` - Main MCP message handler (JSON-RPC 2.0)
- `GET /health` - Health check endpoint
- `GET /ready` - Readiness probe endpoint

### Security Requirements

1. **Authentication**:
   - Support for Prisma AIRS API key authentication
   - Secure storage of credentials using Kubernetes Secrets
   - Token refresh handling

2. **Authorization**:
   - Implement proper access controls
   - Audit logging for all operations
   - Rate limiting per client

3. **Data Protection**:
   - TLS encryption for all external communications
   - No sensitive data in logs
   - Proper secret management

### Performance Requirements

- Response time: < 500ms for standard operations
- Concurrent connections: Support minimum 100 concurrent clients
- Memory usage: < 512MB under normal load
- CPU usage: < 0.5 cores under normal load

### Monitoring & Observability

- Structured JSON logging
- Prometheus metrics export
- OpenTelemetry trace support
- Error tracking and alerting

### Testing Requirements

- Unit tests with >80% coverage
- Integration tests for all AIRS API endpoints
- End-to-end MCP protocol tests
- Load testing for performance validation

### Compliance & Standards

- Follow MCP protocol specification exactly
- Adhere to Prisma AIRS API guidelines
- Kubernetes best practices
- Docker security best practices
- TypeScript style guide and conventions (see `.claude/conventions/`)
- Code must pass all linting and formatting checks

### Success Criteria

1. Fully functional MCP server that passes all protocol compliance tests
2. Complete integration with Prisma AIRS REST API
3. Successful deployment to Kubernetes cluster
4. Proper routing through Traefik ingress
5. All security requirements met
6. Performance benchmarks achieved
7. 100% compliance with TypeScript style guide
8. All code passes ESLint and Prettier checks

### References

- MCP Documentation: Stored locally at `.claude/documentation/mcp-full-documentation.txt`
- MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Prisma AIRS API Documentation: Available in `.claude/context/prisma-airs-api/`
- Prisma AIRS API Endpoint: https://service.api.aisecurity.paloaltonetworks.com
- GitHub Repository: https://github.com/cdot65/prisma-airs-mcp
- Container Registry: ghcr.io/cdot65/prisma-airs-mcp
- Live Production URL: https://airs.cdot.io/prisma-airs

### Implementation Status

**PROJECT COMPLETE AND DEPLOYED! 🎉**

As of Phase 7 completion:

- ✅ Full MCP server implementation with HTTP transport
- ✅ Complete Prisma AIRS API client with advanced features
- ✅ All MCP capabilities implemented (resources, tools, prompts)
- ✅ Production-ready error handling and logging
- ✅ All code passing validation (TypeScript, ESLint, Prettier)
- ✅ MCP endpoints tested and verified
- ✅ Docker containerization with multi-platform support (149MB image)
- ✅ Kubernetes deployment with Kustomize
- ✅ Traefik ingress with TLS termination
- ✅ Live in production at https://airs.cdot.io/prisma-airs
- ✅ Claude Desktop integration ready

### Deployment Details

- **Production URL**: https://airs.cdot.io/prisma-airs
- **Namespace**: prisma-airs
- **Replicas**: 3 (production)
- **Container Port**: 3000
- **Service Port**: 80
- **Ingress**: Traefik with TLS on port 443
- **Path Routing**: /prisma-airs (stripped before forwarding)
- **Rate Limiting**: 100 requests/minute
- **Health Check**: https://airs.cdot.io/prisma-airs/health

### Recent Updates

**Enhanced Configuration and Deployment (v1.3.4)**

- ✅ Fixed AIRS API profile configuration with default "Prisma AIRS" profile
- ✅ Added configurable profile support via environment variables (AIRS_DEFAULT_PROFILE_ID/NAME)
- ✅ Fixed API key authentication issues in Kubernetes deployment
- ✅ Enhanced deployment scripts to use CR_PAT/GITHUB_TOKEN without prompting
- ✅ Added comprehensive deployment workflow with versioning support
- ✅ Implemented SSE transport for streaming capabilities

**MCP Protocol Compliance Fixes (v1.2.1)**

- ✅ Fixed `ping` response to return empty object `{}` per MCP specification
- ✅ Implemented `notifications/initialized` handler
- ✅ Added `resources/templates/list` endpoint for dynamic resource templates
- ✅ Updated server capabilities to include `subscribe: false` and `logging: {}`
- ✅ All endpoints now fully MCP-compliant and tested with MCP Inspector

### Security Hardening (v1.3.5)

**Repository Security Improvements**

- ✅ Removed all hardcoded secrets from codebase
- ✅ Created example files for sensitive configurations
- ✅ Added SECURITY.md with comprehensive security policies
- ✅ Updated .gitignore to prevent accidental secret commits
- ✅ Enhanced all documentation with security setup instructions
- ✅ Repository prepared for safe public release

**Security Best Practices Implemented**

- API keys managed through environment variables and Kubernetes secrets
- Production configurations use example files with placeholders
- Deployment scripts use secure credential handling
- Documentation includes security warnings and setup instructions
- Pre-commit checklist for security review

### Version History

- v1.0.0 - Initial PRD creation
- v1.1.0 - Updated with Phase 5 completion status
- v1.2.0 - Updated with Phase 7 completion and production deployment
- v1.2.1 - MCP protocol compliance fixes and endpoint updates
- v1.3.0-v1.3.4 - Enhanced configuration, deployment automation, and API fixes
- v1.3.5 - Security hardening for public repository release
