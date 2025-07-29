---
layout: documentation
title: Quick Start Guide
description: Get Prisma AIRS MCP up and running in minutes
category: deployment
permalink: /deployment/quickstart/
---

## Overview

Get Prisma AIRS MCP deployed quickly with this step-by-step guide. Choose from Docker, Docker Compose, source build, or Kubernetes deployment.

## Prerequisites

Before you begin, you'll need:

- **Prisma AIRS API key** from [Strata Cloud Manager](https://stratacloudmanager.paloaltonetworks.com)
- **One of the following** depending on your deployment method:
    - Docker (for containerized deployment)
    - Node.js 18+ and pnpm/npm (for source deployment)
    - Kubernetes cluster (for production deployment)

## Quick Start Options

### Option 1: Docker (Fastest)

Single container deployment in under 2 minutes:

```bash
# Create configuration
cat > .env <<EOF
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS
PORT=3000
EOF

# Run the container
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest

# Verify it's running
curl http://localhost:3000/health
```

**[Full Docker Guide →]({{ site.baseurl }}/deployment/docker)**

### Option 2: Docker Compose (Recommended)

Best for development with easy management:

```bash
# Clone the repository
git clone https://github.com/cdot65/prisma-airs-mcp.git
cd prisma-airs-mcp

# Configure
cp .env.example .env
# Edit .env with your API key

# Start with Docker Compose
pnpm run compose:up

# View logs
pnpm run compose:logs
```

**[Full Docker Compose Guide →]({{ site.baseurl }}/deployment/docker-compose)**

### Option 3: Build from Source

For development and customization:

```bash
# Clone and install
git clone https://github.com/cdot65/prisma-airs-mcp.git
cd prisma-airs-mcp
pnpm install

# Configure
cp .env.example .env
# Edit .env with your API key

# Run in development mode
pnpm run local:dev
```

**[Full Source Build Guide →]({{ site.baseurl }}/deployment/source)**

### Option 4: Kubernetes

For production deployments:

```bash
# Clone the repository
git clone https://github.com/cdot65/prisma-airs-mcp.git
cd prisma-airs-mcp

# Create namespace and secret
kubectl create namespace prisma-airs-mcp-server
./k8s/scripts/manage-secrets.sh create prisma-airs-mcp-server 'your-api-key-here'

# Deploy
pnpm run k8s:deploy:latest
```

**[Full Kubernetes Guide →]({{ site.baseurl }}/deployment/kubernetes)**

## Verify Installation

Once deployed, verify the server is running:

```bash
# Check health
curl http://localhost:3000/health

# Expected response
{
  "status": "healthy",
  "uptime": 10.5,
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

Test the MCP protocol:

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

## Basic Configuration

### Minimal Setup

At minimum, you need:

```env
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here
```

### Common Options

```env
# Server
PORT=3000
LOG_LEVEL=info

# Optional Profile
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS

# Performance
CACHE_TTL_SECONDS=300
RATE_LIMIT_MAX_REQUESTS=100
```

**[Full Configuration Reference →]({{ site.baseurl }}/deployment/configuration)**

## Next Steps

### Connect to Claude

1. Install Claude Desktop or Claude Code
2. Configure MCP integration
3. Start using Prisma AIRS security features

**[Claude Integration Guide →]({{ site.baseurl }}/mcp-clients/claude-desktop/)**

### Deployment Guides

- **[Compare All Options]({{ site.baseurl }}/deployment/overview)** - Detailed comparison
- **[Docker Guide]({{ site.baseurl }}/deployment/docker)** - Single container deployment
- **[Docker Compose Guide]({{ site.baseurl }}/deployment/docker-compose)** - Multi-profile setup
- **[Kubernetes Guide]({{ site.baseurl }}/deployment/kubernetes)** - Production deployment

### Development Resources

- **[SDK Documentation]({{ site.baseurl }}/developers/overview)** - Using the TypeScript SDK
- **[API Reference]({{ site.baseurl }}/developers/api/)** - Complete API documentation
- **[Examples]({{ site.baseurl }}/developers/examples/basic)** - Code samples

## Quick Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs prisma-airs-mcp

# Common issues:
# - Invalid API key
# - Port already in use
# - Missing environment variables
```

### API Key Issues

- Verify the key is active in Strata Cloud Manager
- Check for extra spaces in the `.env` file
- Ensure the API URL matches your region

### Port Conflicts

```bash
# Use a different port
PORT=3001 docker run -p 3001:3001 ...

# Or find what's using port 3000
lsof -i :3000
```

### Getting Help

- **Documentation** - You're here!
- **GitHub Issues** - [Report bugs or ask questions](https://github.com/cdot65/prisma-airs-mcp/issues)

Ready to secure your AI applications? Choose your deployment method above and get started!
