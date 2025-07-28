---
layout: documentation
title: Smithery.ai Deployment
permalink: /deployment/smithery/
category: deployment
---

# Smithery.ai Deployment

This guide explains how to deploy the Prisma AIRS MCP server on [Smithery.ai](https://smithery.ai), a platform for
hosting MCP servers with Streamable HTTP connections.

## Overview

Smithery.ai provides a managed hosting environment for MCP servers, handling:

- Container orchestration
- HTTPS endpoints
- Authentication and session management
- Automatic scaling
- Configuration management

## Prerequisites

- A Prisma AIRS API key from Palo Alto Networks
- A Smithery.ai account
- GitHub repository with the MCP server code

## Deployment Methods

Smithery supports two deployment approaches:

1. **TypeScript Deploy**: For TypeScript servers built with Smithery CLI
2. **Custom Deploy**: For any language using Docker containers (our approach)

## Configuration File

The server includes a `smithery.yaml` configuration file that defines:

```yaml
runtime: "container"
build:
  dockerfile: "Dockerfile"           # Path to Dockerfile
  dockerBuildPath: "."               # Docker build context
startCommand:
  type: "http"
  configSchema:                      # JSON Schema for configuration
    type: "object"
    properties:
      AIRS_API_KEY:
        type: "string"
        description: "Prisma AIRS API key for security scanning"
      # ... other environment variables
    required: ["AIRS_API_KEY"]
```

## Required Endpoints

Smithery.ai requires specific endpoints at `/mcp`:

### POST /mcp

Handles JSON-RPC 2.0 messages for MCP protocol communication.

```bash
curl -X POST https://your-server.smithery.ai/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

### GET /mcp

Returns server information or establishes SSE connection.

```bash
# Get server info
curl https://your-server.smithery.ai/mcp

# SSE streaming
curl -H "Accept: text/event-stream" \
     https://your-server.smithery.ai/mcp
```

### DELETE /mcp

Handles session cleanup (returns 204 No Content).

```bash
curl -X DELETE https://your-server.smithery.ai/mcp
```

## Configuration Variables

### Required Configuration

- `AIRS_API_KEY`: Your Prisma AIRS API key (required)

### Optional Configuration

All other settings have defaults but can be customized:

| Variable                    | Description              | Default                                               |
|-----------------------------|--------------------------|-------------------------------------------------------|
| `AIRS_API_URL`              | Prisma AIRS API endpoint | `https://service.api.aisecurity.paloaltonetworks.com` |
| `AIRS_DEFAULT_PROFILE_NAME` | Default security profile | `Prisma AIRS`                                         |
| `NODE_ENV`                  | Environment setting      | `production`                                          |
| `PORT`                      | Server port              | `3000`                                                |
| `LOG_LEVEL`                 | Logging verbosity        | `info`                                                |
| `CACHE_TTL_SECONDS`         | Cache duration           | `300`                                                 |
| `CACHE_MAX_SIZE`            | Maximum cache entries    | `1000`                                                |
| `RATE_LIMIT_MAX_REQUESTS`   | Rate limit threshold     | `100`                                                 |
| `RATE_LIMIT_WINDOW_MS`      | Rate limit window        | `60000`                                               |

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository contains:

- `smithery.yaml` configuration file
- `Dockerfile` for container build
- Source code and dependencies

### 2. Connect to Smithery

1. Sign in to [Smithery.ai](https://smithery.ai)
2. Click "New Server" or "Connect GitHub"
3. Select your repository
4. Choose the branch to deploy

### 3. Configure Environment

1. Navigate to your server's settings
2. Add your `AIRS_API_KEY` in the environment variables section
3. Configure any optional variables as needed

### 4. Deploy

1. Click "Deploy" in the Smithery dashboard
2. Monitor the build logs
3. Wait for the deployment to complete

### 5. Verify Deployment

Once deployed, test your server:

```bash
# Check server info
curl https://your-server.smithery.ai/mcp

# Expected response:
{
  "name": "prisma-airs-mcp",
  "version": "1.0.4",
  "protocolVersion": "2024-11-05",
  "description": "Model Context Protocol server for Prisma AIRS integration",
  "capabilities": ["tools", "resources", "prompts"]
}
```

## Tool Discovery

The server implements "lazy loading" for tool discovery:

- Tools are listed without requiring authentication
- API key validation occurs only when tools are invoked
- This allows users to explore capabilities before configuring

Example:

```bash
# List tools (no auth required)
curl -X POST https://your-server.smithery.ai/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

## Configuration Handling

Smithery passes configuration as query parameters using dot-notation:

```
GET /mcp?AIRS_API_KEY=your-key&LOG_LEVEL=debug
```

The server automatically parses these into environment variables.

## Best Practices

### 1. Security

- Never commit API keys to your repository
- Use Smithery's environment variable management
- Keep your API key secure and rotate regularly

### 2. Performance

- The server includes built-in caching to reduce API calls
- Rate limiting prevents API quota exhaustion
- Configure cache and rate limit settings based on usage

### 3. Monitoring

- Check server logs in Smithery dashboard
- Monitor health endpoints
- Set up alerts for errors

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Problem**: Docker build fails  
**Solution**: Check Dockerfile path in `smithery.yaml` matches your repository structure

#### 2. Missing API Key

**Problem**: Server returns authentication errors  
**Solution**: Ensure `AIRS_API_KEY` is set in Smithery environment variables

#### 3. Connection Errors

**Problem**: Cannot connect to server  
**Solution**: Verify deployment status in Smithery dashboard

### Debug Steps

1. Check deployment logs in Smithery dashboard
2. Verify environment variables are set correctly
3. Test endpoints manually with curl
4. Review server logs for error messages

## Advanced Configuration

### Custom Profiles

Configure default security profiles via environment:

```yaml
AIRS_DEFAULT_PROFILE_NAME: "Custom Security Profile"
```

### Logging

Adjust log verbosity for debugging:

```yaml
LOG_LEVEL: "debug"  # Options: error, warn, info, debug
```

### Performance Tuning

Optimize for your usage patterns:

```yaml
CACHE_TTL_SECONDS: 600        # Longer cache for stable content
CACHE_MAX_SIZE: 5000          # More cache entries
RATE_LIMIT_MAX_REQUESTS: 200  # Higher rate limit
```

## Integration with MCP Clients

Once deployed, integrate with MCP-compatible clients:

### Claude Desktop

```json
{
  "mcpServers": {
    "prisma-airs": {
      "url": "https://your-server.smithery.ai/mcp",
      "config": {
        "AIRS_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Custom Clients

Use any MCP SDK to connect:

```javascript
const client = new MCPClient({
  serverUrl: 'https://your-server.smithery.ai/mcp',
  config: {
    AIRS_API_KEY: process.env.AIRS_API_KEY
  }
});
```

## Version Updates

To deploy a new version:

1. Update code in your repository
2. Push changes to the configured branch
3. Click "Redeploy" in Smithery dashboard
4. Monitor deployment progress

## Support

For deployment issues:

- Smithery.ai documentation: [smithery.ai/docs](https://smithery.ai/docs)
- MCP server issues: [GitHub Issues](https://github.com/cdot65/prisma-airs-mcp/issues)
- Prisma AIRS support: Contact Palo Alto Networks

## Related Documentation

- [Quickstart Guide]({{ site.baseurl }}/deployment/quickstart/)
- [Configuration Options]({{ site.baseurl }}/deployment/configuration/)
- [Docker Deployment]({{ site.baseurl }}/deployment/docker/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io)