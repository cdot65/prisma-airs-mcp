#!/bin/bash

# Deployment script for SSE-enabled version 1.3.0

set -e

echo "🚀 Deploying Prisma AIRS MCP v1.3.0 with SSE support"
echo ""

# Check if logged in to registry
if ! docker pull ghcr.io/cdot65/prisma-airs-mcp:latest 2>/dev/null; then
    echo "⚠️  Unable to pull latest image. Please ensure:"
    echo "   1. You've pushed the v1.3.0 image to ghcr.io"
    echo "   2. The Kubernetes cluster has access to pull from ghcr.io"
    echo ""
    echo "To push the image:"
    echo "   export CR_PAT='your-github-token'"
    echo "   echo \$CR_PAT | docker login ghcr.io -u cdot65 --password-stdin"
    echo "   ./scripts/docker-build-k8s.sh --tag v1.3.0 --push"
    echo ""
    read -p "Continue with deployment anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📋 Current deployment status:"
kubectl get pods -n prisma-airs -l app=prisma-airs-mcp

echo ""
echo "🔄 Rolling out new version..."
./k8s/scripts/deploy.sh deploy production

echo ""
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/prisma-airs-mcp -n prisma-airs

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 New pod status:"
kubectl get pods -n prisma-airs -l app=prisma-airs-mcp

echo ""
echo "🧪 Test SSE functionality:"
echo "curl -H 'Accept: text/event-stream' https://airs.cdot.io/prisma-airs"
echo ""
echo "📝 Version info:"
echo "curl https://airs.cdot.io/prisma-airs/health"