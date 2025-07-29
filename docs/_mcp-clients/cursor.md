---
layout: documentation
title: Cursor Configuration
description: Configure Prisma AIRS MCP for Cursor IDE
permalink: /mcp-clients/cursor/
category: mcp-clients
---

## Overview

Cursor IDE supports the Model Context Protocol (MCP) through its Composer Agent, enabling real-time security scanning and threat detection during development. This integration allows developers to automatically analyze code for security vulnerabilities as they write.

## Prerequisites

- [Cursor IDE](https://cursor.sh/) installed
- Prisma AIRS MCP server running and accessible
- Valid Prisma AIRS API credentials

## Quick Start

1. Create `.cursor/mcp.json` in your project root
2. Add the Prisma AIRS server configuration
3. Open Cursor and the security tools will be available in Composer

## Configuration Methods

### Option 1: Project Configuration (Recommended for Teams)

Create a `.cursor/mcp.json` file in your project to configure the Prisma AIRS MCP server for your team.

1. Create a `.cursor/mcp.json` file in your project root
2. Add the following configuration:

```json
{
  "mcpServers": {
    "prisma-airs": {
      "url": "YOUR_PRISMA_AIRS_URL"
    }
  }
}
```

Replace `YOUR_PRISMA_AIRS_URL` with your server endpoint:

| Environment          | URL Example                  |
| -------------------- | ---------------------------- |
| Local Development    | `http://localhost:3000`      |
| Docker (default)     | `http://localhost:3000`      |
| Docker (custom port) | `http://localhost:3100`      |
| Production           | `https://airs.example.com`   |
| SaaS Deployment      | `https://airs.cdot.io/prisma-airs` |

### Option 2: Global Configuration (For Individual Use)

To configure the Prisma AIRS MCP server for all your projects:

1. Create `~/.cursor/mcp.json` in your home directory
2. Add the same configuration as above

## Configuration Examples

### Development Environment

```json
{
  "mcpServers": {
    "prisma-airs-dev": {
      "url": "http://localhost:3000"
    }
  }
}
```

### Production Environment with Headers

```json
{
  "mcpServers": {
    "prisma-airs": {
      "url": "https://airs.example.com/mcp",
      "headers": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Multiple Environments

```json
{
  "mcpServers": {
    "prisma-airs-dev": {
      "url": "http://localhost:3000"
    },
    "prisma-airs-staging": {
      "url": "https://staging.airs.example.com"
    },
    "prisma-airs-prod": {
      "url": "https://airs.example.com"
    }
  }
}
```

## Using Security Tools

### Available Tools

Once connected, these Prisma AIRS security tools become available in Cursor:

| Tool Name                 | Description                      |
| ------------------------- | -------------------------------- |
| `airs_scan_content`       | Real-time security scanning      |
| `airs_scan_async`         | Batch content scanning           |
| `airs_get_scan_results`   | Retrieve scan results            |
| `airs_get_threat_reports` | Detailed threat analysis         |
| `airs_clear_cache`        | Clear server cache               |

### Accessing Tools in Cursor

The Composer Agent automatically uses MCP tools when relevant. You can:

1. Ask for a specific tool by name
2. Describe what security check you need
3. Enable or disable tools from settings

### Tool Toggling

Enable or disable MCP tools directly from the chat interface:

1. Click a tool name in the Available Tools list to toggle it
2. Disabled tools won't be loaded into context
3. Tools remain available but unused when disabled

### Tool Approval

By default, Composer asks for approval before using MCP tools:

1. Click the arrow next to the tool name to see arguments
2. Review the tool parameters
3. Approve or deny the tool usage

### Auto-run Mode

Enable auto-run (Yolo mode) for Composer to use MCP tools without asking:

- Works like terminal commands
- Speeds up workflow for trusted tools
- Configure in Cursor settings

## Example Workflows

### Security Code Review

```text
@composer Please review this function for security vulnerabilities using Prisma AIRS
```

### API Endpoint Security

```text
Scan this API endpoint for injection attacks and data exposure risks
```

### Sensitive Data Detection

```text
Check if this code properly handles PII and sensitive data according to compliance policies
```

### Batch Security Scan

```text
Run a security scan on all files in the /api directory for potential vulnerabilities
```

## Working with Images

MCP servers can return images (screenshots, diagrams, security reports). Cursor automatically:

1. Attaches returned images to the chat
2. Analyzes them if the model supports images
3. Displays base64-encoded images inline

## Security Considerations

When installing MCP servers:

1. **Verify the source**: Only use trusted MCP servers
2. **Review permissions**: Check what data the server accesses
3. **Limit API keys**: Use restricted keys with minimal permissions
4. **Audit code**: Review server source code for critical integrations
5. **Use HTTPS**: Always use encrypted connections for production

## Troubleshooting

### Common Issues

#### Server Not Connecting

**Symptoms:** Tools not appearing in Available Tools list

**Solutions:**

1. Verify server is running:

   ```bash
   curl http://localhost:3000/health
   ```

2. Check configuration file:

   ```bash
   cat .cursor/mcp.json | jq .
   ```

3. Verify URL is accessible from Cursor

#### Authentication Errors

**Symptoms:** 401/403 errors when using tools

**Solutions:**

1. Check API key configuration
2. Verify credentials are valid
3. Ensure proper headers are set in config

#### Tool Execution Failures

**Symptoms:** Tools fail to execute or return errors

**Solutions:**

1. Check server logs for detailed errors
2. Verify input parameters are correct
3. Ensure rate limits aren't exceeded

## Best Practices

1. **Environment Separation**
   - Use descriptive server names
   - Separate dev/staging/prod configurations
   - Document URLs in project README

2. **Team Collaboration**
   - Use project-level `.cursor/mcp.json`
   - Commit configuration to version control
   - Share security scanning workflows

3. **Security**
   - Never commit API keys to repositories
   - Use environment variables for sensitive data
   - Rotate credentials regularly

4. **Performance**
   - Enable only needed tools
   - Monitor rate limits
   - Use async scanning for large batches

## Integration Examples

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
echo "Running Prisma AIRS security scan..."
# Add your scanning logic here
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Security Scan
  run: |
    echo "Scan code with Prisma AIRS"
    # Add scanning commands
```

## Next Steps

- Explore [available security features]({{ site.baseurl }}/prisma-airs/)
- Review [threat detection capabilities]({{ site.baseurl }}/prisma-airs/prompt-injection/)
- Set up [OAuth authentication]({{ site.baseurl }}/deployment/configuration/)

## Additional Resources

- [Cursor MCP Documentation](https://cursor.sh/docs/mcp)
- [MCP Protocol Specification](https://github.com/modelcontextprotocol/protocol)
- [Prisma AIRS API Documentation]({{ site.baseurl }}/developers/api/)
