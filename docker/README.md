# Docker Configuration for Prisma AIRS MCP Server

This directory contains Docker configurations for building and running the Prisma AIRS MCP Server.

**🚀 Production Image Available**: The server is deployed and running at https://airs.cdot.io/prisma-airs

## Container Registry

Images are published to GitHub Container Registry:

- **Registry**: `ghcr.io/cdot65/prisma-airs-mcp`
- **Latest tag**: AMD64 image for production Kubernetes (used in live deployment)
- **Dev tag**: ARM64 image for Apple Silicon development
- **Version tags**: Multi-platform images (both AMD64 and ARM64)

## Files

- **Dockerfile** - Multi-stage production build
- **Dockerfile.dev** - Development build with hot reloading
- **docker-compose.yml** - Docker Compose configuration for local development

## Quick Start

### Build the Image

```bash
# Build production image (native platform)
pnpm run docker:build

# Build development image
pnpm run docker:build:dev

# Build for Kubernetes deployment (multi-platform)
pnpm run docker:build:k8s

# Build for AMD64 only (for Intel/AMD K8s clusters)
pnpm run docker:build:amd64

# Build with custom tag
./scripts/docker-build.sh --tag v1.0.0

# Build for multiple platforms
./scripts/docker-build.sh --multi-platform
```

### Run the Container

```bash
# Run with default settings
pnpm run docker:run

# Run on different port
./scripts/docker-run.sh --port 8080

# Run with custom env file
./scripts/docker-run.sh --env-file .env.prod

# Run in foreground
./scripts/docker-run.sh --foreground
```

### Docker Compose

```bash
# Start development environment
docker-compose up dev

# Start production environment
docker-compose up prod

# Run in background
pnpm run docker:compose:up

# View logs
pnpm run docker:compose:logs

# Stop services
pnpm run docker:compose:down
```

## Production Dockerfile Features

The production Dockerfile uses a multi-stage build for optimization:

1. **Dependencies Stage** - Installs production dependencies only
2. **Build Stage** - Compiles TypeScript code
3. **Production Stage** - Minimal runtime image

### Optimizations

- Alpine Linux base for minimal size
- Non-root user for security
- dumb-init for proper signal handling
- Health check configured
- Only production dependencies included
- Compiled JavaScript only (no source code)

### Security

- Runs as non-root user (nodejs:1001)
- No development dependencies
- No source code in final image
- Minimal attack surface

## Development Dockerfile

The development Dockerfile includes:

- All dependencies (including dev)
- Source code mounting via volumes
- Nodemon for hot reloading
- Git and bash for debugging

## Environment Variables

Required environment variables:

```env
# Prisma AIRS Configuration
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here

# Server Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

Optional environment variables:

```env
# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# MCP Configuration
MCP_SERVER_NAME=prisma-airs-mcp
MCP_SERVER_VERSION=1.0.0
MCP_PROTOCOL_VERSION=2024-11-05
```

## Health Checks

The container includes a health check that:

- Runs every 30 seconds
- Times out after 3 seconds
- Retries 3 times before marking unhealthy
- Waits 5 seconds before first check

Access the health endpoint:

```bash
curl http://localhost:3000/health
```

## Resource Limits

Docker Compose sets default resource limits:

- CPU: 1 core (limit), 0.25 cores (reservation)
- Memory: 512MB (limit), 128MB (reservation)

Adjust these in docker-compose.yml based on your requirements.

## Troubleshooting

### Container won't start

1. Check logs: `docker logs prisma-airs-mcp`
2. Verify environment variables are set
3. Ensure port 3000 is available

### Build fails

1. Ensure Docker daemon is running
2. Check available disk space
3. Verify network connectivity for package downloads

### Health check failing

1. Check if server is actually running: `docker exec prisma-airs-mcp ps`
2. Verify PORT environment variable matches exposed port
3. Check application logs for errors

## Multi-Platform Builds

The project supports building images for multiple architectures, which is essential when:

- Developing on Apple Silicon (ARM64) but deploying to Intel/AMD (x86_64) Kubernetes clusters
- Supporting diverse infrastructure with both ARM and x86 nodes

### Platform Notes

- **Development on Apple Silicon**: Native ARM64 builds will be faster
- **Production on x86_64**: Use multi-platform builds or specify `--platforms linux/amd64`
- **Multi-platform images**: Cannot be loaded locally, must be pushed to a registry
- **Single platform images**: Can be loaded locally with `--load`

### Image Sizes

- ARM64 production image: ~149MB
- AMD64 production image: ~150MB (currently deployed to production)
- Development image: ~308MB

## Best Practices

1. Always use specific tags for production deployments
2. Keep .env file secure and never commit it
3. Regularly update base images for security patches
4. Monitor container logs in production
5. Use Docker Compose for local development only
6. Build multi-platform images for production deployments
7. Test images on target architecture before deploying
