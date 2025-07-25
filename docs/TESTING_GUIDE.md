# Documentation Testing Guide

This guide explains how to test the Prisma AIRS MCP documentation locally before deploying to GitHub Pages.

## Prerequisites

1. **Ruby** (2.7 or higher)
   - macOS: `brew install ruby`
   - Ubuntu: `sudo apt-get install ruby-full`
   - Windows: Use [RubyInstaller](https://rubyinstaller.org/)

2. **Bundler**
   - Install: `gem install bundler`

3. **Node.js** (optional, for link checking)
   - Install from [nodejs.org](https://nodejs.org/)

## Quick Start

### 1. Install Dependencies

```bash
cd docs
bundle install
```

### 2. Run Local Server

Use our convenience script:

```bash
./scripts/test-local.sh
```

Or manually:

```bash
bundle exec jekyll serve --livereload
```

Visit http://localhost:4000 to see the site.

## Testing Workflow

### 1. Before Making Changes

Always start with a clean build:

```bash
cd docs
rm -rf _site .jekyll-cache
bundle exec jekyll build
```

### 2. During Development

Run the development server with live reload:

```bash
bundle exec jekyll serve --livereload --config _config.yml,_config_dev.yml
```

Features in development mode:
- No baseurl (works on localhost)
- Drafts are shown
- Faster incremental builds
- Verbose output

### 3. Before Committing

Run the validation script:

```bash
./scripts/validate-docs.sh
```

This checks for:
- Required files
- Valid YAML front matter
- Broken internal links
- Missing images
- Jekyll configuration

### 4. Test Production Build

Build with production settings:

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

Then test with a local server:

```bash
cd _site
python3 -m http.server 8000
# Or: npx serve
```

Visit http://localhost:8000/prisma-airs-mcp/

## Common Testing Scenarios

### Test Navigation

1. Click through all navigation links
2. Verify sidebar highlights current page
3. Test mobile menu on small screens
4. Check breadcrumb navigation

### Test Interactive Features

1. **Table of Contents**
   - Verify auto-generation
   - Test smooth scrolling
   - Check active section highlighting

2. **Code Blocks**
   - Test copy button functionality
   - Verify syntax highlighting
   - Check line numbers (where applicable)

3. **Search** (if implemented)
   - Test search functionality
   - Verify result relevance
   - Check keyboard shortcuts

### Test Responsive Design

Use browser dev tools to test:
- Mobile (320px - 768px)
- Tablet (768px - 1024px)
- Desktop (1024px+)

Key areas to check:
- Navigation menu collapse
- Content readability
- Table scrolling
- Code block overflow

### Test Cross-Browser

Test in multiple browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (macOS)
- Mobile browsers

## Automated Testing

### GitHub Actions

Our CI/CD pipeline automatically:
1. Builds the Jekyll site
2. Runs HTML validation
3. Checks for broken links
4. Deploys to GitHub Pages (on main branch)

### Local CI Testing

Simulate the CI environment locally:

```bash
# Build the site
bundle exec jekyll build

# Install and run HTML proofer
gem install html-proofer
htmlproofer ./_site --disable-external --allow-hash-href

# Check links with linkinator
npx linkinator ./_site --recurse
```

## Troubleshooting

### Build Errors

**"Liquid Exception"**
- Check YAML front matter syntax
- Verify variable names in templates
- Look for unclosed tags

**"Page not found"**
- Check file permissions
- Verify file extensions (.md)
- Check permalinks in front matter

### Styling Issues

**CSS not loading**
- Check baseurl in development
- Clear browser cache
- Verify asset paths

**Layout broken**
- Check for missing closing tags
- Validate HTML structure
- Test without custom CSS

### Performance Issues

**Slow builds**
- Use incremental builds
- Reduce number of plugins
- Optimize images

**Slow page loads**
- Check image sizes
- Minimize JavaScript
- Enable caching headers

## Deployment Checklist

Before deploying to production:

- [ ] Run `./scripts/validate-docs.sh`
- [ ] Test all navigation paths
- [ ] Verify all images load
- [ ] Check responsive design
- [ ] Test in multiple browsers
- [ ] Build with production config
- [ ] Review Google Analytics setup
- [ ] Check meta tags and SEO
- [ ] Verify external links
- [ ] Test 404 page

## Tips for Content Authors

1. **Use relative links** with `site.baseurl`:
   ```markdown
   [Link Text]({{ site.baseurl }}/developers/guide)
   ```

2. **Include front matter** on all pages:
   ```yaml
   ---
   layout: documentation
   title: Page Title
   description: Brief description
   category: developers
   ---
   ```

3. **Test code examples** to ensure they work

4. **Optimize images** before adding:
   - Use appropriate formats (PNG, JPG, WebP)
   - Compress images
   - Provide alt text

5. **Follow naming conventions**:
   - Files: `kebab-case.md`
   - Directories: `kebab-case/`
   - No spaces or special characters

## Getting Help

If you encounter issues:

1. Check the [Jekyll documentation](https://jekyllrb.com/docs/)
2. Review error messages carefully
3. Search for similar issues on GitHub
4. Ask in the project discussions

Happy documenting! 📚