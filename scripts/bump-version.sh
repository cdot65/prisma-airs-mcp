#!/bin/bash

# bump-version.sh - Bump version in version.json and sync across project
# Usage: ./scripts/bump-version.sh [major|minor|patch|x.y.z]

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current version
CURRENT_VERSION=$(jq -r '.version' version.json)
if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${RED}Error: Could not read version from version.json${NC}"
    exit 1
fi

# Parse current version
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Determine new version based on argument
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Current version: $CURRENT_VERSION${NC}"
    echo ""
    echo "Usage: $0 [major|minor|patch|x.y.z]"
    echo ""
    echo "Examples:"
    echo "  $0 patch     # Bump patch version (e.g., 1.0.0 -> 1.0.1)"
    echo "  $0 minor     # Bump minor version (e.g., 1.0.0 -> 1.1.0)"
    echo "  $0 major     # Bump major version (e.g., 1.0.0 -> 2.0.0)"
    echo "  $0 1.2.3     # Set specific version"
    exit 0
fi

# Calculate new version
case "$1" in
    major)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        BUMP_TYPE="major"
        ;;
    minor)
        NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
        BUMP_TYPE="minor"
        ;;
    patch)
        NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
        BUMP_TYPE="patch"
        ;;
    *)
        # Check if it's a valid version format
        if [[ $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            NEW_VERSION="$1"
            BUMP_TYPE="specific"
        else
            echo -e "${RED}Error: Invalid version format '$1'${NC}"
            echo "Use 'major', 'minor', 'patch', or a version like '1.2.3'"
            exit 1
        fi
        ;;
esac

echo -e "${BLUE}Bumping version from $CURRENT_VERSION to $NEW_VERSION${NC}"

# Update version.json with new version and date
TEMP_FILE=$(mktemp)
jq --arg version "$NEW_VERSION" \
   --arg date "$(date +%Y-%m-%d)" \
   --arg desc "Version bump: $BUMP_TYPE" \
   '.version = $version | .date = $date | .description = $desc' \
   version.json > "$TEMP_FILE"
mv "$TEMP_FILE" version.json

# Run sync script to update all files
echo -e "${YELLOW}Synchronizing version across project...${NC}"
"$(dirname "$0")/sync-version.sh"

echo ""
echo -e "${GREEN}✓ Version bumped to $NEW_VERSION${NC}"
echo ""
echo "Next steps:"
echo "1. Update release notes in docs/_developers/release-notes.md"
echo "2. Commit changes: git add -A && git commit -m \"chore: bump version to $NEW_VERSION\""
echo "3. Create tag: git tag -a \"v$NEW_VERSION\" -m \"Release version $NEW_VERSION\""
echo "4. Push changes: git push origin main && git push origin \"v$NEW_VERSION\""