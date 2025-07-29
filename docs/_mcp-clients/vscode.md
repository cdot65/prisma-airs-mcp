---
layout: documentation
title: Visual Studio Code Configuration
description: Configure Prisma AIRS MCP for Visual Studio Code
permalink: /mcp-clients/vscode/
category: mcp-clients
---

## Overview

Visual Studio Code supports the Model Context Protocol through its AI assistant features, enabling real-time security scanning during development. This integration allows developers to identify and fix security issues as they write code.

## Prerequisites

- Visual Studio Code v1.102 or later
- [GitHub Copilot](https://github.com/features/copilot) subscription
- Prisma AIRS MCP server running and accessible

## Quick Start

1. Create `.vscode/mcp.json` in your project root
2. Add the Prisma AIRS server configuration
3. Open VS Code and start using security tools

## Configuration Methods

### Option 1: Workspace Settings (Recommended for Teams)

Create a `.vscode/mcp.json` file in your workspace to configure the Prisma AIRS MCP server for a workspace and share configurations with team members.

1. Create a `.vscode/mcp.json` file in your workspace root
2. Add the following configuration:

```json
{
    "servers": {
        "prisma-airs": {
            "url": "YOUR_PRISMA_AIRS_URL",
            "type": "http"
        }
    },
    "inputs": []
}
```

Replace `YOUR_PRISMA_AIRS_URL` with your server endpoint:

| Environment          | URL Example                |
| -------------------- | -------------------------- |
| Local Development    | `http://localhost:3000`    |
| Docker (default)     | `http://localhost:3000`    |
| Docker (custom port) | `http://localhost:3100`    |
| Production           | `https://airs.example.com` |

### Option 2: User Settings (For Individual Use)

To configure the Prisma AIRS MCP server for all your workspaces:

1. Run the command `MCP: Open User Configuration` from the Command Palette (`Cmd/Ctrl + Shift + P`)
2. Add the Prisma AIRS server configuration to the opened `mcp.json` file

### Option 3: Command Palette

1. Open the Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run `MCP: Add Server`
3. Choose the type of MCP server (HTTP)
4. Provide the server information
5. Select whether to add it to Workspace Settings or Global settings

## Configuration Examples

### Development Environment

```json
{
    "servers": {
        "prisma-airs-dev": {
            "url": "http://localhost:3000",
            "type": "http"
        }
    },
    "inputs": []
}
```

### Production Environment

```json
{
    "servers": {
        "prisma-airs-prod": {
            "url": "https://airs.example.com",
            "type": "http"
        }
    },
    "inputs": []
}
```

## Using Security Tools

### Available Tools

Once connected, these Prisma AIRS security tools become available:

| Tool Name                 | Description                 |
| ------------------------- | --------------------------- |
| `airs_scan_content`       | Real-time security scanning |
| `airs_scan_async`         | Batch content scanning      |
| `airs_get_scan_results`   | Retrieve scan results       |
| `airs_get_threat_reports` | Detailed threat analysis    |
| `airs_clear_cache`        | Clear server cache          |

### Accessing Tools in VS Code

1. Open the Chat view: `Ctrl/Cmd + Shift + I`
2. Select **Agent mode** from the dropdown
3. Click the **Tools** button to see available tools
4. Select the Prisma AIRS tools you need

### Example Workflows

**Security Code Review:**

```
Can you review this function for security vulnerabilities using the Prisma AIRS tools?
```

**API Input Validation:**

```
Please scan this API endpoint input for potential injection attacks.
```

**Data Handling Check:**

```
Check if this code properly handles sensitive data according to security policies.
```

## Server Management

### Viewing Server Status

1. Open Extensions view: `Ctrl/Cmd + Shift + X`
2. Find **MCP SERVERS - INSTALLED** section
3. Locate your Prisma AIRS server

### Available Actions

| Action           | Description               | How to Access                    |
| ---------------- | ------------------------- | -------------------------------- |
| Start/Stop       | Control server connection | Right-click → Start/Stop         |
| View Logs        | See server output         | Right-click → Show Output        |
| Check Config     | Review current settings   | Right-click → Show Configuration |
| Browse Resources | See available resources   | Right-click → Browse Resources   |
| Remove           | Uninstall server          | Right-click → Uninstall          |

## Troubleshooting

### Common Issues

#### Server Not Connecting

**Symptoms:** Tools not appearing, connection errors

**Solutions:**

1. Verify server is running:

    ```bash
    # Check server health
    curl http://localhost:3000/health

    # For Docker deployments
    docker ps | grep prisma-airs
    ```

2. Check VS Code MCP logs:

    - Extensions view → MCP Servers → Right-click → Show Output

3. Verify configuration file syntax:
    ```bash
    # Validate JSON
    cat .vscode/mcp.json | jq .
    ```

#### Tool Limit Exceeded

**Error:** "Cannot have more than 128 tools per request"

**Solution:** Disable unused MCP servers:

1. Open Chat view → Tools picker
2. Deselect unnecessary tools/servers
3. Keep only required Prisma AIRS tools active

#### Permission Issues

**Symptoms:** MCP features disabled

**Solutions:**

- Check organization policies for MCP support
- Verify GitHub Copilot subscription is active
- Contact IT if MCP is disabled by policy

## Best Practices

1. **Environment Naming**

    - Use descriptive names: `prisma-airs-dev`, `prisma-airs-staging`
    - Helps prevent accidental connections to wrong environment

2. **Team Collaboration**

    - Use workspace settings (`.vscode/mcp.json`) for shared configs
    - Commit MCP configuration to version control
    - Document server URLs in README

3. **Security**

    - Always use HTTPS for production servers
    - Don't commit sensitive URLs to public repositories
    - Use environment-specific configurations

4. **Performance**
    - Limit active tools to those you need
    - Monitor rate limits through server resources
    - Use caching effectively

## Integration Examples

### Pre-commit Security Check

```json
// In .vscode/tasks.json
{
    "label": "Security Scan",
    "type": "shell",
    "command": "echo 'Run Prisma AIRS scan on staged files'",
    "problemMatcher": []
}
```

### Code Review Workflow

1. Open PR in VS Code
2. Use Copilot with Prisma AIRS tools
3. Ask: "Scan this PR for security issues"
4. Review and address findings

## Next Steps

- Explore [available security features]({{ site.baseurl }}/prisma-airs/)
- Review [security best practices]({{ site.baseurl }}/prisma-airs/overview/)
- Set up [CI/CD integration]({{ site.baseurl }}/deployment/)

## Additional Resources

- [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/model-context-protocol)
- [MCP Protocol Specification](https://github.com/modelcontextprotocol/protocol)
- [Prisma AIRS API Documentation]({{ site.baseurl }}/developers/api/)
