# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that integrates Palo Alto Networks' Prisma AIRS (AI Runtime Security) with AI applications. The project uses TypeScript and implements the MCP specification for resources, tools, and prompts.

## Essential Commands

### Development

- `pnpm dev` - Start the MCP server in development mode (port 3000)
- `pnpm build` - Build the TypeScript project
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests only
- `pnpm test:integration` - Run integration tests only

### Code Quality

- `pnpm run lint:fix` - Run ESLint and fix issues
- `pnpm run format` - Format code with Prettier
- `pnpm run validate` - Run all validation checks (lint, format, typecheck, test)

### Docker & Deployment

- `pnpm run docker:build` - Build Docker image (native platform)
- `pnpm run docker:build:k8s` - Build for Kubernetes (AMD64)
- `pnpm run docker:publish` - Push images to GitHub Container Registry
- `pnpm run deploy:validate` - Run all validation checks before deployment
- `pnpm run deploy:quick:dev` - Quick deployment to development
- `pnpm run deploy:quick:staging` - Quick deployment to staging
- `pnpm run deploy:prod` - Full production deployment (latest tag)
- `pnpm run deploy:prod:version` - Production deployment with version update
- `pnpm run k8s:rollback` - Rollback to previous deployment
- `kubectl logs -l app=prisma-airs-mcp -n prisma-airs -f` - View logs

## Architecture

### Core Components

1. **MCP Server** (`src/server/`) - Implements Model Context Protocol with HTTP transport for Kubernetes deployment
2. **Handlers** (`src/handlers/`) - Request processing for resources, tools, and prompts
3. **AIRS Client** (`src/airs/client.ts`) - REST API integration with Prisma AIRS
4. **Configuration** (`src/config/`) - Environment-based configuration management

### Key Design Patterns

- **Dependency Injection** - Use constructor injection for testability
- **Error Handling** - Structured error responses with proper MCP error codes
- **Retry Logic** - Exponential backoff for AIRS API calls
- **Caching** - In-memory cache with TTL for AIRS responses
- **Type Safety** - Strict TypeScript with no `any` types

### MCP Implementation

The server exposes:

- **Resources**: Real-time AIRS data (threats, vulnerabilities, policies)
- **Tools**: Execute AIRS operations (analyze, remediate, configure)
- **Prompts**: Interactive security workflows

## Development Guidelines

1. **TypeScript**: Use strict mode, avoid `any`, prefer interfaces over types
2. **Testing**: Maintain >80% code coverage, test edge cases and error handling
3. **Logging**: Use structured JSON logging with appropriate levels
4. **Security**: Never log sensitive data, validate all inputs
5. **Performance**: Implement request batching and connection pooling

## Project Status Tracking

Check `.claude/context/TASKS.md` for current development phase and tasks. The project follows a phased approach:

- Phase 1: Project Setup ✅ (Complete)
- Phase 2: Environment Setup ✅ (Complete)
- Phase 3: MCP Server Foundation ✅ (Complete)
- Phase 4: Prisma AIRS Integration ✅ (Complete)
- Phase 5: MCP Features Implementation ✅ (Complete)
- Phase 6: Containerization ✅ (Complete)
- Phase 7: Kubernetes Deployment ✅ (Complete)
- Phase 8: Testing & Optimization ✅ (Complete)
- Phase 9: Documentation ✅ (Complete)
- Phase 10: Production Readiness ✅ (Achieved)
- Phase 11: Security Hardening ✅ (Complete)

## Current Implementation Status

**PROJECT DEPLOYED TO PRODUCTION! 🚀**

**Latest Update (v1.3.5)**: Security hardened and ready for public repository release!

- ✅ HTTP-based MCP server running on Express (port 3000)
- ✅ JSON-RPC 2.0 protocol handling with full MCP compliance
- ✅ Configuration management with Zod validation
- ✅ Structured logging with Winston
- ✅ Health and readiness endpoints for K8s
- ✅ Complete AIRS API client with retry logic and caching
- ✅ MCP Resources (cache stats, rate limits, scan results, threat reports)
- ✅ MCP Tools (5 AIRS operations implemented)
- ✅ MCP Prompts (4 security workflows implemented)
- ✅ Error handling and request routing
- ✅ Docker containerization (149MB production image)
- ✅ Kubernetes deployment with Traefik ingress
- ✅ Live at https://airs.cdot.io/prisma-airs
- ✅ MCP Inspector validated - all endpoints working correctly

### Recent Updates (v1.3.5)

- **Security Hardening** - Removed all hardcoded secrets from codebase
- Created example files for production configurations
- Added SECURITY.md with comprehensive security policies
- Updated .gitignore to prevent accidental secret commits
- Enhanced all documentation with security setup instructions
- Repository prepared for safe public release

### Previous Updates (v1.3.4)

- Fixed AIRS API profile requirement - defaults to "Prisma AIRS"
- Added configurable default profile via environment variables
- Fixed API key authentication in Kubernetes deployment
- Enhanced deployment scripts for automated workflows
- Added SSE transport for streaming capabilities

## Production Access

- **Live URL**: https://airs.cdot.io/prisma-airs
- **Health Check**: https://airs.cdot.io/prisma-airs/health
- **Claude Integration**: See `CLAUDE_SETUP.md`

## Important Context Files

- `PRD.md` - Complete product requirements and specifications
- `.claude/instructions/CLAUDE.md` - Detailed development instructions
- `.claude/documentation/airs-api-openapi.json` - Prisma AIRS API specification
- `.claude/plans/PLAN.md` - Implementation roadmap and decisions
