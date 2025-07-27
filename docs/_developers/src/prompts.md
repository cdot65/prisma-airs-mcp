---
layout: documentation
title: Prompts Module
permalink: /developers/src/prompts/
category: developers
---

# Security Workflows (src/prompts/)

The prompts module provides pre-defined conversation templates for common security workflows using Prisma AIRS. These
prompts guide AI models through structured security analysis, threat investigation, compliance checking, and incident
response procedures.

## Module Structure

```
src/prompts/
└── index.ts    # Prompt handler implementation
```

**Note**: Prompt types are centralized in `src/types/mcp.ts` with the prefix `Mcp` to avoid namespace conflicts.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         MCP Prompt Request              │
│    (via HttpServerTransport)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       PromptHandler.getPrompt           │
│  • Validate prompt name                 │
│  • Process arguments                    │
│  • Generate workflow messages           │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┬──────────────┐
        │                   │             │              │
┌───────▼────────┐ ┌────────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
│ Security       │ │ Threat        │ │Compliance│ │ Incident    │
│ Analysis       │ │ Investigation │ │Check     │ │ Response    │
└───────┬────────┘ └────────┬──────┘ └────┬─────┘ └──────┬──────┘
        │                   │             │              │
        └─────────┬─────────┴─────────────┴──────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    Generated Conversation Messages      │
│  • User instructions                    │
│  • Assistant acknowledgment             │
│  • Workflow guidance                    │
└─────────────────────────────────────────┘
```

## Type System

All prompt-related types are defined in `src/types/mcp.ts` with the `Mcp` prefix:

```typescript
import type {
    McpPrompt,
    McpPromptArgument,
    McpPromptMessage,
    McpPromptsListParams,
    McpPromptsListResult,
    McpPromptsGetParams,
    McpPromptsGetResult
} from '../types';
```

## Available Prompts

### 1. Security Analysis Workflow

**Name:** `security_analysis`  
**Title:** Security Analysis Workflow  
**Description:** Analyze content for security threats and provide recommendations

#### Arguments

| Name                 | Description                                          | Required |
|----------------------|------------------------------------------------------|----------|
| `content`            | The content to analyze (prompt, response, or both)   | Yes      |
| `context`            | Additional context about the content source          | No       |
| `severity_threshold` | Minimum severity level to report (low, medium, high) | No       |

#### Generated Workflow

The prompt generates a structured security analysis that includes:

1. **Executive Summary** - High-level threat overview
2. **Detailed Findings** - Using `airs_scan_content` tool
3. **Risk Assessment** - Severity and impact analysis
4. **Recommendations** - Remediation steps for each threat

#### Workflow Structure

```typescript
// User message includes:
-Content
to
analyze
- Context
information
- Requirements
:
1.
Use
airs_scan_content
tool
2.
Report
threats
at
threshold
or
higher
3.
Provide
specific
examples
4.
Suggest
remediation
steps
5.
Give
overall
risk
score

// Assistant response:
- Acknowledges
the
request
- Indicates
it
will
use
Prisma
AIRS
for analysis
```

### 2. Threat Investigation Workflow

**Name:** `threat_investigation`  
**Title:** Threat Investigation Workflow  
**Description:** Investigate detected threats and provide detailed analysis

#### Arguments

| Name         | Description                                                            | Required |
|--------------|------------------------------------------------------------------------|----------|
| `scan_id`    | The scan ID to investigate                                             | Yes      |
| `focus_area` | Specific threat type to focus on (e.g., injection, dlp, toxic_content) | No       |

#### Investigation Steps

The prompt guides through a comprehensive threat investigation:

1. **Retrieve Scan Results** - Using `airs_get_scan_results`
2. **Get Threat Reports** - Using `airs_get_threat_reports` if available
3. **Threat Analysis**:
    - Threat type and severity
    - Potential impact assessment
    - Attack vector identification
    - False positive evaluation
4. **Timeline & Correlation** - Pattern analysis
5. **Recommendations** - Immediate actions and long-term mitigations

#### Output Format

The investigation is formatted as a professional security report with structured sections for easy consumption.

### 3. Compliance Check Workflow

**Name:** `compliance_check`  
**Title:** Compliance Check Workflow  
**Description:** Check content against compliance policies and regulations

#### Arguments

| Name           | Description                                                           | Required                                |
|----------------|-----------------------------------------------------------------------|-----------------------------------------|
| `content`      | The content to check for compliance                                   | Yes                                     |
| `regulations`  | Comma-separated list of regulations to check (e.g., GDPR, HIPAA, PCI) | No (defaults to "GDPR, HIPAA, PCI-DSS") |
| `profile_name` | Security profile to use for compliance checking                       | No                                      |

#### Compliance Analysis Steps

1. **Data Identification** - Using `airs_scan_content` to find:
    - Personal Identifiable Information (PII)
    - Protected Health Information (PHI)
    - Payment Card Information (PCI)
    - Sensitive personal data categories

2. **Regulatory Mapping** - Map findings to specific requirements

3. **Risk Assessment** - Evaluate compliance risk level

4. **Remediation Guidance** - Provide actionable steps

#### Response Structure

- **Compliance Summary** - Overview of compliance status
- **Detailed Findings by Regulation** - Specific violations per regulation
- **Risk Matrix** - Visual risk assessment
- **Remediation Plan** - Step-by-step fixes
- **Compliance Checklist** - Actionable items

### 4. Incident Response Workflow

**Name:** `incident_response`  
**Title:** Incident Response Workflow  
**Description:** Guide through incident response for detected security issues

#### Arguments

| Name            | Description                                                           | Required                  |
|-----------------|-----------------------------------------------------------------------|---------------------------|
| `incident_type` | Type of incident (e.g., data_leak, injection_attempt, malicious_code) | Yes                       |
| `report_id`     | Threat report ID if available                                         | No                        |
| `urgency`       | Incident urgency level (low, medium, high, critical)                  | No (defaults to "medium") |

#### Response Timeline

The prompt provides time-boxed incident response guidance:

1. **Immediate Actions (0-15 minutes)**:
    - Containment steps
    - Evidence preservation
    - Initial assessment

2. **Investigation (15-60 minutes)**:
    - Use `airs_get_threat_reports` if report_id provided
    - Identify affected systems/data
    - Determine attack vector

3. **Mitigation (1-4 hours)**:
    - Stop the threat
    - Patch vulnerabilities
    - Update security controls

4. **Recovery (4-24 hours)**:
    - Restore normal operations
    - Verify security posture
    - Monitor for recurrence

5. **Lessons Learned**:
    - Root cause analysis
    - Process improvements
    - Documentation updates

The response includes specific commands and checks for each phase.

## Implementation Details

### Prompt Handler Class

```typescript
export class PromptHandler {
    private readonly logger: Logger;

    // Prompt names
    private static readonly PROMPTS = {
        SECURITY_ANALYSIS: 'security_analysis',
        THREAT_INVESTIGATION: 'threat_investigation',
        COMPLIANCE_CHECK: 'compliance_check',
        INCIDENT_RESPONSE: 'incident_response',
    } as const;

    constructor() {
        this.logger = getLogger();
    }

    listPrompts(params: McpPromptsListParams): McpPromptsListResult {
        // Returns static list of all available prompts
        const prompts: McpPrompt[] = [...];
        return {prompts};
    }

    getPrompt(params: McpPromptsGetParams): McpPromptsGetResult {
        const args = params.arguments || {};

        switch (params.name) {
            case PromptHandler.PROMPTS.SECURITY_ANALYSIS:
                return this.getSecurityAnalysisPrompt(args);
            case PromptHandler.PROMPTS.THREAT_INVESTIGATION:
                return this.getThreatInvestigationPrompt(args);
            case PromptHandler.PROMPTS.COMPLIANCE_CHECK:
                return this.getComplianceCheckPrompt(args);
            case PromptHandler.PROMPTS.INCIDENT_RESPONSE:
                return this.getIncidentResponsePrompt(args);
            default:
                throw new Error(`Unknown prompt: ${params.name}`);
        }
    }
}
```

### Message Generation

Each prompt handler method generates a conversation structure with:

1. **User Message**: Detailed instructions with interpolated arguments
2. **Assistant Message**: Acknowledgment and next steps

#### Example: Security Analysis Generation

```typescript
private
getSecurityAnalysisPrompt(args
:
Record<string, string>
):
McpPromptsGetResult
{
    const content = args.content || '[No content provided]';
    const context = args.context || 'No additional context';
    const threshold = args.severity_threshold || 'low';

    const messages: McpPromptMessage[] = [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Please perform a comprehensive security analysis...
                
**Content to Analyze:**
${content}

**Context:**
${context}

**Requirements:**
1. Use the airs_scan_content tool to analyze the content
2. Report all threats with severity ${threshold} or higher
[... detailed instructions ...]`
            },
        },
        {
            role: 'assistant',
            content: {
                type: 'text',
                text: `I'll perform a comprehensive security analysis of the provided content using Prisma AIRS. Let me start by scanning the content for potential threats.`,
            },
        },
    ];

    return {messages};
}
```

## Integration with MCP Server

### Handling Prompt Requests

```typescript
// In transport/http.ts
private
handlePromptsGet(params
:
unknown
):
unknown
{
    return this.promptHandler.getPrompt(params as McpPromptsGetParams);
}

private
handlePromptsList(params
:
unknown
):
unknown
{
    return this.promptHandler.listPrompts(params as McpPromptsListParams);
}
```

### Error Handling

```typescript
try {
    const result = promptHandler.getPrompt(params);
    return result;
} catch (error) {
    if (error.message.includes('not found')) {
        throw new Error(`Unknown prompt: ${params.name}`);
    }
    if (error.message.includes('required')) {
        throw new Error(`Missing required argument: ${error.message}`);
    }
    throw error;
}
```

## Usage Examples

### Client Usage

```typescript
// List available prompts
const {prompts} = await client.listPrompts();

prompts.forEach(prompt => {
    console.log(`${prompt.name}: ${prompt.description}`);
    prompt.arguments?.forEach(arg => {
        console.log(`  - ${arg.name} (${arg.required ? 'required' : 'optional'})`);
    });
});

// Get security analysis prompt
const result = await client.getPrompt({
    name: 'security_analysis',
    arguments: {
        content: 'Process user input: rm -rf /',
        context: 'Command execution request',
        severity_threshold: 'high'
    }
});

// Result contains conversation messages
result.messages.forEach(msg => {
    console.log(`${msg.role}: ${msg.content.text}`);
});
```

### Workflow Execution

```typescript
// Execute threat investigation workflow
async function investigateThreat(scanId: string) {
    const {messages} = await client.getPrompt({
        name: 'threat_investigation',
        arguments: {
            scan_id: scanId,
            threat_type: 'prompt_injection',
            deep_analysis: 'true'
        }
    });

    // Process workflow messages
    for (const message of messages) {
        if (message.content.type === 'text') {
            console.log(message.content.text);
        }
    }
}
```

## Best Practices

### 1. Default Values

Always provide sensible defaults for optional arguments:

```typescript
const content = args.content || '[No content provided]';
const context = args.context || 'No additional context';
const threshold = args.severity_threshold || 'low';
```

### 2. Structured Instructions

Each prompt includes clear, numbered instructions:

```typescript
**
Requirements:*
*
1.
Use
the
airs_scan_content
tool
to
analyze
the
content
2.
Report
all
threats
with severity $
{
    threshold
}
or
higher
3.
Provide
specific
examples
from
the
content
for each threat
found
4.
Suggest
remediation
steps
for each identified
issue
5.
Give
an
overall
security
assessment
and
risk
score
```

### 3. Professional Formatting

Structure prompts to generate professional outputs:

```typescript
Please
structure
your
response
with:
-Executive
Summary
- Detailed
Findings
- Risk
Assessment
- Recommendations
```

### 4. Tool Integration

Explicitly mention which tools to use:

```typescript
"1. Use airs_get_scan_results to retrieve the scan details"
"2. If a report ID is available, use airs_get_threat_reports"
```

## Extending Prompts

### Adding New Prompts

1. **Add to PROMPTS constant**:

```typescript
private static readonly
PROMPTS = {
    // ... existing prompts
    CUSTOM_WORKFLOW: 'custom_workflow',
} as const;
```

2. **Add to listPrompts() array**:

```typescript
{
    name: PromptHandler.PROMPTS.CUSTOM_WORKFLOW,
        title
:
    'Custom Workflow',
        description
:
    'Custom security workflow description',
        arguments
:
    [
        {
            name: 'param1',
            description: 'First parameter',
            required: true,
        },
    ],
}
```

3. **Add case to getPrompt() switch**:

```typescript
case
PromptHandler.PROMPTS.CUSTOM_WORKFLOW
:
return this.getCustomWorkflowPrompt(args);
```

4. **Implement prompt method**:

```typescript
private
getCustomWorkflowPrompt(args
:
Record<string, string>
):
McpPromptsGetResult
{
    const param1 = args.param1 || '[No value provided]';

    const messages: McpPromptMessage[] = [
        // User instructions
        // Assistant acknowledgment
    ];

    return {messages};
}
```

## Type System

The prompts module uses centralized types from `src/types/`:

### MCP Prompt Types

| Type                   | Module    | Purpose                          |
|------------------------|-----------|----------------------------------|
| `McpPrompt`            | `./types` | Prompt definition with arguments |
| `McpPromptArgument`    | `./types` | Individual argument definition   |
| `McpPromptMessage`     | `./types` | Conversation message structure   |
| `McpPromptsListParams` | `./types` | Parameters for listing prompts   |
| `McpPromptsListResult` | `./types` | Result of prompt listing         |
| `McpPromptsGetParams`  | `./types` | Parameters for getting a prompt  |
| `McpPromptsGetResult`  | `./types` | Generated prompt messages        |

## Dependencies

### External Dependencies

| Module    | Purpose            |
|-----------|--------------------|
| `winston` | Structured logging |

### Internal Dependencies

| Module            | Import        | Purpose          |
|-------------------|---------------|------------------|
| `../utils/logger` | `getLogger()` | Logger instance  |
| `../types`        | Various types | Type definitions |

## Performance Considerations

1. **Stateless Design**: No state maintained between requests
2. **Synchronous Generation**: Messages generated immediately
3. **Minimal Memory**: Only static prompt definitions in memory
4. **No Caching**: Prompts are deterministic, no caching needed

## Security Considerations

1. **Argument Sanitization**: Arguments are included as-is in messages
2. **No Code Execution**: Prompts only generate text messages
3. **Tool References**: Prompts reference but don't execute tools
4. **Professional Language**: All prompts use appropriate security terminology

## Related Documentation

- [Types Module]({{ site.baseurl }}/developers/src/types/) - MCP type definitions
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Tools referenced in prompts
- [Transport Module]({{ site.baseurl }}/developers/src/transport/) - How prompts are exposed via MCP
- [Resources Module]({{ site.baseurl }}/developers/src/resources/) - Resources accessed in workflows

## Summary

The prompts module provides pre-configured security workflows that guide AI models through complex security analysis
tasks. Each prompt generates structured conversations with clear instructions, tool references, and professional
formatting to ensure consistent, high-quality security assessments.