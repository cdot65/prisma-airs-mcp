---
layout: documentation
title: Release Notes
permalink: /developers/release-notes/
category: developers
---

# Release Notes

This page contains the version history and release notes for the Prisma AIRS MCP Server.

## Version 1.0.0 (2025-01-27)

**Initial Release**

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

### Security Features

The following Prisma AIRS security capabilities are available:

- **Prompt Threats**: URL categories, DLP, injection attacks, toxic content, malicious code, agent threats, topic violations
- **Response Threats**: All prompt threats plus database security and ungrounded content detection

### Supported Platforms

- Node.js 18.x or higher
- Docker (linux/amd64, linux/arm64)
- Kubernetes 1.24+
- MCP-compatible clients (Claude Desktop, VS Code, Claude Code)

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

## Version 1.0.3 (2025-01-28)

**Bug Fix Release**

This release fixes a critical issue with the cache system that prevented proper deduplication of identical scan requests.

### Bug Fixes

- **Cache Key Generation**
    - Fixed cache key generation to exclude unique identifiers (`tr_id` and `metadata`)
    - Cache now properly deduplicates identical scan requests
    - Significantly improves performance by serving cached results for repeated scans
    - Added comprehensive unit tests for cache behavior

### Testing

- Added 6 new unit tests specifically for cache functionality
- All 31 tests pass successfully
- Verified cache deduplication works correctly

### Technical Details

The previous implementation included the transaction ID (`tr_id`) in the cache key calculation, which made every request unique even when the content was identical. This fix ensures only the security profile and actual content are used for cache keys.

---

## Version 1.0.2 (2025-01-27)

**Dependency Update Release**

This release updates the Model Context Protocol SDK to the latest version, ensuring compatibility with the newest MCP features and improvements.

### Changes

- **Dependencies**
    - Updated `@modelcontextprotocol/sdk` from 1.15.1 to 1.17.0
    - All tests pass successfully with the updated dependency

### Testing

All validation tests continue to pass:
- TypeScript compilation checks
- ESLint and Prettier formatting
- Unit test suite (25 tests)

---

## Version 1.0.1 (2025-01-27)

**Bug Fix and Enhancement Release**

This release introduces the ability to reset the AIRS client instance, addressing issues with stale connections and improving resource management.

### Features

- **AIRS Client Reset Functionality**
    - Added `resetAirsClient()` method to clear cache, reset rate limits, and destroy the current client instance
    - Enables graceful recovery from connection issues
    - Allows dynamic configuration changes without server restart
    - Improves test isolation by providing clean state between test runs

### Bug Fixes

- Fixed issues with cached client instances persisting stale connections
- Resolved rate limiter state persistence across client resets
- Improved memory management by properly cleaning up client resources

### Developer Experience

- Enhanced factory pattern implementation with reset capabilities
- Better support for integration testing with proper cleanup methods
- Improved error recovery mechanisms

---

## Version History

| Version | Date       | Description                                        |
| ------- | ---------- | -------------------------------------------------- |
| 1.0.3   | 2025-01-28 | Fixed cache deduplication for identical requests   |
| 1.0.2   | 2025-01-27 | Dependency update (@modelcontextprotocol/sdk)      |
| 1.0.1   | 2025-01-27 | Added AIRS client reset functionality              |
| 1.0.0   | 2025-01-27 | Initial release with full MCP protocol support     |

---

## Upgrade Guide

### From Pre-Release Versions

If you were using a pre-release version (e.g., 1.3.x development builds), please note:

1. **Configuration Changes**: Environment variables remain the same
2. **API Compatibility**: All MCP endpoints maintain backward compatibility
3. **Docker Tags**: Use `latest` or `v1.0.0` tags instead of development tags

### Version Management

The server version is managed through:

- `version.json` - Source of truth for version information
- `package.json` - NPM package version (synchronized)
- Docker image tags - Follows semantic versioning
- MCP server info - Reports version in protocol responses

---

## Future Roadmap

Planned features for upcoming releases:

- Enhanced caching strategies with Redis support
- WebSocket transport option
- Additional security profile templates
- Metrics and monitoring integration
- Plugin system for custom security checks

For feature requests and bug reports, please visit our [GitHub Issues](https://github.com/cdot65/prisma-airs-mcp/issues).
