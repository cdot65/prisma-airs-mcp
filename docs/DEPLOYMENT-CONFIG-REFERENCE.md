# Deployment Configuration Quick Reference

This is a quick reference for all configuration points when deploying Prisma AIRS MCP server.

## 🔐 Secrets (Sensitive Data)

| Configuration | Location | Example | Required |
|--------------|----------|---------|----------|
| **API Key** | Kubernetes Secret | `your-prisma-airs-api-key-here` | ✅ Yes |
| **GitHub PAT** | Environment Variable | `ghp_xxxxxxxxxxxxxxxxxxxx` | ✅ Yes (for private registry) |

### Creating Secrets:
```bash
# API Key Secret
./k8s/scripts/manage-secrets.sh create <namespace> '<api-key>'

# Registry Secret (uses CR_PAT or GITHUB_TOKEN env var)
export CR_PAT='<your-github-pat>'
./k8s/scripts/create-registry-secret.sh create
```

## 🔧 ConfigMap Settings

| Configuration | Key | Default | Example |
|--------------|-----|---------|---------|
| **API URL** | `airs.api.url` | `https://service.api.aisecurity.paloaltonetworks.com` | Production URL |
| **Profile Name** | `airs.default.profile.name` | `Prisma AIRS` | `My Security Profile` |
| **Profile ID** | `airs.default.profile.id` | None | `12345-67890-abcdef` |
| **Cache TTL** | `cache.ttl.seconds` | `300` | `60` (dev), `300` (prod) |
| **Cache Size** | `cache.max.size` | `1000` | `500` - `2000` |
| **Rate Limit** | `rate.limit.max.requests` | `100` | `200` (dev), `100` (prod) |
| **Rate Window** | `rate.limit.window.ms` | `60000` | `60000` (1 minute) |

### ConfigMap Location:
```yaml
# k8s/overlays/{environment}/kustomization.yaml
configMapGenerator:
- name: prisma-airs-mcp-config
  behavior: merge
  literals:
  - airs.default.profile.name=Your Profile Name
  - cache.ttl.seconds=300
```

## 🏗️ Kubernetes Resources

| Resource | Configuration | Location | Example |
|----------|--------------|----------|---------|
| **Namespace** | Deployment namespace | `k8s/base/kustomization.yaml` | `prisma-airs` |
| **Replicas** | Pod count | `k8s/overlays/{env}/deployment-patch.yaml` | 1 (dev), 2 (staging), 3 (prod) |
| **CPU Request** | Minimum CPU | Deployment patch | `100m` (dev), `500m` (prod) |
| **CPU Limit** | Maximum CPU | Deployment patch | `500m` (dev), `2000m` (prod) |
| **Memory Request** | Minimum RAM | Deployment patch | `64Mi` (dev), `256Mi` (prod) |
| **Memory Limit** | Maximum RAM | Deployment patch | `256Mi` (dev), `1Gi` (prod) |
| **Log Level** | Logging verbosity | Deployment patch | `debug`, `info`, `warn`, `error` |

## 🌐 Ingress Configuration

| Configuration | Location | Example |
|--------------|----------|---------|
| **Domain** | IngressRoute | `airs.cdot.io` |
| **Path** | IngressRoute | `/prisma-airs` |
| **TLS Secret** | IngressRoute | `wildcard-cdot-io-tls` |
| **Strip Path** | Middleware | `true` (removes prefix) |

### Traefik Example:
```yaml
# k8s/base/ingressroute.yaml
routes:
- match: Host(`your-domain.com`) && PathPrefix(`/your-path`)
```

## 🐳 Container Registry

| Configuration | Location | Default |
|--------------|----------|---------|
| **Registry URL** | Scripts & Kustomization | `ghcr.io` |
| **Username** | Scripts | `cdot65` |
| **Image Name** | Scripts & Kustomization | `prisma-airs-mcp` |
| **Image Tag** | Overlay kustomization | `latest`, `v1.3.4` |

### Image Configuration:
```yaml
# k8s/overlays/production/kustomization.yaml
images:
- name: ghcr.io/cdot65/prisma-airs-mcp
  newTag: v1.3.4
```

## 📁 File Locations Summary

### Base Configuration
- `k8s/base/kustomization.yaml` - Namespace, base ConfigMap
- `k8s/base/deployment.yaml` - Core deployment spec
- `k8s/base/service.yaml` - Service configuration
- `k8s/base/ingressroute.yaml` - Ingress routing

### Environment Overlays
- `k8s/overlays/development/` - Dev-specific configs
- `k8s/overlays/staging/` - Staging configs
- `k8s/overlays/production/` - Production configs

### Scripts
- `k8s/scripts/deploy.sh` - Main deployment script
- `k8s/scripts/manage-secrets.sh` - API key management
- `k8s/scripts/create-registry-secret.sh` - Registry access
- `scripts/deploy-production.sh` - Full production deployment

## 🚀 Deployment Commands

```bash
# Quick deployment to different environments
pnpm run deploy:quick:dev      # Development
pnpm run deploy:quick:staging  # Staging
pnpm run deploy:prod           # Production (latest)
pnpm run deploy:prod:version   # Production with version

# Manual deployment
./k8s/scripts/deploy.sh deploy <environment>

# Rollback
pnpm run k8s:rollback
```

## ✅ Pre-Deployment Checklist

- [ ] Set `CR_PAT` or `GITHUB_TOKEN` environment variable
- [ ] Update API key in secrets
- [ ] Configure profile name/ID in ConfigMap
- [ ] Update namespace if different from `prisma-airs`
- [ ] Adjust resource limits for your cluster
- [ ] Update ingress domain and path
- [ ] Verify TLS certificate exists

## 🔍 Verification Commands

```bash
# Check deployment
kubectl get all -n <namespace>

# Verify secrets
kubectl get secrets -n <namespace>

# Check ConfigMaps
kubectl get configmap -n <namespace>

# View pod environment
kubectl exec -it <pod-name> -n <namespace> -- env | grep AIRS

# Check logs
kubectl logs -l app=prisma-airs-mcp -n <namespace>

# Test endpoint
curl https://<your-domain>/<your-path>/health
```

## 🛠️ Common Configuration Scenarios

### Scenario 1: Different API Endpoint
```yaml
# k8s/overlays/development/kustomization.yaml
literals:
- airs.api.url=https://dev-api.aisecurity.example.com
```

### Scenario 2: Custom Profile
```yaml
# k8s/overlays/production/kustomization.yaml
literals:
- airs.default.profile.id=prod-profile-12345
```

### Scenario 3: Increased Rate Limits
```yaml
# k8s/overlays/development/kustomization.yaml
literals:
- rate.limit.max.requests=500
- rate.limit.window.ms=60000
```

### Scenario 4: Custom Registry
```yaml
# k8s/overlays/production/kustomization.yaml
images:
- name: ghcr.io/cdot65/prisma-airs-mcp
  newName: my-registry.com/my-org/prisma-airs-mcp
  newTag: v1.3.4
```