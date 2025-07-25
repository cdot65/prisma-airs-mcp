#!/bin/bash

# Documentation Validation Script
# Run this before committing to ensure documentation quality

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🔍 Prisma AIRS MCP Documentation - Validation"
echo "============================================="

cd "$DOCS_DIR"

# Check for required files
echo ""
echo "📋 Checking required files..."
REQUIRED_FILES=(
    "_config.yml"
    "Gemfile"
    "index.md"
    "_layouts/home.html"
    "_layouts/documentation.html"
    "assets/css/style.css"
    "assets/js/main.js"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    else
        echo "   ✅ Found: $file"
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo ""
    echo "❌ Missing $MISSING_FILES required files!"
    exit 1
fi

# Validate Jekyll configuration
echo ""
echo "🔧 Validating Jekyll configuration..."
bundle exec jekyll doctor

# Check for broken internal links in markdown files
echo ""
echo "🔗 Checking for broken internal links..."
BROKEN_LINKS=0
while IFS= read -r -d '' file; do
    # Extract internal links from markdown files
    grep -Eo '\[([^]]+)\]\(([^)]+)\)' "$file" | grep -E '\]\(/' | while read -r link; do
        # Extract the path from the link
        path=$(echo "$link" | sed -E 's/.*\]\(([^)]+)\).*/\1/')
        # Remove anchor tags
        path=$(echo "$path" | sed 's/#.*//')
        # Remove leading slash for relative check
        relative_path=$(echo "$path" | sed 's/^\///')
        
        # Check if it's a site.baseurl link
        if [[ "$path" == "{{ site.baseurl }}"* ]]; then
            continue
        fi
        
        # Check if the file exists
        if [[ ! -f "$DOCS_DIR/$relative_path" ]] && [[ ! -f "$DOCS_DIR/$relative_path.md" ]] && [[ ! -f "$DOCS_DIR/$relative_path/index.md" ]]; then
            echo "   ❌ Broken link in $file: $path"
            BROKEN_LINKS=$((BROKEN_LINKS + 1))
        fi
    done
done < <(find . -name "*.md" -type f -print0)

if [ $BROKEN_LINKS -gt 0 ]; then
    echo "   ⚠️  Found $BROKEN_LINKS broken internal links"
fi

# Check YAML front matter
echo ""
echo "📄 Validating YAML front matter..."
YAML_ERRORS=0
while IFS= read -r -d '' file; do
    # Skip files without front matter
    if ! head -n 1 "$file" | grep -q "^---$"; then
        continue
    fi
    
    # Extract front matter
    awk '/^---$/{p++}p==1{print}p==2{exit}' "$file" > /tmp/frontmatter.yml
    
    # Validate YAML
    if ! ruby -ryaml -e "YAML.load_file('/tmp/frontmatter.yml')" 2>/dev/null; then
        echo "   ❌ Invalid YAML in: $file"
        YAML_ERRORS=$((YAML_ERRORS + 1))
    fi
done < <(find . -name "*.md" -type f -print0)

if [ $YAML_ERRORS -gt 0 ]; then
    echo "   ❌ Found $YAML_ERRORS files with invalid YAML"
    exit 1
else
    echo "   ✅ All YAML front matter is valid"
fi

# Check image references
echo ""
echo "🖼️  Checking image references..."
IMAGE_ERRORS=0
while IFS= read -r -d '' file; do
    grep -Eo '!\[([^]]*)\]\(([^)]+)\)' "$file" | while read -r img; do
        img_path=$(echo "$img" | sed -E 's/.*\]\(([^)]+)\).*/\1/')
        # Skip external images
        if [[ "$img_path" == http* ]]; then
            continue
        fi
        # Remove leading slash and baseurl
        img_path=$(echo "$img_path" | sed 's/{{ site.baseurl }}\///')
        img_path=$(echo "$img_path" | sed 's/^\///')
        
        if [[ ! -f "$DOCS_DIR/$img_path" ]]; then
            echo "   ⚠️  Missing image in $file: $img_path"
            IMAGE_ERRORS=$((IMAGE_ERRORS + 1))
        fi
    done
done < <(find . -name "*.md" -type f -print0)

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="
if [ $MISSING_FILES -eq 0 ] && [ $BROKEN_LINKS -eq 0 ] && [ $YAML_ERRORS -eq 0 ]; then
    echo "✅ All validation checks passed!"
    echo ""
    echo "🚀 Ready to deploy!"
else
    echo "❌ Validation failed with errors:"
    [ $MISSING_FILES -gt 0 ] && echo "   - Missing files: $MISSING_FILES"
    [ $BROKEN_LINKS -gt 0 ] && echo "   - Broken links: $BROKEN_LINKS"
    [ $YAML_ERRORS -gt 0 ] && echo "   - YAML errors: $YAML_ERRORS"
    [ $IMAGE_ERRORS -gt 0 ] && echo "   - Missing images: $IMAGE_ERRORS"
    echo ""
    echo "Please fix these issues before deploying."
    exit 1
fi