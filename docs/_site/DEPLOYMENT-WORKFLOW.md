# Deployment Workflow Guide

This guide explains the complete deployment workflow for the Prisma AIRS MCP server.

## Quick Start

### Deploy Latest Changes (Development)

```bash
# Quick deploy to development without version update
pnpm run deploy:quick:dev
```

### Deploy to Production with Version

```bash
# Full production deployment with new version
pnpm run deploy:prod:version 1.3.3
```

## Available Deployment Commands

### Validation & Building

- `pnpm run deploy:validate` - Run all code quality checks
- `pnpm run deploy:build` - Validate and build Docker image
- `pnpm run deploy:publish` - Build and push to registry

### Quick Deployment (No Version Update)

- `pnpm run deploy:quick` - Deploy to development
- `pnpm run deploy:quick:dev` - Deploy to development
- `pnpm run deploy:quick:staging` - Deploy to staging

### Production Deployment

- `pnpm run deploy:prod` - Full production deployment (latest tag)
- `pnpm run deploy:prod:version` - Production deployment with version

### Kubernetes Operations

- `pnpm run k8s:status` - Check deployment status
- `pnpm run k8s:rollout:status` - Monitor current rollout
- `pnpm run k8s:rollout:restart` - Restart pods
- `pnpm run k8s:rollback` - Rollback to previous version

## Deployment Workflows

### 1. Development Deployment (Quick)

For testing changes in development environment:

```bash
# Make your code changes
git add .
git commit -m "Fix: AIRS profile configuration"

# Deploy to development
pnpm run deploy:quick:dev

# Check status
pnpm run k8s:status
```

### 2. Staging Deployment

For testing before production:

```bash
# Deploy to staging
pnpm run deploy:quick:staging

# Monitor deployment
pnpm run k8s:rollout:status
```

### 3. Production Deployment (Versioned)

For official releases:

```bash
# Update version and deploy
pnpm run deploy:prod:version 1.3.3

# This will:
# 1. Update package.json version
# 2. Run all validations
# 3. Build Docker image
# 4. Push to registry with version tag
# 5. Update Kubernetes deployment
# 6. Monitor rollout
# 7. Verify health check

# After successful deployment:
git add .
git commit -m "chore: Deploy v1.3.3"
git tag v1.3.3
git push origin main --tags
```

### 4. Hotfix Deployment

For urgent fixes:

```bash
# Make fix
git add .
git commit -m "hotfix: Critical bug fix"

# Deploy without version update
pnpm run deploy:prod

# Or with patch version
pnpm run deploy:prod:version 1.3.4
```

### 5. Rollback Procedure

If deployment fails:

```bash
# View rollout history
pnpm run k8s:rollback

# Rollback to previous version
pnpm run k8s:rollback

# Or rollback to specific revision
pnpm run k8s:rollback 5
```

## Deployment Checklist

### Before Deployment

- [ ] Code changes tested locally
- [ ] All tests passing
- [ ] Version updated in `version.json`
- [ ] Environment variables documented
- [ ] ConfigMap changes applied (if needed)

### During Deployment

- [ ] Validation passes
- [ ] Docker build succeeds
- [ ] Image pushed to registry
- [ ] Kubernetes deployment updated
- [ ] Rollout completes successfully
- [ ] Health check passes

### After Deployment

- [ ] Verify application at https://airs.cdot.io/prisma-airs/health
- [ ] Check logs for errors
- [ ] Test MCP functionality
- [ ] Commit version changes
- [ ] Tag release in Git
- [ ] Update release notes

## Environment-Specific Notes

### Development

- Namespace: `prisma-airs`
- Replicas: 1
- Image: Local builds allowed
- Rate limiting: Relaxed

### Staging

- Namespace: `prisma-airs`
- Replicas: 2
- Image: Must be from registry
- Rate limiting: Moderate

### Production

- Namespace: `prisma-airs`
- Replicas: 3
- Image: Versioned from registry
- Rate limiting: Enforced
- TLS: Required

## Troubleshooting

### Build Failures

```bash
# Clean and rebuild
pnpm run clean
pnpm run build

# Check Docker daemon
docker info
```

### Push Failures

```bash
# Login to registry
echo $GITHUB_TOKEN | docker login ghcr.io -u cdot65 --password-stdin

# Retry push
pnpm run docker:publish
```

### Deployment Failures

```bash
# Check pod status
kubectl get pods -n prisma-airs

# View logs
kubectl logs -l app=prisma-airs-mcp -n prisma-airs

# Describe deployment
kubectl describe deployment prisma-airs-mcp -n prisma-airs
```

### Rollback if Needed

```bash
# Quick rollback to previous
pnpm run k8s:rollback

# Check status after rollback
pnpm run k8s:status
```

## Security Considerations

1. **API Keys**: Never commit API keys. Use Kubernetes secrets
2. **Image Scanning**: Images are scanned in GitHub registry
3. **Network Policies**: Applied in production namespace
4. **RBAC**: Limited permissions for deployment service account

## Monitoring

After deployment, monitor:

- Health endpoint: https://airs.cdot.io/prisma-airs/health
- Logs: `kubectl logs -f -l app=prisma-airs-mcp -n prisma-airs`
- Metrics: Check Kubernetes dashboard
- Alerts: Set up for production failures

## Best Practices

1. **Always validate** before deployment
2. **Use versioned deployments** for production
3. **Monitor rollout** completion
4. **Test after deployment**
5. **Keep rollback plan** ready
6. **Document changes** in commit messages
7. **Tag releases** in Git
