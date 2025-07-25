# Kubernetes Deployment Configuration Guide

This guide covers all configuration items that need to be updated when deploying the Prisma AIRS MCP server to different Kubernetes environments.

## Table of Contents
- [Environment-Specific Configurations](#environment-specific-configurations)
- [Secrets and Sensitive Data](#secrets-and-sensitive-data)
- [ConfigMaps and Application Settings](#configmaps-and-application-settings)
- [Kubernetes Resources](#kubernetes-resources)
- [GitHub Container Registry](#github-container-registry)
- [Deployment Checklist](#deployment-checklist)

## Environment-Specific Configurations

### 1. Kubernetes Namespace

The namespace is configured in multiple locations:

**Files to update:**
- `k8s/base/kustomization.yaml`
  ```yaml
  namespace: prisma-airs  # Change this to your namespace
  ```

**Commands that use namespace:**
```bash
# Update namespace in deployment scripts
./k8s/scripts/deploy.sh deploy production  # Uses namespace from kustomization
kubectl create namespace your-namespace     # Create your namespace
```

### 2. Environment Variables

Environment-specific settings are configured in overlay directories:

**Files to update:**
- `k8s/overlays/development/kustomization.yaml`
- `k8s/overlays/staging/kustomization.yaml`
- `k8s/overlays/production/kustomization.yaml`

```yaml
configMapGenerator:
- name: prisma-airs-mcp-config
  behavior: merge
  literals:
  - airs.api.url=https://service.api.aisecurity.paloaltonetworks.com
  - cache.ttl.seconds=300
  - rate.limit.max.requests=100
  - airs.default.profile.name=Prisma AIRS  # Your default profile name
  # - airs.default.profile.id=profile-123   # Or use profile ID instead
```

### 3. Deployment Configurations

**Files to update:**
- `k8s/overlays/{environment}/deployment-patch.yaml`

```yaml
spec:
  replicas: 3  # Adjust based on environment
  template:
    spec:
      containers:
      - name: prisma-airs-mcp
        env:
        - name: NODE_ENV
          value: production  # development, staging, or production
        - name: LOG_LEVEL
          value: warn       # debug, info, warn, or error
        resources:
          requests:
            memory: "256Mi"  # Adjust based on needs
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "2000m"
```

## Secrets and Sensitive Data

### 1. Prisma AIRS API Key

The API key must be created as a Kubernetes secret:

**Option A: Using the management script (recommended)**
```bash
# Create secret with your API key
./k8s/scripts/manage-secrets.sh create prisma-airs 'your-actual-api-key-here'
```

**Option B: Manual creation**
```bash
kubectl create secret generic prisma-airs-mcp-secrets \
  --from-literal=airs.api.key='your-actual-api-key-here' \
  --namespace=your-namespace
```

**Option C: In production overlay (for GitOps)**
```yaml
# k8s/overlays/production/kustomization.yaml
secretGenerator:
- name: prisma-airs-mcp-secrets
  behavior: replace
  literals:
  - airs.api.key=your-actual-api-key-here  # Never commit real keys!
```

### 2. GitHub Container Registry Access

For private registries, create a pull secret:

**Create the secret:**
```bash
# Set your GitHub Personal Access Token
export CR_PAT='your-github-personal-access-token'

# Create the secret
./k8s/scripts/create-registry-secret.sh create
```

**Or manually:**
```bash
kubectl create secret docker-registry ghcr-login-secret \
  --docker-server=ghcr.io \
  --docker-username=your-github-username \
  --docker-password=your-github-pat \
  --docker-email=your-email@example.com \
  --namespace=your-namespace
```

## ConfigMaps and Application Settings

### 1. Core Application Configuration

**Base configuration** (`k8s/base/kustomization.yaml`):
```yaml
configMapGenerator:
- name: prisma-airs-mcp-config
  literals:
  - airs.api.url=https://service.api.aisecurity.paloaltonetworks.com
  - cache.enabled=true
  - cache.ttl.seconds=300
  - cache.max.size=1000
  - rate.limit.enabled=true
  - rate.limit.max.requests=100
  - rate.limit.window.ms=60000
```

### 2. Profile Configuration

Configure default AIRS profiles via ConfigMap:

```yaml
# In your overlay kustomization.yaml
configMapGenerator:
- name: prisma-airs-mcp-config
  behavior: merge
  literals:
  # Option 1: Use profile name (recommended)
  - airs.default.profile.name=Your Profile Name
  
  # Option 2: Use profile ID
  # - airs.default.profile.id=12345-67890-abcdef
```

### 3. Additional Environment Variables

**Optional configurations** (add to deployment patches):
```yaml
env:
# Cache settings
- name: CACHE_ENABLED
  value: "true"
- name: CACHE_TTL_SECONDS
  value: "300"
- name: CACHE_MAX_SIZE
  value: "1000"

# Rate limiting
- name: RATE_LIMIT_ENABLED
  value: "true"
- name: RATE_LIMIT_MAX_REQUESTS
  value: "100"
- name: RATE_LIMIT_WINDOW_MS
  value: "60000"

# MCP settings
- name: MCP_SERVER_NAME
  value: "prisma-airs-mcp"
- name: MCP_SERVER_VERSION
  value: "1.3.4"
- name: MCP_PROTOCOL_VERSION
  value: "2024-11-05"

# Server settings
- name: PORT
  value: "3000"
- name: NODE_ENV
  value: "production"
- name: LOG_LEVEL
  value: "info"
```

## Kubernetes Resources

### 1. Ingress Configuration

**For Traefik** (`k8s/base/ingressroute.yaml`):
```yaml
spec:
  routes:
  - match: Host(`your-domain.com`) && PathPrefix(`/your-path`)
    services:
    - name: prisma-airs-mcp
      port: 80
```

**For Nginx Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prisma-airs-mcp
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /your-path
        pathType: Prefix
        backend:
          service:
            name: prisma-airs-mcp
            port:
              number: 80
```

### 2. TLS/SSL Certificates

**Update certificate references**:
```yaml
# In your IngressRoute
tls:
  secretName: your-tls-certificate-secret
```

### 3. Service Configuration

The service is defined in `k8s/base/service.yaml` and typically doesn't need changes, but you can adjust:
```yaml
spec:
  type: ClusterIP  # Or LoadBalancer, NodePort
  ports:
  - name: http
    port: 80
    targetPort: http
    protocol: TCP
```

## GitHub Container Registry

### 1. Image References

**Update image location** in overlays:
```yaml
# k8s/overlays/production/kustomization.yaml
images:
- name: ghcr.io/cdot65/prisma-airs-mcp
  newTag: v1.3.4  # Your version tag
```

**For custom registry:**
```yaml
images:
- name: ghcr.io/cdot65/prisma-airs-mcp
  newName: your-registry.com/your-org/prisma-airs-mcp
  newTag: v1.3.4
```

### 2. Build and Push Configuration

**Update registry in scripts**:
```bash
# scripts/docker-publish.sh
REGISTRY="your-registry.com"  # Default: ghcr.io
USERNAME="your-username"       # Default: cdot65
IMAGE_NAME="prisma-airs-mcp"
```

## Deployment Checklist

### Pre-Deployment

- [ ] **Example Files**: Copy and configure example files for production
  ```bash
  cp k8s/overlays/production/kustomization.yaml.example k8s/overlays/production/kustomization.yaml
  # Edit to add your API key or use manage-secrets.sh instead
  ```
- [ ] **Namespace**: Create/verify namespace exists
- [ ] **API Key**: Create secret with correct Prisma AIRS API key
- [ ] **Registry Access**: Create pull secret if using private registry
- [ ] **Profile Config**: Set default profile name or ID in ConfigMap
- [ ] **Domain/Ingress**: Update ingress configuration for your domain
- [ ] **TLS Certificate**: Ensure certificate secret exists
- [ ] **Resource Limits**: Adjust CPU/memory based on cluster capacity

### Configuration Files to Review

1. **Base Resources**:
   - [ ] `k8s/base/kustomization.yaml` - namespace
   - [ ] `k8s/base/deployment.yaml` - if modifying base config
   - [ ] `k8s/base/ingressroute.yaml` - domain and path

2. **Environment Overlays**:
   - [ ] `k8s/overlays/{env}/kustomization.yaml` - ConfigMap values
   - [ ] `k8s/overlays/{env}/deployment-patch.yaml` - resources, replicas

3. **Scripts Configuration**:
   - [ ] `.env` - local environment variables
   - [ ] Update script variables if using custom registry

### Deployment Commands

```bash
# 1. Set environment variables
export CR_PAT='your-github-pat'
export GITHUB_TOKEN='your-github-token'

# 2. Create namespace
kubectl create namespace your-namespace

# 3. Create secrets
./k8s/scripts/manage-secrets.sh create your-namespace 'your-api-key'
./k8s/scripts/create-registry-secret.sh create

# 4. Deploy to your environment
./k8s/scripts/deploy.sh deploy production

# 5. Verify deployment
kubectl get pods -n your-namespace
kubectl get svc -n your-namespace
kubectl get ingressroute -n your-namespace

# 6. Check logs
kubectl logs -l app=prisma-airs-mcp -n your-namespace
```

### Post-Deployment Verification

```bash
# Health check
curl https://your-domain.com/your-path/health

# Test MCP endpoint
curl -X POST https://your-domain.com/your-path \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

## Environment-Specific Examples

### Development Environment
```yaml
# k8s/overlays/development/kustomization.yaml
configMapGenerator:
- name: prisma-airs-mcp-config
  behavior: merge
  literals:
  - airs.api.url=https://dev.aisecurity.example.com  # Dev API endpoint
  - cache.ttl.seconds=60
  - rate.limit.max.requests=200
  - airs.default.profile.name=Development Profile
```

### Production Environment
```yaml
# k8s/overlays/production/kustomization.yaml
configMapGenerator:
- name: prisma-airs-mcp-config
  behavior: merge
  literals:
  - airs.api.url=https://service.api.aisecurity.paloaltonetworks.com
  - cache.ttl.seconds=300
  - rate.limit.max.requests=100
  - airs.default.profile.name=Production Security Profile

secretGenerator:
- name: prisma-airs-mcp-secrets
  behavior: replace
  literals:
  - airs.api.key=${AIRS_API_KEY}  # Use env var substitution
```

## Security Best Practices

1. **Never commit real API keys** - Use sealed secrets or external secret management
2. **Use RBAC** - Limit service account permissions
3. **Network Policies** - Restrict pod-to-pod communication
4. **Pod Security** - Run as non-root user (already configured)
5. **Secret Rotation** - Plan for API key rotation

## Troubleshooting

### Common Issues

1. **API Key Issues**:
   ```bash
   # Check if secret exists
   kubectl get secret prisma-airs-mcp-secrets -n your-namespace
   
   # Verify pod has correct env var
   kubectl exec -it <pod-name> -n your-namespace -- printenv AIRS_API_KEY
   ```

2. **Profile Configuration**:
   ```bash
   # Check ConfigMap
   kubectl get configmap -n your-namespace
   kubectl describe configmap <configmap-name> -n your-namespace
   ```

3. **Registry Access**:
   ```bash
   # Check pull secret
   kubectl get secret ghcr-login-secret -n your-namespace
   
   # Check pod events for pull errors
   kubectl describe pod <pod-name> -n your-namespace
   ```

## Support

For deployment issues:
1. Check pod logs: `kubectl logs -f <pod-name> -n your-namespace`
2. Describe pod: `kubectl describe pod <pod-name> -n your-namespace`
3. Review events: `kubectl get events -n your-namespace --sort-by='.lastTimestamp'`