---
layout: documentation
title: Prompts Module (src/prompts/)
permalink: /developers/src/prompts/
category: developers
---

# Prompts Module Documentation

The prompts module provides pre-defined conversation templates for common security workflows using Prisma AIRS. These prompts guide AI models through structured security analysis, threat investigation, compliance checking, and incident response procedures.

## Module Overview

The prompts module implements the MCP prompt interface to provide:

- Security analysis workflows
- Threat investigation procedures
- Compliance checking protocols
- Incident response guidance
- Structured prompt generation with argument interpolation

## Architecture

The module follows the MCP prompt specification, providing structured conversation templates that can be filled with dynamic arguments.

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
**Purpose:** Analyze content for security threats and provide recommendations

#### Arguments

```typescript
const securityAnalysisPrompt: McpPrompt = {
    name: 'security_analysis',
    description: 'Analyze content for security threats',
    arguments: [
        {
            name: 'content',
            description: 'The content to analyze',
            required: true
        },
        {
            name: 'context',
            description: 'Additional context',
            required: false
        },
        {
            name: 'severity_threshold',
            description: 'Minimum severity (low, medium, high)',
            required: false
        }
    ]
};
```

#### Generated Workflow

The prompt generates a structured conversation that:

1. Scans content using AIRS tools
2. Reports threats above severity threshold
3. Provides specific examples for each threat
4. Suggests remediation steps
5. Delivers overall security assessment

#### Example Usage

```typescript
const result = await promptHandler.getPrompt({
    name: 'security_analysis',
    arguments: {
        content: 'Check if this SQL query is safe: SELECT * FROM users',
        context: 'User-submitted database query',
        severity_threshold: 'medium'
    }
});
```

### 2. Threat Investigation Workflow

**Name:** `threat_investigation`  
**Purpose:** Investigate detected threats and provide detailed analysis

#### Arguments

```typescript
const threatInvestigationPrompt: McpPrompt = {
    name: 'threat_investigation',
    arguments: [
        {
            name: 'scan_id',
            description: 'Scan ID or report ID',
            required: true
        },
        {
            name: 'threat_type',
            description: 'Specific threat to investigate',
            required: false
        },
        {
            name: 'deep_analysis',
            description: 'Perform deep analysis (true/false)',
            required: false
        }
    ]
};
```

#### Investigation Process

1. Retrieves scan results using provided ID
2. Analyzes specific threat indicators
3. Traces threat patterns and behaviors
4. Identifies potential attack vectors
5. Recommends containment strategies

### 3. Compliance Check Workflow

**Name:** `compliance_check`  
**Purpose:** Check content against regulatory compliance requirements

#### Arguments

```typescript
const complianceCheckPrompt: McpPrompt = {
    name: 'compliance_check',
    arguments: [
        {
            name: 'content',
            description: 'Content to check',
            required: true
        },
        {
            name: 'regulations',
            description: 'Regulations to check (GDPR, HIPAA, PCI-DSS)',
            required: true
        },
        {
            name: 'region',
            description: 'Geographic region',
            required: false
        }
    ]
};
```

#### Compliance Analysis

- Scans for sensitive data exposure
- Checks data handling practices
- Identifies regulatory violations
- Provides compliance recommendations
- Generates audit trail

### 4. Incident Response Workflow

**Name:** `incident_response`  
**Purpose:** Guide through security incident response procedures

#### Arguments

```typescript
const incidentResponsePrompt: McpPrompt = {
    name: 'incident_response',
    arguments: [
        {
            name: 'incident_type',
            description: 'Type of incident',
            required: true
        },
        {
            name: 'severity',
            description: 'Incident severity',
            required: true
        },
        {
            name: 'affected_systems',
            description: 'Affected systems',
            required: false
        },
        {
            name: 'initial_indicators',
            description: 'Initial indicators',
            required: false
        }
    ]
};
```

#### Response Workflow

1. **Identification**: Scan and identify threats
2. **Containment**: Immediate containment steps
3. **Eradication**: Remove threat sources
4. **Recovery**: System restoration guidance
5. **Lessons Learned**: Post-incident analysis

## Implementation Details

### Prompt Handler Class

```typescript
export class PromptHandler {
    private prompts: Map<string, McpPrompt>;

    constructor() {
        this.prompts = new Map();
        this.initializePrompts();
    }

    listPrompts(params?: McpPromptsListParams): McpPromptsListResult {
        const prompts = Array.from(this.prompts.values());
        
        // Handle pagination if cursor provided
        if (params?.cursor) {
            // Implementation for cursor-based pagination
        }
        
        return { prompts };
    }

    getPrompt(params: McpPromptsGetParams): McpPromptsGetResult {
        const prompt = this.prompts.get(params.name);
        
        if (!prompt) {
            throw new Error(`Prompt not found: ${params.name}`);
        }
        
        // Generate messages with interpolated arguments
        const messages = this.generateMessages(prompt, params.arguments);
        
        return { messages };
    }
}
```

### Message Generation

```typescript
private generateMessages(
    prompt: McpPrompt,
    args?: Record<string, string>
): McpPromptMessage[] {
    // Validate required arguments
    this.validateArguments(prompt, args);
    
    // Generate workflow-specific messages
    switch (prompt.name) {
        case 'security_analysis':
            return this.generateSecurityAnalysisMessages(args!);
        case 'threat_investigation':
            return this.generateThreatInvestigationMessages(args!);
        // ... other workflows
    }
}
```

### Security Analysis Message Generation

```typescript
private generateSecurityAnalysisMessages(
    args: Record<string, string>
): McpPromptMessage[] {
    const severityThreshold = args.severity_threshold || 'low';
    
    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Please analyze this content for security threats:\n\n${args.content}`
            }
        },
        {
            role: 'assistant',
            content: {
                type: 'text',
                text: 'I\'ll analyze this content for security threats using Prisma AIRS.'
            }
        },
        {
            role: 'assistant',
            content: {
                type: 'text',
                text: `First, let me scan the content with severity threshold: ${severityThreshold}`
            }
        }
    ];
}
```

## Integration with MCP Server

### Handling Prompt Requests

```typescript
// In transport/http.ts
private handlePromptsGet(params: unknown): unknown {
    return this.promptHandler.getPrompt(params as McpPromptsGetParams);
}

private handlePromptsList(params: unknown): unknown {
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
const { prompts } = await client.listPrompts();

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
    const { messages } = await client.getPrompt({
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

### 1. Argument Validation

Always validate required arguments:

```typescript
private validateArguments(
    prompt: McpPrompt,
    args?: Record<string, string>
): void {
    const required = prompt.arguments?.filter(a => a.required) || [];
    
    for (const arg of required) {
        if (!args?.[arg.name]) {
            throw new Error(`Missing required argument: ${arg.name}`);
        }
    }
}
```

### 2. Structured Workflows

Design prompts as complete workflows:

- Clear initialization
- Step-by-step progression
- Error handling guidance
- Summary and next steps

### 3. Context Preservation

Include context throughout the workflow:

```typescript
{
    role: 'assistant',
    content: {
        type: 'text',
        text: `Analyzing content with context: ${args.context || 'General'}`
    }
}
```

### 4. Tool Integration

Integrate with MCP tools in prompts:

```typescript
{
    role: 'assistant',
    content: {
        type: 'text',
        text: 'I\'ll use the airs_scan_content tool to analyze this...'
    }
}
```

## Extending Prompts

### Adding New Prompts

1. Define the prompt interface:

```typescript
const newPrompt: McpPrompt = {
    name: 'custom_workflow',
    description: 'Custom security workflow',
    arguments: [
        {
            name: 'param1',
            description: 'First parameter',
            required: true
        }
    ]
};
```

2. Add to prompt registry:

```typescript
private initializePrompts(): void {
    this.prompts.set('custom_workflow', newPrompt);
}
```

3. Implement message generation:

```typescript
private generateCustomWorkflowMessages(
    args: Record<string, string>
): McpPromptMessage[] {
    // Generate workflow messages
}
```

## Performance Considerations

- Prompts are stateless and lightweight
- Message generation is synchronous
- No caching needed (prompts are static)
- Minimal memory footprint

## Next Steps

- [Types Module]({{ site.baseurl }}/developers/src/types/) - MCP type definitions
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Tool implementations
- [Transport Module]({{ site.baseurl }}/developers/src/transport/) - Request handling