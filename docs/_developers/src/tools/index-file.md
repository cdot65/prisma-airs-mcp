---
layout: documentation
title: Tools Index
permalink: /developers/src/tools/index-file/
category: developers
---

# Tools Index (src/tools/index.ts)

MCP tool handler providing security scanning capabilities through Prisma AIRS API. Exposes tools for content analysis, threat detection, and security report retrieval.

## Core Purpose

- Provide security scanning tools via MCP
- Validate and process tool arguments
- Integrate with AIRS API for scanning
- Format results with resource references

## Key Components

### ToolHandler Class

```typescript
export class ToolHandler {
    // Available tools
    SCAN_CONTENT: 'airs_scan_content'
    SCAN_ASYNC: 'airs_scan_async'
    GET_SCAN_RESULTS: 'airs_get_scan_results'
    GET_THREAT_REPORTS: 'airs_get_threat_reports'
    CLEAR_CACHE: 'airs_clear_cache'
    
    // MCP methods
    listTools(): Returns tool definitions
    callTool(): Executes specific tool
}
```

## Available Tools

### Scan Content
- **Purpose**: Synchronous threat scanning
- **Inputs**: prompt, response, context, profile
- **Output**: Category, action, threats, resource URI

### Scan Async
- **Purpose**: Batch scanning multiple requests
- **Inputs**: Array of scan requests
- **Output**: Scan ID and report ID

### Get Scan Results
- **Purpose**: Retrieve previous scan results
- **Inputs**: Array of scan IDs (max 5)
- **Output**: Scan data with resource URIs

### Get Threat Reports
- **Purpose**: Detailed threat analysis
- **Inputs**: Array of report IDs (max 5)
- **Output**: Report data with resource URIs

### Clear Cache
- **Purpose**: Clear response cache
- **Inputs**: None
- **Output**: Success confirmation

## Integration in Application

- **Used By**: MCP server for tool requests
- **Data Source**: AIRS API via client
- **Resources**: Creates URIs for results
- **Configuration**: Uses defaults from config

## Profile Resolution

Hierarchy for security profile selection:
1. Tool argument profileName
2. Tool argument profileId
3. Config defaultProfileId
4. Config defaultProfileName
5. Fallback to "Prisma AIRS"

## Key Features

### Resource Integration
```typescript
// Create resource reference for results
contents.push({
    type: 'resource',
    resource: ResourceHandler.createResourceReference(
        'scan-result',
        result.scan_id,
        'Scan Result Details',
        result
    )
});
```

### Threat Summarization
```typescript
// Extract and summarize detected threats
if (result.category === 'malicious') {
    const threats = this.summarizeThreats(result);
    contents.push({
        type: 'text',
        text: `Threats detected: ${threats}`
    });
}
```

### Error Handling
- Input validation for required fields
- API error status codes included
- Graceful error messages

## Usage Example

```typescript
// Scan content for threats
const result = await handler.callTool({
    name: 'airs_scan_content',
    arguments: {
        prompt: 'Check this text',
        profileName: 'Strict Security'
    }
});

// Returns:
// - Category: safe/malicious
// - Action: allow/block
// - Resource URI for details
```

## Performance Considerations

- Use async scanning for batches
- Cache responses to avoid duplicates
- Batch result retrieval (up to 5)

## Related Modules

- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - API integration
- [Resources Module]({{ site.baseurl }}/developers/src/resources/overview/) - Resource URIs
- [Configuration]({{ site.baseurl }}/developers/src/config/overview/) - Default settings
- [Tool Types]({{ site.baseurl }}/developers/src/types/tools-types/) - Type definitions