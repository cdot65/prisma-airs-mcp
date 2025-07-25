# Prisma AIRS MCP Server

A lightweight Model Context Protocol (MCP) server that exposes Prisma AIRS capabilities through a simple, elegant interface. Built with TypeScript and the MCP SDK.

## Overview

This MCP server provides seamless integration with Prisma AIRS, enabling you to leverage advanced AI security capabilities within your MCP-compatible applications. The server is designed to be lightweight, efficient, and easy to deploy across various environments.

## Features

- **Lightweight Design**: Minimal overhead with maximum functionality
- **Multiple Deployment Options**: Docker, Docker Compose, Kubernetes, and local development
- **TypeScript Support**: Built with TypeScript for enhanced developer experience
- **MCP SDK Integration**: Leverages the official MCP SDK for reliable protocol compliance
- **Production Ready**: Containerized builds optimized for production environments

## Quick Start

### Docker

```bash
docker run -p 3000:3000 prisma-airs-mcp
```

### Docker Compose

```bash
docker-compose up -d
```

### Local Development

```bash
# Install dependencies
pnpm install

# Start the server
pnpm start
```

## Deployment Options

- **🐳 Docker**: Single container deployment
- **🔧 Docker Compose**: Multi-service orchestration
- **☸️ Kubernetes**: Scalable cluster deployment
- **💻 Local Development**: pnpm-based local builds

## Documentation

For comprehensive implementation details, configuration options, and advanced usage patterns, please visit our official documentation:

**📚 [Official Documentation](https://cdot65.github.io/prisma-airs-mcp)**

The documentation includes:
- Detailed setup instructions
- Configuration examples
- API reference
- Best practices
- Troubleshooting guides

## Requirements

- Node.js 18+ (for local development)
- Docker (for containerized deployments)
- pnpm (for package management)

## Contributing

We welcome contributions! Please refer to our documentation site for contribution guidelines and development setup instructions.

## License

[Include your license information here]

## Support

For support and questions, please:
1. Check the [official documentation](https://cdot65.github.io/prisma-airs-mcp)
2. Open an issue in this repository
3. Review existing discussions and issues

---

**Built with ❤️ using TypeScript and the MCP SDK**