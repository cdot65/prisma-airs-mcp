---
layout: documentation
title: Deployment Overview
description: Comprehensive deployment guides for Prisma AIRS MCP
category: deployment
---

Welcome to the Prisma AIRS MCP deployment documentation. Choose the deployment method that best fits your needs.

## Deployment Options

<div class="card-grid">
  <div class="doc-card">
    <h3>🐳 Docker</h3>
    <p>Quick and easy deployment with Docker containers. Perfect for development and testing.</p>
    <a href="{{ site.baseurl }}/deployment/docker" class="card-link">Docker Guide →</a>
  </div>
  
  <div class="doc-card">
    <h3>🐙 Docker Compose</h3>
    <p>Multi-container deployment with orchestration. Great for local development with dependencies.</p>
    <a href="{{ site.baseurl }}/deployment/docker-compose" class="card-link">Docker Compose Guide →</a>
  </div>
  
  <div class="doc-card">
    <h3>🔧 Build from Source</h3>
    <p>Build and run directly from source code. Ideal for development and customization.</p>
    <a href="{{ site.baseurl }}/deployment/source" class="card-link">Source Guide →</a>
  </div>
  
  <div class="doc-card">
    <h3>☸️ Kubernetes</h3>
    <p>Production-grade deployment with scaling, monitoring, and high availability.</p>
    <a href="{{ site.baseurl }}/deployment/kubernetes" class="card-link">Kubernetes Guide →</a>
  </div>
</div>

## Quick Comparison

| Method             | Best For                  | Setup Time | Scalability     | Customization |
|--------------------|---------------------------|------------|-----------------|---------------|
| **Docker**         | Development, Testing      | 5 minutes  | Single instance | Moderate      |
| **Docker Compose** | Local Dev w/ Dependencies | 7 minutes  | Multi-container | Moderate      |
| **Source**         | Development, Debugging    | 10 minutes | Single instance | Full          |
| **Kubernetes**     | Production                | 30 minutes | Auto-scaling    | Configuration |

## Getting Started

### 1. Choose Your Method

- **Just want to try it?** → Use [Docker]({{ site.baseurl }}/deployment/docker)
- **Need local orchestration?** → Use [Docker Compose]({{ site.baseurl }}/deployment/docker-compose)
- **Need to customize?** → [Build from Source]({{ site.baseurl }}/deployment/source)
- **Production deployment?** → Use [Kubernetes]({{ site.baseurl }}/deployment/kubernetes)

### 2. Get Your API Key

All deployment methods require a Prisma AIRS API key:

1. Log in to [Strata Cloud Manager](https://stratacloudmanager.paloaltonetworks.com)
2. Navigate to Settings → API Keys
3. Create a new API key with AIRS permissions

### 3. Deploy

Follow the guide for your chosen deployment method. Each guide includes:

- Prerequisites
- Step-by-step instructions
- Configuration examples
- Troubleshooting tips
- Best practices

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   AI Client     │────▶│  MCP Server      │────▶│  Prisma AIRS     │
│ (Claude/Other)  │◀────│  (Your Deploy)   │◀────│  (Cloud API)     │
└─────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │                          │
     MCP Protocol            Container/Pod            REST API
```

## Key Features

All deployment methods provide:

- **🛡️ Security Scanning** - Real-time threat detection
- **⚡ High Performance** - Sub-second response times
- **📊 Health Monitoring** - Built-in health checks
- **🔄 Auto-retry** - Resilient API handling
- **💾 Caching** - Intelligent response caching
- **🚦 Rate Limiting** - API quota management

## Production Considerations

For production deployments:

1. **Security**
   - Use secrets management (not plain text)
   - Enable TLS/HTTPS
   - Implement network policies

2. **Reliability**
   - Configure health checks
   - Set up monitoring
   - Plan for high availability

3. **Performance**
   - Tune cache settings
   - Configure rate limits
   - Monitor resource usage

## Configuration

All deployment methods share the same configuration options:

<div class="feature-list">
  <div class="feature-item">
    <h4><a href="{{ site.baseurl }}/deployment/configuration">Configuration Reference</a></h4>
    <p>Complete guide to all environment variables and configuration options.</p>
  </div>
</div>

## Prerequisites

Before deploying, ensure you have:

1. **Prisma AIRS API Key**: Obtain from [Strata Cloud Manager](https://stratacloudmanager.paloaltonetworks.com)
2. **System Requirements**:
   - Node.js 18+ (for source builds)
   - Docker (for containerized deployments)
   - Kubernetes 1.24+ (for K8s deployments)
3. **Network Access**: Outbound HTTPS to `service.api.aisecurity.paloaltonetworks.com`

## Next Steps

1. Choose your deployment method from the guides above
2. Review the [Configuration Reference]({{ site.baseurl }}/deployment/configuration)
3. Follow the [Quick Start Guide]({{ site.baseurl }}/deployment/quickstart) to test your deployment
4. Set up [Claude Integration]({{ site.baseurl }}/deployment/claude-desktop) to use with Claude Desktop

## Need Help?

- **Quick Start** → [Getting Started Guide]({{ site.baseurl }}/deployment/quickstart)
- **Configuration** → [Configuration Reference]({{ site.baseurl }}/deployment/configuration)
- **Troubleshooting** → Check the deployment-specific guides
- **Support** → [GitHub Issues](https://github.com/cdot65/prisma-airs-mcp/issues)

<style>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.doc-card {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.doc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.doc-card h3 {
  margin-bottom: 0.5rem;
}

.doc-card p {
  color: var(--gray);
  margin-bottom: 1rem;
}

.card-link {
  font-weight: 500;
}

.feature-list {
  margin: 2rem 0;
}

.feature-item {
  margin-bottom: 1.5rem;
  padding-left: 1rem;
  border-left: 3px solid var(--primary);
}

.feature-item h4 {
  margin-bottom: 0.5rem;
}

.feature-item p {
  color: var(--gray);
  margin: 0;
}
</style>