# Contributing to Prisma AIRS MCP Server

Thank you for your interest in contributing to the Prisma AIRS MCP Server! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Show empathy towards other community members

## How to Contribute

### Reporting Issues

1. **Check existing issues** - Before creating a new issue, please check if it already exists
2. **Use issue templates** - If available, use the appropriate issue template
3. **Provide details** - Include:
    - Clear description of the issue
    - Steps to reproduce
    - Expected behavior
    - Actual behavior
    - Environment details (OS, Node version, etc.)
    - Relevant logs or error messages

### Suggesting Features

1. **Check the roadmap** - Review existing feature requests and the project roadmap
2. **Open a discussion** - Start with a GitHub Discussion before creating a feature request
3. **Provide context** - Explain:
    - The use case for the feature
    - How it would benefit users
    - Potential implementation approach

### Contributing Code

#### Prerequisites

- Node.js 18+ and pnpm
- Docker (for containerization)
- Git
- TypeScript knowledge
- Familiarity with MCP protocol

#### Development Setup

1. **Fork the repository**

    ```bash
    git clone https://github.com/YOUR_USERNAME/prisma-airs-mcp.git
    cd prisma-airs-mcp
    ```

2. **Install dependencies**

    ```bash
    pnpm install
    ```

3. **Create a feature branch**

    ```bash
    git checkout -b feature/your-feature-name
    ```

4. **Set up environment**
    ```bash
    cp .env.example .env
    # Configure your AIRS credentials
    ```

#### Development Workflow

1. **Before making changes**

    ```bash
    # Ensure you're up to date with main
    git pull origin main

    # Run validation to ensure clean start
    pnpm run validate
    ```

2. **Make your changes**
    - Follow the TypeScript style guide (`.claude/conventions/typescript-style-guide.md`)
    - Write clean, documented code
    - Add tests for new functionality
    - Update documentation as needed

3. **Validate your changes**

    ```bash
    # Run all validation checks
    pnpm run validate

    # This includes:
    # - TypeScript compilation
    # - ESLint checks
    # - Prettier formatting
    # - Unit tests
    ```

4. **Test thoroughly**

    ```bash
    # Run unit tests
    pnpm test:unit

    # Run integration tests
    pnpm test:integration

    # Test locally with dev server
    pnpm dev

    # Test with Docker
    pnpm run docker:build
    pnpm run docker:run
    ```

#### Code Style Guidelines

- **TypeScript**: Use strict mode, avoid `any` types
- **Naming**:
    - Files: `kebab-case.ts`
    - Classes/Interfaces: `PascalCase`
    - Functions/Variables: `camelCase`
    - Constants: `UPPER_SNAKE_CASE`
- **Comments**: Write JSDoc comments for public APIs
- **Error Handling**: Use structured error types
- **Logging**: Use appropriate log levels (debug, info, warn, error)

#### Commit Guidelines

We follow Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

**Examples**:

```bash
feat(tools): add new AIRS scanning tool
fix(transport): handle connection timeouts properly
docs(readme): update deployment instructions
```

#### Pull Request Process

1. **Ensure all checks pass**

    ```bash
    pnpm run validate
    ```

2. **Update documentation**
    - Update README.md if needed
    - Update API documentation
    - Add/update tests

3. **Create Pull Request**
    - Use a clear, descriptive title
    - Reference any related issues
    - Provide a detailed description
    - Include testing instructions

4. **PR Requirements**:
    - All CI checks must pass
    - Code coverage must not decrease
    - At least one approval from a maintainer
    - No merge conflicts

### Testing

#### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run tests in watch mode
pnpm test:unit -- --watch

# Run with coverage
pnpm test:unit -- --coverage
```

#### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Test specific endpoint
pnpm test:integration -- --grep "tools/list"
```

#### MCP Protocol Testing

```bash
# Use MCP Inspector
npx @modelcontextprotocol/inspector

# Test against live server
curl -X POST https://airs.cdot.io/prisma-airs \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","params":{},"id":1}'
```

### Documentation

- Keep documentation up to date with code changes
- Use clear, concise language
- Include code examples where appropriate
- Update the following when relevant:
    - README.md
    - API documentation
    - Deployment guides
    - Claude integration docs

### Release Process

1. **Version Bumping**
    - Follow semantic versioning (MAJOR.MINOR.PATCH)
    - Update version in package.json
    - Update version badges in README.md

2. **Changelog**
    - Document all changes in CHANGELOG.md
    - Group by type (Features, Fixes, etc.)
    - Include breaking changes prominently

3. **Testing**
    - Full test suite must pass
    - Manual testing of critical paths
    - Docker image build and test

4. **Deployment**
    - Build and push Docker images
    - Update Kubernetes manifests if needed
    - Deploy to staging first
    - Verify in production

## Getting Help

- **Documentation**: Check the `/docs` directory
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Claude Context**: Review `.claude/` directory for development context

## Recognition

Contributors will be recognized in:

- The project README
- Release notes
- Special thanks section

Thank you for contributing to Prisma AIRS MCP Server! 🎉
