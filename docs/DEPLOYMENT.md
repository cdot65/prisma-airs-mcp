# Deployment Guide

This guide covers deploying the Prisma AIRS MCP Server using the pre-built container images from GitHub Container Registry.

## Container Images

Pre-built images are available at `ghcr.io/cdot65/prisma-airs-mcp`:

| Tag      | Platform       | Use Case                                      |
| -------- | -------------- | --------------------------------------------- |
| `latest` | linux/amd64    | Production deployment on Intel/AMD Kubernetes |
| `dev`    | linux/arm64    | Development on Apple Silicon Macs             |
| `vX.Y.Z` | Multi-platform | Specific version for production               |

## Quick Start

### Pull the Image

```bash
# For production (AMD64)
docker pull ghcr.io/cdot65/prisma-airs-mcp:latest

# For Apple Silicon development
docker pull ghcr.io/cdot65/prisma-airs-mcp:dev

# Specific version (multi-platform)
docker pull ghcr.io/cdot65/prisma-airs-mcp:v1.0.0
```

### Run with Docker

```bash
# Create environment file
cat > .env << EOF
AIRS_API_URL=https://api.prismaairs.example.com
AIRS_API_KEY=your-api-key-here
EOF

# Run production container (AMD64)
docker run -d \
  --name prisma-airs-mcp \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  ghcr.io/cdot65/prisma-airs-mcp:latest

# Run development container (ARM64/Apple Silicon)
docker run -d \
  --name prisma-airs-mcp-dev \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/cdot65/prisma-airs-mcp:dev
```

## Kubernetes Deployment

### Using kubectl

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prisma-airs-mcp
  labels:
    app: prisma-airs-mcp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: prisma-airs-mcp
  template:
    metadata:
      labels:
        app: prisma-airs-mcp
    spec:
      containers:
        - name: app
          image: ghcr.io/cdot65/prisma-airs-mcp:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: 'production'
            - name: AIRS_API_URL
              valueFrom:
                configMapKeyRef:
                  name: prisma-airs-config
                  key: api-url
            - name: AIRS_API_KEY
              valueFrom:
                secretKeyRef:
                  name: prisma-airs-secret
                  key: api-key
          resources:
            limits:
              cpu: 1000m
              memory: 512Mi
            requests:
              cpu: 250m
              memory: 128Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: prisma-airs-mcp
spec:
  selector:
    app: prisma-airs-mcp
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### Apply the deployment:

```bash
# Create ConfigMap
kubectl create configmap prisma-airs-config \
  --from-literal=api-url=https://api.prismaairs.example.com

# Create Secret
kubectl create secret generic prisma-airs-secret \
  --from-literal=api-key=your-api-key-here

# Deploy
kubectl apply -f deployment.yaml

# Check deployment
kubectl rollout status deployment/prisma-airs-mcp
kubectl get pods -l app=prisma-airs-mcp
```

## Docker Compose

For local development or testing:

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Use pre-built production image
  prod:
    image: ghcr.io/cdot65/prisma-airs-mcp:latest
    container_name: prisma-airs-mcp
    ports:
      - '3000:3000'
    env_file:
      - .env
    restart: unless-stopped
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

  # Use pre-built dev image (Apple Silicon)
  dev:
    image: ghcr.io/cdot65/prisma-airs-mcp:dev
    container_name: prisma-airs-mcp-dev
    ports:
      - '3000:3000'
    env_file:
      - .env
    volumes:
      # Optional: mount local config
      - ./config:/app/config:ro
```

## Environment Variables

Required environment variables:

```bash
# Prisma AIRS Configuration
AIRS_API_URL=https://api.prismaairs.example.com
AIRS_API_KEY=your-api-key-here

# Server Configuration (optional)
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Cache Configuration (optional)
CACHE_ENABLED=true
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000

# Rate Limiting (optional)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## Health Checks

The service provides health check endpoints:

- `/health` - Basic health check
- `/ready` - Readiness probe (checks AIRS connectivity)

## Monitoring

### View Logs

```bash
# Docker
docker logs -f prisma-airs-mcp

# Kubernetes
kubectl logs -f deployment/prisma-airs-mcp
```

### Metrics

The application logs structured JSON that can be collected by:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Prometheus + Grafana
- CloudWatch Logs
- Datadog

## Troubleshooting

### Container won't start

1. Check environment variables are set correctly
2. Verify AIRS API credentials
3. Check container logs for errors

### Connection issues

1. Verify network connectivity to AIRS API
2. Check firewall rules
3. Ensure correct PORT is exposed

### Platform mismatch warnings

If you see platform warnings when running on different architectures:

- Use `:latest` for AMD64/Intel systems
- Use `:dev` for ARM64/Apple Silicon
- Use versioned tags for multi-platform support

## Security Considerations

1. Always use secrets for API keys
2. Run containers as non-root user (already configured)
3. Use read-only root filesystem where possible
4. Implement network policies in Kubernetes
5. Regular image updates for security patches

## Support

For issues or questions:

- GitHub Issues: https://github.com/cdot65/prisma-airs-mcp/issues
- Documentation: https://github.com/cdot65/prisma-airs-mcp#readme
