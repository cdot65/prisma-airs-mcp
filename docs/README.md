# Prisma AIRS MCP Documentation

This directory contains the GitHub Pages documentation site for Prisma AIRS MCP.

## Structure

```
docs/
├── _config.yml          # Jekyll configuration
├── _layouts/            # Page layouts
├── _includes/           # Reusable components
├── _data/              # Site data files
├── assets/             # CSS, JS, images
├── developers/         # Developer documentation
├── prisma-airs/        # Prisma AIRS documentation
├── enterprise/         # Enterprise documentation
├── api/               # API reference
└── index.md           # Home page
```

## Local Development

1. Install Jekyll and dependencies:

```bash
bundle install
```

2. Run the development server:

```bash
bundle exec jekyll serve --baseurl ""
```

3. Open http://localhost:4000 in your browser

## Deployment

The site automatically builds and deploys to GitHub Pages through GitHub Actions when changes are merged to the main branch.

### Automated CI/CD Process

1. **Pull Request**: When you create a PR that modifies the `docs/` directory:
    - Jekyll site is built and tested
    - HTML is validated
    - Broken links are checked
    - Build status is commented on the PR

2. **Merge to Main**: When the PR is merged:
    - Production site is built
    - Automatically deployed to GitHub Pages
    - Available at: https://cdot65.github.io/prisma-airs-mcp/

### Manual Build

To build the site locally:

```bash
bundle exec jekyll build
```

The built site will be in the `_site` directory

## Adding Content

### Creating a New Page

1. Add a markdown file to the appropriate collection directory
2. Include the required front matter:

```yaml
---
layout: documentation
title: Page Title
description: Brief description
category: developers|prisma-airs|enterprise|api
---
```

### Adding to Navigation

Edit `_includes/sidebar.html` to add new pages to the navigation menu.

## Customization

- **Styles**: Edit `assets/css/style.css`
- **JavaScript**: Edit `assets/js/main.js`
- **Layouts**: Modify files in `_layouts/`
- **Configuration**: Update `_config.yml`

## GitHub Pages Settings

1. Go to repository Settings > Pages
2. Source: GitHub Actions (automatically configured by the workflow)
3. The workflow handles building and deployment
4. Custom domain: (optional)
5. Enforce HTTPS: Recommended

## Enabling GitHub Pages

To enable GitHub Pages for this repository:

1. Go to https://github.com/cdot65/prisma-airs-mcp/settings/pages
2. Under "Build and deployment", select:
    - Source: **GitHub Actions**
3. Save the settings

The GitHub Actions workflow will automatically:

- Build the Jekyll site when changes are pushed to main
- Deploy to https://cdot65.github.io/prisma-airs-mcp/
- Run tests on pull requests before merging

## License

This documentation is part of the Prisma AIRS MCP project.
