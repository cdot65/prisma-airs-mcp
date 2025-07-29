---
layout: documentation
title: Docker Compose Deployment
description: Deploy Prisma AIRS MCP using Docker Compose with development and production profiles
category: deployment
---

## Overview

Docker Compose provides a structured way to deploy Prisma AIRS MCP with separate development and production configurations. This guide covers multi-profile deployments with proper environment management.

## Prerequisites

- Docker Engine 20.10+ with Docker Compose v2
- Prisma AIRS API key from [Strata Cloud Manager](https://stratacloudmanager.paloaltonetworks.com)
- Git (to clone the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/cdot65/prisma-airs-mcp.git
cd prisma-airs-mcp
```

### 2. Configure Environment

```bash
# Copy example configuration
cp .env.example .env

# Edit .env with your API key
nano .env
```

### 3. Start the Service

```bash
# Start the service (uses dev image)
pnpm run compose:up

# Or with docker compose directly
docker compose up -d
```

## Docker Compose Setup

The Docker Compose configuration has been simplified to use a single service with the development image (multi-platform support). For production deployments, we recommend using Kubernetes.

## Container Management

### Starting the Service

```bash
# Start the container
pnpm run compose:up

# View logs
pnpm run compose:logs

# Restart the service
pnpm run compose:restart

# Stop the service
pnpm run compose:down
```

### Development docker-compose.yml

```yaml
services:
    dev:
        profiles:
            - dev
        build:
            context: .
            dockerfile: docker/Dockerfile.dev
        image: ghcr.io/cdot65/prisma-airs-mcp:dev-local
        container_name: prisma-airs-mcp-dev
        ports:
            - '3000:3000'
        volumes:
            - ./src:/app/src:ro
            - ./package.json:/app/package.json:ro
            - ./tsconfig.json:/app/tsconfig.json:ro
            - node_modules:/app/node_modules
        environment:
            - NODE_ENV=development
            - LOG_LEVEL=debug
        env_file:
            - .env
        restart: unless-stopped
```

### Building the Image

```bash
# Build the image locally
pnpm run compose:build

# Or pull the pre-built image
docker compose pull
```

### Production docker-compose.yml

```yaml
services:
    prod:
        profiles:
            - prod
        build:
            context: .
            dockerfile: docker/Dockerfile
            target: production
        image: ghcr.io/cdot65/prisma-airs-mcp:latest
        container_name: prisma-airs-mcp-prod
        ports:
            - '3000:3000'
        environment:
            - NODE_ENV=production
            - LOG_LEVEL=info
        env_file:
            - .env
        healthcheck:
            test:
                [
                    'CMD',
                    'node',
                    '-e',
                    "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });",
                ]
            interval: 30s
            timeout: 3s
            retries: 3
            start_period: 10s
        restart: unless-stopped
        deploy:
            resources:
                limits:
                    cpus: '1'
                    memory: 512M
                reservations:
                    cpus: '0.25'
                    memory: 128M
```

## Common Commands

### Service Management

```bash
# Start services
docker compose --profile dev up -d
docker compose --profile prod up -d

# Stop services
docker compose --profile dev down
docker compose --profile prod down

# Stop all services
docker compose down

# Restart services
docker compose --profile prod restart

# View status
docker compose ps
```

### Building Images

```bash
# Build development image
docker compose --profile dev build

# Build production image
docker compose --profile prod build

# Build without cache
docker compose --profile prod build --no-cache

# Build with specific arguments
docker compose --profile prod build --build-arg VERSION=1.3.5
```

### Logs and Monitoring

```bash
# View all logs
docker compose logs

# Follow logs for specific service
docker compose logs -f dev
docker compose logs -f prod

# View last 100 lines
docker compose logs --tail 100 prod

# View logs with timestamps
docker compose logs -t prod
```

### Debugging

```bash
# Execute commands in container
docker compose --profile dev exec dev sh
docker compose --profile prod exec prod sh

# Run one-off commands
docker compose --profile dev run --rm dev npm test
docker compose --profile prod run --rm prod env

# View container details
docker compose --profile prod ps -a
docker compose --profile prod top
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Required
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here

# Optional Profile Configuration
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS
# Or use profile ID
# AIRS_DEFAULT_PROFILE_ID=your-profile-id

# Server Configuration
PORT=3000
NODE_ENV=production

# Logging
LOG_LEVEL=info

# Performance
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Override Files

Create environment-specific overrides:

**docker-compose.dev.yml**:

```yaml
services:
    dev:
        environment:
            - LOG_LEVEL=debug
            - CACHE_TTL_SECONDS=60
        ports:
            - '3001:3000'
```

Use with:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev up
```

### Secrets Management

For production, use Docker secrets:

**docker-compose.prod.yml**:

```yaml
services:
    prod:
        secrets:
            - airs_api_key
            - airs_profile_name
        environment:
            - AIRS_API_KEY_FILE=/run/secrets/airs_api_key
            - AIRS_PROFILE_NAME_FILE=/run/secrets/airs_profile_name

secrets:
    airs_api_key:
        external: true
    airs_profile_name:
        external: true
```

## Advanced Configuration

### Custom Networks

```yaml
services:
    prod:
        networks:
            - prisma-network

networks:
    prisma-network:
        driver: bridge
        ipam:
            config:
                - subnet: 172.20.0.0/16
```

### Volume Management

```yaml
services:
    dev:
        volumes:
            - ./src:/app/src:ro
            - node_modules:/app/node_modules
            - logs:/app/logs

volumes:
    node_modules:
    logs:
        driver: local
```

### Health Check Customization

```yaml
services:
    prod:
        healthcheck:
            test:
                [
                    'CMD-SHELL',
                    'wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1',
                ]
            interval: 30s
            timeout: 3s
            retries: 3
            start_period: 10s
            disable: false
```

### Resource Limits

```yaml
services:
    prod:
        deploy:
            resources:
                limits:
                    cpus: '2'
                    memory: 1G
                reservations:
                    cpus: '0.5'
                    memory: 256M
```

## Scaling

### Manual Scaling

```bash
# Scale to 3 instances (requires removing container_name)
docker compose --profile prod up -d --scale prod=3

# View scaled instances
docker compose ps
```

### Load Balancing

Add a load balancer service:

```yaml
services:
    nginx:
        image: nginx:alpine
        ports:
            - '80:80'
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf:ro
        depends_on:
            - prod

    prod:
        # Remove ports mapping
        # Remove container_name for scaling
        deploy:
            replicas: 3
```

## Troubleshooting

### Profile Issues

```bash
# Verify profile configuration
docker compose config --profile dev
docker compose config --profile prod

# List available profiles
docker compose config --profiles
```

### Port Conflicts

```bash
# Check what's using port 3000
lsof -i :3000

# Use different port
# Edit docker-compose.yml or use override:
docker compose --profile prod up -d -p 3001:3000
```

### Build Failures

```bash
# Clean build cache
docker system prune -a

# Build with verbose output
docker compose --profile prod build --progress plain

# Force rebuild
docker compose --profile prod build --no-cache
```

### Container Won't Start

```bash
# Check logs
docker compose logs prod

# Check events
docker events --filter container=prisma-airs-mcp-prod

# Inspect container
docker compose --profile prod ps -a
```

### Memory Issues

```bash
# Check memory usage
docker stats prisma-airs-mcp-prod

# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
```

## Best Practices

1. **Environment Separation**

    - Never use dev profile in production
    - Keep separate .env files for each environment
    - Use override files for environment-specific settings

2. **Security**

    - Store secrets in Docker secrets or external vaults
    - Use read-only volumes where possible
    - Regularly update base images

3. **Performance**

    - Set appropriate resource limits
    - Use health checks for automatic recovery
    - Monitor container metrics

4. **Maintenance**
    - Tag images with versions
    - Keep compose files in version control
    - Document custom configurations

## Migration from Docker Run

Converting from `docker run` to Docker Compose:

**From:**

```bash
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  ghcr.io/cdot65/prisma-airs-mcp:latest
```

**To docker-compose.yml:**

```yaml
services:
    app:
        image: ghcr.io/cdot65/prisma-airs-mcp:latest
        container_name: prisma-airs-mcp
        ports:
            - '3000:3000'
        env_file:
            - .env
        restart: unless-stopped
```

## Next Steps

- Review [Docker Build Options]({{ site.baseurl }}/deployment/docker-build-options) for custom builds
- Explore [Kubernetes Deployment]({{ site.baseurl }}/deployment/kubernetes) for orchestration
- Check [Configuration Reference]({{ site.baseurl }}/deployment/configuration) for all options
- Set up [Claude Integration]({{ site.baseurl }}/mcp-clients/claude-desktop/)
