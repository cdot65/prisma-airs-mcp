# Security Policy

## Protecting Sensitive Information

This project requires API keys and credentials to function. To ensure security:

### Before Making Public

1. **Never commit sensitive data** to version control
2. **Always use environment variables** or Kubernetes secrets for credentials
3. **Review all files** before pushing to ensure no secrets are exposed

### Required Setup for New Deployments

When deploying this project, you must:

1. **Copy example files** and configure them with your credentials:
   ```bash
   # For local development
   cp .env.example .env
   
   # For Kubernetes production deployment
   cp k8s/overlays/production/kustomization.yaml.example k8s/overlays/production/kustomization.yaml
   ```

2. **Update the copied files** with your actual values:
   - Replace `your-api-key-here` with your Prisma AIRS API key
   - Replace `YOUR_PRISMA_AIRS_API_KEY_HERE` in production configs
   - Update any other placeholder values

3. **Use secure methods** for production:
   ```bash
   # Recommended: Use the secrets management script
   ./k8s/scripts/manage-secrets.sh create namespace 'your-actual-api-key'
   ```

### Files Containing Examples

The following files contain example/placeholder values and must be configured:

- `.env.example` - Local development environment variables
- `k8s/overlays/production/kustomization.yaml.example` - Production Kubernetes config

### Security Best Practices

1. **API Key Management**
   - Store API keys in environment variables or Kubernetes secrets
   - Never hardcode API keys in source files
   - Rotate API keys regularly
   - Use different API keys for different environments

2. **GitHub Repository**
   - Keep the repository private until all sensitive data is removed
   - Use GitHub Secrets for CI/CD workflows
   - Enable security scanning and alerts

3. **Kubernetes Deployments**
   - Use `kubectl create secret` or secrets management tools
   - Avoid using `secretGenerator` with literal values in production
   - Consider using sealed-secrets or external secret operators
   - Implement RBAC to limit access to secrets

4. **Container Registry**
   - Use GitHub Personal Access Tokens (PAT) with minimal required scopes
   - Store registry credentials as Kubernetes secrets
   - Use `imagePullSecrets` for private registries

### Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** create a public issue
2. Contact the maintainers directly
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

### Pre-Commit Checklist

Before committing:

- [ ] No API keys in code files
- [ ] No credentials in configuration files
- [ ] All sensitive values use placeholders in examples
- [ ] `.env` is listed in `.gitignore`
- [ ] Production configs use proper secrets management