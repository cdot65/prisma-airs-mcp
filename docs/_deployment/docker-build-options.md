---
layout: documentation
title: Docker Build Options
description: Platform-specific Docker builds and multi-architecture strategies for Prisma AIRS MCP
category: deployment
permalink: /deployment/docker-build-options/
---

## Overview

This guide explains the Docker build architecture for Prisma AIRS MCP, including platform-specific builds, multi-architecture support, and optimization strategies.

## Architecture Support

The project supports both ARM64 (Apple Silicon) and AMD64 (x86_64) architectures:

| Architecture | Platforms                            | Use Cases                               |
| ------------ | ------------------------------------ | --------------------------------------- |
| **AMD64**    | Intel/AMD CPUs, Most cloud providers | Production Kubernetes, CI/CD            |
| **ARM64**    | Apple M1/M2/M3, AWS Graviton         | Development on Mac, ARM cloud instances |

## Build Commands

### Quick Reference

```bash
# Development build (multi-platform)
pnpm run docker:build:dev      # Builds for linux/amd64,linux/arm64

# Production build (AMD64 only)
pnpm run docker:build:prod     # Builds for linux/amd64 only

# Run containers
pnpm run docker:run:dev        # Run dev image on port 3000
pnpm run docker:run:dev:3100   # Run dev image on port 3100
```

### Development Builds

#### Development Build

Multi-platform build supporting both ARM64 and AMD64:

```bash
# Build dev image
pnpm run docker:build:dev

# Equivalent to:
./scripts/docker-build.sh --platforms linux/amd64,linux/arm64 --tag dev
```

> **Note**: When building for multiple platforms with `--platforms linux/amd64,linux/arm64`, the image can only be loaded to local Docker if building for a single platform. For multi-platform images, use `--push` flag to push to registry.

### Production Builds

Production builds are AMD64-only for consistency:

```bash
# Build production image
pnpm run docker:build:prod

# Equivalent to:
./scripts/docker-build.sh --platforms linux/amd64 --tag latest
```

## Platform-Specific Considerations

### Apple Silicon (M1/M2/M3)

For developers on Apple Silicon Macs:

1. **Local Development**:

    ```bash
    # Build dev image (supports both platforms)
    pnpm run docker:build:dev
    
    # Run locally
    pnpm run docker:run:dev
    ```

2. **Testing AMD64 Compatibility**:

    ```bash
    # Build AMD64 image (will use emulation)
    pnpm run docker:build:amd64
    ```

3. **Using Pre-built Images**:
    ```bash
    # Dev tag supports both architectures
    docker pull ghcr.io/cdot65/prisma-airs-mcp:dev
    ```

### Intel/AMD Systems

For developers on x86_64 systems:

```bash
# All builds are native, no emulation needed
pnpm run docker:build:dev   # Multi-platform dev build
pnpm run docker:build:prod  # AMD64 production build
```

## Docker Buildx Setup

### Enable Buildx

Docker Buildx is required for multi-platform builds:

```bash
# Check if buildx is available
docker buildx version

# Create a new builder instance
docker buildx create --name multiarch-builder --use

# Inspect the builder
docker buildx inspect --bootstrap

# List available platforms
docker buildx ls
```

### Builder Management

```bash
# Use specific builder
docker buildx use multiarch-builder

# Remove builder
docker buildx rm multiarch-builder

# Reset to default
docker buildx use default
```

## Build Optimization

### Layer Caching

Optimize build times with proper layer ordering:

```dockerfile
# Good: Dependencies before source
COPY package*.json ./
RUN npm ci
COPY . .

# Bad: Source changes invalidate dependency cache
COPY . .
RUN npm ci
```

### Multi-Stage Builds

The project uses multi-stage builds for optimization:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
```

### Build Arguments

Pass build-time variables:

```bash
# Set version during build
docker build \
  --build-arg VERSION=1.3.5 \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  -t prisma-airs-mcp:1.3.5 .
```

## Image Tags and Registry

### Tag Strategy

| Tag      | Architecture   | Purpose             | Auto-update |
| -------- | -------------- | ------------------- | ----------- |
| `latest` | AMD64 only     | Production stable   | Yes         |
| `dev`    | Multi-platform | Development/testing | Yes         |
| `v1.3.5` | Multi-platform | Specific version    | No          |
| `local`  | Native         | Local development   | No          |

### Publishing Images

```bash
# Development (multi-platform)
pnpm run docker:push:dev

# Production (AMD64)
pnpm run docker:push:prod

# Versioned release
pnpm run docker:push:version
```

### Registry Authentication

```bash
# Login to GitHub Container Registry
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin

# Push image
docker push ghcr.io/cdot65/prisma-airs-mcp:latest
```

## Custom Dockerfiles

### Development Dockerfile

Located at `docker/Dockerfile.dev`:

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Install development dependencies
RUN apk add --no-cache python3 make g++

# Copy and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source (mounted in compose)
COPY . .

# Development command
CMD ["npm", "run", "dev"]
```

### Production Dockerfile

Located at `docker/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
# Build stage...

FROM node:18-alpine AS production
# Minimal runtime...
```

## Build Performance

### Benchmark Results

| Platform    | Build Type       | Time | Size  |
| ----------- | ---------------- | ---- | ----- |
| M1 Mac      | Native ARM64     | ~45s | 149MB |
| M1 Mac      | AMD64 (emulated) | ~3m  | 149MB |
| Intel Mac   | Native AMD64     | ~50s | 149MB |
| Linux AMD64 | Native           | ~40s | 149MB |

### Optimization Tips

1. **Use .dockerignore**:

    ```
    node_modules
    dist
    .git
    *.log
    .env
    ```

2. **Leverage Build Cache**:

    ```bash
    # Use cache from registry
    docker build --cache-from ghcr.io/cdot65/prisma-airs-mcp:latest .
    ```

3. **Parallel Builds**:
    ```bash
    # Build multiple platforms in parallel
    docker buildx build --platform linux/amd64,linux/arm64 .
    ```

## Troubleshooting

### Platform Mismatch

```bash
# WARNING: The requested image platform does not match
# Force pull specific platform
docker pull --platform linux/amd64 ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Buildx Issues

```bash
# Reset buildx
docker buildx rm multiarch-builder
docker buildx create --name multiarch-builder --use

# Clear build cache
docker buildx prune -a
```

### Slow Builds

```bash
# Check builder status
docker buildx inspect

# Use native platform for development
pnpm run docker:build:local
```

### Out of Space

```bash
# Clean up Docker system
docker system prune -a --volumes

# Remove specific builders
docker buildx ls
docker buildx rm <builder-name>
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v2

- name: Build and push
  uses: docker/build-push-action@v4
  with:
      context: .
      platforms: linux/amd64,linux/arm64
      push: true
      tags: |
          ghcr.io/cdot65/prisma-airs-mcp:latest
          ghcr.io/cdot65/prisma-airs-mcp:${{ github.sha }}
```

### GitLab CI

```yaml
docker-build:
    stage: build
    script:
        - docker buildx create --use
        - docker buildx build --platform linux/amd64,linux/arm64 --push -t $CI_REGISTRY_IMAGE:latest .
```

## Security Scanning

### Build-time Scanning

```bash
# Scan during build
docker build --secret id=snyk,src=$HOME/.snyk/token \
  --target scan -t prisma-airs-mcp:scan .

# Scan existing image
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Multi-stage Security

```dockerfile
# Security scanning stage
FROM node:18-alpine AS security
COPY package*.json ./
RUN npm audit --production

# Only continue if audit passes
FROM security AS builder
# ... rest of build
```

## Advanced Techniques

### Build Matrix

Build multiple variants:

```bash
#!/bin/bash
PLATFORMS=("linux/amd64" "linux/arm64")
VERSIONS=("18-alpine" "20-alpine")

for platform in "${PLATFORMS[@]}"; do
  for version in "${VERSIONS[@]}"; do
    docker buildx build \
      --platform $platform \
      --build-arg NODE_VERSION=$version \
      -t prisma-airs-mcp:node$version-$platform \
      .
  done
done
```

### Cache Mounting

```dockerfile
# Use cache mount for npm
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production
```

### Remote Builders

```bash
# Use remote Docker host
export DOCKER_HOST=tcp://remote-docker:2376
docker build .

# Or use buildx remote
docker buildx create \
  --name remote \
  --driver docker-container \
  --driver-opt network=host \
  --platform linux/amd64,linux/arm64 \
  ssh://user@remote-host
```

## Best Practices

1. **Development**

    - Use native platform builds for speed
    - Test on target platform before deployment
    - Keep dev and prod Dockerfiles separate

2. **Production**

    - Always specify exact base image tags
    - Minimize layer count and image size
    - Scan images for vulnerabilities
    - Use multi-stage builds

3. **Multi-platform**
    - Test on all target platforms
    - Use platform-specific optimizations carefully
    - Document platform requirements

## Next Steps

- [Docker Deployment]({{ site.baseurl }}/deployment/docker) - Single container setup
- [Docker Compose]({{ site.baseurl }}/deployment/docker-compose) - Multi-profile deployment
- [Kubernetes]({{ site.baseurl }}/deployment/kubernetes) - Production orchestration
- [Configuration Reference]({{ site.baseurl }}/deployment/configuration) - Environment variables
