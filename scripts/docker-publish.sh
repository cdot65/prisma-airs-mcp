#!/bin/bash
# Publish Docker images to GitHub Container Registry
# Builds and pushes both AMD64 (latest) and ARM64 (dev) images

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

# Default values
SKIP_LOGIN=false
VERSION=""
TAG=""

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Build and publish multi-platform Docker images to GitHub Container Registry"
    echo ""
    echo "Options:"
    echo "  -v, --version VERSION    Version tag (in addition to latest/dev)"
    echo "  -t, --tag TAG            Custom tag to use (dev, latest, or custom)"
    echo "  --skip-login             Skip docker login (if already logged in)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "This script will build and push:"
    echo "  - ${FULL_IMAGE_BASE}:latest (AMD64 for production K8s)"
    echo "  - ${FULL_IMAGE_BASE}:dev (ARM64 for Apple Silicon development)"
    echo "  - ${FULL_IMAGE_BASE}:VERSION (multi-platform, if version specified)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Build and push latest and dev tags"
    echo "  $0 --version v1.0.0   # Also create versioned multi-platform image"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        --skip-login)
            SKIP_LOGIN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

echo -e "${BLUE}=== GitHub Container Registry Publishing ===${NC}"
echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
echo -e "${YELLOW}Repository: ${USERNAME}/${IMAGE_NAME}${NC}"
echo ""

# Login to GitHub Container Registry
if [ "$SKIP_LOGIN" = false ]; then
    echo -e "${GREEN}Logging in to GitHub Container Registry...${NC}"
    
    # Check for CR_PAT or GITHUB_TOKEN
    TOKEN="${CR_PAT:-${GITHUB_TOKEN:-}}"
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}ERROR: Neither CR_PAT nor GITHUB_TOKEN environment variable is set${NC}"
        echo -e "${YELLOW}Please set one of these environment variables with a GitHub Personal Access Token${NC}"
        echo -e "${YELLOW}The token needs 'write:packages' permission${NC}"
        echo -e "${YELLOW}Example: export GITHUB_TOKEN='your-token-here'${NC}"
        exit 1
    fi
    
    if ! echo "$TOKEN" | docker login ${REGISTRY} -u ${USERNAME} --password-stdin; then
        echo -e "${RED}ERROR: Failed to login to GitHub Container Registry${NC}"
        echo -e "${YELLOW}Please check that your token has 'write:packages' permission${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Successfully logged in to GitHub Container Registry${NC}"
else
    echo -e "${YELLOW}Skipping login (--skip-login specified)${NC}"
fi

# Setup buildx
echo -e "${GREEN}Setting up Docker buildx...${NC}"
if ! docker buildx inspect multiarch-builder > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating multiarch-builder...${NC}"
    docker buildx create --name multiarch-builder --driver docker-container --use
else
    echo -e "${GREEN}Using existing multiarch-builder${NC}"
    docker buildx use multiarch-builder
fi

# Bootstrap the builder
docker buildx inspect --bootstrap > /dev/null 2>&1

# Determine what to build based on tag
if [ -n "$TAG" ]; then
    # Custom tag specified
    if [ "$TAG" = "dev" ]; then
        # Build multi-platform dev image
        echo ""
        echo -e "${BLUE}Building multi-platform image for development...${NC}"
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            -f docker/Dockerfile \
            -t ${FULL_IMAGE_BASE}:dev \
            --target production \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg VERSION=dev \
            --push \
            .
        echo -e "${GREEN}✅ Multi-platform image pushed as :dev${NC}"
    elif [ "$TAG" = "latest" ]; then
        # Build AMD64 only for production
        echo ""
        echo -e "${BLUE}Building AMD64 image for production Kubernetes...${NC}"
        docker buildx build \
            --platform linux/amd64 \
            -f docker/Dockerfile \
            -t ${FULL_IMAGE_BASE}:latest \
            --target production \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg VERSION=latest \
            --push \
            .
        echo -e "${GREEN}✅ AMD64 image pushed as :latest${NC}"
    else
        # Custom tag - build multi-platform
        echo ""
        echo -e "${BLUE}Building multi-platform image with tag ${TAG}...${NC}"
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            -f docker/Dockerfile \
            -t ${FULL_IMAGE_BASE}:${TAG} \
            --target production \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg VERSION=${TAG} \
            --push \
            .
        echo -e "${GREEN}✅ Multi-platform image pushed as :${TAG}${NC}"
    fi
else
    # Default behavior - build both latest and dev
    # Build and push AMD64 image as "latest"
    echo ""
    echo -e "${BLUE}Building AMD64 image for production Kubernetes...${NC}"
    docker buildx build \
        --platform linux/amd64 \
        -f docker/Dockerfile \
        -t ${FULL_IMAGE_BASE}:latest \
        --target production \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VERSION=latest \
        --push \
        .
    
    echo -e "${GREEN}✅ AMD64 image pushed as :latest${NC}"
    
    # Build and push multi-platform image as "dev"
    echo ""
    echo -e "${BLUE}Building multi-platform image for development...${NC}"
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -f docker/Dockerfile \
        -t ${FULL_IMAGE_BASE}:dev \
        --target production \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VERSION=dev \
        --push \
        .
    
    echo -e "${GREEN}✅ Multi-platform image pushed as :dev${NC}"
fi

# Build and push versioned multi-platform image if version specified
if [ -n "$VERSION" ]; then
    echo ""
    echo -e "${BLUE}Building multi-platform image for version ${VERSION}...${NC}"
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -f docker/Dockerfile \
        -t ${FULL_IMAGE_BASE}:${VERSION} \
        --target production \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VERSION=${VERSION} \
        --push \
        .
    
    echo -e "${GREEN}✅ Multi-platform image pushed as :${VERSION}${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=== Publishing Complete ===${NC}"
echo ""
echo "Images published to GitHub Container Registry:"
if [ -n "$TAG" ]; then
    if [ "$TAG" = "latest" ]; then
        echo -e "  ${BLUE}${FULL_IMAGE_BASE}:latest${NC} (AMD64 for production)"
    elif [ "$TAG" = "dev" ]; then
        echo -e "  ${BLUE}${FULL_IMAGE_BASE}:dev${NC} (Multi-platform for development)"
    else
        echo -e "  ${BLUE}${FULL_IMAGE_BASE}:${TAG}${NC} (Multi-platform)"
    fi
else
    echo -e "  ${BLUE}${FULL_IMAGE_BASE}:latest${NC} (AMD64 for production)"
    echo -e "  ${BLUE}${FULL_IMAGE_BASE}:dev${NC} (Multi-platform for development)"
fi
if [ -n "$VERSION" ]; then
    echo -e "  ${BLUE}${FULL_IMAGE_BASE}:${VERSION}${NC} (Multi-platform)"
fi
echo ""
echo "To pull images:"
echo "  docker pull ${FULL_IMAGE_BASE}:latest  # For production K8s (AMD64)"
echo "  docker pull ${FULL_IMAGE_BASE}:dev     # For development (Multi-platform)"
echo ""
echo "To use in Kubernetes:"
echo "  kubectl set image deployment/prisma-airs-mcp app=${FULL_IMAGE_BASE}:latest"