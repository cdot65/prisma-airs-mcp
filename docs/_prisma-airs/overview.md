---
layout: documentation
title: Prisma AIRS Overview
description: API Intercept threat detection service for securing AI applications
category: prisma-airs
---

# Prisma AIRS AI Runtime: API Intercept Overview

## What is Prisma AIRS?

Prisma AIRS AI Runtime: API intercept is a threat detection service designed to secure AI applications. It helps discover and protect applications using REST APIs by embedding Security-as-Code directly into source code.

The Scan API service scans prompts and models responses to identify potential threats and provides actionable recommendations.

The APIs protect your AI models, applications, and datasets by programmatically scanning prompts and models for threats, enabling robust protection across public and private models with model-agnostic functionality. Its model-agnostic design ensures seamless integration with any AI model, regardless of its architecture or framework. This enables consistent security across diverse AI models without any model-specific customization.

You can use this API in your application to send prompts or model responses and receive a threat assessment, along with the recommended actions based on your API security profile.

For information on using the APIs, see the [API Reference Documentation]({{ site.baseurl }}/developers/api).

## Key Features

### Simple Integration

Secure AI application models and datasets from insecure model outputs, prompt injections, and sensitive data loss.

### Comprehensive Threat Detection

Provides extensive app, model, and data threat detection while maintaining ease of use.

### Exceptional Flexibility and Defense

Integrates API-based threat detection to deliver unmatched adaptability and layered protection.

## Use Cases

### Secure AI Models in Production

Validate prompt requests and responses to protect deployed AI models.

### Detect Data Poisoning

Identify contaminated training data before fine-tuning.

### Protect Adversarial Input

Safeguard AI agents from malicious inputs and outputs while maintaining workflow flexibility.

### Prevent Sensitive Data Leakage

Use API-based threat detection to block sensitive data leaks during AI interactions.

## API Capabilities

### Synchronous Scanning

**Operational Model**: Blocking - the API call waits until the scan completes and returns the verdict immediately.

**Primary Use Case**: Real-time threat prevention in production applications.

- **Immediate verdict**: Get threat assessment instantly
- **Single scan per request**: One prompt or response at a time
- **Maximum 2 MB payload size**: Per request limit
- **Application impact**: Adds latency to your application flow
- **When to use**: Production apps requiring real-time protection

### Asynchronous Scanning

**Operational Model**: Non-blocking - returns a scan ID immediately, verdict retrieved later via scan endpoint.

**Primary Use Case**: Monitoring, auditing, and forensics - NOT for production apps needing protection.

- **Two-step process**:
    1. Submit prompts and receive scan ID
    2. Poll scan endpoint with ID to retrieve verdict
- **Batch processing**: Submit multiple prompts at once
- **Maximum 5 MB payload size**: Larger payload support
- **Application impact**: No latency impact on main application flow
- **When to use**:
    - Post-processing analysis
    - Compliance auditing
    - Forensic investigation
    - Testing and evaluation
- **When NOT to use**: Real-time protection in production

### Threat Detection Types

Our comprehensive threat detection includes:

- [Prompt Injection Detection]({{ site.baseurl }}/prisma-airs/prompt-injection)
- [Malicious URL Scanning]({{ site.baseurl }}/prisma-airs/malicious-url)
- [Sensitive Data Loss Prevention]({{ site.baseurl }}/prisma-airs/sensitive-data-loss)
- [Database Security Attack Detection]({{ site.baseurl }}/prisma-airs/database-security-attack)
- [Toxic Content Filtering]({{ site.baseurl }}/prisma-airs/toxic-content)
- [Malicious Code Detection]({{ site.baseurl }}/prisma-airs/malicious-code)
- [AI Agent Threat Protection]({{ site.baseurl }}/prisma-airs/ai-agent-threats)
- [Contextual Grounding Validation]({{ site.baseurl }}/prisma-airs/contextual-grounding)
- [Custom Topic Guardrails]({{ site.baseurl }}/prisma-airs/custom-topic-guardrails)
- [Secure MCP Implementation]({{ site.baseurl }}/prisma-airs/secure-mcp)

## Architecture

### Model-Agnostic Design

Prisma AIRS works with text-based LLMs (not multi-modal inputs like images, video, or audio):

- **OpenAI**: GPT-4, GPT-3.5
- **Anthropic**: Claude 3, Claude 2
- **Google**: Gemini, PaLM
- **Open Source**: Llama, Mistral
- **Custom Models**: Private deployments

### Integration Points

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   AI App    │────▶│ Prisma AIRS  │────▶│  AI Model   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       │                    ▼                     │
       │            ┌──────────────┐             │
       │            │ Threat       │             │
       │            │ Detection    │             │
       │            └──────────────┘             │
       │                    │                     │
       └────────────────────┴─────────────────────┘
                     Protected Flow
```

## Deployment Options

### SaaS Deployment

- Fully managed service
- Automatic updates
- Global availability
- Zero infrastructure management

### On-Premises Deployment

- Complete data control
- Air-gapped environments
- Custom configurations
- Enterprise support

### Hybrid Deployment

- Flexible architecture
- Local sensitive data processing
- Cloud-based threat intelligence
- Best of both worlds

## Security Profiles

### Default Profile

Balanced security for general use:

- Moderate sensitivity settings
- Standard threat detection
- Automatic updates

### Strict Profile

Maximum security for sensitive applications:

- High sensitivity detection
- All threat types enabled
- Comprehensive logging

### Custom Profiles

Tailored to your needs:

- Industry-specific rules
- Compliance requirements
- Business logic integration

## Limitations

### Service Limits

- **One API security profile per tenant service group (TSG)**: Limited to one API security profile per group
- **One API key per deployment profile**: Each deployment profile allows a single API key
- **Region-specific API keys**: Keys created in a specific region can only be used within that region
- **Payload size limits**:
    - 2 MB maximum for synchronous scans (single prompt/response)
    - 5 MB maximum for asynchronous scans (multiple prompts)

### Best Practices

1. **Use appropriate scanning mode**:
    - Synchronous for production real-time protection
    - Asynchronous for monitoring, auditing, and forensics only
2. **Implement retry logic**: Handle transient failures gracefully
3. **Cache results**: Reduce API calls for repeated content
4. **Monitor usage**: Track API consumption and limits

## Support and Resources

### Documentation

- [Quick Start Guide]({{ site.baseurl }}/deployment/quickstart)
- [API Reference]({{ site.baseurl }}/developers/api)
- [Integration Examples]({{ site.baseurl }}/developers/examples)

## Next Steps

Ready to secure your AI applications?

<div class="cta-buttons">
  <a href="{{ site.baseurl }}/deployment/quickstart" class="btn btn-primary">Get Started</a>
  <a href="{{ site.baseurl }}/developers/api" class="btn btn-secondary">API Documentation</a>
</div>
