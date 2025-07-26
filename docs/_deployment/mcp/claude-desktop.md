---
layout: documentation
title: Claude Desktop Configuration
description: Configure Prisma AIRS MCP for Claude Desktop application
permalink: /deployment/mcp/claude-desktop/
category: deployment
---

## Overview

Claude Desktop is a native application that supports the Model Context Protocol, enabling AI-powered security scanning through Prisma AIRS. This integration provides real-time threat detection and security analysis within your Claude conversations.

## Prerequisites

- Claude Desktop application installed
- Node.js v16 or later (for `npx` command)
- Prisma AIRS MCP server running and accessible

## Quick Start

1. Locate your Claude Desktop configuration file
2. Add the Prisma AIRS server configuration
3. Restart Claude Desktop
4. Verify tools are available

## Configuration

**macOS:**

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**

```bash
%APPDATA%\Claude\claude_desktop_config.json
```

### Configuration Examples

#### Development Environment

```json
{
    "mcpServers": {
        "prisma-airs-dev": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/mcp-remote", "http://localhost:3000"]
        }
    }
}
```

#### Production Environment

```json
{
    "mcpServers": {
        "prisma-airs-prod": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/mcp-remote", "https://airs.example.com"]
        }
    }
}
```

> **Note**: The `-y` flag ensures `npx` runs without prompts

## Setup Instructions

### Step 1: Open Configuration File

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

### Step 2: Add Server Configuration

Add the Prisma AIRS server to your configuration. Choose based on your deployment:

| Environment | Server URL |
|-------------|------------|
| Local Development | `http://localhost:3000` |
| Docker (default) | `http://localhost:3000` |
| Docker (custom port) | `http://localhost:3100` |
| Production | `https://airs.example.com` |

### Step 3: Save and Restart

1. Save the configuration file
2. **Completely quit** Claude Desktop (not just close the window):
   - **macOS**: `Cmd+Q` or Claude → Quit Claude
   - **Windows**: `Alt+F4` or File → Exit
3. Launch Claude Desktop again

### Step 4: Verify Connection

Test the integration by asking Claude:

> "What MCP tools do you have available for security scanning?"

Claude should list these Prisma AIRS tools:

| Tool Name | Description |
|-----------|-------------|
| `airs_scan_content` | Real-time security scanning |
| `airs_scan_async` | Batch content scanning |
| `airs_get_scan_results` | Retrieve scan results |
| `airs_get_threat_reports` | Detailed threat analysis |
| `airs_clear_cache` | Clear server cache |

## Connection Methods

### Method 1: Using npx (Recommended)

Uses `npx` to run mcp-remote without installation:

```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/mcp-remote", "http://localhost:3000"]
}
```

**Advantages:**
- Zero installation required
- Automatically uses latest version
- Works immediately

**Considerations:**
- First run downloads the package (~2-3 seconds)
- Cached for subsequent uses

### Method 2: Global Installation

For faster startup, install mcp-remote globally:

```bash
# Install globally
npm install -g @modelcontextprotocol/mcp-remote

# Verify installation
mcp-remote --version
```

Then use direct command:

```json
{
    "command": "mcp-remote",
    "args": ["http://localhost:3000"]
}
```

**Advantages:**
- Faster startup time
- No network required after installation

**Considerations:**
- Requires manual updates
- Additional installation step

## Using Security Tools

### Example Conversations

**Security Analysis:**
> "Can you analyze this code snippet for security vulnerabilities?"

**Threat Detection:**
> "Please scan this user input for potential injection attacks."

**Compliance Check:**
> "Check if this document contains any sensitive data that should be masked."

### Tool Capabilities

Prisma AIRS tools in Claude Desktop can:

- Detect prompt injection attempts
- Identify malicious URLs and code
- Find sensitive data exposure
- Analyze database queries for SQL injection
- Check for toxic or harmful content
- Validate AI agent security

## Troubleshooting

### Common Issues

#### Tools Not Appearing

**Symptoms:** Claude doesn't show Prisma AIRS tools

**Solutions:**

1. **Validate JSON syntax:**
   ```bash
   # macOS
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
   
   # Windows
   type %APPDATA%\Claude\claude_desktop_config.json | jq .
   ```

2. **Check server health:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Verify complete restart:**
   - Ensure Claude Desktop was fully quit (not just closed)
   - Check system tray/menu bar for running instances

#### Connection Failed

**Error:** "Failed to connect to MCP server"

**Solutions:**

1. **For local servers:**
   ```bash
   # Check if server is running
   docker ps | grep prisma-airs
   
   # Test connection
   curl -I http://localhost:3000
   ```

2. **For remote servers:**
   - Verify URL is accessible
   - Check firewall rules
   - Ensure HTTPS certificate is valid

#### npx Download Issues

**Error:** "npx failed to download package"

**Solutions:**

1. **Check npm registry:**
   ```bash
   npm config get registry
   # Should be: https://registry.npmjs.org/
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Use explicit registry:**
   ```json
   {
       "command": "npx",
       "args": [
           "--registry=https://registry.npmjs.org/",
           "-y",
           "@modelcontextprotocol/mcp-remote",
           "http://localhost:3000"
       ]
   }
   ```

### Debug Mode

Enable verbose logging for troubleshooting:

```json
{
    "mcpServers": {
        "prisma-airs": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/mcp-remote", "http://localhost:3000"],
            "env": {
                "DEBUG": "mcp:*",
                "MCP_LOG_LEVEL": "debug",
                "NODE_ENV": "development"
            }
        }
    }
}
```

## Best Practices

### 1. Environment Management

**Use descriptive server names:**
```json
{
    "mcpServers": {
        "prisma-airs-dev": { /* dev config */ },
        "prisma-airs-prod": { /* prod config */ }
    }
}
```

### 2. Security Considerations

- Always use HTTPS for production servers
- Keep server URLs private
- Regularly update both Claude Desktop and MCP server
- Monitor server logs for suspicious activity

### 3. Performance Optimization

- Use local servers for development
- Monitor rate limits via `airs_get_rate_limit_status`
- Clear cache periodically with `airs_clear_cache`
- Consider geographic server placement for latency

### 4. Team Collaboration

- Document server URLs and environments
- Share configuration templates
- Establish naming conventions
- Create runbooks for common issues

## Integration Examples

### Security-First Development

1. Configure Claude Desktop with Prisma AIRS
2. Before committing code, ask:
   > "Scan my recent changes for security vulnerabilities"
3. Address any findings before pushing

### Document Review Workflow

1. Open sensitive document
2. Ask Claude:
   > "Check this document for data that should be redacted"
3. Apply recommended masking

### Incident Response

1. During security incident, ask:
   > "Analyze this log file for signs of compromise"
2. Use threat reports for detailed analysis
3. Document findings for post-mortem

## Next Steps

- Configure [additional MCP clients]({{ site.baseurl }}/deployment/mcp/)
- Explore [security features]({{ site.baseurl }}/prisma-airs/)
- Review [API documentation]({{ site.baseurl }}/developers/api/)

## Additional Resources

- [Claude Desktop Documentation](https://claude.ai/docs/desktop)
- [MCP Remote Repository](https://github.com/modelcontextprotocol/servers/tree/main/src/mcp-remote)
- [Prisma AIRS Overview]({{ site.baseurl }}/prisma-airs/overview/)
