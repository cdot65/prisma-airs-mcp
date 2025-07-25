# Kubernetes Deployment Guide

This guide covers deploying the Prisma AIRS MCP server to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (1.21+)
- kubectl configured to access your cluster
- Traefik ingress controller installed (for IngressRoute)
- Docker images built and available

## Directory Structure

```
k8s/
├── base/                    # Base Kubernetes manifests
│   ├── deployment.yaml     # Main deployment
│   ├── service.yaml        # ClusterIP service
│   ├── ingressroute.yaml   # Traefik IngressRoute
│   ├── kustomization.yaml  # Base kustomization
│   └── secret-template.yaml # Secret template (DO NOT COMMIT)
├── overlays/               # Environment-specific configurations
│   ├── development/        # Development environment
│   ├── staging/           # Staging environment
│   └── production/        # Production environment
└── scripts/               # Helper scripts
    ├── deploy.sh          # Deployment script
    └── manage-secrets.sh  # Secret management script
```

## Quick Start

### 1. Create Registry Secret (if using private registry)

```bash
export CR_PAT='your-github-personal-access-token'
./k8s/scripts/create-registry-secret.sh create
```

### 2. Create API Secret

Create the secret containing your Prisma AIRS API key:

```bash
# From .env file
./k8s/scripts/manage-secrets.sh create prisma-airs

# Or provide directly
./k8s/scripts/manage-secrets.sh create prisma-airs 'your-api-key-here'
```

### 3. Deploy to Environment

```bash
# Deploy to development
./k8s/scripts/deploy.sh deploy development

# Deploy to production
./k8s/scripts/deploy.sh deploy production
```

### 4. Verify Deployment

```bash
./k8s/scripts/deploy.sh status prisma-airs
```

### 5. Test Deployment

```bash
./k8s/scripts/deploy.sh test prisma-airs
```

## Deployment Environments

### Development

- **Namespace**: `prisma-airs`
- **Replicas**: 1
- **Image**: `ghcr.io/cdot65/prisma-airs-mcp:latest`
- **Resources**: Minimal (64Mi-256Mi memory, 100m-500m CPU)
- **Log Level**: debug
- **Name Prefix**: `dev-`

### Staging

- **Namespace**: `prisma-airs`
- **Replicas**: 2
- **Image**: `ghcr.io/cdot65/prisma-airs-mcp:latest`
- **Resources**: Standard (128Mi-512Mi memory, 250m-1000m CPU)
- **Log Level**: info
- **Name Prefix**: `staging-`

### Production

- **Namespace**: `prisma-airs`
- **Replicas**: 3
- **Image**: `ghcr.io/cdot65/prisma-airs-mcp:latest`
- **Resources**: High (256Mi-1Gi memory, 500m-2000m CPU)
- **Log Level**: warn
- **Features**: Pod anti-affinity, rate limiting

## Configuration

### Environment Variables

Configuration is managed through ConfigMaps and Secrets:

**ConfigMap** (`prisma-airs-mcp-config`):

- `airs.api.url` - Prisma AIRS API endpoint
- `cache.enabled` - Enable/disable caching
- `cache.ttl.seconds` - Cache TTL in seconds
- `cache.max.size` - Maximum cache entries
- `rate.limit.enabled` - Enable/disable rate limiting
- `rate.limit.max.requests` - Max requests per window
- `rate.limit.window.ms` - Rate limit window in milliseconds

**Secret** (`prisma-airs-mcp-secrets`):

- `airs.api.key` - Prisma AIRS API key

### Customizing Configuration

To override configuration for an environment, edit the corresponding overlay:

```yaml
# k8s/overlays/production/kustomization.yaml
configMapGenerator:
  - name: prisma-airs-mcp-config
    behavior: merge
    literals:
      - airs.api.url=https://api.prismaairs-prod.example.com
      - cache.ttl.seconds=600
```

## Deployment Commands

### Deploy with Custom Namespace

```bash
# Deploy staging to a custom namespace
./k8s/scripts/deploy.sh deploy staging my-staging-namespace
```

### Dry Run Deployment

```bash
# Preview what will be deployed without applying
./k8s/scripts/deploy.sh deploy production --dry-run
```

### Delete Deployment

```bash
# Remove all resources
./k8s/scripts/deploy.sh delete development
```

## Secret Management

### Create Secret

```bash
./k8s/scripts/manage-secrets.sh create <namespace> '<api-key>'
```

### Verify Secret

```bash
./k8s/scripts/manage-secrets.sh verify <namespace>
```

### Rotate Secret

```bash
# Rotate secret and restart pods
./k8s/scripts/manage-secrets.sh rotate <namespace> '<new-api-key>'
```

## Traefik IngressRoute

The service is exposed through Traefik with the following configuration:

- **Path**: `/prisma-airs`
- **Strip Prefix**: Yes (removes `/prisma-airs` before forwarding)
- **TLS**: Enabled on port 443 with existing cluster certificate
- **Headers**: Security headers added
- **Rate Limiting**: Enabled in production (100 req/min)

### Custom Domain (Production)

Edit `k8s/overlays/production/ingressroute-patch.yaml`:

```yaml
spec:
  routes:
    - match: Host(`your-domain.com`) && PathPrefix(`/airs`)
```

## Monitoring

### View Logs

```bash
# View logs from all pods
kubectl logs -l app=prisma-airs-mcp -n development --tail=100 -f

# View logs from specific pod
kubectl logs <pod-name> -n development
```

### Check Pod Status

```bash
# List all pods
kubectl get pods -l app=prisma-airs-mcp -n development

# Describe pod for details
kubectl describe pod <pod-name> -n development
```

### Execute Commands in Pod

```bash
# Open shell in pod
kubectl exec -it <pod-name> -n development -- sh

# Test internal endpoints
kubectl exec <pod-name> -n development -- wget -qO- http://localhost:3000/health
```

## Troubleshooting

### Pod Not Starting

1. Check pod events:

   ```bash
   kubectl describe pod <pod-name> -n <namespace>
   ```

2. Check logs:

   ```bash
   kubectl logs <pod-name> -n <namespace> --previous
   ```

3. Verify secret exists:
   ```bash
   ./k8s/scripts/manage-secrets.sh verify <namespace>
   ```

### Service Not Accessible

1. Check service endpoints:

   ```bash
   kubectl get endpoints prisma-airs-mcp -n <namespace>
   ```

2. Test service internally:

   ```bash
   kubectl run test-pod --image=busybox -it --rm -- wget -qO- http://prisma-airs-mcp/health
   ```

3. Check IngressRoute:
   ```bash
   kubectl get ingressroute prisma-airs-mcp -n <namespace> -o yaml
   ```

### Configuration Issues

1. View current ConfigMap:

   ```bash
   kubectl get configmap -l app=prisma-airs-mcp -n <namespace> -o yaml
   ```

2. Check environment variables in pod:
   ```bash
   kubectl exec <pod-name> -n <namespace> -- env | grep AIRS
   ```

## Security Considerations

1. **Secrets**: Never commit actual API keys. Use the secret management script.
2. **Network Policies**: Consider implementing network policies to restrict traffic.
3. **RBAC**: Ensure proper RBAC rules for service accounts.
4. **Security Context**: Pods run as non-root user (1001) with read-only root filesystem.
5. **Resource Limits**: All containers have resource limits to prevent resource exhaustion.

## Scaling

### Manual Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment prisma-airs-mcp -n production --replicas=5
```

### Horizontal Pod Autoscaler

Create an HPA for automatic scaling:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: prisma-airs-mcp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: prisma-airs-mcp
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Best Practices

1. **Always use dry-run** first when deploying to production
2. **Monitor logs** during and after deployment
3. **Test endpoints** after deployment using the test script
4. **Rotate secrets** regularly using the secret management script
5. **Keep overlays minimal** - only override what's necessary
6. **Document changes** in overlay files with comments

## Advanced Topics

### Custom Kustomization

To add custom resources or patches:

1. Create new files in the overlay directory
2. Add them to the overlay's `kustomization.yaml`
3. Test with: `kustomize build k8s/overlays/<environment>`

### Multi-Region Deployment

For multi-region deployments:

1. Create region-specific overlays (e.g., `production-us-east`, `production-eu-west`)
2. Override necessary configurations (endpoints, replicas, etc.)
3. Deploy to different namespaces or clusters

### Backup and Restore

To backup configuration:

```bash
# Export all resources
kubectl get all,configmap,secret,ingressroute -l app=prisma-airs-mcp -n production -o yaml > backup.yaml
```

## Support

For issues or questions:

1. Check pod logs and events
2. Review this documentation
3. Consult the main README.md
4. Check Kubernetes and Traefik documentation
