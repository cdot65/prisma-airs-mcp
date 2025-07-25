#!/bin/bash
# Docker build script for Prisma AIRS MCP Server

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="prisma-airs-mcp"
IMAGE_TAG="latest"
BUILD_TARGET="production"
PLATFORMS=""
USE_BUILDX=false
PUSH=false

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --name NAME        Image name (default: prisma-airs-mcp)"
    echo "  -t, --tag TAG          Image tag (default: latest)"
    echo "  -d, --dev              Build development image"
    echo "  -p, --prod             Build production image (default)"
    echo "  -m, --multi-platform   Build for multiple platforms (linux/amd64,linux/arm64)"
    echo "  --platforms PLATFORMS  Specify platforms (e.g., linux/amd64 or linux/arm64)"
    echo "  --push                 Push image to registry (requires --multi-platform)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                     # Build production image"
    echo "  $0 --dev               # Build development image"
    echo "  $0 --tag v1.0.0        # Build with specific tag"
    echo "  $0 --multi-platform    # Build for multiple architectures"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -d|--dev)
            BUILD_TARGET="development"
            shift
            ;;
        -p|--prod)
            BUILD_TARGET="production"
            shift
            ;;
        -m|--multi-platform)
            PLATFORMS="linux/amd64,linux/arm64"
            USE_BUILDX=true
            shift
            ;;
        --platforms)
            PLATFORMS="$2"
            USE_BUILDX=true
            shift 2
            ;;
        --push)
            PUSH=true
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

# Determine Dockerfile
if [ "$BUILD_TARGET" == "development" ]; then
    DOCKERFILE="docker/Dockerfile.dev"
else
    DOCKERFILE="docker/Dockerfile"
fi

# Build image
echo -e "${YELLOW}Building ${BUILD_TARGET} image: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
echo "Dockerfile: ${DOCKERFILE}"

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}Error: Dockerfile not found: ${DOCKERFILE}${NC}"
    exit 1
fi

# Build command
if [ "$USE_BUILDX" = true ]; then
    # Multi-platform build with buildx
    echo -e "${YELLOW}Setting up multi-platform build with buildx${NC}"
    
    # Check if multiarch-builder exists and is running
    if ! docker buildx inspect multiarch-builder > /dev/null 2>&1; then
        echo -e "${YELLOW}Creating multiarch builder...${NC}"
        docker buildx create --name multiarch-builder --use
    else
        echo -e "${GREEN}Using existing multiarch builder${NC}"
        docker buildx use multiarch-builder
    fi
    
    # Ensure builder is bootstrapped
    docker buildx inspect --bootstrap > /dev/null 2>&1
    
    BUILD_CMD="docker buildx build --platform ${PLATFORMS}"
    
    # Add push flag if specified
    if [ "$PUSH" = true ]; then
        BUILD_CMD="${BUILD_CMD} --push"
    else
        # Load to local Docker (only works for single platform)
        if [ "$PLATFORMS" == "linux/amd64" ] || [ "$PLATFORMS" == "linux/arm64" ]; then
            BUILD_CMD="${BUILD_CMD} --load"
        else
            echo -e "${YELLOW}Note: Multi-platform images cannot be loaded to local Docker.${NC}"
            echo -e "${YELLOW}The image will be built but not loaded. Use --push to push to a registry.${NC}"
            echo -e "${YELLOW}To run locally, build for your specific platform or use --push with a registry.${NC}"
        fi
    fi
else
    # Standard build
    BUILD_CMD="docker build"
fi

# Add common flags
BUILD_CMD="${BUILD_CMD} -f ${DOCKERFILE} -t ${IMAGE_NAME}:${IMAGE_TAG}"

# Add build target for production builds
if [ "$BUILD_TARGET" == "production" ]; then
    BUILD_CMD="${BUILD_CMD} --target production"
fi

# Add context
BUILD_CMD="${BUILD_CMD} ."

# Execute build
echo -e "${GREEN}Executing: ${BUILD_CMD}${NC}"
eval $BUILD_CMD

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo -e "${GREEN}Image: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
    
    if [ "$USE_BUILDX" = true ]; then
        echo -e "${GREEN}Platforms: ${PLATFORMS}${NC}"
        if [ "$PUSH" = true ]; then
            echo -e "${GREEN}Image pushed to registry${NC}"
        fi
    else
        # Show image size for local builds
        docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    fi
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi