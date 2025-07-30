#!/bin/bash
# Script to create Docker registry secret for pulling images from GitHub Container Registry

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Configuration
NAMESPACE="${NAMESPACE:-prisma-airs-mcp-server}"
SECRET_NAME="ghcr-login-secret"
REGISTRY_URL="ghcr.io"
USERNAME="${GITHUB_USERNAME:-cdot65}"

# Function to create namespace if it doesn't exist
ensure_namespace() {
    namespace=$1
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        print_color $YELLOW "Creating namespace: $namespace"
        kubectl create namespace "$namespace"
    else
        print_color $GREEN "Namespace exists: $namespace"
    fi
}

# Function to create registry secret
create_registry_secret() {
    # Check if CR_PAT is set
    if [ -z "$CR_PAT" ]; then
        print_color $RED "Error: CR_PAT environment variable is not set"
        print_color $YELLOW "Please export your GitHub Personal Access Token:"
        print_color $BLUE "  export CR_PAT='your-github-pat-token'"
        exit 1
    fi
    
    print_color $YELLOW "Creating Docker registry secret in namespace: $NAMESPACE"
    
    # Create the secret
    kubectl create secret docker-registry "$SECRET_NAME" \
        --docker-server="$REGISTRY_URL" \
        --docker-username="$USERNAME" \
        --docker-password="$CR_PAT" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_color $GREEN "✅ Registry secret '$SECRET_NAME' created/updated successfully"
    
    # Label the secret
    kubectl label secret "$SECRET_NAME" \
        app=prisma-airs-mcp \
        app.kubernetes.io/name=prisma-airs-mcp \
        --namespace="$NAMESPACE" \
        --overwrite
    
    print_color $GREEN "✅ Secret labeled successfully"
}

# Function to verify secret
verify_secret() {
    print_color $YELLOW "Verifying registry secret..."
    
    if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
        print_color $GREEN "✅ Secret '$SECRET_NAME' exists in namespace: $NAMESPACE"
        
        # Get secret details (without exposing the token)
        print_color $BLUE "Secret details:"
        kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.type}' | xargs echo "  Type:"
        kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.data.\.dockerconfigjson}' | wc -c | xargs echo "  Config size (bytes):"
    else
        print_color $RED "❌ Secret '$SECRET_NAME' not found in namespace: $NAMESPACE"
        return 1
    fi
}

# Function to test secret by pulling image
test_secret() {
    print_color $YELLOW "Testing registry secret by creating a test pod..."
    
    # Create a test pod that uses the image
    cat <<EOF | kubectl apply -f - -n "$NAMESPACE"
apiVersion: v1
kind: Pod
metadata:
  name: test-registry-secret
  labels:
    app: test
spec:
  containers:
  - name: test
    image: ghcr.io/cdot65/prisma-airs-mcp:latest
    command: ["echo", "Successfully pulled image!"]
  imagePullSecrets:
  - name: $SECRET_NAME
  restartPolicy: Never
EOF
    
    # Wait for pod to complete
    print_color $YELLOW "Waiting for test pod to complete..."
    kubectl wait --for=condition=Ready pod/test-registry-secret -n "$NAMESPACE" --timeout=60s || {
        print_color $RED "❌ Test pod failed to start. Checking pod status..."
        kubectl describe pod test-registry-secret -n "$NAMESPACE"
        kubectl delete pod test-registry-secret -n "$NAMESPACE" --force
        return 1
    }
    
    # Check pod status
    status=$(kubectl get pod test-registry-secret -n "$NAMESPACE" -o jsonpath='{.status.phase}')
    if [ "$status" = "Succeeded" ] || [ "$status" = "Running" ]; then
        print_color $GREEN "✅ Successfully pulled image using registry secret!"
    else
        print_color $RED "❌ Failed to pull image. Pod status: $status"
    fi
    
    # Cleanup
    kubectl delete pod test-registry-secret -n "$NAMESPACE" --force
}

# Main execution
case "${1:-create}" in
    create)
        print_color $BLUE "🔐 GitHub Container Registry Secret Setup"
        print_color $BLUE "========================================="
        ensure_namespace "$NAMESPACE"
        create_registry_secret
        verify_secret
        ;;
    verify)
        verify_secret
        ;;
    test)
        verify_secret && test_secret
        ;;
    delete)
        print_color $YELLOW "Deleting registry secret..."
        kubectl delete secret "$SECRET_NAME" -n "$NAMESPACE" || print_color $YELLOW "Secret not found"
        ;;
    help|*)
        print_color $BLUE "GitHub Container Registry Secret Management"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  create  - Create or update the registry secret (default)"
        echo "  verify  - Verify the secret exists"
        echo "  test    - Test the secret by pulling an image"
        echo "  delete  - Delete the registry secret"
        echo ""
        echo "Environment Variables:"
        echo "  CR_PAT          - GitHub Personal Access Token (required)"
        echo "  NAMESPACE       - Kubernetes namespace (default: prisma-airs-mcp-server)"
        echo "  GITHUB_USERNAME - GitHub username (default: cdot65)"
        echo ""
        echo "Example:"
        echo "  export CR_PAT='ghp_xxxxxxxxxxxxxxxxxxxx'"
        echo "  $0 create"
        ;;
esac