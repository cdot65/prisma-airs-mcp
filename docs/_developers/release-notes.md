---
layout: documentation
title: Release Notes
permalink: /developers/release-notes/
category: developers
---

This page contains the version history and release notes for the Prisma AIRS MCP Server.

## Version 1.0.0 (2025-07-30)

### Initial Release

This is the first official release of the Prisma AIRS MCP Server, bringing enterprise-grade AI security to MCP-enabled applications through integration with Palo Alto Networks' Prisma AI Runtime Security platform.

### Features

- **Full MCP Protocol Support**
  - Tools for security scanning and threat detection
  - Resources for accessing scan results and reports
  - Pre-configured security workflow prompts
  - Server-Sent Events (SSE) support for streaming

- **Prisma AIRS Integration**
  - Synchronous content scanning for immediate results
  - Asynchronous batch scanning for multiple requests
  - Comprehensive threat detection across multiple categories
  - Support for custom security profiles

- **Performance & Reliability**
  - Built-in LRU caching to reduce API calls
  - Token bucket rate limiting for API protection
  - Automatic retry logic with exponential backoff
  - Connection pooling for efficient resource usage

- **Deployment Options**
  - Docker containers with multi-architecture support
  - Kubernetes manifests with Kustomize overlays
  - Local development with hot-reload
  - Environment-based configuration

- **Developer Experience**
  - Comprehensive TypeScript type definitions
  - Structured logging with Winston
  - Health and readiness endpoints
  - Extensive documentation and examples
  - Developer documentation as MCP resources

### Security Features

The following Prisma AIRS security capabilities are available:

- **Prompt Threats**: URL categories, DLP, injection attacks, toxic content, malicious code, agent threats, topic violations
- **Response Threats**: All prompt threats plus database security and ungrounded content detection

### Supported Platforms

- Node.js 18.x or higher
- Docker (linux/amd64, linux/arm64)
- Kubernetes 1.24+
- MCP-compatible clients (Claude Desktop, VS Code, Cursor, JetBrains)

### Documentation

Complete documentation is available at [https://cdot65.github.io/prisma-airs-mcp/](https://cdot65.github.io/prisma-airs-mcp/)

### Breaking Changes

As this is the initial release, there are no breaking changes.

### Known Issues

- Rate limiting status provides simplified statistics (detailed per-bucket information requires enhanced AIRS client implementation)
- SSE reconnection handling may require client-side implementation

### Contributors

This project is open source and welcomes contributions. See [CONTRIBUTING.md](https://github.com/cdot65/prisma-airs-mcp/blob/main/CONTRIBUTING.md) for details.

---

## Version History

| Version | Date       | Description             |
|---------|------------|-------------------------|
| 1.0.0   | 2025-07-30 | Initial release         |

---

## Future Roadmap

Planned features for upcoming releases:

- Enhanced caching strategies with Redis support
- WebSocket transport option
- Additional security profile templates
- Metrics and monitoring integration
- Plugin system for custom security checks

For feature requests and bug reports, please visit our [GitHub Issues](https://github.com/cdot65/prisma-airs-mcp/issues).
