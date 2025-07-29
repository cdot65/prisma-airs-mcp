#!/bin/bash
# deploy-production.sh - Complete production deployment with version management
# This script handles the full production deployment cycle including:
# - Building versioned container images
# - Pushing to GitHub Container Registry
# - Updating Kubernetes deployment with new version

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="ghcr.io"
USERNAME="cdot65"
IMAGE_NAME="prisma-airs-mcp"
FULL_IMAGE_BASE="${REGISTRY}/${USERNAME}/${IMAGE_NAME}"
NAMESPACE="prisma-airs-mcp-server"

# Get version from version.json
VERSION=$(jq -r '.version' version.json)
if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not read version from version.json${NC}"
    exit 1
fi

echo -e "${BLUE}=== Production Deployment v${VERSION} ===${NC}"
echo ""

# Step 1: Validate the codebase
echo -e "${YELLOW}Step 1: Validating codebase...${NC}"
pnpm run local:lint:fix
pnpm run local:format
pnpm run local:typecheck
pnpm run local:build
echo -e "${GREEN}✓ Validation complete${NC}"
echo ""

# Step 2: Build production images
echo -e "${YELLOW}Step 2: Building production images...${NC}"
echo "Building AMD64 image for Kubernetes production..."
# Add a unique build arg to bust cache
BUILD_ID=$(date +%s)
docker buildx build \
    --platform linux/amd64 \
    --tag "${FULL_IMAGE_BASE}:latest" \
    --tag "${FULL_IMAGE_BASE}:v${VERSION}" \
    --build-arg VERSION="${VERSION}" \
    --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --build-arg BUILD_ID="${BUILD_ID}" \
    --no-cache \
    --load \
    -f docker/Dockerfile \
    --target production \
    .
echo -e "${GREEN}✓ AMD64 production image built${NC}"
echo ""

# Step 3: Push images to registry
echo -e "${YELLOW}Step 3: Pushing images to GitHub Container Registry...${NC}"

# Login to GitHub Container Registry if needed
if ! docker pull ${FULL_IMAGE_BASE}:latest >/dev/null 2>&1; then
    echo "Logging in to GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$USERNAME" --password-stdin
fi

# Push AMD64 as latest
echo "Pushing AMD64 image as :latest..."
docker push "${FULL_IMAGE_BASE}:latest"

# Push versioned image
echo "Pushing versioned image as :v${VERSION}..."
docker tag "${FULL_IMAGE_BASE}:latest" "${FULL_IMAGE_BASE}:v${VERSION}"
docker push "${FULL_IMAGE_BASE}:v${VERSION}"

# Build and push multi-platform dev image
echo "Building multi-platform dev image..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "${FULL_IMAGE_BASE}:dev" \
    --build-arg VERSION="${VERSION}" \
    --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --build-arg BUILD_ID="${BUILD_ID}" \
    --push \
    -f docker/Dockerfile \
    --target production \
    .

echo -e "${GREEN}✓ All images pushed successfully${NC}"
echo ""

# Step 4: Update Kubernetes deployment
echo -e "${YELLOW}Step 4: Updating Kubernetes deployment...${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl not found. Please install kubectl to continue.${NC}"
    exit 1
fi

# Update the kustomization.yaml with the new version
KUSTOMIZATION_FILE="k8s/overlays/production/kustomization.yaml"
if [ -f "$KUSTOMIZATION_FILE" ]; then
    echo "Updating kustomization.yaml with new version tag..."
    # Use 'latest' tag for production instead of version-specific tag
    sed -i.bak "s/newTag:.*/newTag: latest/" "$KUSTOMIZATION_FILE"
    rm -f "${KUSTOMIZATION_FILE}.bak"
fi

# Apply the Kubernetes configuration
echo "Applying Kubernetes configuration..."
kubectl apply -k k8s/overlays/production -n "$NAMESPACE"

# Force rollout restart to ensure fresh image pull
echo "Forcing rollout restart to pull fresh images..."
kubectl rollout restart deployment/prisma-airs-mcp -n "$NAMESPACE"

# Wait for rollout to complete
echo "Waiting for deployment rollout..."
kubectl rollout status deployment/prisma-airs-mcp -n "$NAMESPACE"

echo -e "${GREEN}✓ Kubernetes deployment updated${NC}"
echo ""

# Step 5: Verify deployment
echo -e "${YELLOW}Step 5: Verifying deployment...${NC}"
kubectl get pods -n "$NAMESPACE" -l app=prisma-airs-mcp
echo ""

# Show the deployed image
echo "Deployed image versions:"
kubectl get deployment prisma-airs-mcp -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' && echo
echo ""

# Step 6: Run deployment verification
echo -e "${YELLOW}Step 6: Running deployment verification...${NC}"
if ./scripts/verify-deployment.sh "$NAMESPACE"; then
    echo -e "${GREEN}✓ Deployment verification passed${NC}"
else
    echo -e "${RED}✗ Deployment verification failed${NC}"
    echo -e "${YELLOW}Please check the errors above and resolve them${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Summary:"
echo "  - Version: v${VERSION}"
echo "  - Namespace: ${NAMESPACE}"
echo "  - Images pushed:"
echo "    - ${FULL_IMAGE_BASE}:latest (AMD64 for production)"
echo "    - ${FULL_IMAGE_BASE}:v${VERSION} (AMD64 versioned)"
echo "    - ${FULL_IMAGE_BASE}:dev (Multi-platform)"
echo ""
echo "Access the service at: https://airs.cdot.io/prisma-airs"