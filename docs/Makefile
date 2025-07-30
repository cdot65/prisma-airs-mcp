# Prisma AIRS MCP Documentation Makefile
# Convenient commands for documentation development

.PHONY: help install clean build serve test validate deploy doctor

# Default target
help:
	@echo "Prisma AIRS MCP Documentation Commands"
	@echo "====================================="
	@echo "make install    - Install Ruby dependencies"
	@echo "make serve      - Start local development server"
	@echo "make build      - Build the site for production"
	@echo "make test       - Run all tests and validation"
	@echo "make validate   - Validate documentation structure"
	@echo "make clean      - Remove build artifacts"
	@echo "make doctor     - Check Jekyll environment"
	@echo ""
	@echo "Quick start: make install && make serve"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@bundle install
	@echo "✅ Dependencies installed!"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf _site .jekyll-cache .sass-cache
	@echo "✅ Clean complete!"

# Build for production
build: clean
	@echo "🔨 Building site for production..."
	@JEKYLL_ENV=production bundle exec jekyll build
	@echo "✅ Build complete! Site in _site/"

# Start development server
serve:
	@echo "🚀 Starting development server..."
	@echo "   URL: http://localhost:4000"
	@echo "   Press Ctrl+C to stop"
	@bundle exec jekyll serve --config _config.yml,_config_dev.yml --livereload

# Run tests
test: validate
	@echo "🧪 Running tests..."
	@bundle exec jekyll build --config _config.yml,_config_dev.yml
	@if command -v htmlproofer >/dev/null 2>&1; then \
		echo "🔍 Running HTML proofer..."; \
		htmlproofer ./_site --disable-external --allow-hash-href --ignore-urls "/^#/" || true; \
	else \
		echo "⚠️  HTML proofer not installed. Skipping..."; \
	fi
	@echo "✅ Tests complete!"

# Validate documentation
validate:
	@echo "🔍 Validating documentation..."
	@./scripts/validate-docs.sh

# Run Jekyll doctor
doctor:
	@echo "👨‍⚕️ Running Jekyll doctor..."
	@bundle exec jekyll doctor
	@echo ""
	@echo "📋 Environment info:"
	@ruby --version
	@bundle --version
	@bundle exec jekyll --version

# Deploy to GitHub Pages (requires proper permissions)
deploy: test
	@echo "🚀 Deploying to GitHub Pages..."
	@echo "⚠️  Note: Deployment is handled by GitHub Actions"
	@echo "   Push to main branch to trigger deployment"
	@echo ""
	@echo "   To deploy manually, ensure GitHub Pages is configured:"
	@echo "   Settings → Pages → Source: Deploy from branch"
	@echo "   Branch: main, Folder: /docs"

# Install development tools
dev-tools:
	@echo "🛠️  Installing development tools..."
	@gem install html-proofer
	@npm install -g linkinator
	@echo "✅ Development tools installed!"

# Create a new documentation page
new-page:
	@read -p "Enter page path (e.g., developers/new-guide): " path; \
	read -p "Enter page title: " title; \
	read -p "Enter page description: " desc; \
	mkdir -p $$(dirname "_$$path.md"); \
	echo "---" > "_$$path.md"; \
	echo "layout: documentation" >> "_$$path.md"; \
	echo "title: $$title" >> "_$$path.md"; \
	echo "description: $$desc" >> "_$$path.md"; \
	echo "category: $$(echo $$path | cut -d'/' -f1)" >> "_$$path.md"; \
	echo "---" >> "_$$path.md"; \
	echo "" >> "_$$path.md"; \
	echo "## Overview" >> "_$$path.md"; \
	echo "" >> "_$$path.md"; \
	echo "Content goes here..." >> "_$$path.md"; \
	echo "✅ Created _$$path.md"

# Check for broken links
check-links: build
	@echo "🔗 Checking for broken links..."
	@if command -v linkinator >/dev/null 2>&1; then \
		cd _site && linkinator . --recurse --skip "^(?!http://localhost)"; \
	else \
		echo "⚠️  linkinator not installed. Run: npm install -g linkinator"; \
	fi

# Start production preview
preview: build
	@echo "👀 Starting production preview..."
	@echo "   URL: http://localhost:8000/prisma-airs-mcp/"
	@cd _site && python3 -m http.server 8000

# Update dependencies
update:
	@echo "📦 Updating dependencies..."
	@bundle update
	@echo "✅ Dependencies updated!"

# Show file statistics
stats:
	@echo "📊 Documentation Statistics"
	@echo "=========================="
	@echo "Markdown files: $$(find . -name '*.md' -type f | wc -l)"
	@echo "Total lines: $$(find . -name '*.md' -type f -exec wc -l {} + | tail -1 | awk '{print $$1}')"
	@echo "Images: $$(find assets/img -type f 2>/dev/null | wc -l || echo 0)"
	@echo ""
	@echo "By section:"
	@echo "  Developers: $$(find _developers -name '*.md' -type f 2>/dev/null | wc -l || echo 0) pages"
	@echo "  Security: $$(find _security -name '*.md' -type f 2>/dev/null | wc -l || echo 0) pages"
	@echo "  Enterprise: $$(find _enterprise -name '*.md' -type f 2>/dev/null | wc -l || echo 0) pages"
	@echo "  API: $$(find _api -name '*.md' -type f 2>/dev/null | wc -l || echo 0) pages"