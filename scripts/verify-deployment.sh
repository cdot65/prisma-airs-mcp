#!/bin/bash
# verify-deployment.sh - Verify that the deployed image matches what we expect
# This script helps catch deployment issues where old images are still running

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
NAMESPACE="${1:-prisma-airs-mcp-server}"

echo -e "${BLUE}=== Deployment Verification ===${NC}"
echo -e "${YELLOW}Namespace: ${NAMESPACE}${NC}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl not found. Please install kubectl to continue.${NC}"
    exit 1
fi

# Get the expected image from registry
echo -e "${YELLOW}Checking latest image in registry...${NC}"
REGISTRY_DIGEST=$(docker manifest inspect "${FULL_IMAGE_BASE}:latest" 2>/dev/null | jq -r '.manifests[0].digest' || echo "")
if [ -z "$REGISTRY_DIGEST" ]; then
    echo -e "${RED}Failed to get latest image digest from registry${NC}"
    echo -e "${YELLOW}Make sure you're logged in to the registry and the image exists${NC}"
    exit 1
fi
echo -e "${GREEN}Registry digest: ${REGISTRY_DIGEST}${NC}"

# Get the configured image in deployment
echo ""
echo -e "${YELLOW}Checking configured image in deployment...${NC}"
DEPLOYMENT_IMAGE=$(kubectl get deployment prisma-airs-mcp -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")
if [ -z "$DEPLOYMENT_IMAGE" ]; then
    echo -e "${RED}Failed to get deployment image${NC}"
    exit 1
fi
echo -e "${GREEN}Deployment configured image: ${DEPLOYMENT_IMAGE}${NC}"

# Get the actual running images
echo ""
echo -e "${YELLOW}Checking actual running images in pods...${NC}"
RUNNING_PODS=$(kubectl get pods -l app=prisma-airs-mcp -n "$NAMESPACE" -o json 2>/dev/null | jq -r '.items[] | "\(.metadata.name)|\(.status.containerStatuses[0].imageID)"' || echo "")
if [ -z "$RUNNING_PODS" ]; then
    echo -e "${RED}No running pods found${NC}"
    exit 1
fi

# Check each pod
MISMATCH=false
while IFS='|' read -r POD_NAME IMAGE_ID; do
    # Extract digest from imageID
    POD_DIGEST=$(echo "$IMAGE_ID" | cut -d'@' -f2)
    
    if [ "$POD_DIGEST" != "$REGISTRY_DIGEST" ]; then
        echo -e "${RED}❌ Pod ${POD_NAME} is running outdated image${NC}"
        echo -e "   Expected: ${REGISTRY_DIGEST}"
        echo -e "   Running:  ${POD_DIGEST}"
        MISMATCH=true
    else
        echo -e "${GREEN}✓ Pod ${POD_NAME} is running latest image${NC}"
    fi
done <<< "$RUNNING_PODS"

# Get version from running pods
echo ""
echo -e "${YELLOW}Checking application version from running pods...${NC}"
POD=$(kubectl get pods -l app=prisma-airs-mcp -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$POD" ]; then
    APP_VERSION=$(kubectl exec -n "$NAMESPACE" "$POD" -- cat version.json 2>/dev/null | jq -r '.version' || echo "unknown")
    echo -e "${GREEN}Application version: ${APP_VERSION}${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}=== Summary ===${NC}"
if [ "$MISMATCH" = true ]; then
    echo -e "${RED}⚠️  Deployment verification FAILED${NC}"
    echo -e "${YELLOW}Some pods are running outdated images.${NC}"
    echo ""
    echo -e "${YELLOW}To fix this issue, run:${NC}"
    echo -e "${BLUE}  kubectl rollout restart deployment/prisma-airs-mcp -n ${NAMESPACE}${NC}"
    echo -e "${BLUE}  kubectl rollout status deployment/prisma-airs-mcp -n ${NAMESPACE}${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All pods are running the latest image${NC}"
    echo -e "${GREEN}Registry digest: ${REGISTRY_DIGEST}${NC}"
    echo -e "${GREEN}App version: ${APP_VERSION}${NC}"
fi

# Check if deployment has imagePullPolicy: Always
echo ""
echo -e "${YELLOW}Checking imagePullPolicy...${NC}"
PULL_POLICY=$(kubectl get deployment prisma-airs-mcp -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].imagePullPolicy}')
if [ "$PULL_POLICY" != "Always" ]; then
    echo -e "${YELLOW}⚠️  WARNING: imagePullPolicy is set to '${PULL_POLICY}'${NC}"
    echo -e "${YELLOW}This may cause issues with pulling fresh images.${NC}"
    echo -e "${YELLOW}Consider setting it to 'Always' for production deployments.${NC}"
else
    echo -e "${GREEN}✓ imagePullPolicy is set to 'Always'${NC}"
fi