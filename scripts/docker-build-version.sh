#!/bin/bash

# docker-build-version.sh - Build Docker images with version tags from version.json
# Usage: ./scripts/docker-build-version.sh [--push]

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-cdot65}"
IMAGE_NAME="prisma-airs-mcp"
FULL_IMAGE="${REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}"

# Check if we should push
PUSH=false
if [[ "$1" == "--push" ]]; then
    PUSH=true
fi

# Get version from version.json
VERSION=$(jq -r '.version' version.json)
if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not read version from version.json${NC}"
    exit 1
fi

echo -e "${YELLOW}Building Docker images for version $VERSION...${NC}"

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Build image
if [ "$PUSH" = true ]; then
    echo -e "${GREEN}Building and pushing multi-platform image...${NC}"
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag "${FULL_IMAGE}:latest" \
        --tag "${FULL_IMAGE}:v${VERSION}" \
        --tag "${FULL_IMAGE}:${VERSION}" \
        --build-arg VERSION="${VERSION}" \
        --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --push \
        -f docker/Dockerfile \
        .
else
    echo -e "${GREEN}Building local image (single platform)...${NC}"
    docker buildx build \
        --tag "${FULL_IMAGE}:latest" \
        --tag "${FULL_IMAGE}:v${VERSION}" \
        --tag "${FULL_IMAGE}:${VERSION}" \
        --build-arg VERSION="${VERSION}" \
        --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --load \
        -f docker/Dockerfile \
        .
fi

if [ "$PUSH" = true ]; then
    echo -e "${GREEN}✓ Images built and pushed successfully${NC}"
    echo ""
    echo "Tagged images:"
    echo "  - ${FULL_IMAGE}:latest"
    echo "  - ${FULL_IMAGE}:v${VERSION}"
    echo "  - ${FULL_IMAGE}:${VERSION}"
else
    echo -e "${GREEN}✓ Images built successfully (not pushed)${NC}"
    echo ""
    echo "To push images, run: $0 --push"
fi