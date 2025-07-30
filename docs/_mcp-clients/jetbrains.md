---
layout: documentation
title: JetBrains IDEs Configuration
description: Configure Prisma AIRS MCP for JetBrains IDEs (IntelliJ, WebStorm, PyCharm, etc.)
permalink: /mcp-clients/jetbrains/
category: mcp-clients
---

## Overview

JetBrains IDEs support the Model Context Protocol (MCP) through AI Assistant, enabling real-time security scanning and threat detection during development. This integration works across all JetBrains IDEs including IntelliJ IDEA, WebStorm, PyCharm, GoLand, and others.

## Prerequisites

- Any JetBrains IDE with AI Assistant plugin
- AI Assistant subscription (Pro or Enterprise)
- Prisma AIRS MCP server running and accessible
- Valid Prisma AIRS API credentials

## Quick Start

1. Open Settings → Tools → AI Assistant → Model Context Protocol (MCP)
2. Add new MCP server configuration
3. Specify Prisma AIRS server details
4. Start using security tools with `/` commands

## Configuration Methods

### Option 1: IDE Settings UI (Recommended)

1. Open **Settings** (Ctrl+Alt+S / Cmd+,)
2. Navigate to **Tools → AI Assistant → Model Context Protocol (MCP)**
3. Click **Add** button
4. Configure the server:
   - **Name**: `prisma-airs`
   - **Command**: `node`
   - **Arguments**: `/path/to/prisma-airs-mcp/dist/index.js`
   - **Working directory**: `/path/to/prisma-airs-mcp`
5. Add environment variables if needed:
   - `AIRS_API_KEY`: Your API key
   - `AIRS_API_URL`: Server URL
6. Click **OK** to save

### Option 2: JSON Configuration

1. In the MCP settings dialog, click **Command** → **As JSON**
2. Add your configuration and save in the working directory:

  ```json
  {
    "name": "prisma-airs",
    "command": "node",
    "args": ["/path/to/prisma-airs-mcp/dist/index.js"],
    "env": {
      "AIRS_API_URL": "https://airs.example.com",
      "AIRS_API_KEY": "your-api-key"
    }
  }
  ```

### Option 3: Import Claude Configuration

If you already have a Claude MCP configuration:

1. Click **Import Claude configuration**
2. Select your Claude config file
3. JetBrains will automatically import compatible servers
4. Adjust paths if necessary

## Configuration Examples

### Local Development

```json
{
  "name": "prisma-airs-dev",
  "command": "node",
  "args": ["./dist/index.js"],
  "env": {
    "AIRS_API_URL": "http://localhost:3000",
    "NODE_ENV": "development"
  }
}
```

### Docker Container

```json
{
  "name": "prisma-airs-docker",
  "command": "docker",
  "args": [
    "run",
    "--rm",
    "-i",
    "prisma-airs-mcp:latest"
  ],
  "env": {
    "AIRS_API_URL": "http://host.docker.internal:3000"
  }
}
```

### Remote Server

```json
{
  "name": "prisma-airs-remote",
  "command": "ssh",
  "args": [
    "user@remote-host",
    "node /opt/prisma-airs-mcp/dist/index.js"
  ],
  "env": {
    "AIRS_API_URL": "https://airs.example.com",
    "AIRS_API_KEY": "your-api-key"
  }
}
```

## Configuration Scope

In the **Level** column, choose the availability scope:

- **Global**: Available in all projects
- **Project**: Only available in current project

## Using Security Tools

### Available Commands

Once connected, use these commands in AI chat with `/`:

| Command                    | Description                      |
| -------------------------- | -------------------------------- |
| `/airs_scan_content`       | Real-time security scanning      |
| `/airs_scan_async`         | Batch content scanning           |
| `/airs_get_scan_results`   | Retrieve scan results            |
| `/airs_get_threat_reports` | Detailed threat analysis         |
| `/airs_clear_cache`        | Clear server cache               |

### Accessing Tools

1. Open AI Assistant chat
2. Type `/` to see available commands
3. Select a Prisma AIRS command
4. Provide required parameters

**Note**: Ensure **Codebase mode** is enabled for full functionality.

### Server Status

Check connection status:

1. Go to MCP settings
2. View **Status** column
3. Click status icon to see available tools

## Example Workflows

### Security Code Review

```text
/airs_scan_content
Please analyze the selected code for security vulnerabilities
```

### API Security Check

```text
/airs_scan_async
Scan all API endpoints in the current file for injection vulnerabilities
```

### Sensitive Data Detection

```text
/airs_scan_content
Check if this function properly handles sensitive user data
```

### Threat Report Analysis

```text
/airs_get_threat_reports
Show me detailed reports for the last scan
```

## Working with Results

### Inline Suggestions

AI Assistant displays security findings:

- Directly in the editor as warnings/errors
- In the AI chat with explanations
- As quick-fix suggestions

### Code Inspections

Security issues appear in:

- Problems tool window
- Editor gutter icons
- Code inspection results

## Troubleshooting

### Common Issues

#### Server Not Starting

**Symptoms:** Connection failed, status shows error

**Solutions:**

1. Verify command path:

   ```bash
   which node
   ls -la /path/to/prisma-airs-mcp/dist/index.js
   ```

2. Check working directory permissions
3. Verify environment variables are set

#### Authentication Errors

**Symptoms:** 401/403 errors in tool responses

**Solutions:**

1. Verify API key in environment variables
2. Check server URL is correct
3. Test credentials directly:

   ```bash
   curl -H "x-pan-token: your-api-key" https://airs.example.com/health
   ```

#### Tools Not Appearing

**Symptoms:** No Prisma AIRS commands in `/` menu

**Solutions:**

1. Enable Codebase mode in AI chat
2. Check MCP server status (should be green)
3. Click refresh icon in MCP settings
4. Restart IDE if necessary

#### Performance Issues

**Symptoms:** Slow responses, timeouts

**Solutions:**

1. Check network connectivity
2. Verify server performance
3. Reduce batch scan sizes
4. Use async scanning for large files

## Best Practices

### Project Configuration

1. **Store in Version Control**
   - Save MCP config at project level
   - Document server URLs in README
   - Use environment variables for secrets

2. **Team Collaboration**
   - Share project-level configurations
   - Document security workflows
   - Create custom inspection profiles

### Security Configuration

1. **Credentials Management**
   - Never hardcode API keys
   - Use IDE's secure credential storage
   - Rotate keys regularly

2. **Network Security**
   - Use HTTPS for remote servers
   - Configure firewall rules
   - Monitor API usage

### Performance Optimization

1. **Selective Scanning**
   - Scan changed files only
   - Use file masks to exclude vendors
   - Configure scan triggers

2. **Caching Strategy**
   - Enable result caching
   - Clear cache periodically
   - Monitor cache size

## IDE-Specific Features

### IntelliJ IDEA

- Integration with code inspections
- Security audit reports
- Maven/Gradle plugin support

### WebStorm

- JavaScript/TypeScript specific scanning
- NPM security audit integration
- React/Vue/Angular support

### PyCharm

- Python security analysis
- Virtual environment support
- Django/Flask specific checks

## Integration Examples

### Code Inspection Profile

```xml
<!-- .idea/inspectionProfiles/PrismaAIRS.xml -->
<profile version="1.0">
  <option name="myName" value="Prisma AIRS Security" />
  <inspection_tool class="PrismaAIRSSecurity" enabled="true" level="WARNING" />
</profile>
```

### Build Integration

```groovy
// build.gradle
task securityScan {
    doLast {
        // Trigger Prisma AIRS scan
        println 'Running security scan...'
    }
}
```

### Git Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit
echo "Running Prisma AIRS security check..."
# Add IDE command line security scan
```

## Advanced Configuration

### Custom Tool Parameters

```json
{
  "name": "prisma-airs-custom",
  "command": "node",
  "args": [
    "./dist/index.js",
    "--profile", "strict",
    "--timeout", "30000"
  ]
}
```

### Multiple Profiles

Configure different security profiles:

1. Development (fast, basic checks)
2. Staging (comprehensive scanning)
3. Production (strict compliance checks)

## Next Steps

- Explore [available security features]({{ site.baseurl }}/prisma-airs/)
- Configure [threat detection rules]({{ site.baseurl }}/prisma-airs/custom-topic-guardrails/)
- Set up [CI/CD integration]({{ site.baseurl }}/deployment/)

## Additional Resources

- [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/idea/ai-assistant.html)
- [MCP Protocol Specification](https://github.com/modelcontextprotocol/protocol)
- [Prisma AIRS API Documentation]({{ site.baseurl }}/developers/api/)
