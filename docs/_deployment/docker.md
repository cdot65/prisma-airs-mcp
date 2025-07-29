---
layout: documentation
title: Docker Deployment
description: Deploy Prisma AIRS MCP using standalone Docker
category: deployment
permalink: /deployment/docker/
---

## Overview

Deploy Prisma AIRS MCP as a standalone Docker container. This is the fastest deployment method, perfect for testing and single-instance deployments.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Prisma AIRS API key from [Strata Cloud Manager](https://stratacloudmanager.paloaltonetworks.com)

## Quick Start

### 1. Create Configuration

Create a `.env` file with your API credentials:

```bash
cat > .env <<EOF
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS
PORT=3000
EOF
```

### 2. Run the Container

```bash
# Pull the latest image
docker pull ghcr.io/cdot65/prisma-airs-mcp:latest

# Run the container
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

### 3. Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/health

# View logs
docker logs -f prisma-airs-mcp
```

## Docker Run Options

### Basic Usage

```bash
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Advanced Options

```bash
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  --memory 512m \
  --cpus 1 \
  --health-cmd "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1" \
  --health-interval 30s \
  --health-timeout 3s \
  --health-retries 3 \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Environment Variables

Pass configuration via environment variables:

```bash
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  -e AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com \
  -e AIRS_API_KEY=your-api-key-here \
  -e AIRS_DEFAULT_PROFILE_NAME="Prisma AIRS" \
  -e LOG_LEVEL=info \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

## Container Management

### Basic Commands

```bash
# Start container
docker start prisma-airs-mcp

# Stop container
docker stop prisma-airs-mcp

# Restart container
docker restart prisma-airs-mcp

# Remove container
docker rm prisma-airs-mcp

# Remove container (force)
docker rm -f prisma-airs-mcp
```

### Monitoring

```bash
# View logs
docker logs prisma-airs-mcp

# Follow logs
docker logs -f prisma-airs-mcp

# View last 100 lines
docker logs --tail 100 prisma-airs-mcp

# View container stats
docker stats prisma-airs-mcp

# View running processes
docker top prisma-airs-mcp
```

### Debugging

```bash
# Access container shell
docker exec -it prisma-airs-mcp sh

# Run commands inside container
docker exec prisma-airs-mcp ps aux
docker exec prisma-airs-mcp env | grep AIRS

# Inspect container
docker inspect prisma-airs-mcp

# View container health
docker inspect prisma-airs-mcp --format='{% raw %}{{.State.Health.Status}}{% endraw %}'
```

## Configuration

### Using .env File

Create a `.env` file:

```env
# Required
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here

# Optional Profile
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS

# Server Settings
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Performance
CACHE_TTL_SECONDS=300
RATE_LIMIT_MAX_REQUESTS=100
```

Run with env file:

```bash
docker run -d --env-file .env ...
```

### Using Docker Secrets (Swarm Mode)

For Docker Swarm deployments:

```bash
# Create secrets
echo "your-api-key" | docker secret create airs_api_key -
echo "Prisma AIRS" | docker secret create airs_profile_name -

# Deploy service
docker service create \
  --name prisma-airs-mcp \
  --publish 3000:3000 \
  --secret airs_api_key \
  --secret airs_profile_name \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

## Networking

### Port Mapping

```bash
# Map to different host port
docker run -p 8080:3000 ...

# Bind to specific interface
docker run -p 127.0.0.1:3000:3000 ...

# Random host port
docker run -P ...
```

### Custom Networks

```bash
# Create network
docker network create prisma-network

# Run container on network
docker run -d \
  --name prisma-airs-mcp \
  --network prisma-network \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

## Resource Management

### Memory and CPU Limits

```bash
docker run -d \
  --name prisma-airs-mcp \
  --memory 512m \
  --memory-reservation 256m \
  --cpus 1 \
  --cpu-shares 1024 \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Storage Limits

```bash
docker run -d \
  --name prisma-airs-mcp \
  --storage-opt size=10G \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

## Health Checks

### Built-in Health Check

The container includes a health check that monitors the `/health` endpoint:

```bash
# View health status
docker ps --format "table {% raw %}{{.Names}}\t{{.Status}}{% endraw %}"

# Get detailed health info
docker inspect prisma-airs-mcp --format='{% raw %}{{json .State.Health}}{% endraw %}' | jq
```

### Custom Health Check

```bash
docker run -d \
  --name prisma-airs-mcp \
  --health-cmd "curl -f http://localhost:3000/health || exit 1" \
  --health-interval 30s \
  --health-timeout 3s \
  --health-retries 3 \
  --health-start-period 10s \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

## Updates and Maintenance

### Update Container

```bash
# Pull latest image
docker pull ghcr.io/cdot65/prisma-airs-mcp:latest

# Stop and remove old container
docker stop prisma-airs-mcp
docker rm prisma-airs-mcp

# Run new container
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Automated Updates (Watchtower)

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400 \
  prisma-airs-mcp
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs prisma-airs-mcp

# Common issues:
# - Invalid API key: Check AIRS_API_KEY
# - Port conflict: Use different port
# - Missing env vars: Verify .env file
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Use different port
docker run -p 3001:3000 ...
```

### Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Container Crashes

```bash
# Check exit code
docker ps -a

# View detailed logs
docker logs --details prisma-airs-mcp

# Increase memory if needed
docker run --memory 1g ...
```

## Security Best Practices

1. **Never hardcode secrets** - Use .env files or Docker secrets
2. **Run as non-root** - The container runs as node user by default
3. **Use specific tags** - Avoid using `latest` in production
4. **Limit resources** - Set memory and CPU limits
5. **Use read-only filesystem** when possible:

```bash
docker run -d \
  --name prisma-airs-mcp \
  --read-only \
  --tmpfs /tmp \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

## Next Steps

- For multi-container setups, see [Docker Compose Deployment]({{ site.baseurl }}/deployment/docker-compose)
- For production deployments, consider [Kubernetes]({{ site.baseurl }}/deployment/kubernetes)
- Review the [Configuration Reference]({{ site.baseurl }}/deployment/configuration)
- Set up [Claude Integration]({{ site.baseurl }}/mcp-clients/claude-desktop/)
