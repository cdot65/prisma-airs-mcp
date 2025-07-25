# Linting and Formatting Setup Guide

## Required Dependencies

Install the following dev dependencies in your project:

```bash
pnpm add -D \
  eslint \
  prettier \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-config-prettier \
  eslint-plugin-import \
  eslint-plugin-security \
  eslint-plugin-promise \
  eslint-plugin-sonarjs \
  eslint-import-resolver-typescript \
  husky \
  lint-staged
```

## Configuration Files

Copy the following files from `.claude/conventions/` to your project root:

- `.prettierrc` → `/.prettierrc`
- `.prettierignore` → `/.prettierignore`
- `.eslintrc.js` → `/.eslintrc.js`

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "validate": "pnpm run typecheck && pnpm run lint && pnpm run format:check",
    "prepare": "husky install"
  }
}
```

## Git Hooks Setup

### 1. Initialize Husky

```bash
pnpm run prepare
```

### 2. Add Pre-commit Hook

```bash
npx husky add .husky/pre-commit "pnpm run lint-staged"
```

### 3. Configure lint-staged

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

## WebStorm IDE Setup

### 1. Enable ESLint

1. Go to Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Select "Automatic ESLint configuration"
3. Check "Run eslint --fix on save"

### 2. Enable Prettier

1. Go to Settings → Languages & Frameworks → JavaScript → Prettier
2. Set Prettier package path to `./node_modules/prettier`
3. Check "On save"
4. Check "On reformat code action"

### 3. TypeScript Configuration

1. Go to Settings → Languages & Frameworks → TypeScript
2. Enable "Recompile on changes"
3. Set TypeScript version to use workspace version

### 4. File Watchers (Optional)

Create file watchers for automatic formatting:

1. Settings → Tools → File Watchers
2. Add TypeScript watcher with ESLint fix command
3. Add Prettier watcher for all supported files

## VS Code Setup (for Claude Code reference)

### .vscode/settings.json

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Validation Commands

Run these commands to ensure everything is set up correctly:

```bash
# Check TypeScript compilation
pnpm run typecheck

# Run ESLint
pnpm run lint

# Check Prettier formatting
pnpm run format:check

# Run all validations
pnpm run validate
```

## CI/CD Integration

Add this to your CI pipeline:

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Run validation
  run: pnpm run validate

- name: Run tests
  run: pnpm test
```
