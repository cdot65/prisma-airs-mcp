---
layout: documentation
title: Configuration Reference
description: Complete configuration reference for Prisma AIRS MCP
category: deployment
---

## Overview

This reference covers all configuration options for Prisma AIRS MCP. Configuration can be provided through environment variables, `.env` files, or Kubernetes ConfigMaps/Secrets.

## Configuration Priority

Configuration is loaded in the following order (later sources override earlier ones):

1. Default values in code
2. `.env` file
3. Environment variables
4. Command line arguments (if applicable)

## Required Configuration

These settings must be configured for the server to start:

### AIRS API Settings

| Variable       | Description              | Example                                               |
| -------------- | ------------------------ | ----------------------------------------------------- |
| `AIRS_API_URL` | Prisma AIRS API endpoint | `https://service.api.aisecurity.paloaltonetworks.com` |
| `AIRS_API_KEY` | Your Prisma AIRS API key | `your-api-key-here`                                   |

### Profile Configuration

You must specify either a profile name OR profile ID (not both):

| Variable                    | Description                | Example                                |
| --------------------------- | -------------------------- | -------------------------------------- |
| `AIRS_DEFAULT_PROFILE_NAME` | Profile name to use        | `Prisma AIRS`                          |
| `AIRS_DEFAULT_PROFILE_ID`   | Profile UUID (alternative) | `123e4567-e89b-12d3-a456-426614174000` |

> **Note**: If neither is specified, the server defaults to using the "Prisma AIRS" profile.

## Server Configuration

### Basic Settings

| Variable    | Description       | Default      | Valid Values                        |
| ----------- | ----------------- | ------------ | ----------------------------------- |
| `PORT`      | Server port       | `3000`       | Any valid port number               |
| `NODE_ENV`  | Environment mode  | `production` | `development`, `production`, `test` |
| `LOG_LEVEL` | Logging verbosity | `info`       | `debug`, `info`, `warn`, `error`    |

### Advanced Settings

| Variable              | Description                | Default |
| --------------------- | -------------------------- | ------- |
| `SHUTDOWN_TIMEOUT_MS` | Graceful shutdown timeout  | `30000` |
| `REQUEST_TIMEOUT_MS`  | Request processing timeout | `30000` |
| `BODY_SIZE_LIMIT`     | Maximum request body size  | `1mb`   |

## Caching Configuration

Control the in-memory cache behavior:

| Variable                     | Description           | Default | Range     |
| ---------------------------- | --------------------- | ------- | --------- |
| `CACHE_TTL_SECONDS`          | Cache time-to-live    | `300`   | 60-3600   |
| `CACHE_MAX_SIZE`             | Maximum cache entries | `1000`  | 100-10000 |
| `CACHE_CHECK_PERIOD_SECONDS` | Cleanup interval      | `60`    | 30-300    |

### Cache Strategy

```env
# Conservative (minimize API calls)
CACHE_TTL_SECONDS=3600
CACHE_MAX_SIZE=5000

# Aggressive (fresh data)
CACHE_TTL_SECONDS=60
CACHE_MAX_SIZE=500

# Balanced (recommended)
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000
```

## Rate Limiting

Protect against abuse and ensure fair usage:

| Variable                              | Description                    | Default |
| ------------------------------------- | ------------------------------ | ------- |
| `RATE_LIMIT_MAX_REQUESTS`             | Maximum requests per window    | `100`   |
| `RATE_LIMIT_WINDOW_MS`                | Time window in milliseconds    | `60000` |
| `RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS` | Only count failed requests     | `false` |
| `RATE_LIMIT_SKIP_FAILED_REQUESTS`     | Only count successful requests | `false` |

### Rate Limit Strategies

```env
# Strict (API protection)
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=60000

# Lenient (development)
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000

# Per-minute limiting
RATE_LIMIT_MAX_REQUESTS=60
RATE_LIMIT_WINDOW_MS=60000
```

## AIRS Client Configuration

Fine-tune the AIRS API client behavior:

| Variable                  | Description                | Default |
| ------------------------- | -------------------------- | ------- |
| `AIRS_RETRY_ATTEMPTS`     | Number of retry attempts   | `3`     |
| `AIRS_RETRY_DELAY_MS`     | Initial retry delay        | `1000`  |
| `AIRS_RETRY_MAX_DELAY_MS` | Maximum retry delay        | `30000` |
| `AIRS_RETRY_FACTOR`       | Exponential backoff factor | `2`     |
| `AIRS_REQUEST_TIMEOUT_MS` | API request timeout        | `30000` |

### Retry Configuration Examples

```env
# Quick retry (unstable network)
AIRS_RETRY_ATTEMPTS=5
AIRS_RETRY_DELAY_MS=500
AIRS_RETRY_MAX_DELAY_MS=10000

# Conservative retry (stable network)
AIRS_RETRY_ATTEMPTS=2
AIRS_RETRY_DELAY_MS=2000
AIRS_RETRY_MAX_DELAY_MS=60000
```

## Security Configuration

### CORS Settings

| Variable           | Description       | Default            |
| ------------------ | ----------------- | ------------------ |
| `CORS_ENABLED`     | Enable CORS       | `true`             |
| `CORS_ORIGIN`      | Allowed origins   | `*`                |
| `CORS_METHODS`     | Allowed methods   | `GET,POST,OPTIONS` |
| `CORS_CREDENTIALS` | Allow credentials | `false`            |

### Security Headers

| Variable             | Description                 | Default |
| -------------------- | --------------------------- | ------- |
| `HELMET_ENABLED`     | Enable security headers     | `true`  |
| `TRUST_PROXY`        | Trust proxy headers         | `true`  |
| `ENABLE_COMPRESSION` | Enable response compression | `true`  |

## Complete Example Configurations

### Development Configuration

```env
# Development environment
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# AIRS API
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-dev-api-key
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS

# Relaxed limits for development
RATE_LIMIT_MAX_REQUESTS=1000
CACHE_TTL_SECONDS=60

# Detailed logging
LOG_LEVEL=debug
```

### Production Configuration

```env
# Production environment
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# AIRS API
AIRS_API_URL=https://service.api.aisecurity.paloaltonetworks.com
AIRS_API_KEY=your-prod-api-key
AIRS_DEFAULT_PROFILE_NAME=Prisma AIRS

# Performance optimization
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Security
CORS_ORIGIN=https://your-domain.com
CORS_CREDENTIALS=true
HELMET_ENABLED=true

# Reliability
AIRS_RETRY_ATTEMPTS=3
AIRS_RETRY_DELAY_MS=1000
SHUTDOWN_TIMEOUT_MS=30000
```

### Kubernetes Configuration

For Kubernetes deployments, use ConfigMaps and Secrets:

**ConfigMap** (`configmap.yaml`):

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
    name: prisma-airs-config
data:
    NODE_ENV: 'production'
    PORT: '3000'
    LOG_LEVEL: 'info'
    AIRS_API_URL: 'https://service.api.aisecurity.paloaltonetworks.com'
    CACHE_TTL_SECONDS: '300'
    RATE_LIMIT_MAX_REQUESTS: '100'
```

**Secret** (`secret.yaml`):

```yaml
apiVersion: v1
kind: Secret
metadata:
    name: prisma-airs-secret
type: Opaque
stringData:
    api-key: 'your-api-key-here'
    profile-name: 'Prisma AIRS'
```

## Environment-Specific Settings

### Docker Compose

In `docker-compose.yml`:

```yaml
services:
    prod:
        environment:
            - NODE_ENV=production
            - PORT=3000
            - LOG_LEVEL=info
        env_file:
            - .env
```

### Systemd

In service file:

```ini
[Service]
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/etc/prisma-airs-mcp/.env
```

### PM2

In `ecosystem.config.js`:

```javascript
module.exports = {
    apps: [
        {
            name: 'prisma-airs-mcp',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                LOG_LEVEL: 'info',
            },
        },
    ],
};
```

## Validation

The server validates configuration on startup. Invalid configuration will prevent the server from starting with descriptive error messages:

```
Error: Invalid configuration
- AIRS_API_KEY: Required
- PORT: Must be a valid port number (received: "abc")
- CACHE_TTL_SECONDS: Must be between 60 and 3600 (received: 10)
```

## Best Practices

### Security

1. **Never commit secrets to version control**

    ```bash
    # .gitignore
    .env
    .env.*
    !.env.example
    ```

2. **Use secret management tools**

    - Kubernetes Secrets
    - AWS Secrets Manager
    - HashiCorp Vault
    - Azure Key Vault

3. **Rotate API keys regularly**

### Performance

1. **Tune cache settings based on usage**

    - High-traffic: Increase TTL and size
    - Frequent updates: Decrease TTL

2. **Monitor rate limits**

    - Adjust based on actual usage
    - Consider per-user limits

3. **Set appropriate timeouts**
    - Balance between reliability and responsiveness

### Reliability

1. **Configure retries for network issues**
2. **Set graceful shutdown timeouts**
3. **Use health checks in production**

## Troubleshooting

### Configuration Not Loading

```bash
# Check environment variables
env | grep AIRS

# Verify .env file
cat .env

# Test with explicit variables
AIRS_API_KEY=test PORT=3001 npm start
```

### Validation Errors

Common issues and solutions:

| Error                    | Solution                         |
| ------------------------ | -------------------------------- |
| "AIRS_API_KEY: Required" | Set the API key in environment   |
| "Invalid port number"    | Use a number between 1-65535     |
| "Profile not found"      | Check profile name/ID is correct |

### Debug Configuration

Enable debug logging to see configuration:

```bash
LOG_LEVEL=debug npm start
```

The server logs the loaded configuration (with secrets redacted) on startup.
