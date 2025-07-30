---
layout: documentation
title: Prompts Index
permalink: /developers/src/prompts/index-file/
category: developers
---

MCP prompt handler providing pre-configured security workflows for AI assistants to guide users through complex security analysis tasks.

## Core Purpose

- Provide structured security workflows
- Generate multi-step analysis instructions
- Handle prompt arguments and templating
- Enable consistent security guidance

## Key Components

### PromptHandler Class

```typescript
export class PromptHandler {
    // Available prompts
    SECURITY_ANALYSIS: 'security_analysis'
    THREAT_INVESTIGATION: 'threat_investigation' 
    COMPLIANCE_CHECK: 'compliance_check'
    INCIDENT_RESPONSE: 'incident_response'
    
    // MCP methods
    listPrompts(): Returns all available prompts
    getPrompt(): Generates specific workflow
}
```

## Available Workflows

### Security Analysis

- Comprehensive threat scanning
- Risk assessment and scoring
- Remediation recommendations
- Arguments: content, context, severity_threshold

### Threat Investigation

- Deep-dive into detected threats
- Attack vector analysis
- False positive assessment
- Arguments: scan_id, focus_area

### Compliance Check

- Regulatory compliance verification
- PII/PHI/PCI detection
- Risk matrix generation
- Arguments: content, regulations, profile_name

### Incident Response

- Step-by-step incident handling
- Time-based action phases
- Evidence preservation guide
- Arguments: incident_type, report_id, urgency

## Integration in Application

- **Used By**: MCP server for prompt requests
- **Integrates With**: Tools for security scanning
- **Pattern**: Template-based workflow generation
- **Output**: Structured conversation messages

## Workflow Structure

Each prompt generates:

1. User message with detailed instructions
2. Assistant acknowledgment message
3. Structured steps using MCP tools
4. Professional report formatting

## Example Usage

```typescript
// Get security analysis workflow
const workflow = handler.getPrompt({
    name: 'security_analysis',
    arguments: {
        content: 'Analyze this text',
        severity_threshold: 'high'
    }
});

// Returns structured messages:
// - Instructions for using airs_scan_content
// - Requirements for analysis
// - Report structure template
```

## Key Features

### Dynamic Content

- Argument-based customization
- Default value handling
- Conditional instructions

### Professional Output

- Markdown formatting
- Clear section headers
- Step-by-step guidance

### Tool Integration

- References specific MCP tools
- Provides usage instructions
- Chains tool operations

## Related Modules

- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Security scanning tools
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Logger]({{ site.baseurl }}/developers/src/utils/logger/) - Debug logging
