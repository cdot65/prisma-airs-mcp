# Testing

This project uses Jest for testing and separates tests into unit and integration categories.

## Test Structure

- **Unit Tests** (`tests/unit/`): Tests that don't require external dependencies or environment configuration
- **Integration Tests** (`tests/integration/`): Tests that require environment configuration (e.g., API keys)

## Running Tests

### Unit Tests (CI-safe)
Unit tests can run without environment configuration and are used in CI pipelines:

```bash
# Run all unit tests
pnpm run local:test:unit
```

### Integration Tests (Local only)
Integration tests require a `.env` file with proper configuration:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key
# Then run integration tests
pnpm run local:test:integration
```

### All Tests
To run both unit and integration tests locally:

```bash
# Requires .env file
pnpm run local:test
```

### Other Test Commands

```bash
# Watch mode
pnpm run local:test:watch

# Coverage report
pnpm run local:test:coverage
```

## CI/CD

The CI pipeline only runs unit tests to avoid requiring sensitive API keys in the CI environment.
Integration tests should be run locally before pushing changes.