---
layout: documentation
title: MCP Client Overview
description: Understanding MCP clients and how to connect to Prisma AIRS MCP server
permalink: /mcp-clients/
category: mcp-clients
---

## What is an MCP Client?

The Model Context Protocol (MCP) defines a standard for communication between AI applications (clients) and external
tools/data sources (servers). An MCP client is any application that can connect to MCP servers to extend its
capabilities.

In the context of Prisma AIRS, MCP clients are AI-powered applications that connect to our MCP server to gain security
scanning capabilities. This allows these applications to:

- Scan content for security threats in real-time
- Detect prompt injection attempts
- Identify malicious URLs and code
- Prevent sensitive data leakage
- Enforce compliance with security policies

## Supported MCP Clients

We provide configuration guides for the following MCP clients:

### 1. [Visual Studio Code]({{ site.baseurl }}/mcp-clients/vscode/)

- **Type**: IDE with AI assistant integration
- **Use Case**: Secure code development and review
- **Connection**: HTTP-based MCP server
- **Key Features**: Real-time security scanning during development, code review assistance

### 2. [Claude Desktop]({{ site.baseurl }}/mcp-clients/claude-desktop/)

- **Type**: Desktop AI assistant application
- **Use Case**: General-purpose AI interactions with security
- **Connection**: Via mcp-remote proxy
- **Key Features**: Natural language security analysis, document review

### 3. [Claude Code]({{ site.baseurl }}/mcp-clients/claude-code/)

- **Type**: Web-based AI development environment
- **Use Case**: Secure AI-assisted coding in the browser
- **Connection**: CLI-managed HTTP connection
- **Key Features**: Project-scoped security policies, team collaboration

### 4. [LibreChat]({{ site.baseurl }}/mcp-clients/librechat/)

- **Type**: Open-source multi-user AI chat platform
- **Use Case**: Enterprise-grade secure AI chat for teams
- **Connection**: Streamable HTTP transport
- **Key Features**: Multi-user support, custom agents, flexible model integration

## How MCP Clients Connect

MCP clients connect to the Prisma AIRS MCP server through different mechanisms:

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   VS Code       │     │ Claude Desktop  │     │  Claude Code    │
│                 │     │                 │     │                 │
│ Direct HTTP     │     │ mcp-remote      │     │ CLI Config      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Prisma AIRS MCP Server  │
                    │   (HTTP/JSON-RPC)       │
                    └─────────────────────────┘
```

### Connection Methods

1. **Direct HTTP Connection** (VS Code)

    - Client connects directly to the MCP server's HTTP endpoint
    - Configuration via JSON files in the project or user settings

2. **MCP Remote Proxy** (Claude Desktop)

    - Uses `mcp-remote` as a bridge between the desktop app and HTTP server
    - Configuration in the application's config directory

3. **CLI Management** (Claude Code)
    - Managed through command-line interface
    - Supports different scopes (local, project, user)

## Common Configuration Pattern

All MCP clients share similar configuration requirements:

### 1. Server Endpoint

The URL where your Prisma AIRS MCP server is accessible:

- **Local Development**: `http://localhost:3000`
- **Docker Container**: `http://localhost:3100` (when using port mapping)
- **Production**: `https://your-domain.com/prisma-airs`

### 2. Server Identification

A unique name to identify the server in the client:

- Recommended: `prisma-airs` or `prisma-airs-{environment}`
- Examples: `prisma-airs-dev`, `prisma-airs-prod`

### 3. Connection Type

- Most clients use HTTP/HTTPS transport
- Some may support WebSocket or other protocols

## Security Considerations

When configuring MCP clients:

1. **Use HTTPS in Production**

    - Always use encrypted connections for remote servers
    - Example: `https://airs.example.com`

2. **Network Security**

    - Ensure firewall rules allow client-to-server communication
    - Consider VPN for sensitive deployments

3. **Authentication**

    - The MCP server relies on API key authentication to Prisma AIRS
    - API keys are configured server-side, not in client configurations

4. **Scope Management**
    - Use project-scoped configurations for team environments
    - User-scoped for personal development
    - Local-scoped for testing

## Choosing the Right Client

Select your MCP client based on your workflow:

| Use Case              | Recommended Client | Why                               |
| --------------------- | ------------------ | --------------------------------- |
| IDE-based development | VS Code            | Integrated development experience |
| General AI assistance | Claude Desktop     | Natural conversation interface    |
| Web-based development | Claude Code        | No installation required          |
| CI/CD integration     | Custom MCP client  | Programmatic control              |

## Getting Started

1. **Deploy the MCP Server** - Follow our [deployment guides]({{ site.baseurl }}/deployment/)
2. **Choose Your Client** - Select from the supported clients above
3. **Configure Connection** - Follow the specific client guide
4. **Verify Integration** - Test the security tools are available

## Available Security Tools

Once connected, all MCP clients provide access to these Prisma AIRS security tools:

- **airs_scan_content** - Synchronous content scanning
- **airs_scan_async** - Batch asynchronous scanning
- **airs_get_scan_results** - Retrieve scan results
- **airs_get_threat_reports** - Detailed threat analysis
- **airs_clear_cache** - Cache management

## Troubleshooting Connection Issues

Common issues across all clients:

1. **Server Not Reachable**

    ```bash
    # Test server health
    curl http://localhost:3000/health
    ```

2. **Invalid Configuration**

    - Check JSON syntax in configuration files
    - Verify server URL format

3. **Port Conflicts**

    - Ensure the server port is not in use
    - Check Docker port mappings

4. **Firewall Blocking**
    - Allow traffic on the MCP server port
    - Check both client and server firewalls

## Next Steps

- Choose and configure your preferred [MCP client](#supported-mcp-clients)
- Review [security best practices]({{ site.baseurl }}/prisma-airs/)
- Explore [available security features]({{ site.baseurl }}/prisma-airs/)
