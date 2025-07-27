#!/bin/bash

# sync-version.sh - Synchronize version across all project files
# Usage: ./scripts/sync-version.sh

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from version.json
VERSION=$(jq -r '.version' version.json)

if [ -z "$VERSION" ]; then
    echo "Error: Could not read version from version.json"
    exit 1
fi

echo -e "${YELLOW}Synchronizing version $VERSION across project files...${NC}"

# Update package.json
echo "Updating package.json..."
jq --arg version "$VERSION" '.version = $version' package.json > package.tmp.json
mv package.tmp.json package.json

# Update claude.json
echo "Updating claude.json..."
jq --arg version "$VERSION" '.version = $version' claude.json > claude.tmp.json
mv claude.tmp.json claude.json

# Update version badge in README.md
echo "Updating README.md version badge..."
sed -i.bak "s/version-[0-9]\+\.[0-9]\+\.[0-9]\+-blue/version-$VERSION-blue/g" README.md
rm -f README.md.bak

# Update documentation files
echo "Updating documentation references..."

# Update API documentation
if [ -f "docs/_developers/api.md" ]; then
    sed -i.bak "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" docs/_developers/api.md
    rm -f docs/_developers/api.md.bak
fi

# Update deployment documentation
if [ -f "docs/_deployment/source.md" ]; then
    sed -i.bak "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" docs/_deployment/source.md
    rm -f docs/_deployment/source.md.bak
fi

# Update Docker examples
if [ -f "docker/README.md" ]; then
    sed -i.bak "s/MCP_SERVER_VERSION=[0-9]\+\.[0-9]\+\.[0-9]\+/MCP_SERVER_VERSION=$VERSION/g" docker/README.md
    sed -i.bak "s/--version v[0-9]\+\.[0-9]\+\.[0-9]\+/--version v$VERSION/g" docker/README.md
    rm -f docker/README.md.bak
fi

# Update test files (optional - only if you want tests to use current version)
# echo "Updating test files..."
# find tests -name "*.ts" -type f -exec sed -i.bak "s/'1\.0\.0'/'$VERSION'/g" {} \;
# find tests -name "*.ts.bak" -type f -delete

echo -e "${GREEN}✓ Version synchronized to $VERSION${NC}"
echo ""
echo "Files updated:"
echo "  - version.json (source)"
echo "  - package.json"
echo "  - claude.json"
echo "  - README.md"
echo "  - Documentation files"
echo ""
echo "Remember to commit these changes!"