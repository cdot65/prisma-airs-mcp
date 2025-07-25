# Claude Code Setup Guide

## Quick Start

Start Claude Code from the project root directory:

```bash
claude --add-dir "$(pwd)"
```

## Loading Project Context

Once Claude starts, paste this command to load all essential context:

```
Read .claude/instructions/CLAUDE.md, PRD.md, .claude/context/TASKS.md, .claude/plans/PLAN.md, and .claude/conventions/typescript-style-guide.md to understand the Prisma AIRS MCP Server project, then let me know what you'd like to work on today.
```

## Essential Files

The following files provide complete project context:

- `.claude/instructions/CLAUDE.md` - Development instructions and guidelines
- `PRD.md` - Project requirements and specifications
- `.claude/context/TASKS.md` - Current task tracking and progress
- `.claude/plans/PLAN.md` - Implementation strategy and architecture
- `.claude/conventions/typescript-style-guide.md` - Code style standards

## Additional Context (Load as Needed)

- `.claude/documentation/mcp-full-documentation.txt` - Complete MCP protocol spec
- `.claude/context/prisma-airs-api/openapi-schema.yaml` - AIRS API specification
- `.claude/conventions/.eslintrc.js` - ESLint configuration
- `.claude/conventions/.prettierrc` - Prettier configuration

## Common Tasks

Once Claude Code is running:

- Review tasks: "Show me the current tasks in TASKS.md"
- Run validation: "Run pnpm validate and fix any issues"
- Update progress: "Mark task X as completed in TASKS.md"
- Check style guide: "Show me the naming conventions"

## Project Configuration

The project includes:

- `claude.json` - Defines project metadata and settings
- `.claudeignore` - Specifies files Claude should ignore
- `CLAUDE.md` - Project-specific guidance (in root directory)

## Development Commands

```bash
# Code quality
pnpm run lint:fix    # Fix linting issues
pnpm run format      # Format with Prettier
pnpm run validate    # Run all checks

# Development
pnpm dev            # Start dev server
pnpm test           # Run tests
pnpm build          # Build project

# Deployment
pnpm run deploy:prod:version  # Deploy to production with version
pnpm run deploy:quick:dev     # Quick deploy to development
pnpm run k8s:rollback         # Rollback deployment
```
