#!/bin/bash
# Build multi-platform Docker image for Kubernetes deployment
# This script builds for both ARM64 (Apple Silicon) and AMD64 (Intel/AMD)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="prisma-airs-mcp"
IMAGE_TAG="latest"
REGISTRY=""
PLATFORMS="linux/amd64,linux/arm64"

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Build multi-platform Docker image for Kubernetes deployment"
    echo ""
    echo "Options:"
    echo "  -r, --registry REGISTRY    Container registry (e.g., docker.io/myuser)"
    echo "  -t, --tag TAG              Image tag (default: latest)"
    echo "  -p, --platforms PLATFORMS  Target platforms (default: linux/amd64,linux/arm64)"
    echo "  --push                     Push to registry after build"
    echo "  --load                     Load to local Docker (single platform only)"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --push                              # Build and push with default tag"
    echo "  $0 --registry myregistry.io/myproject  # Use custom registry"
    echo "  $0 --tag v1.0.0 --push                 # Build specific version and push"
    echo "  $0 --platforms linux/amd64 --load      # Build for AMD64 only and load locally"
    exit 1
}

# Parse command line arguments
PUSH=false
LOAD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -p|--platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        --push)
            PUSH=true
            shift
            ;;
        --load)
            LOAD=true
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

# Construct full image name
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
else
    FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
fi

echo -e "${BLUE}=== Multi-Platform Docker Build for Kubernetes ===${NC}"
echo -e "${YELLOW}Image: ${FULL_IMAGE}${NC}"
echo -e "${YELLOW}Platforms: ${PLATFORMS}${NC}"

# Check if we can load (only for single platform)
if [ "$LOAD" = true ] && [[ "$PLATFORMS" == *","* ]]; then
    echo -e "${RED}Error: --load can only be used with a single platform${NC}"
    echo "Use --push instead for multi-platform images"
    exit 1
fi

# Check if pushing without registry
if [ "$PUSH" = true ] && [ -z "$REGISTRY" ]; then
    echo -e "${YELLOW}Warning: Pushing without registry specified. Make sure you're logged in to Docker Hub${NC}"
fi

# Setup buildx
echo -e "${GREEN}Setting up Docker buildx...${NC}"

# Check if multiarch-builder exists
if ! docker buildx inspect multiarch-builder > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating multiarch-builder...${NC}"
    docker buildx create --name multiarch-builder --driver docker-container --use
else
    echo -e "${GREEN}Using existing multiarch-builder${NC}"
    docker buildx use multiarch-builder
fi

# Bootstrap the builder
echo -e "${GREEN}Bootstrapping builder...${NC}"
docker buildx inspect --bootstrap

# Build command
BUILD_CMD="docker buildx build"
BUILD_CMD="${BUILD_CMD} --platform ${PLATFORMS}"
BUILD_CMD="${BUILD_CMD} -f docker/Dockerfile"
BUILD_CMD="${BUILD_CMD} -t ${FULL_IMAGE}"
BUILD_CMD="${BUILD_CMD} --target production"

# Add build args for metadata
BUILD_CMD="${BUILD_CMD} --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
BUILD_CMD="${BUILD_CMD} --build-arg VERSION=${IMAGE_TAG}"

# Add output options
if [ "$PUSH" = true ]; then
    BUILD_CMD="${BUILD_CMD} --push"
    echo -e "${YELLOW}Will push to registry after build${NC}"
elif [ "$LOAD" = true ]; then
    BUILD_CMD="${BUILD_CMD} --load"
    echo -e "${YELLOW}Will load image to local Docker${NC}"
else
    # For multi-platform builds, we can't load, so just build to cache
    if [[ "$PLATFORMS" == *","* ]]; then
        echo -e "${YELLOW}Building multi-platform images (will remain in build cache)${NC}"
        echo -e "${YELLOW}Note: Multi-platform builds cannot be loaded locally${NC}"
    else
        # Single platform can be loaded
        BUILD_CMD="${BUILD_CMD} --load"
        echo -e "${YELLOW}Building and loading single-platform image to local Docker${NC}"
    fi
fi

# Add cache options for faster builds (only when pushing)
if [ "$PUSH" = true ]; then
    BUILD_CMD="${BUILD_CMD} --cache-from type=registry,ref=${FULL_IMAGE}-cache"
    BUILD_CMD="${BUILD_CMD} --cache-to type=registry,ref=${FULL_IMAGE}-cache,mode=max"
fi

# Add context
BUILD_CMD="${BUILD_CMD} ."

# Execute build
echo -e "${GREEN}Executing build...${NC}"
echo -e "${BLUE}Command: ${BUILD_CMD}${NC}"
echo ""

eval $BUILD_CMD

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Multi-platform build successful!${NC}"
    echo -e "${GREEN}Image: ${FULL_IMAGE}${NC}"
    echo -e "${GREEN}Platforms: ${PLATFORMS}${NC}"
    
    if [ "$PUSH" = true ]; then
        echo -e "${GREEN}✅ Image pushed to registry${NC}"
        echo ""
        echo "To use in Kubernetes:"
        echo "  kubectl set image deployment/prisma-airs-mcp app=${FULL_IMAGE}"
    elif [ "$LOAD" = true ]; then
        echo ""
        echo "Image loaded locally. To run:"
        echo "  docker run -p 3000:3000 --env-file .env ${FULL_IMAGE}"
    fi
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi