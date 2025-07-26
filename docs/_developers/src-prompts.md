---
layout: documentation
title: Prompts Module (src/prompts/)
permalink: /developers/src-prompts/
category: developers
---

# Prompts Module Documentation

The prompts module provides pre-defined conversation templates for common security workflows using Prisma AIRS. These prompts guide AI models through structured security analysis, threat investigation, compliance checking, and incident response procedures.

## Module Overview

The prompts module consists of a single file (`index.ts`) that implements:

- Security analysis workflows
- Threat investigation procedures
- Compliance checking protocols
- Incident response guidance
- Structured prompt generation with arguments

## Available Prompts

### 1. Security Analysis Workflow

**Name:** `security_analysis`  
**Purpose:** Analyze content for security threats and provide recommendations

#### Arguments

| Name | Description | Required |
|------|-------------|----------|
| `content` | The content to analyze (prompt, response, or both) | Yes |
| `context` | Additional context about the content source | No |
| `severity_threshold` | Minimum severity level to report (low, medium, high) | No |

#### Generated Workflow

The prompt guides through:
1. Scanning content using AIRS tools
2. Reporting threats above severity threshold
3. Providing specific examples for each threat
4. Suggesting remediation steps
5. Overall security assessment and risk score

### 2. Threat Investigation Workflow

**Name:** `threat_investigation`  
**Purpose:** Investigate detected threats and provide detailed analysis

#### Arguments

| Name | Description | Required |
|------|-------------|----------|
| `scan_id` | The scan ID to investigate | Yes |
| `focus_area` | Specific threat type to focus on (e.g., injection, dlp, toxic_content) | No |

#### Generated Workflow

The prompt includes:
1. Retrieving scan details using AIRS tools
2. Analyzing each detected threat
3. Assessing potential impact and attack vectors
4. False positive evaluation
5. Timeline and correlation analysis
6. Immediate actions and long-term mitigations

### 3. Compliance Check Workflow

**Name:** `compliance_check`  
**Purpose:** Check content against compliance policies and regulations

#### Arguments

| Name | Description | Required |
|------|-------------|----------|
| `content` | The content to check for compliance | Yes |
| `regulations` | Comma-separated list of regulations (e.g., GDPR, HIPAA, PCI) | No |
| `profile_name` | Security profile to use for compliance checking | No |

#### Generated Workflow

The prompt covers:
1. Scanning for regulatory violations
2. Identifying PII, PHI, and PCI data
3. Mapping findings to specific regulations
4. Risk level assessment
5. Remediation guidance
6. Compliance checklist generation

### 4. Incident Response Workflow

**Name:** `incident_response`  
**Purpose:** Guide through incident response for detected security issues

#### Arguments

| Name | Description | Required |
|------|-------------|----------|
| `incident_type` | Type of incident (e.g., data_leak, injection_attempt, malicious_code) | Yes |
| `report_id` | Threat report ID if available | No |
| `urgency` | Incident urgency level (low, medium, high, critical) | No |

#### Generated Workflow

The prompt provides phased response:
1. **Immediate Actions** (0-15 minutes)
   - Containment steps
   - Evidence preservation
   - Initial assessment
2. **Investigation** (15-60 minutes)
   - Scope and impact analysis
   - Attack vector identification
3. **Mitigation** (1-4 hours)
   - Threat elimination
   - Vulnerability patching
4. **Recovery** (4-24 hours)
   - Normal operations restoration
   - Security posture verification
5. **Lessons Learned**
   - Root cause analysis
   - Process improvements

## Implementation Details

### PromptHandler Class

```typescript
export class PromptHandler {
    // Static prompt identifiers
    private static readonly PROMPTS = {
        SECURITY_ANALYSIS: 'security_analysis',
        THREAT_INVESTIGATION: 'threat_investigation',
        COMPLIANCE_CHECK: 'compliance_check',
        INCIDENT_RESPONSE: 'incident_response',
    } as const;

    // List all available prompts
    listPrompts(params: PromptsListParams): PromptsListResult

    // Get a specific prompt with arguments
    getPrompt(params: PromptsGetParams): PromptsGetResult
}
```

### Prompt Structure

Each prompt returns a conversation with:
- User message containing the structured workflow
- Assistant message acknowledging the task
- Detailed instructions and requirements
- Expected output structure

## Usage Examples

### Basic Prompt Listing

```typescript
import { PromptHandler } from './prompts';

const handler = new PromptHandler();

// List all available prompts
const { prompts } = handler.listPrompts({});

prompts.forEach(prompt => {
    console.log(`${prompt.name}: ${prompt.title}`);
    prompt.arguments?.forEach(arg => {
        console.log(`  - ${arg.name} (${arg.required ? 'required' : 'optional'})`);
    });
});
```

### Security Analysis Example

```typescript
// Get security analysis prompt
const result = handler.getPrompt({
    name: 'security_analysis',
    arguments: {
        content: 'User input containing potential SQL injection',
        context: 'Form submission from public website',
        severity_threshold: 'medium'
    }
});

// Result contains structured messages
result.messages.forEach(msg => {
    console.log(`${msg.role}: ${msg.content.text}`);
});
```

### Incident Response Example

```typescript
// Critical incident response
const incident = handler.getPrompt({
    name: 'incident_response',
    arguments: {
        incident_type: 'data_leak',
        report_id: 'rpt_12345',
        urgency: 'critical'
    }
});

// Messages guide through phased response
```

## Integration with MCP Server

The prompts integrate with the MCP server through:

1. **Registration** - Prompts are registered during server initialization
2. **Discovery** - Clients can list available prompts
3. **Execution** - Prompts generate messages for AI models
4. **Tool Integration** - Prompts reference AIRS tools by name

### Server Registration

```typescript
// In server initialization
server.setRequestHandler(PromptsListMethod, handler.listPrompts.bind(handler));
server.setRequestHandler(PromptsGetMethod, handler.getPrompt.bind(handler));
```

### Client Usage

```typescript
// MCP client requests
const prompts = await client.listPrompts();
const workflow = await client.getPrompt({
    name: 'security_analysis',
    arguments: { content: 'suspicious content' }
});
```

## Prompt Design Principles

1. **Structured Workflows** - Each prompt follows a clear structure
2. **Tool Integration** - Explicitly mentions AIRS tools to use
3. **Output Format** - Specifies expected response structure
4. **Progressive Detail** - Starts with summary, then detailed analysis
5. **Actionable Results** - Always includes recommendations

## Customization Guidelines

### Adding New Prompts

1. Add identifier to `PROMPTS` constant
2. Define prompt metadata in `listPrompts`
3. Implement prompt generation method
4. Add case in `getPrompt` switch

```typescript
// Add new prompt identifier
private static readonly PROMPTS = {
    // ... existing prompts
    CUSTOM_WORKFLOW: 'custom_workflow',
} as const;

// Add to listPrompts
{
    name: PromptHandler.PROMPTS.CUSTOM_WORKFLOW,
    title: 'Custom Security Workflow',
    description: 'Description of workflow',
    arguments: [
        { name: 'param1', description: 'Parameter description', required: true }
    ]
}

// Implement generation method
private getCustomWorkflowPrompt(args: Record<string, string>): PromptsGetResult {
    // Generate prompt messages
}
```

### Modifying Existing Prompts

1. Update argument definitions in `listPrompts`
2. Modify prompt generation logic
3. Ensure backward compatibility
4. Update documentation

## Best Practices

1. **Validate Arguments** - Check required arguments before use
2. **Provide Defaults** - Use sensible defaults for optional arguments
3. **Clear Instructions** - Make workflow steps explicit
4. **Tool References** - Use exact tool names from the tools module
5. **Structured Output** - Request specific output formats

## Error Handling

```typescript
// Unknown prompt handling
getPrompt(params: PromptsGetParams): PromptsGetResult {
    switch (params.name) {
        // ... prompt cases
        default:
            throw new Error(`Unknown prompt: ${params.name}`);
    }
}
```

## Testing Prompts

```typescript
// Test prompt generation
const testPrompt = handler.getPrompt({
    name: 'security_analysis',
    arguments: {
        content: 'test content'
    }
});

// Verify structure
assert(testPrompt.messages.length === 2);
assert(testPrompt.messages[0].role === 'user');
assert(testPrompt.messages[1].role === 'assistant');
```

## Next Steps

- [Tools Module]({{ site.baseurl }}/developers/src-tools/) - Tools referenced in prompts
- [MCP Types]({{ site.baseurl }}/developers/src-mcp/) - Type definitions used
- [Transport Module]({{ site.baseurl }}/developers/src-transport/) - How prompts are served