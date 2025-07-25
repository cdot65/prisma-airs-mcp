# Integrating Prisma AIRS MCP Server with Claude

Your Prisma AIRS MCP server is now live at `https://airs.cdot.io/prisma-airs`. Here's how to integrate it with Claude.

## Option 1: Claude Desktop App Configuration

If you're using Claude Desktop app, you need to configure it to connect to your MCP server.

### Configuration File Location

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prisma-airs": {
      "url": "https://airs.cdot.io/prisma-airs",
      "transport": "http"
    }
  }
}
```

If you already have other MCP servers configured, add it to the existing `mcpServers` object:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/files"
      ]
    },
    "prisma-airs": {
      "url": "https://airs.cdot.io/prisma-airs",
      "transport": "http"
    }
  }
}
```

### Restart Claude

After updating the configuration, restart Claude Desktop for the changes to take effect.

## Option 2: Using MCP Inspector for Testing

You can test your MCP server using the MCP Inspector tool:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Test your server
mcp-inspector https://airs.cdot.io/prisma-airs
```

## Option 3: Direct HTTP Testing

Test the MCP protocol directly:

### 1. Initialize Session

```bash
curl -X POST https://airs.cdot.io/prisma-airs \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "0.1.0",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

### 2. List Available Tools

```bash
curl -X POST https://airs.cdot.io/prisma-airs \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }'
```

### 3. List Resources

```bash
curl -X POST https://airs.cdot.io/prisma-airs \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "params": {},
    "id": 3
  }'
```

### 4. Execute a Tool (Example: Clear Cache)

```bash
curl -X POST https://airs.cdot.io/prisma-airs \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "airs_clear_cache",
      "arguments": {}
    },
    "id": 4
  }'
```

## Available MCP Features

Once connected, Claude will have access to:

### Resources

- `airs://cache/stats` - View cache statistics
- `airs://rate-limit/status` - Check rate limit status
- Dynamic scan results and threat reports

### Tools

1. **airs_scan_content** - Scan content for security threats
2. **airs_scan_async** - Submit async scan requests
3. **airs_get_scan_results** - Retrieve scan results
4. **airs_get_threat_reports** - Get threat reports
5. **airs_clear_cache** - Clear response cache

### Prompts

1. **security_analysis** - Security analysis workflow
2. **threat_investigation** - Threat investigation workflow
3. **compliance_check** - Compliance validation
4. **incident_response** - Incident response guidance

## Troubleshooting

### Connection Issues

1. **Verify server is accessible**:

   ```bash
   curl https://airs.cdot.io/prisma-airs/health
   ```

2. **Check MCP initialization**:

   ```bash
   curl -X POST https://airs.cdot.io/prisma-airs \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"ping","id":1}'
   ```

3. **View server logs**:
   ```bash
   kubectl logs -l app=prisma-airs-mcp -n prisma-airs -f
   ```

### Common Issues

1. **SSL Certificate Errors**: The server uses a valid wildcard certificate for `*.cdot.io`. If you get SSL errors, ensure your client trusts the certificate.

2. **Rate Limiting**: The server implements rate limiting (100 requests/minute in production). If you hit limits, you'll receive appropriate error responses.

3. **Authentication**: Currently, the API key is configured server-side. Future versions may require client authentication.

## Security Considerations

- The server is accessible over HTTPS only
- Rate limiting is enforced
- All requests are logged for audit purposes
- The `/prisma-airs` prefix is stripped before reaching the MCP server

## Next Steps

1. Configure Claude Desktop with your MCP server URL
2. Test the connection using the MCP Inspector
3. Start using Prisma AIRS security features within Claude
4. Monitor server logs for any issues

## Support

For issues or questions:

- Check server health: `https://airs.cdot.io/prisma-airs/health`
- View logs: `kubectl logs -n prisma-airs -l app=prisma-airs-mcp`
- Review deployment: `kubectl describe deployment prisma-airs-mcp -n prisma-airs`
