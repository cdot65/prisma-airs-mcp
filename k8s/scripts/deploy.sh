#!/bin/bash
# Script to deploy Prisma AIRS MCP to Kubernetes

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

# Function to check prerequisites
check_prerequisites() {
    print_color $YELLOW "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_color $RED "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check kustomize
    if ! command -v kustomize &> /dev/null; then
        print_color $YELLOW "kustomize is not installed. Using kubectl's built-in kustomize..."
        KUSTOMIZE_CMD="kubectl kustomize"
    else
        KUSTOMIZE_CMD="kustomize build"
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        print_color $RED "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    print_color $GREEN "Prerequisites check passed"
}

# Function to validate environment
validate_environment() {
    env=$1
    case $env in
        development|staging|production)
            return 0
            ;;
        *)
            print_color $RED "Invalid environment: $env"
            print_color $YELLOW "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

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

# Function to deploy
deploy() {
    environment=$1
    namespace=$2
    dry_run=$3
    
    print_color $BLUE "Deploying to $environment environment in namespace: $namespace"
    
    # Build kustomization
    overlay_path="k8s/overlays/$environment"
    
    if [ ! -d "$overlay_path" ]; then
        print_color $RED "Overlay directory not found: $overlay_path"
        exit 1
    fi
    
    # Check if secret exists
    if ! kubectl get secret prisma-airs-mcp-secrets -n "$namespace" &> /dev/null; then
        print_color $YELLOW "WARNING: Secret 'prisma-airs-mcp-secrets' not found in namespace: $namespace"
        print_color $YELLOW "Please create the secret first using:"
        print_color $BLUE "  ./k8s/scripts/manage-secrets.sh create $namespace '<your-api-key>'"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    if [ "$dry_run" = "true" ]; then
        print_color $YELLOW "Running in dry-run mode..."
        $KUSTOMIZE_CMD "$overlay_path" | kubectl apply --dry-run=client -f -
    else
        print_color $YELLOW "Applying configuration..."
        $KUSTOMIZE_CMD "$overlay_path" | kubectl apply -f -
        
        # Wait for rollout
        print_color $YELLOW "Waiting for deployment to be ready..."
        kubectl rollout status deployment -l app=prisma-airs-mcp -n "$namespace" --timeout=300s
        
        # Force rollout restart to ensure fresh image pull
        print_color $YELLOW "Forcing rollout restart to pull fresh images..."
        kubectl rollout restart deployment -l app=prisma-airs-mcp -n "$namespace"
        kubectl rollout status deployment -l app=prisma-airs-mcp -n "$namespace" --timeout=300s
    fi
    
    print_color $GREEN "Deployment completed successfully!"
}

# Function to show deployment status
show_status() {
    namespace=$1
    
    print_color $BLUE "Deployment Status in namespace: $namespace"
    echo ""
    
    print_color $YELLOW "Pods:"
    kubectl get pods -l app=prisma-airs-mcp -n "$namespace"
    echo ""
    
    print_color $YELLOW "Services:"
    kubectl get svc -l app=prisma-airs-mcp -n "$namespace"
    echo ""
    
    print_color $YELLOW "IngressRoutes:"
    kubectl get ingressroute -l app=prisma-airs-mcp -n "$namespace" 2>/dev/null || echo "No IngressRoutes found"
    echo ""
    
    print_color $YELLOW "ConfigMaps:"
    kubectl get configmap -l app=prisma-airs-mcp -n "$namespace"
    echo ""
    
    print_color $YELLOW "Secrets:"
    kubectl get secret -l app=prisma-airs-mcp -n "$namespace"
}

# Function to test deployment
test_deployment() {
    namespace=$1
    
    print_color $BLUE "Testing deployment in namespace: $namespace"
    
    # Get a pod name
    pod=$(kubectl get pods -l app=prisma-airs-mcp -n "$namespace" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod" ]; then
        print_color $RED "No pods found"
        exit 1
    fi
    
    print_color $YELLOW "Testing health endpoint on pod: $pod"
    kubectl exec -n "$namespace" "$pod" -- wget -qO- http://localhost:3000/health || {
        print_color $RED "Health check failed"
        exit 1
    }
    
    print_color $GREEN "Health check passed"
    
    print_color $YELLOW "Testing ready endpoint on pod: $pod"
    kubectl exec -n "$namespace" "$pod" -- wget -qO- http://localhost:3000/ready || {
        print_color $RED "Ready check failed"
        exit 1
    }
    
    print_color $GREEN "Ready check passed"
    
    # Verify image version
    print_color $YELLOW "Verifying deployed image..."
    deployed_image=$(kubectl get deployment prisma-airs-mcp -n "$namespace" -o jsonpath='{.spec.template.spec.containers[0].image}')
    print_color $BLUE "Deployed image: $deployed_image"
    
    # Get actual running image digest
    running_digest=$(kubectl get pods -l app=prisma-airs-mcp -n "$namespace" -o jsonpath='{.items[0].status.containerStatuses[0].imageID}' | cut -d'@' -f2)
    print_color $BLUE "Running image digest: $running_digest"
}

# Main script
case "$1" in
    deploy)
        if [ $# -lt 2 ]; then
            print_color $RED "Usage: $0 deploy <environment> [namespace] [--dry-run]"
            exit 1
        fi
        
        environment=$2
        namespace=${3:-prisma-airs-mcp-server}
        dry_run="false"
        
        if [ "$4" = "--dry-run" ] || [ "$3" = "--dry-run" ]; then
            dry_run="true"
            if [ "$3" = "--dry-run" ]; then
                namespace=prisma-airs-mcp-server
            fi
        fi
        
        validate_environment "$environment"
        check_prerequisites
        ensure_namespace "$namespace"
        deploy "$environment" "$namespace" "$dry_run"
        ;;
    
    status)
        if [ $# -ne 2 ]; then
            print_color $RED "Usage: $0 status <namespace>"
            exit 1
        fi
        show_status "$2"
        ;;
    
    test)
        if [ $# -ne 2 ]; then
            print_color $RED "Usage: $0 test <namespace>"
            exit 1
        fi
        test_deployment "$2"
        ;;
    
    delete)
        if [ $# -lt 2 ]; then
            print_color $RED "Usage: $0 delete <environment> [namespace]"
            exit 1
        fi
        
        environment=$2
        namespace=${3:-prisma-airs-mcp-server}
        
        validate_environment "$environment"
        
        print_color $YELLOW "This will delete all resources for $environment in namespace: $namespace"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $KUSTOMIZE_CMD "k8s/overlays/$environment" | kubectl delete -f - -n "$namespace"
            print_color $GREEN "Resources deleted"
        else
            print_color $YELLOW "Deletion cancelled"
        fi
        ;;
    
    *)
        print_color $BLUE "Prisma AIRS MCP Kubernetes Deployment"
        echo ""
        echo "Usage:"
        echo "  $0 deploy <environment> [namespace] [--dry-run]  Deploy to environment"
        echo "  $0 status <namespace>                             Show deployment status"
        echo "  $0 test <namespace>                               Test deployment health"
        echo "  $0 delete <environment> [namespace]               Delete deployment"
        echo ""
        echo "Environments: development, staging, production"
        echo ""
        echo "Examples:"
        echo "  $0 deploy development                    # Deploy to development namespace"
        echo "  $0 deploy production prod-namespace      # Deploy to custom namespace"
        echo "  $0 deploy staging --dry-run              # Dry run deployment"
        echo "  $0 status production                     # Show production status"
        echo "  $0 test staging                          # Test staging deployment"
        exit 1
        ;;
esac