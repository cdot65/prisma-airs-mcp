#!/bin/bash
# Script to copy wildcard TLS certificate to prisma-airs-mcp-server namespace

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
SOURCE_NAMESPACE="kube-system"
TARGET_NAMESPACE="prisma-airs-mcp-server"
SECRET_NAME="wildcard-cdot-io-tls"

# Check if secret exists in source namespace
if ! kubectl get secret "$SECRET_NAME" -n "$SOURCE_NAMESPACE" &> /dev/null; then
    print_color $RED "Error: Secret '$SECRET_NAME' not found in namespace '$SOURCE_NAMESPACE'"
    exit 1
fi

# Ensure target namespace exists
if ! kubectl get namespace "$TARGET_NAMESPACE" &> /dev/null; then
    print_color $YELLOW "Namespace '$TARGET_NAMESPACE' doesn't exist. Please create it first."
    exit 1
fi

# Check if secret already exists in target namespace
if kubectl get secret "$SECRET_NAME" -n "$TARGET_NAMESPACE" &> /dev/null; then
    print_color $YELLOW "Secret '$SECRET_NAME' already exists in namespace '$TARGET_NAMESPACE'"
    read -p "Do you want to replace it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_color $YELLOW "Skipping certificate copy"
        exit 0
    fi
fi

# Copy the secret
print_color $BLUE "Copying TLS certificate from '$SOURCE_NAMESPACE' to '$TARGET_NAMESPACE'..."

kubectl get secret "$SECRET_NAME" -n "$SOURCE_NAMESPACE" -o yaml | \
    sed "s/namespace: $SOURCE_NAMESPACE/namespace: $TARGET_NAMESPACE/" | \
    kubectl apply -f -

print_color $GREEN "✅ TLS certificate copied successfully!"

# Verify
if kubectl get secret "$SECRET_NAME" -n "$TARGET_NAMESPACE" &> /dev/null; then
    print_color $GREEN "✅ Verified: Secret exists in namespace '$TARGET_NAMESPACE'"
else
    print_color $RED "❌ Error: Failed to verify secret in namespace '$TARGET_NAMESPACE'"
    exit 1
fi