#!/bin/bash

# Local Documentation Testing Script
# This script helps you test the documentation site locally before pushing

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🚀 Prisma AIRS MCP Documentation - Local Testing"
echo "================================================"

# Check if Ruby is installed
if ! command -v ruby &> /dev/null; then
    echo "❌ Ruby is not installed. Please install Ruby first."
    echo "   Visit: https://www.ruby-lang.org/en/documentation/installation/"
    exit 1
fi

# Check if Bundler is installed
if ! command -v bundle &> /dev/null; then
    echo "📦 Installing Bundler..."
    gem install bundler
fi

cd "$DOCS_DIR"

# Install dependencies
echo ""
echo "📚 Installing dependencies..."
bundle install

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
rm -rf _site .jekyll-cache

# Build the site
echo ""
echo "🔨 Building documentation site..."
bundle exec jekyll build --config _config.yml,_config_dev.yml

# Run HTML proofer
echo ""
echo "🔍 Checking for HTML issues..."
if command -v htmlproofer &> /dev/null; then
    htmlproofer ./_site --disable-external --allow-hash-href --ignore-urls "/^#/" || true
else
    echo "⚠️  HTML Proofer not installed. Skipping HTML validation."
    echo "   Install with: gem install html-proofer"
fi

# Start the server
echo ""
echo "🌐 Starting local server..."
echo "   URL: http://localhost:4000"
echo "   Press Ctrl+C to stop"
echo ""

bundle exec jekyll serve --config _config.yml,_config_dev.yml --livereload