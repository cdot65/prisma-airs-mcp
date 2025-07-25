# Quick Setup: Connect Claude to Prisma AIRS MCP Server

Your Prisma AIRS MCP server is now live and ready to use with Claude!

## Quick Setup (macOS)

1. **Copy this configuration to Claude's config directory**:

```bash
# Create config directory if it doesn't exist
mkdir -p ~/Library/Application\ Support/Claude

# Copy the configuration
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/
```

2. **If you already have a config file, merge the settings**:

```bash
# Check if config exists
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

If it exists, add the Prisma AIRS server to the existing `mcpServers` section.

3. **Restart Claude Desktop**

## What You Can Do Now

Once connected, you can ask Claude to:

- **Scan content for threats**: "Use the Prisma AIRS tool to scan this prompt for security threats"
- **Check threat reports**: "Get the latest threat reports from Prisma AIRS"
- **View cache statistics**: "Show me the Prisma AIRS cache statistics"
- **Check rate limits**: "What's the current rate limit status for Prisma AIRS?"

## Test Commands

You can test the server directly:

```bash
# Check health
curl https://airs.cdot.io/prisma-airs/health

# Test MCP protocol
curl -X POST https://airs.cdot.io/prisma-airs \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

## Server Details

- **URL**: `https://airs.cdot.io/prisma-airs`
- **Protocol**: HTTP/HTTPS with JSON-RPC 2.0
- **TLS**: Valid wildcard certificate for \*.cdot.io
- **Rate Limit**: 100 requests/minute

## Troubleshooting

If Claude can't connect:

1. Make sure Claude Desktop is fully closed before editing the config
2. Check the config file syntax (must be valid JSON)
3. Verify the server is accessible: `curl https://airs.cdot.io/prisma-airs/health`
4. Check Claude's logs for connection errors

## Next Steps

1. Copy the configuration to Claude
2. Restart Claude Desktop
3. Start using Prisma AIRS security features!

The MCP server provides real-time security analysis, threat detection, and compliance checking capabilities directly within Claude.
