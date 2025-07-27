#!/bin/bash
# Quick deployment script for development/testing
# This script builds and deploys without version updates

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Get environment from command line (default to development)
ENVIRONMENT="${1:-development}"
NAMESPACE="${2:-prisma-airs}"

print_color $CYAN "=== Quick Deployment to ${ENVIRONMENT} ==="
echo ""

# Step 1: Validate code
print_color $BLUE "Step 1/4: Validating code..."
pnpm run local:lint:fix
pnpm run local:format
pnpm run local:typecheck
pnpm run local:build
print_color $GREEN "✅ Validation complete"
echo ""

# Step 2: Build Docker image
print_color $BLUE "Step 2/4: Building Docker image..."
./scripts/docker-build.sh
print_color $GREEN "✅ Docker image built"
echo ""

# Step 3: Deploy to Kubernetes
print_color $BLUE "Step 3/4: Deploying to ${ENVIRONMENT}..."
./k8s/scripts/deploy.sh deploy ${ENVIRONMENT}
print_color $GREEN "✅ Deployment updated"
echo ""

# Step 4: Monitor rollout
print_color $BLUE "Step 4/4: Monitoring rollout..."
kubectl rollout status deployment/prisma-airs-mcp -n ${NAMESPACE} || \
    kubectl rollout status deployment/dev-prisma-airs-mcp -n ${NAMESPACE} || \
    kubectl rollout status deployment/staging-prisma-airs-mcp -n ${NAMESPACE}
print_color $GREEN "✅ Rollout complete"
echo ""

# Show pod status
print_color $YELLOW "Current pods:"
kubectl get pods -n ${NAMESPACE} -l app=prisma-airs-mcp
echo ""

print_color $GREEN "=== Quick deployment complete! ==="