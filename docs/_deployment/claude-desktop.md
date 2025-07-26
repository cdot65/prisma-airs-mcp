---
layout: documentation
title: Claude Desktop Integration
description: Configure Prisma AIRS MCP for Claude Desktop
category: deployment
---

## Overview

Claude Desktop supports the Model Context Protocol (MCP), allowing seamless integration with Prisma AIRS for real-time AI security scanning. This guide covers setup and configuration for Claude Desktop specifically.

## Prerequisites

- Claude Desktop installed on your system
- Node.js installed (for `npx` command)
- Prisma AIRS MCP server running (locally or remotely)

## Configuration

### Location of Configuration File

**macOS:**

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**

```bash
%APPDATA%\Claude\claude_desktop_config.json
```

### Basic Configuration

For a local Prisma AIRS MCP server:

```json
{
    "mcpServers": {
        "prisma-airs": {
            "command": "npx",
            "args": ["mcp-remote", "http://localhost:3000"]
        }
    }
}
```

### Remote Server Configuration

For a deployed Prisma AIRS MCP server:

```json
{
    "mcpServers": {
        "prisma-airs": {
            "command": "npx",
            "args": ["mcp-remote", "https://your-server.com/prisma-airs"]
        }
    }
}
```

## Installation Steps

### 1. Edit Configuration

**macOS:**

```bash
# Open configuration in your editor
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Or use a visual editor
open -e ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**

```bash
# Open configuration in Notepad
notepad %APPDATA%\Claude\claude_desktop_config.json
```

### 2. Add MCP Server Configuration

Add the Prisma AIRS configuration to your `claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "prisma-airs": {
            "command": "npx",
            "args": ["mcp-remote", "http://localhost:3000"]
        }
    }
}
```

### 3. Save and Restart Claude Desktop

1. Save the configuration file
2. Completely quit Claude Desktop:
    - **macOS**: Cmd+Q or Claude → Quit Claude
    - **Windows**: Alt+F4 or File → Exit
3. Restart Claude Desktop

### 4. Verify Integration

After restarting, the Prisma AIRS tools should be available. You can verify by asking Claude:

```
"What security scanning tools do you have available?"
```

Claude should list the Prisma AIRS tools:

- `airs_scan_content`
- `airs_scan_async`
- `airs_get_scan_results`
- `airs_get_threat_reports`
- `airs_clear_cache`

## Using npx vs Global Installation

### Option 1: Using npx (Recommended)

The configuration above uses `npx` which downloads and runs `mcp-remote` on demand:

```json
{
    "command": "npx",
    "args": ["mcp-remote", "http://localhost:3000"]
}
```

**Pros:**

- No installation required
- Always uses the latest version
- Works out of the box

**Cons:**

- Slightly slower startup (downloads package if not cached)
- Requires internet connection on first use

### Option 2: Global Installation

Install `mcp-remote` globally for faster startup:

```bash
# Install globally
npm install -g @modelcontextprotocol/mcp-remote

# Verify installation
mcp-remote --version
```

Then update your configuration:

```json
{
    "command": "mcp-remote",
    "args": ["http://localhost:3000"]
}
```

## Troubleshooting

### Tools Not Appearing

1. **Check JSON Syntax**

    ```bash
    # Validate JSON syntax
    python -m json.tool ~/Library/Application\ Support/Claude/claude_desktop_config.json
    ```

2. **Verify Server is Running**

    ```bash
    curl http://localhost:3000/health
    ```

3. **Check for Errors**
    - Look for error messages in Claude Desktop
    - Enable debug logging in the configuration

### Connection Errors

1. **Local Server Not Accessible**
    - Ensure the MCP server is running: `docker ps`
    - Check the port: `lsof -i :3000`

2. **Remote Server Issues**
    - Test the URL: `curl https://your-server.com/prisma-airs/health`
    - Check firewall/security group settings

### Debug Mode

Enable detailed logging:

```json
{
    "mcpServers": {
        "prisma-airs": {
            "command": "npx",
            "args": ["mcp-remote", "http://localhost:3000"],
            "env": {
                "DEBUG": "mcp:*",
                "LOG_LEVEL": "debug"
            }
        }
    }
}
```

## Best Practices

1. **Use Environment-Specific Names**
    - Name servers clearly: `prisma-airs-dev`, `prisma-airs-prod`
    - Helps avoid confusion when switching environments

2. **Secure Remote Connections**
    - Always use HTTPS for remote servers
    - Consider using API keys or authentication headers

3. **Monitor Performance**
    - Check rate limits regularly
    - Monitor cache statistics for optimization

4. **Regular Updates**
    - Keep Claude Desktop updated
    - Update the MCP server regularly

## Next Steps

- [Claude Code Integration]({{ site.baseurl }}/deployment/claude-code) - Using with Claude Code
- [Quick Start Guide]({{ site.baseurl }}/deployment/quickstart) - Full deployment guide
- [Configuration Reference]({{ site.baseurl }}/deployment/configuration) - Server configuration
- [Security Best Practices]({{ site.baseurl }}/prisma-airs/best-practices) - Security guidelines
