---
layout: documentation
title: Tools Index
permalink: /developers/src/tools/index-file/
category: developers
---

# Tools Index (src/tools/index.ts)

The tools index file implements the MCP tool handler that provides security scanning capabilities through the Prisma
AIRS API. This module exposes tools for content analysis, threat detection, and security report retrieval.

## Overview

The ToolHandler class:

- Manages available security scanning tools
- Processes tool arguments and validates inputs
- Integrates with the AIRS client for API operations
- Formats results with resource references
- Handles errors gracefully with detailed messages

## Core Implementation

### ToolHandler Class

```typescript
import { getLogger } from '../utils/logger.js';
import { getAirsClient } from '../airs/factory.js';
import { getConfig } from '../config';
import { ResourceHandler } from '../resources';
import type { Logger } from 'winston';

export class ToolHandler {
    private readonly logger: Logger;
    private readonly airsClient = getAirsClient();

    // Tool names
    private static readonly TOOLS = {
        SCAN_CONTENT: 'airs_scan_content',
        SCAN_ASYNC: 'airs_scan_async',
        GET_SCAN_RESULTS: 'airs_get_scan_results',
        GET_THREAT_REPORTS: 'airs_get_threat_reports',
        CLEAR_CACHE: 'airs_clear_cache',
    } as const;

    constructor() {
        this.logger = getLogger();
    }
```

## Available Tools

### 1. Scan Content (`airs_scan_content`)

Synchronous content scanning for immediate threat detection.

```typescript
{
    name: 'airs_scan_content',
    title: 'Scan Content for Threats',
    description: 'Analyze prompt and/or response content for security threats using Prisma AIRS',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'The prompt content to scan',
            },
            response: {
                type: 'string',
                description: 'The response content to scan',
            },
            context: {
                type: 'string',
                description: 'Additional context for the scan',
            },
            profileName: {
                type: 'string',
                description: 'Name of the AI security profile to use',
            },
            profileId: {
                type: 'string',
                description: 'ID of the AI security profile to use',
            },
            metadata: {
                type: 'object',
                description: 'Additional metadata for the scan',
                properties: {
                    appName: { type: 'string' },
                    appUser: { type: 'string' },
                    aiModel: { type: 'string' },
                    userIp: { type: 'string' },
                },
            },
        },
        required: [],
    },
}
```

### 2. Scan Async (`airs_scan_async`)

Asynchronous batch scanning for multiple requests.

```typescript
{
    name: 'airs_scan_async',
    title: 'Scan Content Asynchronously',
    description: 'Submit multiple scan requests for asynchronous processing',
    inputSchema: {
        type: 'object',
        properties: {
            requests: {
                type: 'array',
                description: 'Array of scan requests',
                items: {
                    type: 'object',
                    properties: {
                        reqId: {
                            type: 'integer',
                            description: 'Unique identifier for this request',
                        },
                        prompt: { type: 'string' },
                        response: { type: 'string' },
                        context: { type: 'string' },
                        profileName: { type: 'string' },
                        profileId: { type: 'string' },
                    },
                    required: ['reqId'],
                },
            },
        },
        required: ['requests'],
    },
}
```

### 3. Get Scan Results (`airs_get_scan_results`)

Retrieve results from previous scans.

```typescript
{
    name: 'airs_get_scan_results',
    title: 'Get Scan Results',
    description: 'Retrieve results for previously submitted scans',
    inputSchema: {
        type: 'object',
        properties: {
            scanIds: {
                type: 'array',
                description: 'Array of scan IDs to retrieve (max 5)',
                items: { type: 'string' },
            },
        },
        required: ['scanIds'],
    },
}
```

### 4. Get Threat Reports (`airs_get_threat_reports`)

Retrieve detailed threat analysis reports.

```typescript
{
    name: 'airs_get_threat_reports',
    title: 'Get Threat Reports',
    description: 'Retrieve detailed threat scan reports',
    inputSchema: {
        type: 'object',
        properties: {
            reportIds: {
                type: 'array',
                description: 'Array of report IDs to retrieve (max 5)',
                items: { type: 'string' },
            },
        },
        required: ['reportIds'],
    },
}
```

### 5. Clear Cache (`airs_clear_cache`)

Clear the AIRS client response cache.

```typescript
{
    name: 'airs_clear_cache',
    title: 'Clear Cache',
    description: 'Clear the AIRS response cache',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
}
```

## Method Implementations

### listTools Method

```typescript
listTools(params: McpToolsListParams): McpToolsListResult {
    this.logger.debug('Listing tools', { cursor: params?.cursor });

    const tools: McpTool[] = [
        // Tool definitions...
    ];

    return { tools };
}
```

### callTool Method

Main dispatcher for tool execution.

```typescript
async callTool(params: McpToolsCallParams): Promise<McpToolsCallResult> {
    this.logger.debug('Calling tool', {
        name: params.name,
        hasArguments: !!params.arguments,
    });

    try {
        switch (params.name) {
            case ToolHandler.TOOLS.SCAN_CONTENT:
                return this.scanContent(params.arguments || {});

            case ToolHandler.TOOLS.SCAN_ASYNC:
                return this.scanAsync(params.arguments || {});

            case ToolHandler.TOOLS.GET_SCAN_RESULTS:
                return this.getScanResults(params.arguments || {});

            case ToolHandler.TOOLS.GET_THREAT_REPORTS:
                return this.getThreatReports(params.arguments || {});

            case ToolHandler.TOOLS.CLEAR_CACHE:
                return this.clearCache();

            default:
                throw new Error(`Unknown tool: ${params.name}`);
        }
    } catch (error) {
        return this.createErrorResult(error);
    }
}
```

## Tool Implementation Details

### Scan Content Implementation

```typescript
private async scanContent(args: Record<string, unknown>): Promise<McpToolsCallResult> {
    const typedArgs = args as ToolsScanContentArgs;
    const scanRequest: AirsScanRequest = {
        tr_id: Date.now().toString(), // Generate unique transaction ID
        ai_profile: {},
        contents: [],
    };

    // Profile resolution hierarchy:
    // 1. Tool argument profileName
    // 2. Tool argument profileId
    // 3. Config defaultProfileId
    // 4. Config defaultProfileName
    // 5. Fallback to "Prisma AIRS"
    
    const config = getConfig();
    if (typedArgs.profileName) {
        scanRequest.ai_profile.profile_name = typedArgs.profileName;
    } else if (typedArgs.profileId) {
        scanRequest.ai_profile.profile_id = typedArgs.profileId;
    } else if (config.airs.defaultProfileId) {
        scanRequest.ai_profile.profile_id = config.airs.defaultProfileId;
    } else if (config.airs.defaultProfileName) {
        scanRequest.ai_profile.profile_name = config.airs.defaultProfileName;
    } else {
        scanRequest.ai_profile.profile_name = 'Prisma AIRS';
    }

    // Build content
    const content: {
        prompt?: string;
        response?: string;
        context?: string;
    } = {};
    if (typedArgs.prompt) content.prompt = typedArgs.prompt;
    if (typedArgs.response) content.response = typedArgs.response;
    if (typedArgs.context) content.context = typedArgs.context;

    if (Object.keys(content).length === 0) {
        throw new Error('At least one of prompt, response, or context is required');
    }

    scanRequest.contents.push(content);

    // Add metadata if provided
    if (typedArgs.metadata) {
        scanRequest.metadata = {
            app_name: typedArgs.metadata.appName,
            app_user: typedArgs.metadata.appUser,
            ai_model: typedArgs.metadata.aiModel,
            user_ip: typedArgs.metadata.userIp,
        };
    }

    // Perform scan
    const result = await this.airsClient.scanSync(scanRequest);

    // Create tool result
    const contents: McpToolResultContent[] = [
        {
            type: 'text',
            text: `Scan completed. Category: ${result.category}, Action: ${result.action}`,
        },
    ];

    // Add resource reference for detailed results
    if (result.scan_id) {
        contents.push({
            type: 'resource',
            resource: ResourceHandler.createResourceReference(
                'scan-result',
                result.scan_id,
                'Scan Result Details',
                result,
            ),
        });
    }

    // Add threat summary if threats detected
    if (result.category === 'malicious') {
        const threats = this.summarizeThreats(result);
        contents.push({
            type: 'text',
            text: `Threats detected: ${threats}`,
        });
    }

    return { content: contents };
}
```

### Scan Async Implementation

```typescript
private async scanAsync(args: Record<string, unknown>): Promise<McpToolsCallResult> {
    const typedArgs = args as unknown as ToolsScanAsyncArgs;

    if (!Array.isArray(typedArgs.requests)) {
        throw new Error('requests must be an array');
    }

    const config = getConfig();
    const asyncRequests: AirsAsyncScanObject[] = typedArgs.requests.map(
        (req: ToolsAsyncScanRequestItem) => {
            const scanRequest: AirsScanRequest = {
                ai_profile: {},
                contents: [],
            };

            // Apply same profile resolution hierarchy
            // ... profile setup code ...

            // Build content
            const content: {
                prompt?: string;
                response?: string;
                context?: string;
            } = {};
            if (req.prompt) content.prompt = req.prompt;
            if (req.response) content.response = req.response;
            if (req.context) content.context = req.context;

            scanRequest.contents.push(content);

            return {
                req_id: req.reqId,
                scan_req: scanRequest,
            };
        },
    );

    // Submit async scan
    const result = await this.airsClient.scanAsync(asyncRequests);

    const contents: McpToolResultContent[] = [
        {
            type: 'text',
            text: `Async scan submitted. Scan ID: ${result.scan_id}`,
        },
    ];

    if (result.report_id) {
        contents.push({
            type: 'text',
            text: `Report ID: ${result.report_id}`,
        });
    }

    return { content: contents };
}
```

### Get Scan Results Implementation

```typescript
private async getScanResults(args: Record<string, unknown>): Promise<McpToolsCallResult> {
    const typedArgs = args as unknown as ToolsGetScanResultsArgs;

    if (!Array.isArray(typedArgs.scanIds)) {
        throw new Error('scanIds must be an array');
    }

    const scanIds = typedArgs.scanIds.map(String);
    const results = await this.airsClient.getScanResults(scanIds);

    const contents: McpToolResultContent[] = [
        {
            type: 'text',
            text: `Retrieved ${results.length} scan results`,
        },
    ];

    // Add resource references for each result
    results.forEach((result) => {
        if (result.scan_id) {
            contents.push({
                type: 'resource',
                resource: ResourceHandler.createResourceReference(
                    'scan-result',
                    result.scan_id,
                    `Scan Result: ${result.status || 'unknown'}`,
                    result,
                ),
            });
        }
    });

    return { content: contents };
}
```

### Threat Summarization

```typescript
private summarizeThreats(result: ToolsScanResponseWithDetected): string {
    const threats: string[] = [];

    if (result.prompt_detected) {
        // Extract threats from prompt_detected fields
        if (result.prompt_detected.url_cats) threats.push('prompt_url_cats');
        if (result.prompt_detected.dlp) threats.push('prompt_dlp');
        if (result.prompt_detected.injection) threats.push('prompt_injection');
        if (result.prompt_detected.toxic_content) threats.push('prompt_toxic_content');
        if (result.prompt_detected.malicious_code) threats.push('prompt_malicious_code');
        if (result.prompt_detected.agent) threats.push('prompt_agent');
        if (result.prompt_detected.topic_violation) threats.push('prompt_topic_violation');
    }

    if (result.response_detected) {
        // Extract threats from response_detected fields
        if (result.response_detected.url_cats) threats.push('response_url_cats');
        if (result.response_detected.dlp) threats.push('response_dlp');
        if (result.response_detected.db_security) threats.push('response_db_security');
        if (result.response_detected.toxic_content) threats.push('response_toxic_content');
        if (result.response_detected.malicious_code) threats.push('response_malicious_code');
        if (result.response_detected.agent) threats.push('response_agent');
        if (result.response_detected.ungrounded) threats.push('response_ungrounded');
        if (result.response_detected.topic_violation) threats.push('response_topic_violation');
    }

    return threats.join(', ') || 'unknown threats';
}
```

## Error Handling

### Error Result Creation

```typescript
private createErrorResult(error: unknown): McpToolsCallResult {
    let message = 'Unknown error occurred';

    if (error instanceof Error) {
        message = error.message;

        // Include status code for API errors
        if ('statusCode' in error && typeof error.statusCode === 'number') {
            message = `API Error (${error.statusCode}): ${message}`;
        }
    }

    this.logger.error('Tool execution failed', {
        error: message,
    });

    return {
        content: [
            {
                type: 'text',
                text: message,
            },
        ],
        isError: true,
    };
}
```

## Integration Patterns

### Resource Integration

Tools integrate with the resource system:

```typescript
// Create resource reference
contents.push({
    type: 'resource',
    resource: ResourceHandler.createResourceReference(
        'scan-result',
        result.scan_id,
        'Scan Result Details',
        result,
    ),
});
```

### Configuration Integration

Tools use configuration for defaults:

```typescript
const config = getConfig();
if (config.airs.defaultProfileId) {
    scanRequest.ai_profile.profile_id = config.airs.defaultProfileId;
}
```

## Testing

### Unit Tests

```typescript
describe('ToolHandler', () => {
    let handler: ToolHandler;
    let mockAirsClient: jest.Mocked<EnhancedAirsClient>;

    beforeEach(() => {
        handler = new ToolHandler();
        mockAirsClient = createMockAirsClient();
        handler['airsClient'] = mockAirsClient;
    });

    describe('listTools', () => {
        it('should return all available tools', () => {
            const result = handler.listTools({});
            
            expect(result.tools).toHaveLength(5);
            expect(result.tools[0].name).toBe('airs_scan_content');
        });
    });

    describe('scanContent', () => {
        it('should scan content successfully', async () => {
            mockAirsClient.scanSync.mockResolvedValue({
                scan_id: 'scan_123',
                category: 'safe',
                action: 'allow',
                tr_id: '12345'
            });

            const result = await handler.callTool({
                name: 'airs_scan_content',
                arguments: {
                    prompt: 'Test content'
                }
            });

            expect(result.content[0].text).toContain('Category: safe');
            expect(result.isError).toBeUndefined();
        });

        it('should handle missing content error', async () => {
            const result = await handler.callTool({
                name: 'airs_scan_content',
                arguments: {}
            });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain(
                'At least one of prompt, response, or context is required'
            );
        });
    });
});
```

### Integration Tests

```typescript
it('should integrate with MCP server', async () => {
    const server = new MCPServer();
    const handler = new ToolHandler();
    
    server.setToolHandler(handler);
    
    // Test tool listing
    const listResponse = await server.handleRequest({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: '1'
    });
    
    expect(listResponse.result.tools).toBeDefined();
    
    // Test tool execution
    const callResponse = await server.handleRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: 'airs_clear_cache'
        },
        id: '2'
    });
    
    expect(callResponse.result.content).toBeDefined();
});
```

## Performance Considerations

### Request Optimization

- Use async scanning for batch operations
- Leverage caching to avoid duplicate scans
- Batch result retrieval (up to 5 IDs)

### Resource Usage

```typescript
// Efficient batch processing
const asyncRequests = requests.map(req => ({
    req_id: req.reqId,
    scan_req: buildScanRequest(req)
}));

// Single API call for multiple scans
const result = await this.airsClient.scanAsync(asyncRequests);
```

## Best Practices

### 1. Input Validation

```typescript
// Validate array inputs
if (!Array.isArray(typedArgs.scanIds)) {
    throw new Error('scanIds must be an array');
}

// Validate required content
if (Object.keys(content).length === 0) {
    throw new Error('At least one of prompt, response, or context is required');
}
```

### 2. Profile Resolution

```typescript
// Clear hierarchy for profile selection
// 1. Explicit tool argument
// 2. Configuration defaults
// 3. Hardcoded fallback
```

### 3. Resource References

```typescript
// Always include resource references for detailed data
if (result.scan_id) {
    contents.push({
        type: 'resource',
        resource: createResourceReference(...)
    });
}
```

### 4. Error Context

```typescript
// Include API status codes
if ('statusCode' in error) {
    message = `API Error (${error.statusCode}): ${message}`;
}
```

## Extending the Module

### Adding New Tools

1. **Add tool constant**:
   ```typescript
   private static readonly TOOLS = {
       // ... existing tools
       NEW_TOOL: 'airs_new_tool',
   } as const;
   ```

2. **Define tool schema**:
   ```typescript
   {
       name: ToolHandler.TOOLS.NEW_TOOL,
       title: 'New Tool',
       description: 'Description',
       inputSchema: { ... }
   }
   ```

3. **Add case in callTool**:
   ```typescript
   case ToolHandler.TOOLS.NEW_TOOL:
       return this.newTool(params.arguments || {});
   ```

4. **Implement tool method**:
   ```typescript
   private async newTool(args: Record<string, unknown>): Promise<McpToolsCallResult> {
       // Implementation
   }
   ```

### Adding Tool Features

```typescript
// Progress reporting (future)
private async scanWithProgress(
    args: ToolsScanContentArgs,
    onProgress: (progress: number) => void
): Promise<McpToolsCallResult> {
    onProgress(0);
    // Scan implementation
    onProgress(50);
    // More processing
    onProgress(100);
}

// Streaming results (future)
private async* scanStream(
    args: ToolsScanContentArgs
): AsyncGenerator<McpToolResultContent> {
    yield { type: 'text', text: 'Starting scan...' };
    const result = await this.airsClient.scanSync(scanRequest);
    yield { type: 'text', text: 'Scan complete' };
    yield { type: 'resource', resource: ... };
}
```

## Related Documentation

- [Tools Overview]({{ site.baseurl }}/developers/src/tools/overview/) - Module overview
- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - API integration
- [Resources Module]({{ site.baseurl }}/developers/src/resources/overview/) - Resource system
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Tool Types]({{ site.baseurl }}/developers/src/types/tools-types/) - Type definitions