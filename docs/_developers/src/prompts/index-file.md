---
layout: documentation
title: Prompts Index
permalink: /developers/src/prompts/index-file/
category: developers
---

# Prompts Index (src/prompts/index.ts)

The prompts index file implements the MCP prompt handler that provides pre-configured security workflows. This module
enables AI assistants to guide users through complex security analysis tasks with structured, multi-step interactions.

## Overview

The PromptHandler class:

- Manages available security workflow prompts
- Processes prompt arguments and generates instructions
- Provides structured conversation templates
- Integrates with MCP tools for comprehensive analysis
- Delivers consistent, professional security guidance

## Core Implementation

### PromptHandler Class

```typescript
import { getLogger } from '../utils/logger';
import type { Logger } from 'winston';
import type {
    McpPrompt,
    McpPromptMessage,
    McpPromptsGetParams,
    McpPromptsGetResult,
    McpPromptsListParams,
    McpPromptsListResult,
} from '../types';

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
```

## Available Prompts

### Security Analysis Prompt

Comprehensive content security analysis workflow.

```typescript
{
    name: 'security_analysis',
    title: 'Security Analysis Workflow',
    description: 'Analyze content for security threats and provide recommendations',
    arguments: [
        {
            name: 'content',
            description: 'The content to analyze (prompt, response, or both)',
            required: true,
        },
        {
            name: 'context',
            description: 'Additional context about the content source',
            required: false,
        },
        {
            name: 'severity_threshold',
            description: 'Minimum severity level to report (low, medium, high)',
            required: false,
        },
    ],
}
```

### Threat Investigation Prompt

Deep-dive investigation of detected threats.

```typescript
{
    name: 'threat_investigation',
    title: 'Threat Investigation Workflow',
    description: 'Investigate detected threats and provide detailed analysis',
    arguments: [
        {
            name: 'scan_id',
            description: 'The scan ID to investigate',
            required: true,
        },
        {
            name: 'focus_area',
            description: 'Specific threat type to focus on (e.g., injection, dlp, toxic_content)',
            required: false,
        },
    ],
}
```

### Compliance Check Prompt

Regulatory compliance verification workflow.

```typescript
{
    name: 'compliance_check',
    title: 'Compliance Check Workflow',
    description: 'Check content against compliance policies and regulations',
    arguments: [
        {
            name: 'content',
            description: 'The content to check for compliance',
            required: true,
        },
        {
            name: 'regulations',
            description: 'Comma-separated list of regulations to check (e.g., GDPR, HIPAA, PCI)',
            required: false,
        },
        {
            name: 'profile_name',
            description: 'Security profile to use for compliance checking',
            required: false,
        },
    ],
}
```

### Incident Response Prompt

Guided security incident response workflow.

```typescript
{
    name: 'incident_response',
    title: 'Incident Response Workflow',
    description: 'Guide through incident response for detected security issues',
    arguments: [
        {
            name: 'incident_type',
            description: 'Type of incident (e.g., data_leak, injection_attempt, malicious_code)',
            required: true,
        },
        {
            name: 'report_id',
            description: 'Threat report ID if available',
            required: false,
        },
        {
            name: 'urgency',
            description: 'Incident urgency level (low, medium, high, critical)',
            required: false,
        },
    ],
}
```

## Method Implementations

### listPrompts Method

Returns all available prompts with their metadata.

```typescript
listPrompts(params: McpPromptsListParams): McpPromptsListResult {
    this.logger.debug('Listing prompts', { cursor: params?.cursor });

    const prompts: McpPrompt[] = [
        // Security Analysis Prompt
        {
            name: PromptHandler.PROMPTS.SECURITY_ANALYSIS,
            title: 'Security Analysis Workflow',
            description: 'Analyze content for security threats and provide recommendations',
            arguments: [...],
        },
        // ... other prompts
    ];

    return { prompts };
}
```

### getPrompt Method

Generates specific prompt workflow based on name and arguments.

```typescript
getPrompt(params: McpPromptsGetParams): McpPromptsGetResult {
    this.logger.debug('Getting prompt', {
        name: params.name,
        hasArguments: !!params.arguments,
    });

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
```

## Prompt Generation Methods

### Security Analysis Prompt Generation

```typescript
private getSecurityAnalysisPrompt(args: Record<string, string>): McpPromptsGetResult {
    const content = args.content || '[No content provided]';
    const context = args.context || 'No additional context';
    const threshold = args.severity_threshold || 'low';

    const messages: McpPromptMessage[] = [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Please perform a comprehensive security analysis of the following content using Prisma AIRS.

**Content to Analyze:**
${content}

**Context:**
${context}

**Requirements:**
1. Use the airs_scan_content tool to analyze the content
2. Report all threats with severity ${threshold} or higher
3. Provide specific examples from the content for each threat found
4. Suggest remediation steps for each identified issue
5. Give an overall security assessment and risk score

Please structure your response with:
- Executive Summary
- Detailed Findings
- Risk Assessment
- Recommendations`,
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

    return { messages };
}
```

### Threat Investigation Prompt Generation

```typescript
private getThreatInvestigationPrompt(args: Record<string, string>): McpPromptsGetResult {
    const scanId = args.scan_id || '[No scan ID provided]';
    const focusArea = args.focus_area;

    const messages: McpPromptMessage[] = [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Please investigate the security scan with ID: ${scanId}

${focusArea ? `Focus specifically on threats related to: ${focusArea}` : 'Investigate all detected threats'}

**Investigation Steps:**
1. Use airs_get_scan_results to retrieve the scan details
2. If a report ID is available, use airs_get_threat_reports for detailed analysis
3. Analyze each detected threat:
   - Threat type and severity
   - Potential impact
   - Attack vectors
   - False positive assessment
4. Provide timeline and correlation analysis
5. Recommend immediate actions and long-term mitigations

Format your investigation as a professional security report.`,
            },
        },
        // ... assistant response
    ];

    return { messages };
}
```

### Compliance Check Prompt Generation

```typescript
private getComplianceCheckPrompt(args: Record<string, string>): McpPromptsGetResult {
    const content = args.content || '[No content provided]';
    const regulations = args.regulations || 'GDPR, HIPAA, PCI-DSS';
    const profileName = args.profile_name;

    const messages: McpPromptMessage[] = [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Please perform a compliance check on the following content against ${regulations} regulations.

**Content to Check:**
${content}

${profileName ? `**Use Security Profile:** ${profileName}` : ''}

**Compliance Analysis Required:**
1. Use airs_scan_content to identify any data that might violate regulations
2. Check for:
   - Personal Identifiable Information (PII)
   - Protected Health Information (PHI)
   - Payment Card Information (PCI)
   - Sensitive personal data categories
3. Map findings to specific regulatory requirements
4. Assess the compliance risk level
5. Provide remediation guidance

Structure your response as:
- Compliance Summary
- Detailed Findings by Regulation
- Risk Matrix
- Remediation Plan
- Compliance Checklist`,
            },
        },
        // ... assistant response
    ];

    return { messages };
}
```

### Incident Response Prompt Generation

```typescript
private getIncidentResponsePrompt(args: Record<string, string>): McpPromptsGetResult {
    const incidentType = args.incident_type || 'unknown';
    const reportId = args.report_id;
    const urgency = args.urgency || 'medium';

    const messages: McpPromptMessage[] = [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `SECURITY INCIDENT RESPONSE REQUIRED

**Incident Type:** ${incidentType}
**Urgency Level:** ${urgency}
${reportId ? `**Related Report ID:** ${reportId}` : ''}

Please guide me through the incident response process:

1. **Immediate Actions** (0-15 minutes):
   - Containment steps
   - Evidence preservation
   - Initial assessment

2. **Investigation** (15-60 minutes):
   ${reportId ? '- Use airs_get_threat_reports to analyze the incident' : '- Determine scope and impact'}
   - Identify affected systems/data
   - Determine attack vector

3. **Mitigation** (1-4 hours):
   - Stop the threat
   - Patch vulnerabilities
   - Update security controls

4. **Recovery** (4-24 hours):
   - Restore normal operations
   - Verify security posture
   - Monitor for recurrence

5. **Lessons Learned**:
   - Root cause analysis
   - Process improvements
   - Documentation updates

Provide step-by-step guidance with specific commands and checks.`,
            },
        },
        {
            role: 'assistant',
            content: {
                type: 'text',
                text: `I'll guide you through the incident response for this ${urgency} priority ${incidentType} incident. Let's start with immediate containment actions.

**IMMEDIATE ACTIONS REQUIRED:**`,
            },
        },
    ];

    return { messages };
}
```

## Error Handling

### Invalid Prompt Name

```typescript
default:
    throw new Error(`Unknown prompt: ${params.name}`);
```

### Missing Required Arguments

```typescript
// Built into prompt generation
const content = args.content || '[No content provided]';
// Prompts handle missing arguments gracefully
```

## Logging and Monitoring

### Debug Logging

```typescript
// List prompts logging
this.logger.debug('Listing prompts', { cursor: params?.cursor });

// Get prompt logging
this.logger.debug('Getting prompt', {
    name: params.name,
    hasArguments: !!params.arguments,
});
```

### Performance Tracking

```typescript
// Can be extended with:
const start = Date.now();
const result = this.generatePrompt(args);
this.logger.info('Prompt generated', {
    name: params.name,
    duration: Date.now() - start,
    messageCount: result.messages.length,
});
```

## Best Practices

### 1. Argument Handling

```typescript
// Provide defaults for optional arguments
const threshold = args.severity_threshold || 'low';
const regulations = args.regulations || 'GDPR, HIPAA, PCI-DSS';
const urgency = args.urgency || 'medium';
```

### 2. Clear Instructions

```typescript
// Be specific about tool usage
"1. Use the airs_scan_content tool to analyze the content"

// Provide structured output requirements
"Please structure your response with:
- Executive Summary
- Detailed Findings
- Risk Assessment
- Recommendations"
```

### 3. Context Preservation

```typescript
// Include user arguments in the prompt
`**Content to Analyze:**
${content}

**Context:**
${context}`
```

### 4. Professional Formatting

```typescript
// Use markdown for structure
"**Requirements:**
1. First requirement
2. Second requirement"

// Use clear section headers
"## Executive Summary"
```

## Testing

### Unit Tests

```typescript
describe('PromptHandler', () => {
    let handler: PromptHandler;

    beforeEach(() => {
        handler = new PromptHandler();
    });

    describe('listPrompts', () => {
        it('should return all available prompts', () => {
            const result = handler.listPrompts({});
            
            expect(result.prompts).toHaveLength(4);
            expect(result.prompts[0].name).toBe('security_analysis');
        });
    });

    describe('getPrompt', () => {
        it('should generate security analysis prompt', () => {
            const result = handler.getPrompt({
                name: 'security_analysis',
                arguments: {
                    content: 'Test content',
                    severity_threshold: 'high'
                }
            });
            
            expect(result.messages).toHaveLength(2);
            expect(result.messages[0].role).toBe('user');
            expect(result.messages[0].content.text).toContain('Test content');
            expect(result.messages[0].content.text).toContain('severity high');
        });

        it('should throw error for unknown prompt', () => {
            expect(() => {
                handler.getPrompt({ name: 'unknown_prompt' });
            }).toThrow('Unknown prompt: unknown_prompt');
        });
    });
});
```

### Integration Tests

```typescript
it('should integrate with MCP server', async () => {
    const server = new MCPServer();
    const handler = new PromptHandler();
    
    // Register handler
    server.setPromptHandler(handler);
    
    // Test prompt listing
    const listResult = await server.handleRequest({
        jsonrpc: '2.0',
        method: 'prompts/list',
        id: '1'
    });
    
    expect(listResult.result.prompts).toBeDefined();
});
```

## Usage Example

### Using Prompts in Claude

```typescript
// 1. List available prompts
const prompts = await mcp.listPrompts();

// 2. Select security analysis prompt
const securityPrompt = prompts.find(p => p.name === 'security_analysis');

// 3. Get prompt with arguments
const workflow = await mcp.getPrompt({
    name: 'security_analysis',
    arguments: {
        content: 'User provided content here',
        context: 'Chat conversation',
        severity_threshold: 'medium'
    }
});

// 4. Execute the workflow
// The prompt provides structured instructions for:
// - Using airs_scan_content tool
// - Analyzing results
// - Generating security report
```

## Extending the Module

### Adding New Prompts

1. **Add prompt constant**:
   ```typescript
   private static readonly PROMPTS = {
       // ... existing prompts
       NEW_WORKFLOW: 'new_workflow',
   } as const;
   ```

2. **Add to listPrompts**:
   ```typescript
   {
       name: PromptHandler.PROMPTS.NEW_WORKFLOW,
       title: 'New Workflow',
       description: 'Description here',
       arguments: [...]
   }
   ```

3. **Add case in getPrompt**:
   ```typescript
   case PromptHandler.PROMPTS.NEW_WORKFLOW:
       return this.getNewWorkflowPrompt(args);
   ```

4. **Implement generation method**:
   ```typescript
   private getNewWorkflowPrompt(args: Record<string, string>): McpPromptsGetResult {
       // Generate prompt messages
   }
   ```

### Adding Dynamic Features

```typescript
// Conditional content based on arguments
if (args.advanced_analysis === 'true') {
    messages.push({
        role: 'user',
        content: {
            type: 'text',
            text: 'Additionally, perform advanced threat correlation...'
        }
    });
}

// Multi-language support
const language = args.language || 'en';
const promptText = this.getLocalizedPrompt(language, 'security_analysis');
```

## Performance Optimization

### Caching Static Content

```typescript
private static readonly PROMPT_TEMPLATES = new Map<string, string>();

// Cache frequently used templates
if (!PROMPT_TEMPLATES.has(promptName)) {
    PROMPT_TEMPLATES.set(promptName, generateTemplate());
}
```

### Lazy Loading

```typescript
// Load prompt definitions on demand
private loadPromptDefinition(name: string): McpPrompt {
    // Load from file or database
    return promptDefinitions.get(name);
}
```

## Related Documentation

- [Prompts Overview]({{ site.baseurl }}/developers/src/prompts/overview/) - Module overview
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Type definitions
- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Tool integration
- [Workflow Guide]({{ site.baseurl }}/developers/workflows/) - Creating workflows