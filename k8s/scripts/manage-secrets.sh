#!/bin/bash
# Script to manage Prisma AIRS MCP secrets in Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to create secret
create_secret() {
    namespace=$1
    api_key=$2
    
    if [ -z "$namespace" ] || [ -z "$api_key" ]; then
        print_color $RED "Error: Namespace and API key are required"
        exit 1
    fi
    
    print_color $YELLOW "Creating secret in namespace: $namespace"
    
    kubectl create secret generic prisma-airs-mcp-secrets \
        --from-literal=airs.api.key="$api_key" \
        --namespace="$namespace" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_color $GREEN "Secret created/updated successfully"
}

# Function to verify secret
verify_secret() {
    namespace=$1
    
    if [ -z "$namespace" ]; then
        print_color $RED "Error: Namespace is required"
        exit 1
    fi
    
    print_color $YELLOW "Verifying secret in namespace: $namespace"
    
    if kubectl get secret prisma-airs-mcp-secrets -n "$namespace" >/dev/null 2>&1; then
        print_color $GREEN "Secret exists in namespace: $namespace"
        
        # Check if the key exists
        if kubectl get secret prisma-airs-mcp-secrets -n "$namespace" -o jsonpath='{.data.airs\.api\.key}' | base64 -d >/dev/null 2>&1; then
            print_color $GREEN "API key is present in the secret"
        else
            print_color $RED "API key is missing from the secret"
        fi
    else
        print_color $RED "Secret does not exist in namespace: $namespace"
    fi
}

# Function to rotate secret
rotate_secret() {
    namespace=$1
    new_api_key=$2
    
    if [ -z "$namespace" ] || [ -z "$new_api_key" ]; then
        print_color $RED "Error: Namespace and new API key are required"
        exit 1
    fi
    
    print_color $YELLOW "Rotating secret in namespace: $namespace"
    
    # Create new secret
    create_secret "$namespace" "$new_api_key"
    
    # Restart deployment to pick up new secret
    print_color $YELLOW "Restarting deployment to pick up new secret..."
    kubectl rollout restart deployment -l app=prisma-airs-mcp -n "$namespace"
    
    print_color $GREEN "Secret rotation completed"
}

# Function to create secret from .env file
create_from_env() {
    namespace=$1
    env_file=${2:-.env}
    
    if [ ! -f "$env_file" ]; then
        print_color $RED "Error: .env file not found at: $env_file"
        exit 1
    fi
    
    # Extract AIRS_API_KEY from .env file
    api_key=$(grep -E "^AIRS_API_KEY=" "$env_file" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$api_key" ]; then
        print_color $RED "Error: AIRS_API_KEY not found in $env_file"
        exit 1
    fi
    
    print_color $GREEN "Found API key in .env file"
    create_secret "$namespace" "$api_key"
}

# Main script
case "$1" in
    create)
        if [ $# -eq 2 ]; then
            # If only namespace provided, try to read from .env
            print_color $YELLOW "Reading API key from .env file..."
            create_from_env "$2"
        elif [ $# -eq 3 ]; then
            # If api-key provided, use it directly
            create_secret "$2" "$3"
        else
            print_color $RED "Usage: $0 create <namespace> [api-key]"
            print_color $YELLOW "If api-key is not provided, it will be read from .env file"
            exit 1
        fi
        ;;
    create-from-env)
        if [ $# -lt 2 ]; then
            print_color $RED "Usage: $0 create-from-env <namespace> [env-file]"
            exit 1
        fi
        create_from_env "$2" "${3:-.env}"
        ;;
    verify)
        if [ $# -ne 2 ]; then
            print_color $RED "Usage: $0 verify <namespace>"
            exit 1
        fi
        verify_secret "$2"
        ;;
    rotate)
        if [ $# -ne 3 ]; then
            print_color $RED "Usage: $0 rotate <namespace> <new-api-key>"
            exit 1
        fi
        rotate_secret "$2" "$3"
        ;;
    *)
        print_color $YELLOW "Prisma AIRS MCP Secret Management"
        echo ""
        echo "Usage:"
        echo "  $0 create <namespace> [api-key]       Create secret (reads from .env if no key)"
        echo "  $0 create-from-env <namespace> [file] Create secret from env file"
        echo "  $0 verify <namespace>                 Verify secret exists"
        echo "  $0 rotate <namespace> <new-api-key>   Rotate secret and restart pods"
        echo ""
        echo "Examples:"
        echo "  $0 create prisma-airs-mcp-server                 # Read from .env file"
        echo "  $0 create prisma-airs-mcp-server 'my-api-key'    # Use provided key"
        echo "  $0 create-from-env prisma-airs-mcp-server .env.prod"
        echo "  $0 verify prisma-airs-mcp-server"
        echo "  $0 rotate prisma-airs-mcp-server 'new-key'"
        exit 1
        ;;
esac