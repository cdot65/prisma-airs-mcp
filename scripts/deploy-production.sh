#!/bin/bash
# Complete production deployment script with versioning
# This script handles the entire deployment workflow:
# 1. Validates code
# 2. Updates version
# 3. Builds Docker image
# 4. Pushes to registry
# 5. Deploys to Kubernetes
# 6. Monitors rollout

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="ghcr.io"
USERNAME="cdot65"
IMAGE_NAME="prisma-airs-mcp"
FULL_IMAGE_BASE="${REGISTRY}/${USERNAME}/${IMAGE_NAME}"
NAMESPACE="prisma-airs"

# Read current version from version.json
CURRENT_VERSION=$(jq -r '.version' version.json)

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to update version in package.json
update_package_version() {
    local version=$1
    print_color $YELLOW "Updating package.json version to ${version}..."
    jq ".version = \"${version}\"" package.json > package.json.tmp && mv package.json.tmp package.json
}

# Function to check if user wants to proceed
confirm_deployment() {
    local version=$1
    print_color $CYAN "=== Production Deployment Confirmation ==="
    print_color $YELLOW "Current version: ${CURRENT_VERSION}"
    print_color $YELLOW "New version: ${version}"
    print_color $YELLOW "Image: ${FULL_IMAGE_BASE}:${version}"
    print_color $YELLOW "Namespace: ${NAMESPACE}"
    echo ""
    read -p "Do you want to proceed with deployment? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_color $RED "Deployment cancelled."
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_color $BLUE "Checking prerequisites..."
    
    local missing=false
    
    # Check required commands
    for cmd in jq kubectl docker; do
        if ! command -v $cmd &> /dev/null; then
            print_color $RED "❌ $cmd is not installed"
            missing=true
        else
            print_color $GREEN "✅ $cmd is available"
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_color $RED "❌ Docker daemon is not running"
        missing=true
    else
        print_color $GREEN "✅ Docker daemon is running"
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        print_color $RED "❌ Cannot connect to Kubernetes cluster"
        missing=true
    else
        print_color $GREEN "✅ Kubernetes cluster connection OK"
    fi
    
    # Check GitHub token
    TOKEN="${CR_PAT:-${GITHUB_TOKEN:-}}"
    if [ -z "$TOKEN" ]; then
        print_color $RED "❌ Neither CR_PAT nor GITHUB_TOKEN is set"
        missing=true
    else
        print_color $GREEN "✅ GitHub token is set (using ${CR_PAT:+CR_PAT}${GITHUB_TOKEN:+GITHUB_TOKEN})"
    fi
    
    if [ "$missing" = true ]; then
        print_color $RED "Prerequisites check failed. Please install missing components."
        exit 1
    fi
    
    print_color $GREEN "All prerequisites satisfied!"
    echo ""
}

# Main deployment workflow
main() {
    print_color $CYAN "=== Prisma AIRS MCP Production Deployment ==="
    echo ""
    
    # Get version from command line or use current
    VERSION="${1:-$CURRENT_VERSION}"
    
    # If no argument provided, prompt for version
    if [ $# -eq 0 ]; then
        print_color $YELLOW "Current version: ${CURRENT_VERSION}"
        read -p "Enter new version (or press Enter to use current): " NEW_VERSION
        VERSION="${NEW_VERSION:-$CURRENT_VERSION}"
    fi
    
    # Validate version format (basic check)
    if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_color $RED "Invalid version format. Please use semantic versioning (e.g., 1.3.3)"
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Confirm deployment
    confirm_deployment $VERSION
    
    # Step 1: Update version in package.json
    if [ "$VERSION" != "$CURRENT_VERSION" ]; then
        update_package_version $VERSION
    fi
    
    # Step 2: Run validation
    print_color $BLUE "Step 1/6: Running validation checks..."
    if ! pnpm run deploy:validate; then
        print_color $RED "Validation failed. Please fix issues before deploying."
        exit 1
    fi
    print_color $GREEN "✅ Validation passed"
    echo ""
    
    # Step 3: Build Docker image
    print_color $BLUE "Step 2/6: Building Docker image..."
    if ! pnpm run docker:build:k8s; then
        print_color $RED "Docker build failed."
        exit 1
    fi
    print_color $GREEN "✅ Docker image built"
    echo ""
    
    # Step 4: Push to registry
    print_color $BLUE "Step 3/6: Pushing to registry..."
    if ! ./scripts/docker-publish.sh --version "v${VERSION}"; then
        print_color $RED "Docker push failed."
        exit 1
    fi
    print_color $GREEN "✅ Images pushed to registry"
    echo ""
    
    # Step 5: Update Kubernetes deployment
    print_color $BLUE "Step 4/6: Updating Kubernetes deployment..."
    
    # Update the production kustomization to use the new version
    print_color $YELLOW "Updating production kustomization.yaml..."
    sed -i.bak "s/newTag: .*/newTag: v${VERSION}/" k8s/overlays/production/kustomization.yaml
    rm k8s/overlays/production/kustomization.yaml.bak
    
    # Deploy to Kubernetes
    if ! ./k8s/scripts/deploy.sh deploy production; then
        print_color $RED "Kubernetes deployment failed."
        exit 1
    fi
    print_color $GREEN "✅ Kubernetes deployment updated"
    echo ""
    
    # Step 6: Monitor rollout
    print_color $BLUE "Step 5/6: Monitoring rollout..."
    kubectl rollout status deployment/prisma-airs-mcp -n ${NAMESPACE}
    print_color $GREEN "✅ Rollout completed successfully"
    echo ""
    
    # Step 7: Verify deployment
    print_color $BLUE "Step 6/6: Verifying deployment..."
    kubectl get pods -n ${NAMESPACE} -l app=prisma-airs-mcp
    echo ""
    
    # Test health endpoint
    print_color $YELLOW "Testing health endpoint..."
    sleep 5
    if curl -s -f https://airs.cdot.io/prisma-airs/health > /dev/null; then
        print_color $GREEN "✅ Health check passed"
    else
        print_color $YELLOW "⚠️  Health check failed (service may still be starting)"
    fi
    
    # Success message
    echo ""
    print_color $GREEN "=== Deployment Complete! ==="
    print_color $CYAN "Version ${VERSION} is now live at: https://airs.cdot.io/prisma-airs"
    print_color $CYAN "Images published:"
    print_color $CYAN "  - ${FULL_IMAGE_BASE}:latest (AMD64)"
    print_color $CYAN "  - ${FULL_IMAGE_BASE}:v${VERSION} (Multi-platform)"
    echo ""
    
    # Suggest next steps
    print_color $YELLOW "Next steps:"
    print_color $YELLOW "1. Verify the deployment: https://airs.cdot.io/prisma-airs/health"
    print_color $YELLOW "2. Check logs: kubectl logs -l app=prisma-airs-mcp -n ${NAMESPACE}"
    print_color $YELLOW "3. Commit version changes: git add . && git commit -m 'Deploy v${VERSION}'"
    print_color $YELLOW "4. Tag release: git tag v${VERSION} && git push --tags"
}

# Run main function
main "$@"