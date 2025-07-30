# 🛡️ Prisma AIRS MCP Server

> Bring enterprise-grade AI security to your MCP-enabled applications

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/cdot65/prisma-airs-mcp/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/cdot65/prisma-airs-mcp/ci.yml?branch=main)](https://github.com/cdot65/prisma-airs-mcp/actions)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](https://github.com/cdot65/prisma-airs-mcp/blob/main/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-cdot65.github.io-blue)](https://cdot65.github.io/prisma-airs-mcp/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

## 🚀 What is this?

The Prisma AIRS MCP Server connects AI applications (like Claude, VS Code, and more) to Palo Alto Networks' Prisma AI
Runtime Security platform. This gives your AI tools the ability to:

✅ **Detect security threats** in real-time  
✅ **Block prompt injection** attempts  
✅ **Prevent data leakage** of sensitive information  
✅ **Scan for malicious content** before it reaches your AI  
✅ **Enforce compliance** with security policies

## 🎯 Quick Start

Get up and running in under 2 minutes:

### Option 1: Docker (Recommended)

```bash
# Run with your Prisma AIRS API key
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  -e AIRS_API_KEY="your-api-key" \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Option 2: Local Development

```bash
# Clone and install
git clone https://github.com/cdot65/prisma-airs-mcp.git
cd prisma-airs-mcp
pnpm install

# Configure (copy .env.example to .env and add your API key)
cp .env.example .env

# Run
pnpm run local:dev
```

## 🔌 Connect Your AI Tools

Once running, connect your favorite MCP-compatible applications:

- **[Claude Desktop](https://cdot65.github.io/prisma-airs-mcp/deployment/mcp/claude-desktop/)** - AI assistant with
  security
- **[VS Code](https://cdot65.github.io/prisma-airs-mcp/deployment/mcp/vscode/)** - Secure coding companion
- **[Claude Code](https://cdot65.github.io/prisma-airs-mcp/deployment/mcp/claude-code/)** - Web-based secure development

## 🏗️ Architecture

```
Your AI App (Claude, VS Code, etc.)
        ↓
   MCP Protocol
        ↓
Prisma AIRS MCP Server (this project)
        ↓
Prisma AIRS Security API
```

## 🔒 Privacy & Monitoring

This MCP server is designed with privacy in mind:

- **No telemetry by default** - The server does not collect any usage data unless explicitly enabled
- **Optional error monitoring** - Sentry.io integration is available but completely opt-in
- **Data filtering** - When monitoring is enabled, sensitive data (API keys, scan results, etc.) is automatically filtered
- **You control your data** - All monitoring features require explicit configuration

To enable optional monitoring for debugging, see the [configuration guide](https://cdot65.github.io/prisma-airs-mcp/deployment/configuration/#optional-monitoring-sentry).

## 📚 Documentation

**[Visit our comprehensive documentation →](https://cdot65.github.io/prisma-airs-mcp/)**

Key sections:

- 🚀 [Quick Start Guide](https://cdot65.github.io/prisma-airs-mcp/deployment/quickstart/)
- 🔧 [Configuration Reference](https://cdot65.github.io/prisma-airs-mcp/deployment/configuration/)
- 🛡️ [Security Features](https://cdot65.github.io/prisma-airs-mcp/prisma-airs/)
- 👩‍💻 [Developer Guide](https://cdot65.github.io/prisma-airs-mcp/developers/)

## 🛠️ Prerequisites

- **Prisma AIRS API Key** - Get yours from [Strata Cloud Manager](https://stratacloudmanager.paloaltonetworks.com)
- **Node.js 18+** - For local development
- **Docker** - For containerized deployment (optional)

## 🤝 Contributing

We love contributions! Check out our [contributing guide](CONTRIBUTING.md) to get started.

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 💬 Get Help

- 📖 [Documentation](https://cdot65.github.io/prisma-airs-mcp/)
- 💡 [GitHub Issues](https://github.com/cdot65/prisma-airs-mcp/issues)
- 💬 [Discussions](https://github.com/cdot65/prisma-airs-mcp/discussions)

---

<p align="center">
  Built with ❤️ by the community | Powered by <a href="https://modelcontextprotocol.io">MCP</a> and <a href="https://www.typescriptlang.org/">TypeScript</a>
</p>
