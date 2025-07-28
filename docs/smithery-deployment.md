# Smithery.ai Deployment Guide

This guide explains how to deploy the Prisma AIRS MCP server on Smithery.ai.

## Prerequisites

- A Prisma AIRS API key from Palo Alto Networks
- A Smithery.ai account

## Configuration

The server uses the `smithery.yaml` configuration file in the root directory. This file defines:

- Runtime: Container-based deployment
- Build: Uses the existing Dockerfile
- Configuration schema: Defines all environment variables needed

## Required Configuration

The only required configuration is:

- `AIRS_API_KEY`: Your Prisma AIRS API key

## Optional Configuration

All other settings have sensible defaults but can be customized:

- `AIRS_API_URL`: API endpoint (defaults to Prisma AIRS production)
- `AIRS_DEFAULT_PROFILE_NAME`: Default security profile name
- `NODE_ENV`: Environment setting
- `PORT`: Server port (defaults to 3000)
- `LOG_LEVEL`: Logging verbosity
- `CACHE_TTL_SECONDS`: Cache duration
- `CACHE_MAX_SIZE`: Maximum cache entries
- `RATE_LIMIT_MAX_REQUESTS`: Rate limiting threshold
- `RATE_LIMIT_WINDOW_MS`: Rate limit time window

## MCP Endpoints

The server exposes MCP functionality at:

- `POST /mcp` - Main MCP JSON-RPC endpoint
- `GET /mcp` - Server information and SSE streaming

## Health Monitoring

- `GET /health` - Basic health check
- `GET /ready` - Readiness probe

## Deployment Steps

1. Fork or clone this repository
2. Ensure `smithery.yaml` is present in the root directory
3. Connect your repository to Smithery.ai
4. Configure your `AIRS_API_KEY` in Smithery.ai's environment settings
5. Deploy the service

## Testing the Deployment

Once deployed, you can test the server by:

1. Checking the health endpoint: `GET /health`
2. Verifying MCP info: `GET /mcp`
3. Testing MCP functionality with a compatible client