# Kubernetes Deployment Quick Start

This guide provides quick deployment instructions for the Prisma AIRS MCP server.

## Prerequisites

- Kubernetes cluster with Traefik ingress controller
- kubectl configured
- Access to ghcr.io/cdot65/prisma-airs-mcp-server-mcp:latest image
- Prisma AIRS API key

## Quick Deployment Steps

### 1. Create Namespace

The namespace will be created automatically, but you can create it manually:

```bash
kubectl create namespace prisma-airs-mcp-server-mcp-server
```

### 2. Create Registry Secret

If your GitHub Container Registry is private, create the pull secret:

```bash
# Using environment variable
export CR_PAT='your-github-personal-access-token'
./k8s/scripts/create-registry-secret.sh create

# Or verify it was created
./k8s/scripts/create-registry-secret.sh verify
```

### 3. Create API Secret

Create the Prisma AIRS API secret from your .env file:

```bash
# Reads AIRS_API_KEY from .env file
./k8s/scripts/manage-secrets.sh create prisma-airs-mcp-server

# Or provide directly
./k8s/scripts/manage-secrets.sh create prisma-airs-mcp-server 'your-api-key'
```

### 4. Deploy Application

**For Production (First Time)**: Copy and configure the example file:

```bash
# Copy the production kustomization example
cp overlays/production/kustomization.yaml.example overlays/production/kustomization.yaml

# Edit to add your API key (or use manage-secrets.sh instead for better security)
```

Deploy to your chosen environment:

```bash
# Deploy to development
./k8s/scripts/deploy.sh deploy development

# Deploy to staging
./k8s/scripts/deploy.sh deploy staging

# Deploy to production
./k8s/scripts/deploy.sh deploy production

# Dry run first
./k8s/scripts/deploy.sh deploy production --dry-run
```

### 5. Verify Deployment

Check the deployment status:

```bash
# Check status
./k8s/scripts/deploy.sh status prisma-airs-mcp-server

# Test endpoints
./k8s/scripts/deploy.sh test prisma-airs-mcp-server
```

## Configuration Details

### Namespace

- All resources deploy to `prisma-airs-mcp-server` namespace by default

### API Endpoint

- Base URL: `https://service.api.aisecurity.paloaltonetworks.com`

### Container Image

- Image: `ghcr.io/cdot65/prisma-airs-mcp-server-mcp:latest`
- Port: 3000

### Ingress Route

- Path: `/prisma-airs-mcp-server`
- TLS: Enabled on port 443
- The path is stripped before forwarding to the container

### Environment Differences

| Environment | Replicas | CPU Request | Memory Request | Log Level |
| ----------- | -------- | ----------- | -------------- | --------- |
| development | 1        | 100m        | 64Mi           | debug     |
| staging     | 2        | 250m        | 128Mi          | info      |
| production  | 3        | 500m        | 256Mi          | warn      |

## Accessing the Service

Once deployed, the service will be available at:

```
https://your-domain.com/prisma-airs-mcp-server
```

The `/prisma-airs-mcp-server` prefix will be stripped, so the application receives requests at its root path.

## Common Commands

```bash
# View logs
kubectl logs -l app=prisma-airs-mcp-server-mcp -n prisma-airs-mcp-server -f

# Scale deployment
kubectl scale deployment prisma-airs-mcp-server-mcp -n prisma-airs-mcp-server --replicas=5

# Restart pods
kubectl rollout restart deployment -l app=prisma-airs-mcp-server-mcp -n prisma-airs-mcp-server

# Delete deployment
./k8s/scripts/deploy.sh delete production
```

## Troubleshooting

### Image Pull Errors

If you see `ImagePullBackOff`:

1. Check registry secret exists:

    ```bash
    kubectl get secret ghcr-login-secret -n prisma-airs-mcp-server
    ```

2. Recreate if needed:
    ```bash
    export CR_PAT='your-pat'
    ./k8s/scripts/create-registry-secret.sh create
    ```

### API Key Issues

1. Verify secret exists:

    ```bash
    ./k8s/scripts/manage-secrets.sh verify prisma-airs-mcp-server
    ```

2. Check pod environment:
    ```bash
    kubectl exec -it <pod-name> -n prisma-airs-mcp-server -- env | grep AIRS
    ```

### Ingress Issues

1. Check IngressRoute:

    ```bash
    kubectl get ingressroute -n prisma-airs-mcp-server
    ```

2. Test internal service:
    ```bash
    kubectl run test --image=busybox -it --rm -n prisma-airs-mcp-server -- wget -qO- http://prisma-airs-mcp-server-mcp/health
    ```

## Security Notes

- Never commit real API keys
- Use the provided scripts to manage secrets
- The container runs as non-root user (1001)
- All capabilities are dropped for security
