# Changelog

All notable changes to the Prisma AIRS MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2024-01-14

### Added

- `notifications/initialized` handler for MCP protocol compliance
- `resources/templates/list` endpoint for dynamic resource templates
- Server capabilities: `subscribe: false` and `logging: {}`
- CONTRIBUTING.md with comprehensive contribution guidelines
- MIT LICENSE file
- Version badge in README.md
- CHANGELOG.md for version tracking

### Fixed

- `ping` endpoint now returns empty object `{}` per MCP specification
- Full MCP protocol compliance validated with MCP Inspector

### Changed

- Updated all documentation to reflect v1.2.1 status
- Enhanced error handling for unimplemented endpoints

## [1.2.0] - 2024-01-14

### Added

- Production deployment to Kubernetes
- Traefik IngressRoute with TLS termination
- Live deployment at https://airs.cdot.io/prisma-airs
- Kubernetes deployment scripts and manifests
- Multi-environment support (dev, staging, production)
- Health and readiness endpoints

### Changed

- Port changed from 3000 to 3000
- Updated container registry to ghcr.io/cdot65/prisma-airs-mcp
- Enhanced deployment documentation

## [1.1.0] - 2024-01-13

### Added

- Complete MCP features implementation
- 5 MCP tools for AIRS operations
- 4 MCP prompts for security workflows
- Resource handlers for cache stats and rate limits
- Dynamic resource support for scan results and threat reports

### Changed

- Enhanced AIRS client with retry logic and rate limiting
- Improved error handling and logging

## [1.0.0] - 2024-01-12

### Added

- Initial project setup with TypeScript
- Basic MCP server implementation with HTTP transport
- JSON-RPC 2.0 protocol handling
- Prisma AIRS API client integration
- Docker containerization
- Basic documentation and project structure

### Security

- Environment-based configuration for API keys
- No hardcoded credentials
- Secure secret management
