---
layout: documentation
title: Build from Source
description: Build and run Prisma AIRS MCP from source code
category: deployment
permalink: /deployment/source/
---

## Overview

Building from source gives you full control over the deployment process and is ideal for development, customization, or when you need specific configurations.

## Prerequisites

- Node.js 18.0 or higher
- pnpm (recommended) or npm package manager
- Git
- Prisma AIRS API key from [Strata Cloud Manager](https://stratacloudmanager.paloaltonetworks.com)

### Installing Prerequisites

**macOS:**

```bash
# Install Node.js using Homebrew
brew install node

# Install pnpm
npm install -g pnpm
```

**Ubuntu/Debian:**

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm
```

**Windows:**

```bash
# Use WSL2 and follow Ubuntu instructions
# Or use Windows Package Manager
winget install OpenJS.NodeJS
npm install -g pnpm
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/cdot65/prisma-airs-mcp.git
cd prisma-airs-mcp
```

### 2. Install Dependencies

Using pnpm (recommended):

```bash
pnpm install
```

Using npm:

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred editor
nano .env  # or vim, code, etc.
```

Required configuration in `.env`:

```env
# Prisma AIRS API Configuration
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-api-key-here

# Profile Configuration (Optional)
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Build the Project

```bash
# Build TypeScript files
pnpm build

# Or with npm
npm run build
```

## Running the Server

### Development Mode

Development mode includes hot reloading and detailed logging:

```bash
# Start with hot reload
pnpm dev

# Or with npm
npm run dev
```

The server will:

- Start on http://localhost:3000
- Automatically restart on file changes
- Show detailed debug logs
- Enable source maps for debugging

### Docker Development Mode

For testing MCP clients with a containerized server:

```bash
# Build and run development container on port 3100
pnpm docker:dev

# This command:
# 1. Builds the development Docker image
# 2. Runs the container on port 3100
# 3. Mounts your .env file for configuration
# 4. Enables hot reload through volume mounts
```

This is ideal for:

- Testing with MCP clients in isolation
- Verifying Docker deployment before production
- Development in a containerized environment

### Production Mode

For production deployment from source:

```bash
# Build and start
pnpm build
pnpm start

# Or with npm
npm run build
npm start
```

### Verification

Test that the server is running:

```bash
# Check health endpoint
curl http://localhost:3000/health

# Test MCP initialization
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

## Development Workflow

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build TypeScript
pnpm start            # Start production server

# Docker Development
pnpm docker:dev       # Build and run dev container on port 3100
pnpm docker:build:dev # Build development Docker image
pnpm docker:run:dev:3100 # Run dev container on port 3100

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests only
pnpm test:integration # Run integration tests

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix linting issues
pnpm format           # Format with Prettier
pnpm typecheck        # Run TypeScript checks
pnpm validate         # Run all checks

# Documentation
pnpm docs:build       # Build documentation
pnpm docs:serve       # Serve documentation locally
```

### Project Structure

```
prisma-airs-mcp/
├── src/                    # Source code
│   ├── index.ts          # Application entry point
│   ├── airs/             # AIRS API client module
│   ├── config/           # Configuration management
│   ├── prompts/          # MCP prompt handlers
│   ├── resources/        # MCP resource handlers
│   ├── tools/            # MCP tool handlers
│   ├── transport/        # HTTP/SSE transport layer
│   ├── types/            # Centralized TypeScript types
│   └── utils/            # Shared utilities
├── tests/                 # Test files
├── docs/                  # Documentation
├── k8s/                   # Kubernetes manifests
├── scripts/               # Build and deployment scripts
└── docker/               # Docker configurations
```

### Making Changes

1. **Create a feature branch:**

    ```bash
    git checkout -b feature/my-feature
    ```

2. **Make your changes and test:**

    ```bash
    # Run tests
    pnpm test

    # Check code quality
    pnpm validate
    ```

3. **Build and verify:**
    ```bash
    pnpm build
    pnpm start
    ```

## Advanced Configuration

### Environment Variables

See the [Configuration Reference]({{ site.baseurl }}/deployment/configuration) for all available options.

### Custom Build Options

**TypeScript Configuration:**

Edit `tsconfig.json` for custom TypeScript settings:

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "commonjs",
        "outDir": "./dist",
        "strict": true
    }
}
```

**ESLint Configuration:**

Customize linting rules in `.eslintrc.json`:

```json
{
    "extends": ["eslint:recommended"],
    "rules": {
        "no-console": "warn"
    }
}
```

### Performance Tuning

**Node.js Options:**

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm start

# Enable profiling
NODE_OPTIONS="--prof" pnpm start
```

**Clustering:**

For multi-core systems, use PM2:

```bash
# Install PM2
npm install -g pm2

# Start with cluster mode
pm2 start dist/index.js -i max --name prisma-airs-mcp

# Monitor
pm2 monit
```

## Troubleshooting

### Common Issues

**Module Not Found**

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**TypeScript Errors**

```bash
# Clean build directory
rm -rf dist
pnpm build
```

**Port Already in Use**

```bash
# Use a different port
PORT=3001 pnpm dev

# Or kill the process
lsof -i :3000
kill -9 <PID>
```

**Permission Errors**

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Debugging

**Enable Debug Logs:**

```bash
LOG_LEVEL=debug pnpm dev
```

**Use Node.js Inspector:**

```bash
# Start with inspector
node --inspect dist/index.js

# Or with development server
pnpm dev --inspect
```

**VSCode Debugging:**

Create `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug Server",
            "skipFiles": ["<node_internals>/**"],
            "program": "${workspaceFolder}/dist/index.js",
            "envFile": "${workspaceFolder}/.env",
            "outFiles": ["${workspaceFolder}/dist/**/*.js"]
        }
    ]
}
```

## Production Deployment

### Systemd Service

Create `/etc/systemd/system/prisma-airs-mcp.service`:

```ini
[Unit]
Description=Prisma AIRS MCP Server
After=network.target

[Service]
Type=simple
User=prisma-airs
WorkingDirectory=/opt/prisma-airs-mcp
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable prisma-airs-mcp
sudo systemctl start prisma-airs-mcp
```

### Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

Example `ecosystem.config.js`:

```javascript
module.exports = {
    apps: [
        {
            name: 'prisma-airs-mcp',
            script: './dist/index.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
        },
    ],
};
```

## Next Steps

- Review the [Configuration Reference]({{ site.baseurl }}/deployment/configuration)
- Follow the [Quick Start Guide]({{ site.baseurl }}/deployment/quickstart)
- Set up [Claude Integration]({{ site.baseurl }}/mcp-clients/claude-desktop/)
- Consider [Docker]({{ site.baseurl }}/deployment/docker) or [Kubernetes]({{ site.baseurl }}/deployment/kubernetes) for easier deployment
