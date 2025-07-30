#!/bin/bash
# Docker run script for Prisma AIRS MCP Server

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="prisma-airs-mcp"
IMAGE_TAG="latest"
CONTAINER_NAME="prisma-airs-mcp"
PORT="3000"
ENV_FILE=".env"
DETACH=true

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --name NAME        Container name (default: prisma-airs-mcp)"
    echo "  -i, --image NAME:TAG   Image name:tag (default: prisma-airs-mcp:latest)"
    echo "  -t, --tag TAG          Image tag (default: latest)"
    echo "  -p, --port PORT        Host port (default: 3000)"
    echo "  -e, --env-file FILE    Environment file (default: .env)"
    echo "  -f, --foreground       Run in foreground (default: detached)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Run with defaults"
    echo "  $0 --port 8080               # Run on different port"
    echo "  $0 --env-file .env.prod      # Use production env file"
    echo "  $0 --foreground              # Run in foreground"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -i|--image)
            IFS=':' read -r IMAGE_NAME IMAGE_TAG <<< "$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -e|--env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        -f|--foreground)
            DETACH=false
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

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: Environment file not found: ${ENV_FILE}${NC}"
    echo "Please create the file or specify a different one with --env-file"
    exit 1
fi

# Check if image exists
if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${IMAGE_NAME}:${IMAGE_TAG}$"; then
    echo -e "${YELLOW}Warning: Image ${IMAGE_NAME}:${IMAGE_TAG} not found locally${NC}"
    echo "Run ./scripts/docker-build.sh first to build the image"
    exit 1
fi

# Check if container with same name is already running
if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Container ${CONTAINER_NAME} is already running${NC}"
    echo "Stop it first with: docker stop ${CONTAINER_NAME}"
    exit 1
fi

# Remove old container if exists
if docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Removing old container: ${CONTAINER_NAME}${NC}"
    docker rm ${CONTAINER_NAME}
fi

# Build run command
RUN_CMD="docker run"

# Add detach flag
if [ "$DETACH" = true ]; then
    RUN_CMD="${RUN_CMD} -d"
fi

# Add container name
RUN_CMD="${RUN_CMD} --name ${CONTAINER_NAME}"

# Add port mapping
RUN_CMD="${RUN_CMD} -p ${PORT}:3000"

# Add env file
RUN_CMD="${RUN_CMD} --env-file ${ENV_FILE}"

# Add restart policy
RUN_CMD="${RUN_CMD} --restart unless-stopped"

# Add image
RUN_CMD="${RUN_CMD} ${IMAGE_NAME}:${IMAGE_TAG}"

# Execute run
echo -e "${GREEN}Starting container: ${CONTAINER_NAME}${NC}"
echo -e "${GREEN}Image: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
echo -e "${GREEN}Port: ${PORT}:3000${NC}"
echo -e "${GREEN}Env file: ${ENV_FILE}${NC}"

eval $RUN_CMD

# Check if successful
if [ $? -eq 0 ]; then
    if [ "$DETACH" = true ]; then
        echo -e "${GREEN}✅ Container started successfully!${NC}"
        echo ""
        echo "Check status: docker ps"
        echo "View logs: docker logs -f ${CONTAINER_NAME}"
        echo "Stop container: docker stop ${CONTAINER_NAME}"
        echo ""
        echo -e "${GREEN}Server available at: http://localhost:${PORT}${NC}"
        echo -e "${GREEN}Health check: http://localhost:${PORT}/health${NC}"
    else
        echo -e "${GREEN}Container stopped${NC}"
    fi
else
    echo -e "${RED}❌ Failed to start container!${NC}"
    exit 1
fi