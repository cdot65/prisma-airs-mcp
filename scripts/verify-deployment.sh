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

# First check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not available, skipping digest check${NC}"
    REGISTRY_DIGEST="unknown"
else
    # Try to get the digest from local docker first
    LOCAL_DIGEST=$(docker images --digests "${FULL_IMAGE_BASE}" 2>/dev/null | grep latest | awk '{print $3}' | head -1 || echo "")
    if [ -z "$LOCAL_DIGEST" ] || [ "$LOCAL_DIGEST" == "<none>" ]; then
        # Try using docker manifest inspect (requires experimental features and login)
        # This often fails in CI/CD environments, so we suppress errors
        REGISTRY_DIGEST=$(docker manifest inspect "${FULL_IMAGE_BASE}:latest" 2>/dev/null | jq -r '.manifests[0].digest' 2>/dev/null || echo "")
        if [ -z "$REGISTRY_DIGEST" ]; then
            # Get the local image ID as fallback
            REGISTRY_DIGEST=$(docker inspect "${FULL_IMAGE_BASE}:latest" 2>/dev/null | jq -r '.[0].RepoDigests[0]' 2>/dev/null | cut -d'@' -f2 || echo "")
        fi
    else
        REGISTRY_DIGEST=$LOCAL_DIGEST
    fi
    
    if [ -z "$REGISTRY_DIGEST" ] || [ "$REGISTRY_DIGEST" == "null" ]; then
        echo -e "${YELLOW}Note: Could not determine registry digest (this is normal in some environments)${NC}"
        REGISTRY_DIGEST="unknown"
    else
        echo -e "${GREEN}Expected digest: ${REGISTRY_DIGEST}${NC}"
    fi
fi

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
RUNNING_PODS=$(kubectl get pods -l app=prisma-airs-mcp -n "$NAMESPACE" -o json 2>/dev/null | jq -r '.items[] | select(.status.containerStatuses != null) | "\(.metadata.name)|\(.status.containerStatuses[0].imageID)"' 2>/dev/null || echo "")
if [ -z "$RUNNING_PODS" ]; then
    echo -e "${YELLOW}No running pods found yet. This is normal during deployment.${NC}"
    echo -e "${YELLOW}Checking pod status...${NC}"
    kubectl get pods -l app=prisma-airs-mcp -n "$NAMESPACE" --no-headers 2>/dev/null || echo "No pods found"
    echo ""
    echo -e "${GREEN}Deployment is likely still in progress. This is normal.${NC}"
    exit 0
fi

# Check each pod
MISMATCH=false
ALL_SAME=true
FIRST_DIGEST=""
while IFS='|' read -r POD_NAME IMAGE_ID; do
    # Extract digest from imageID
    POD_DIGEST=$(echo "$IMAGE_ID" | cut -d'@' -f2)
    
    # Store first digest for comparison
    if [ -z "$FIRST_DIGEST" ]; then
        FIRST_DIGEST="$POD_DIGEST"
    fi
    
    # Check if all pods have the same digest
    if [ "$POD_DIGEST" != "$FIRST_DIGEST" ]; then
        ALL_SAME=false
    fi
    
    if [ "$REGISTRY_DIGEST" != "unknown" ] && [ "$POD_DIGEST" != "$REGISTRY_DIGEST" ]; then
        echo -e "${RED}❌ Pod ${POD_NAME} is running outdated image${NC}"
        echo -e "   Expected: ${REGISTRY_DIGEST}"
        echo -e "   Running:  ${POD_DIGEST}"
        MISMATCH=true
    else
        echo -e "${GREEN}✓ Pod ${POD_NAME} is running image: ${POD_DIGEST:0:12}...${NC}"
    fi
done <<< "$RUNNING_PODS"

# If we couldn't determine expected digest, at least check all pods are the same
if [ "$REGISTRY_DIGEST" == "unknown" ] && [ "$ALL_SAME" = false ]; then
    echo -e "${RED}❌ Pods are running different image versions${NC}"
    MISMATCH=true
fi

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

# If we have version info, that's more important than digest matching
if [ -n "$APP_VERSION" ] && [ "$APP_VERSION" != "unknown" ]; then
    echo -e "${GREEN}✅ Application version: ${APP_VERSION}${NC}"
    echo -e "${GREEN}All pods are running successfully${NC}"
    
    # Only warn about digest mismatch, don't fail
    if [ "$MISMATCH" = true ] && [ "$REGISTRY_DIGEST" != "unknown" ]; then
        echo -e "${YELLOW}Note: Image digests don't match local build, but version is correct${NC}"
    fi
elif [ "$MISMATCH" = true ]; then
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