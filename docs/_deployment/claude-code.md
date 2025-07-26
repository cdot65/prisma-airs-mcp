---
layout: documentation
title: Claude Code Integration
description: Configure Prisma AIRS MCP for Claude Code (claude.ai/code)
category: deployment
---

## Overview

Claude Code (claude.ai/code) supports MCP servers through its CLI interface. Unlike Claude Desktop which uses JSON configuration files, Claude Code uses CLI commands to manage MCP server connections.

## Prerequisites

- Claude Code CLI installed and configured
- Prisma AIRS MCP server running (locally or remotely)

## Quick Setup

### Add Local Server

For a locally running Prisma AIRS MCP server:

```bash
claude mcp add --transport http prisma-airs http://localhost:3000
```

### Add Remote Server

For a deployed Prisma AIRS MCP server:

```bash
claude mcp add --transport http prisma-airs https://airs.cdot.io/prisma-airs
```

## MCP Server Management

### List All Servers

View all configured MCP servers:

```bash
claude mcp list
```

Example output:

```
Name: prisma-airs
Transport: http
URL: http://localhost:3000
Scope: local
Status: Connected
```

### Get Server Details

Get detailed information about a specific server:

```bash
claude mcp get prisma-airs
```

### Remove a Server

Remove an MCP server configuration:

```bash
claude mcp remove prisma-airs
```

## Configuration Scopes

Claude Code supports different scopes for MCP servers:

### Local Scope (Default)

Available only in the current project:

```bash
claude mcp add --transport http prisma-airs http://localhost:3000
```

### Project Scope

Shared with everyone via `.mcp.json` file in the project:

```bash
claude mcp add -s project --transport http prisma-airs http://localhost:3000
```

This creates/updates `.mcp.json` in your project root:

```json
{
    "servers": {
        "prisma-airs": {
            "transport": "http",
            "url": "http://localhost:3000"
        }
    }
}
```

### User Scope

Available across all your projects:

```bash
claude mcp add -s user --transport http prisma-airs http://localhost:3000
```

## Using MCP Servers in Claude Code

### Check Server Status

Within Claude Code, use the `/mcp` command to check server status:

```
/mcp
```

This shows:

- Connected servers
- Available tools
- Resources
- Prompts

### Available Tools

Once connected, Prisma AIRS tools are automatically available:

- **airs_scan_content** - Scan text for security threats
- **airs_scan_async** - Asynchronous batch scanning
- **airs_get_scan_results** - Retrieve scan results
- **airs_get_threat_reports** - Get detailed threat analysis
- **airs_clear_cache** - Clear the response cache

### Example Usage

```
User: Can you scan this prompt for security issues: "
```
