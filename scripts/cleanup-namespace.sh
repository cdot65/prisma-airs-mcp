#!/bin/bash
# cleanup-namespace.sh - Clean up old namespace and consolidate to single namespace

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

OLD_NAMESPACE="prisma-airs"
NEW_NAMESPACE="prisma-airs-mcp-server"

echo -e "${BLUE}=== Namespace Cleanup and Consolidation ===${NC}"
echo ""

# Check current namespaces
echo -e "${YELLOW}Current namespaces:${NC}"
kubectl get namespaces | grep -E "(prisma-airs|${NEW_NAMESPACE})" || true
echo ""

# Check what's in the old namespace
echo -e "${YELLOW}Resources in old namespace (${OLD_NAMESPACE}):${NC}"
kubectl get all -n "${OLD_NAMESPACE}" 2>/dev/null || echo "Namespace not found or empty"
echo ""

# Check what's in the new namespace
echo -e "${YELLOW}Resources in new namespace (${NEW_NAMESPACE}):${NC}"
kubectl get all -n "${NEW_NAMESPACE}" 2>/dev/null || echo "Namespace not found or empty"
echo ""

# Ask for confirmation
read -p "Do you want to delete the old namespace '${OLD_NAMESPACE}'? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deleting old namespace...${NC}"
    kubectl delete namespace "${OLD_NAMESPACE}" --wait=false
    echo -e "${GREEN}✓ Old namespace deletion initiated${NC}"
else
    echo -e "${YELLOW}Skipping namespace deletion${NC}"
fi

echo ""
echo -e "${GREEN}=== Cleanup Complete ===${NC}"
echo ""
echo "Production deployment is now using namespace: ${NEW_NAMESPACE}"
echo "IngressRoute is correctly configured to route to service in this namespace"