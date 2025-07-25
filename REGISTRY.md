# Container Registry Quick Reference

## GitHub Container Registry

All images are published to: `ghcr.io/cdot65/prisma-airs-mcp`

### Image Tags

| Tag      | Platform       | Description                    | Use Case                      |
| -------- | -------------- | ------------------------------ | ----------------------------- |
| `latest` | linux/amd64    | Production image for Intel/AMD | Kubernetes clusters on x86_64 |
| `dev`    | linux/arm64    | Development image for ARM      | Apple Silicon Macs (M1/M2/M3) |
| `vX.Y.Z` | Multi-platform | Versioned release              | Production deployments        |

### Publishing Images

```bash
# Publish latest (AMD64) and dev (ARM64) tags
pnpm run docker:publish

# Publish with version tag (creates multi-platform image)
pnpm run docker:publish:version v1.0.0

# Manual publish with all options
./scripts/docker-publish.sh --version v1.0.0
```

### Using Images

```bash
# Production deployment (AMD64)
docker pull ghcr.io/cdot65/prisma-airs-mcp:latest
docker run -p 3000:3000 --env-file .env ghcr.io/cdot65/prisma-airs-mcp:latest

# Development on Apple Silicon
docker pull ghcr.io/cdot65/prisma-airs-mcp:dev
docker run -p 3000:3000 --env-file .env ghcr.io/cdot65/prisma-airs-mcp:dev

# Kubernetes deployment
kubectl set image deployment/prisma-airs-mcp app=ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Authentication

To push images, you need to authenticate with GitHub Container Registry:

```bash
# Using GitHub token (recommended)
export GITHUB_TOKEN=your-github-token
echo $GITHUB_TOKEN | docker login ghcr.io -u cdot65 --password-stdin

# Interactive login
docker login ghcr.io -u cdot65
```

Required token permissions:

- `read:packages` - Pull images
- `write:packages` - Push images
- `delete:packages` - Delete images (optional)

### GitHub Actions

Images are automatically built and published on:

- Push to `main` branch → Updates `latest` and `dev` tags
- Tag push `v*` → Creates versioned multi-platform image
- Pull requests → Builds but doesn't push (for testing)

### Local Development

For local development on different platforms:

```bash
# Apple Silicon Mac (ARM64)
docker run -v $(pwd)/src:/app/src:ro -p 3000:3000 ghcr.io/cdot65/prisma-airs-mcp:dev

# Intel/AMD machine (x86_64)
docker run -v $(pwd)/src:/app/src:ro -p 3000:3000 ghcr.io/cdot65/prisma-airs-mcp:latest
```

### Repository Links

- GitHub Repository: https://github.com/cdot65/prisma-airs-mcp
- Container Registry: https://github.com/cdot65/prisma-airs-mcp/pkgs/container/prisma-airs-mcp
- Issues: https://github.com/cdot65/prisma-airs-mcp/issues
