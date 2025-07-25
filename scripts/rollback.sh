#!/bin/bash
# Rollback script for Kubernetes deployments

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="prisma-airs"
DEPLOYMENT_NAME="prisma-airs-mcp"

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show rollout history
show_history() {
    print_color $BLUE "=== Rollout History ==="
    kubectl rollout history deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}
    echo ""
}

# Function to perform rollback
perform_rollback() {
    revision=$1
    
    if [ -z "$revision" ]; then
        print_color $YELLOW "Rolling back to previous version..."
        kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}
    else
        print_color $YELLOW "Rolling back to revision ${revision}..."
        kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --to-revision=${revision}
    fi
    
    # Monitor rollback
    print_color $BLUE "Monitoring rollback..."
    kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}
    
    print_color $GREEN "✅ Rollback completed successfully"
}

# Main function
main() {
    print_color $CYAN "=== Kubernetes Deployment Rollback ==="
    echo ""
    
    # Check if deployment exists
    if ! kubectl get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} &> /dev/null; then
        print_color $RED "Deployment ${DEPLOYMENT_NAME} not found in namespace ${NAMESPACE}"
        exit 1
    fi
    
    # Show current deployment info
    print_color $YELLOW "Current deployment:"
    kubectl get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} -o wide
    echo ""
    
    # Show rollout history
    show_history
    
    # Get revision from command line or prompt
    if [ $# -eq 0 ]; then
        read -p "Enter revision number to rollback to (or press Enter for previous): " REVISION
    else
        REVISION=$1
    fi
    
    # Confirm rollback
    if [ -z "$REVISION" ]; then
        read -p "Rollback to previous version? (y/N) " -n 1 -r
    else
        read -p "Rollback to revision ${REVISION}? (y/N) " -n 1 -r
    fi
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_color $RED "Rollback cancelled."
        exit 1
    fi
    
    # Perform rollback
    perform_rollback "$REVISION"
    
    # Show updated deployment info
    echo ""
    print_color $YELLOW "Updated deployment:"
    kubectl get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} -o wide
    echo ""
    kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}
}

# Run main function
main "$@"