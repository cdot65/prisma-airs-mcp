---
layout: documentation
title: Prompts Overview
permalink: /developers/src/prompts/overview/
category: developers
---

The prompts module (`src/prompts/`) implements pre-configured AI workflows for common security tasks. These prompts
provide guided interactions that combine multiple MCP tools to accomplish complex security analysis and incident
response scenarios.

## Module Structure

```text
src/prompts/
└── index.ts   # Prompt handler implementation
```

## Architecture

```text
┌─────────────────────────────────────────┐
│             MCP Client                  │
│        (Claude, IDE, etc.)              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           Prompt Request                │
│    • List available prompts             │
│    • Get specific prompt                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          PromptHandler                  │
│    • Workflow definitions               │
│    • Argument processing                │
│    • Message generation                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│       Generated Workflow                │
│    • User instructions                  │
│    • Tool integration steps             │
│    • Response templates                 │
└─────────────────────────────────────────┘
```

## Available Prompts

### 1. Security Analysis (`security_analysis`)

Comprehensive security analysis of content with threat detection and recommendations.

**Use Cases:**

- Analyze user inputs for security threats
- Evaluate AI-generated responses for risks
- Perform security assessments on text content
- Generate security reports

**Arguments:**

- `content` (required): Content to analyze
- `context` (optional): Additional context
- `severity_threshold` (optional): Minimum severity to report

### 2. Threat Investigation (`threat_investigation`)

Deep-dive investigation of detected security threats.

**Use Cases:**

- Investigate specific scan results
- Analyze threat patterns
- Determine false positives
- Create detailed threat reports

**Arguments:**

- `scan_id` (required): Scan ID to investigate
- `focus_area` (optional): Specific threat type to focus on

### 3. Compliance Check (`compliance_check`)

Check content against regulatory compliance requirements.

**Use Cases:**

- GDPR compliance verification
- HIPAA data protection checks
- PCI-DSS compliance validation
- Data privacy assessments

**Arguments:**

- `content` (required): Content to check
- `regulations` (optional): Regulations to check against
- `profile_name` (optional): Security profile to use

### 4. Incident Response (`incident_response`)

Guided incident response workflow for security issues.

**Use Cases:**

- Data breach response
- Injection attack mitigation
- Malicious code incidents
- Security incident handling

**Arguments:**

- `incident_type` (required): Type of incident
- `report_id` (optional): Related threat report
- `urgency` (optional): Incident urgency level

## Workflow Structure

### Prompt Message Format

Each prompt returns a structured conversation:

```typescript
interface PromptResult {
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: {
            type: 'text';
            text: string;
        };
    }>;
}
```

### Workflow Components

1. **Initial Instructions**
    - Clear objective statement
    - Required tools and steps
    - Expected outcomes

2. **Tool Integration**
    - Specific tool calls required
    - Parameter guidance
    - Result interpretation

3. **Response Structure**
    - Standardized report formats
    - Section organization
    - Action items

## Integration with Tools

### Tool Usage Patterns

Prompts integrate with MCP tools:

```text
┌─────────────────┐     ┌─────────────────┐
│     Prompt      │────▶│   Tool Calls    │
│   Workflow      │     │                 │
└─────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌───────────────────┐
         │              │ airs_scan_content │
         │              │ airs_get_results  │
         │              │ airs_get_reports  │
         └─────────────▶└───────────────────┘
```

### Common Tool Sequences

1. **Security Analysis Flow**

   ```text
   1. airs_scan_content → Initial scan
   2. airs_get_scan_results → Retrieve details
   3. airs_get_threat_reports → Deep analysis
   ```

2. **Investigation Flow**

   ```text
   1. airs_get_scan_results → Get scan data
   2. airs_get_threat_reports → Detailed reports
   3. airs_scan_content → Additional checks
   ```

## Workflow Examples

### Security Analysis Workflow

```text
User Input:
- Content to analyze
- Context information
- Severity threshold

Workflow Steps:
1. Initial content scan
2. Threat identification
3. Risk assessment
4. Remediation suggestions
5. Executive summary

Output Structure:
- Executive Summary
- Detailed Findings
- Risk Assessment
- Recommendations
```

### Incident Response Workflow

```text
Incident Trigger:
- Incident type
- Urgency level
- Related reports

Response Phases:
1. Immediate Actions (0-15 min)
2. Investigation (15-60 min)
3. Mitigation (1-4 hours)
4. Recovery (4-24 hours)
5. Lessons Learned

Deliverables:
- Action checklist
- Investigation findings
- Mitigation steps
- Recovery plan
- Post-mortem report
```

## Best Practices

### 1. Argument Validation

```typescript
// Always validate required arguments
if (!args.content) {
    throw new Error('Content is required for security analysis');
}

// Provide sensible defaults
const threshold = args.severity_threshold || 'low';
```

### 2. Clear Instructions

```typescript
// Be specific about tool usage
"Use the airs_scan_content tool with the following parameters:"

// Provide examples
"For example: airs_scan_content({ content: '...', profile_name: 'strict' })"
```

### 3. Structured Output

```typescript
// Define clear output structure
"Please structure your response with:
- Executive Summary
- Detailed Findings
- Risk Assessment
- Recommendations"
```

### 4. Error Guidance

```typescript
// Include error handling instructions
"If the scan fails, check:
1. Content format is valid
2. Profile name exists
3. API connectivity"
```

## Customization

### Adding New Prompts

1. **Define the prompt**:

   ```typescript
   PROMPTS.NEW_WORKFLOW = 'new_workflow'
   ```

2. **Add to listing**:

   ```typescript
   {
       name: 'new_workflow',
       description: 'Description',
       arguments: [...]
   }
   ```

3. **Implement handler**:

   ```typescript
   case PROMPTS.NEW_WORKFLOW:
       return this.getNewWorkflowPrompt(args);
   ```

### Extending Workflows

```typescript
// Add conditional logic
if (args.advanced_mode === 'true') {
    messages.push({
        role: 'user',
        content: { 
            type: 'text', 
            text: 'Include advanced analysis...'
        }
    });
}
```

## Testing Prompts

### Unit Testing

```typescript
describe('PromptHandler', () => {
    it('should generate security analysis prompt', () => {
        const handler = new PromptHandler();
        const result = handler.getPrompt({
            name: 'security_analysis',
            arguments: { content: 'test content' }
        });
        
        expect(result.messages).toHaveLength(2);
        expect(result.messages[0].role).toBe('user');
    });
});
```

### Integration Testing

```typescript
it('should integrate with tools', async () => {
    // Get prompt
    const prompt = handler.getPrompt({ name: 'security_analysis' });
    
    // Execute workflow
    const scanResult = await tools.call('airs_scan_content', {
        content: 'test content'
    });
    
    // Verify integration
    expect(scanResult.success).toBe(true);
});
```

## Performance Considerations

### Message Generation

- Keep initial messages concise
- Avoid redundant instructions
- Use references to documentation
- Cache static content

### Workflow Efficiency

- Minimize tool calls
- Batch operations when possible
- Provide clear stopping conditions
- Include timeout guidance

## Security Guidelines

### Input Sanitization

```typescript
// Sanitize user inputs
const sanitizedContent = args.content
    .replace(/[<>]/g, '')
    .substring(0, 10000);
```

### Sensitive Data

```typescript
// Warn about sensitive data
"⚠️ Warning: Do not include API keys, passwords, or other secrets"
```

### Access Control

```typescript
// Check permissions if needed
if (requiresElevated && !hasPermission) {
    throw new Error('Elevated permissions required');
}
```

## Monitoring and Analytics

### Usage Tracking

```typescript
logger.info('Prompt requested', {
    prompt: params.name,
    hasArguments: !!params.arguments,
    timestamp: new Date().toISOString()
});
```

### Performance Metrics

```typescript
const start = Date.now();
const result = this.generatePrompt(args);
const duration = Date.now() - start;

logger.debug('Prompt generated', {
    prompt: name,
    duration,
    messageCount: result.messages.length
});
```

## Future Enhancements

### Planned Features

1. **Dynamic Workflows**
    - Conditional branching
    - Multi-step wizards
    - Interactive prompts

2. **Template System**
    - Reusable components
    - Variable substitution
    - Template inheritance

3. **Workflow Store**
    - Save custom workflows
    - Share workflows
    - Version control

4. **Analytics Dashboard**
    - Usage statistics
    - Performance metrics
    - Error tracking

## Related Documentation

- [Prompt Index]({{ site.baseurl }}/developers/src/prompts/index-file/) - Implementation details
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Tools Overview]({{ site.baseurl }}/developers/src/tools/overview/) - Available tools
- [Workflow Guide]({{ site.baseurl }}/developers/workflows/) - Creating workflows
