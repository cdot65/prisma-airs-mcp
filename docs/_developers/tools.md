---
layout: documentation
title: MCP Tools
description: Implementing and using MCP tools for AIRS operations
category: developers
---

## Overview

MCP Tools are the primary way to execute operations in Prisma AIRS. They provide a structured interface for AI
assistants to perform security scans, retrieve results, and manage the system.

## Available Tools

### 1. airs_scan_content

Performs synchronous security scanning with immediate results.

```typescript
{
    name: "airs_scan_content",
        description
:
    "Scan text content for security threats",
        inputSchema
:
    {
        type: "object",
            properties
    :
        {
            prompt: {
                type: "string",
                    description
            :
                "The prompt text to scan"
            }
        ,
            response: {
                type: "string",
                    description
            :
                "The AI response text to scan"
            }
        ,
            profileName: {
                type: "string",
                    description
            :
                "Security profile to use",
            default:
                "Prisma AIRS"
            }
        ,
            metadata: {
                type: "object",
                    description
            :
                "Additional metadata",
                    properties
            :
                {
                    app_name: {
                        type: "string"
                    }
                ,
                    user_id: {
                        type: "string"
                    }
                }
            }
        }
    }
}
```

### 2. airs_scan_async

Submits content for asynchronous batch scanning.

```typescript
{
    name: "airs_scan_async",
        description
:
    "Submit multiple items for async scanning",
        inputSchema
:
    {
        type: "object",
            required
    :
        ["contents"],
            properties
    :
        {
            contents: {
                type: "array",
                    items
            :
                {
                    type: "object",
                        properties
                :
                    {
                        prompt: {
                            type: "string"
                        }
                    ,
                        response: {
                            type: "string"
                        }
                    ,
                        code_prompt: {
                            type: "string"
                        }
                    ,
                        code_response: {
                            type: "string"
                        }
                    }
                }
            }
        ,
            profileName: {
                type: "string"
            }
        ,
            tr_id: {
                type: "string",
                    description
            :
                "Transaction ID for correlation"
            }
        }
    }
}
```

### 3. airs_get_scan_results

Retrieves results from async scan operations.

```typescript
{
    name: "airs_get_scan_results",
        description
:
    "Get results for async scan IDs",
        inputSchema
:
    {
        type: "object",
            required
    :
        ["scan_ids"],
            properties
    :
        {
            scan_ids: {
                type: "array",
                    items
            :
                {
                    type: "string"
                }
            ,
                maxItems: 5,
                    description
            :
                "Array of scan IDs to retrieve"
            }
        }
    }
}
```

### 4. airs_get_threat_reports

Retrieves detailed threat analysis reports.

```typescript
{
    name: "airs_get_threat_reports",
        description
:
    "Get detailed threat analysis reports",
        inputSchema
:
    {
        type: "object",
            required
    :
        ["report_ids"],
            properties
    :
        {
            report_ids: {
                type: "array",
                    items
            :
                {
                    type: "string"
                }
            ,
                maxItems: 5
            }
        }
    }
}
```

### 5. airs_clear_cache

Clears the server-side response cache.

```typescript
{
    name: "airs_clear_cache",
        description
:
    "Clear the response cache",
        inputSchema
:
    {
        type: "object",
            properties
    :
        {
            scope: {
                type: "string",

                enum

            :
                ["all", "scan_results", "reports"],
            default:
                "all"
            }
        }
    }
}
```

## Tool Implementation

### Basic Tool Handler

```typescript
import {
    CallToolRequestSchema,
    Tool,
} from '@modelcontextprotocol/sdk/types.js';

const scanContentTool: Tool = {
    name: 'airs_scan_content',
    description: 'Scan content for security threats',
    inputSchema: {
        /* schema definition */
    },
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case 'airs_scan_content':
            return handleScanContent(args);
        case 'airs_scan_async':
            return handleScanAsync(args);
        // ... other tools
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
```

### Scan Content Implementation

```typescript
async function handleScanContent(args: any): Promise<ToolResult> {
    try {
        // Validate input
        const { prompt, response, profileName, metadata } =
            validateScanArgs(args);

        // Check if at least one content field is provided
        if (!prompt && !response) {
            throw new Error('Either prompt or response must be provided');
        }

        // Build scan request
        const scanRequest: ScanRequest = {
            ai_profile: { profile_name: profileName || 'Prisma AIRS' },
            contents: [
                {
                    prompt: prompt || undefined,
                    response: response || undefined,
                },
            ],
            metadata: metadata || undefined,
        };

        // Execute scan
        const result = await airsClient.scanContent(scanRequest);

        // Format response
        const summary = formatScanResult(result);

        // Register as resource
        resourceRegistry.register(`airs://scan-results/${result.scan_id}`, {
            name: `Scan Result ${result.scan_id}`,
            description: `Security scan completed at ${new Date().toISOString()}`,
            mimeType: 'application/json',
        });

        return {
            content: [
                {
                    type: 'text',
                    text: summary,
                },
            ],
            isError: false,
        };
    } catch (error) {
        logger.error('Scan content error', error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}
```

### Async Scan Implementation

```typescript
async function handleScanAsync(args: any): Promise<ToolResult> {
    try {
        const { contents, profileName, tr_id } = args;

        // Validate contents array
        if (!Array.isArray(contents) || contents.length === 0) {
            throw new Error('Contents array is required');
        }

        // Build request
        const scanRequest: AsyncScanRequest = {
            ai_profile: { profile_name: profileName || 'Prisma AIRS' },
            contents: contents.map(validateContentItem),
            tr_id: tr_id || generateTransactionId(),
        };

        // Submit async scan
        const result = await airsClient.scanAsync(scanRequest);

        // Track scan for later retrieval
        scanTracker.track(result.scan_id, {
            submitted: Date.now(),
            itemCount: contents.length,
            status: 'processing',
        });

        return {
            content: [
                {
                    type: 'text',
                    text:
                        `Async scan submitted successfully\n\n` +
                        `Scan ID: ${result.scan_id}\n` +
                        `Items: ${contents.length}\n` +
                        `Status: Processing\n\n` +
                        `Use airs_get_scan_results to retrieve results`,
                },
            ],
            isError: false,
        };
    } catch (error) {
        return handleToolError(error);
    }
}
```

### Result Retrieval Implementation

```typescript
async function handleGetScanResults(args: any): Promise<ToolResult> {
    try {
        const { scan_ids } = args;

        // Validate input
        if (!Array.isArray(scan_ids) || scan_ids.length === 0) {
            throw new Error('scan_ids array is required');
        }

        if (scan_ids.length > 5) {
            throw new Error('Maximum 5 scan IDs allowed per request');
        }

        // Retrieve results
        const results = await airsClient.getScanResults(scan_ids);

        // Format results
        const summary = results
            .map((result, index) => {
                const threats = detectThreats(result);
                return (
                    `${index + 1}. Scan ${result.scan_id}:\n` +
                    `   - Category: ${result.category}\n` +
                    `   - Action: ${result.action}\n` +
                    `   - Threats: ${threats.length > 0 ? threats.join(', ') : 'None detected'}`
                );
            })
            .join('\n\n');

        // Register results as resources
        results.forEach((result) => {
            resourceRegistry.register(`airs://scan-results/${result.scan_id}`, {
                name: `Scan Result ${result.scan_id}`,
                description: `Retrieved at ${new Date().toISOString()}`,
                mimeType: 'application/json',
                data: result,
            });
        });

        return {
            content: [
                {
                    type: 'text',
                    text: `Retrieved ${results.length} scan results:\n\n${summary}`,
                },
            ],
            isError: false,
        };
    } catch (error) {
        return handleToolError(error);
    }
}
```

## Advanced Tool Patterns

### Tool Composition

```typescript
// Combine multiple tools for complex operations
async function performComprehensiveAnalysis(
    content: string,
): Promise<AnalysisResult> {
    // Step 1: Initial scan
    const scanResult = await callTool('airs_scan_content', {
        prompt: content,
        profileName: 'Strict Security',
    });

    // Step 2: If threats detected, get detailed report
    if (scanResult.category === 'malicious') {
        const report = await callTool('airs_get_threat_reports', {
            report_ids: [scanResult.report_id],
        });

        // Step 3: Perform remediation
        const remediation = await callTool('suggest_remediation', {
            report_id: scanResult.report_id,
            threat_type: report.primary_threat,
        });

        return {
            scan: scanResult,
            report: report,
            remediation: remediation,
        };
    }

    return { scan: scanResult };
}
```

### Tool Middleware

```typescript
// Add middleware for all tools
interface ToolMiddleware {
    before?: (name: string, args: any) => Promise<any>;
    after?: (name: string, args: any, result: any) => Promise<any>;
}

class ToolExecutor {
    private middlewares: ToolMiddleware[] = [];

    use(middleware: ToolMiddleware): void {
        this.middlewares.push(middleware);
    }

    async execute(name: string, args: any): Promise<ToolResult> {
        // Run before middlewares
        let processedArgs = args;
        for (const mw of this.middlewares) {
            if (mw.before) {
                processedArgs = await mw.before(name, processedArgs);
            }
        }

        // Execute tool
        let result = await this.executeToolHandler(name, processedArgs);

        // Run after middlewares
        for (const mw of this.middlewares) {
            if (mw.after) {
                result = await mw.after(name, processedArgs, result);
            }
        }

        return result;
    }
}

// Example: Logging middleware
toolExecutor.use({
    before: async (name, args) => {
        logger.info('Tool execution started', { name, args });
        return args;
    },
    after: async (name, args, result) => {
        logger.info('Tool execution completed', {
            name,
            success: !result.isError,
        });
        return result;
    },
});
```

### Tool Validation

```typescript
import { z } from 'zod';

// Define schemas for each tool
const toolSchemas = {
    airs_scan_content: z
        .object({
            prompt: z.string().optional(),
            response: z.string().optional(),
            profileName: z.string().optional(),
            metadata: z
                .object({
                    app_name: z.string().optional(),
                    user_id: z.string().optional(),
                })
                .optional(),
        })
        .refine(
            (data) => data.prompt || data.response,
            'Either prompt or response must be provided',
        ),

    airs_scan_async: z.object({
        contents: z
            .array(
                z.object({
                    prompt: z.string().optional(),
                    response: z.string().optional(),
                }),
            )
            .min(1)
            .max(100),
        profileName: z.string().optional(),
        tr_id: z.string().optional(),
    }),
};

// Validate before execution
function validateToolArgs(name: string, args: any): any {
    const schema = toolSchemas[name];
    if (!schema) {
        throw new Error(`No schema defined for tool: ${name}`);
    }

    return schema.parse(args);
}
```

## Error Handling

### Structured Error Responses

```typescript
interface ToolError {
    code: string;
    message: string;
    details?: any;
}

function handleToolError(error: any): ToolResult {
    let toolError: ToolError;

    if (error instanceof AIRSError) {
        toolError = {
            code: error.code,
            message: error.message,
            details: error.details,
        };
    } else if (error instanceof z.ZodError) {
        toolError = {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tool arguments',
            details: error.errors,
        };
    } else {
        toolError = {
            code: 'INTERNAL_ERROR',
            message: error.message || 'An unexpected error occurred',
        };
    }

    return {
        content: [
            {
                type: 'text',
                text: `Error: ${toolError.message}\nCode: ${toolError.code}`,
            },
        ],
        isError: true,
    };
}
```

## Testing Tools

### Unit Testing

```typescript
describe('airs_scan_content tool', () => {
    let mockClient: MockAIRSClient;

    beforeEach(() => {
        mockClient = new MockAIRSClient();
    });

    it('should scan content successfully', async () => {
        mockClient.setMockResponse('scanContent', {
            scan_id: 'test-123',
            category: 'benign',
            action: 'allow',
        });

        const result = await handleScanContent({
            prompt: 'Test prompt',
            profileName: 'Test Profile',
        });

        expect(result.isError).toBe(false);
        expect(result.content[0].text).toContain('benign');
    });

    it('should handle validation errors', async () => {
        const result = await handleScanContent({
            // Missing both prompt and response
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Either prompt or response');
    });
});
```

### Integration Testing

```typescript
describe('Tool integration tests', () => {
    it('should perform full scan workflow', async () => {
        // Submit async scan
        const submitResult = await callTool('airs_scan_async', {
            contents: [{ prompt: 'Test 1' }, { prompt: 'Test 2' }],
        });

        expect(submitResult.isError).toBe(false);
        const scanId = extractScanId(submitResult.content[0].text);

        // Wait for processing
        await delay(2000);

        // Retrieve results
        const results = await callTool('airs_get_scan_results', {
            scan_ids: [scanId],
        });

        expect(results.isError).toBe(false);
        expect(results.content[0].text).toContain('Retrieved 1 scan results');
    });
});
```

## Best Practices

1. **Input Validation**: Always validate tool inputs using schemas
2. **Error Messages**: Provide clear, actionable error messages
3. **Resource Creation**: Create resources for significant results
4. **Idempotency**: Make tools idempotent where possible
5. **Logging**: Log tool usage for debugging and analytics
6. **Rate Limiting**: Respect API rate limits in tool implementations
7. **Timeouts**: Set appropriate timeouts for long-running operations

## Next Steps

- [Prompts]({{ site.baseurl }}/developers/prompts) - Creating interactive prompts
- [Tool Patterns]({{ site.baseurl }}/developers/patterns/tools) - Advanced tool patterns
- [Error Handling]({{ site.baseurl }}/developers/error-handling) - Comprehensive error handling
- [Testing]({{ site.baseurl }}/developers/testing) - Testing strategies
