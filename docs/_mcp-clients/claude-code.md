---
layout: documentation
title: Claude Code Configuration
description: Configure Prisma AIRS MCP for Claude Code (claude.ai/code)
permalink: /mcp-clients/claude-code/
category: mcp-clients
---

## Overview

Claude Code is a web-based AI development environment that supports the Model Context Protocol through its command-line interface. This integration enables security scanning and threat detection directly within your browser-based coding sessions.

## Prerequisites

- Access to [Claude Code](https://claude.ai/code)
- Claude Code CLI installed (`claude` command)
- Prisma AIRS MCP server running and accessible

## Quick Start

1. Open your terminal in the project directory
2. Add the Prisma AIRS MCP server
3. Verify the connection
4. Start using security tools in Claude Code

## Adding MCP Servers

### Development Environment

```bash
# Add local development server
claude mcp add --transport http prisma-airs-dev http://localhost:3000
```

### Production Environment

```bash
# Add production server
claude mcp add --transport http prisma-airs-prod https://airs.example.com
```

### Docker Environment

```bash
# Add Docker container (custom port)
claude mcp add --transport http prisma-airs-docker http://localhost:3100
```

## Server Management

### List Configured Servers

```bash
claude mcp list
```

**Example output:**

```
MCP Servers:
┌──────────────────┬───────────┬──────────────────────┬─────────┬────────────┐
│ Name             │ Transport │ URL                  │ Scope   │ Status     │
├──────────────────┼───────────┼──────────────────────┼─────────┼────────────┤
│ prisma-airs-dev  │ http      │ http://localhost:3000│ local   │ Connected  │
│ prisma-airs-prod │ http      │ https://airs.example │ project │ Connected  │
└──────────────────┴───────────┴──────────────────────┴─────────┴────────────┘
```

### View Server Details

```bash
# Get detailed information
claude mcp get prisma-airs-dev
```

**Output includes:**

- Available tools
- Resources
- Prompts
- Connection status
- Configuration details

### Remove a Server

```bash
# Remove by name
claude mcp remove prisma-airs-dev

# Remove with confirmation
claude mcp remove prisma-airs-prod --confirm
```

## Configuration Scopes

### Understanding Scopes

| Scope   | Visibility           | Storage Location         | Use Case           |
| ------- | -------------------- | ------------------------ | ------------------ |
| Local   | Current project only | `.claude/local.mcp.json` | Personal testing   |
| Project | All team members     | `.mcp.json` (in repo)    | Team collaboration |
| User    | All your projects    | `~/.claude/mcp.json`     | Personal servers   |

### Local Scope (Default)

For personal development in current project:

```bash
claude mcp add --transport http prisma-airs-local http://localhost:3000
```

### Project Scope (Recommended for Teams)

Share configuration with your team:

```bash
# Add to project scope
claude mcp add -s project --transport http prisma-airs http://localhost:3000

# This creates/updates .mcp.json in project root
```

**Generated `.mcp.json`:**

```json
{
    "servers": {
        "prisma-airs": {
            "transport": "http",
            "url": "http://localhost:3000",
            "description": "Prisma AIRS security scanning"
        }
    }
}
```

### User Scope

For personal servers across all projects:

```bash
claude mcp add -s user --transport http prisma-airs-personal https://my-airs.com
```

## Using Security Tools

### Available Tools

Once connected, these Prisma AIRS tools are available:

| Tool Name                 | Description                 | Usage                      |
| ------------------------- | --------------------------- | -------------------------- |
| `airs_scan_content`       | Real-time security scanning | Immediate threat detection |
| `airs_scan_async`         | Batch content scanning      | Large-scale analysis       |
| `airs_get_scan_results`   | Retrieve scan results       | Check async scan status    |
| `airs_get_threat_reports` | Detailed threat analysis    | Deep dive into threats     |
| `airs_clear_cache`        | Clear server cache          | Performance management     |

### Checking Tool Availability

In Claude Code, use the `/mcp` command:

```
/mcp
```

**Output shows:**

- Connected servers and their status
- Available tools with descriptions
- Resources and prompts
- Rate limit information

### Example Workflows

#### Security Code Review

```
User: Please review this API endpoint for security vulnerabilities:

@app.route('/api/search')
def search():
    query = request.args.get('q')
    results = db.execute(f"SELECT * FROM products WHERE name LIKE '%{query}%'")
    return jsonify(results)
```

Claude will use Prisma AIRS tools to detect SQL injection vulnerability.

#### Batch Security Scan

```
User: Scan all user inputs in this file for potential security threats.
```

Claude will use `airs_scan_async` for efficient batch processing.

#### Compliance Check

```
User: Check if this code handles PII data according to GDPR requirements.
```

## Troubleshooting

### Common Issues

#### Server Not Connecting

**Symptoms:** Tools not available, connection errors

**Solutions:**

1. **Verify server is running:**

    ```bash
    # Check health endpoint
    curl http://localhost:3000/health
    ```

2. **Check Claude Code CLI:**

    ```bash
    # Verify CLI is working
    claude --version

    # Check authentication
    claude auth status
    ```

3. **Test with verbose mode:**
    ```bash
    claude mcp add --transport http --verbose prisma-airs http://localhost:3000
    ```

#### Scope Conflicts

**Error:** "Server name already exists in different scope"

**Solution:** Use unique names per scope:

```bash
# Remove conflicting server
claude mcp remove prisma-airs --scope project

# Add with unique name
claude mcp add -s project --transport http prisma-airs-team http://localhost:3000
```

#### Permission Issues

**Error:** "Cannot write to .mcp.json"

**Solutions:**

1. **Check file permissions:**

    ```bash
    ls -la .mcp.json
    chmod 644 .mcp.json
    ```

2. **Use user scope instead:**
    ```bash
    claude mcp add -s user --transport http prisma-airs http://localhost:3000
    ```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment
export CLAUDE_LOG_LEVEL=debug

# Add server with debug output
claude mcp add --transport http --debug prisma-airs http://localhost:3000
```

## Best Practices

### 1. Naming Conventions

**Use environment-specific names:**

```bash
# Development
claude mcp add --transport http prisma-airs-dev http://localhost:3000

# Staging
claude mcp add --transport http prisma-airs-staging https://staging.airs.example.com

# Production
claude mcp add --transport http prisma-airs-prod https://airs.example.com
```

### 2. Team Collaboration

**Share configurations via project scope:**

1. Add server to project scope:

    ```bash
    claude mcp add -s project --transport http prisma-airs-team http://team-server:3000
    ```

2. Commit `.mcp.json` to version control:

    ```bash
    git add .mcp.json
    git commit -m "Add Prisma AIRS MCP configuration"
    ```

3. Document in README:
    ```markdown
    ## Security Tools
    This project uses Prisma AIRS for security scanning.
    MCP configuration is in `.mcp.json`.
    ```

### 3. Security Considerations

- Use HTTPS for production servers
- Don't commit sensitive URLs to public repos
- Regularly update server configurations
- Monitor rate limits and usage

### 4. Performance Tips

- Use local servers for development
- Configure caching appropriately
- Monitor rate limits with `/mcp` command
- Clear cache when needed

## Integration Examples

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if Prisma AIRS is configured
if ! claude mcp list | grep -q "prisma-airs"; then
    echo "Warning: Prisma AIRS not configured. Security scanning unavailable."
fi
```

### CI/CD Integration

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Configure MCP
        run: |
          claude mcp add --transport http prisma-airs ${{ secrets.AIRS_URL }}
      - name: Run security scan
        run: |
          claude analyze --security
```

## Next Steps

- Explore [available security features]({{ site.baseurl }}/prisma-airs/)
- Set up [additional MCP clients]({{ site.baseurl }}/mcp-clients/)
- Review [API documentation]({{ site.baseurl }}/developers/api/)

## Additional Resources

- [Claude Code Documentation](https://claude.ai/docs/code)
- [MCP CLI Reference](https://github.com/anthropics/claude-cli)
- [Prisma AIRS Security Features]({{ site.baseurl }}/prisma-airs/overview/)

```

```
