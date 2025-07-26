---
layout: documentation
title: Resources Module (src/resources/)
permalink: /developers/src-resources/
category: developers
---

# Resources Module Documentation

The resources module provides MCP resource handlers for accessing Prisma AIRS data. Resources represent external data sources that can be read by AI models, including scan results, threat reports, and system statistics.

## Module Overview

The resources module consists of a single file (`index.ts`) that implements:

- Resource URI scheme for AIRS data
- Scan result retrieval
- Threat report access
- Cache statistics monitoring
- Rate limit status checking
- Resource reference creation for tool results

## Resource URI Scheme

All resources follow the URI pattern: `airs://{type}/{id}`

### Resource Types

| Type | URI Pattern | Description |
|------|-------------|-------------|
| `scan-results` | `airs://scan-results/{scanId}` | Individual scan results |
| `threat-reports` | `airs://threat-reports/{reportId}` | Detailed threat reports |
| `cache-stats` | `airs://cache-stats/current` | Current cache statistics |
| `rate-limit-status` | `airs://rate-limit-status/current` | Rate limiting status |

## Available Resources

### 1. Scan Results

**URI Pattern:** `airs://scan-results/{scanId}`  
**MIME Type:** `application/json`  
**Description:** Retrieves detailed scan results by scan ID

#### Content Structure

```json
{
    "req_id": 1,
    "status": "complete",
    "scan_id": "scan_12345",
    "result": {
        "report_id": "rpt_12345",
        "scan_id": "scan_12345",
        "category": "malicious",
        "action": "block",
        "prompt_detected": {
            "injection": true,
            "toxic_content": false
        },
        "response_detected": {
            "malicious_code": true
        }
        // ... additional fields
    }
}
```

### 2. Threat Reports

**URI Pattern:** `airs://threat-reports/{reportId}`  
**MIME Type:** `application/json`  
**Description:** Retrieves detailed threat analysis reports

#### Content Structure

```json
{
    "report_id": "rpt_12345",
    "scan_id": "scan_12345",
    "transaction_id": "tr_67890",
    "detection_results": [
        {
            "data_type": "prompt",
            "detection_service": "injection_detection",
            "verdict": "malicious",
            "action": "block",
            "result_detail": {
                // Service-specific details
            }
        }
    ]
}
```

### 3. Cache Statistics

**URI Pattern:** `airs://cache-stats/current`  
**MIME Type:** `application/json`  
**Description:** Current cache performance metrics

#### Content Structure

```json
{
    "size": 1048576,          // Current cache size in bytes
    "count": 42,              // Number of cached entries
    "enabled": true,          // Cache enabled status
    "timestamp": "2024-01-01T12:00:00Z"
}
```

### 4. Rate Limit Status

**URI Pattern:** `airs://rate-limit-status/current`  
**MIME Type:** `application/json`  
**Description:** Current rate limiting status and quotas

#### Content Structure

```json
{
    "bucketCount": 3,         // Active rate limit buckets
    "enabled": true,          // Rate limiting enabled
    "timestamp": "2024-01-01T12:00:00Z"
}
```

## Implementation Details

### ResourceHandler Class

```typescript
export class ResourceHandler {
    // Resource type constants
    private static readonly RESOURCE_TYPES = {
        SCAN_RESULT: 'scan-results',
        THREAT_REPORT: 'threat-reports',
        CACHE_STATS: 'cache-stats',
        RATE_LIMIT_STATUS: 'rate-limit-status',
    } as const;

    // List available static resources
    listResources(params: ResourcesListParams): ResourcesListResult

    // Read a specific resource by URI
    async readResource(params: ResourcesReadParams): Promise<ResourcesReadResult>

    // Create resource reference for tool results
    static createResourceReference(
        type: string,
        id: string,
        title: string,
        data?: unknown
    ): ResourceContent
}
```

### URI Parsing

```typescript
private parseResourceUri(uri: string): { type: string; id: string } | null {
    const match = uri.match(/^airs:\/\/([^/]+)\/(.+)$/);
    
    if (!match) {
        return null;
    }
    
    return {
        type: match[1] || '',
        id: match[2] || '',
    };
}
```

## Usage Examples

### Listing Resources

```typescript
import { ResourceHandler } from './resources';

const handler = new ResourceHandler();

// List available static resources
const { resources } = handler.listResources({});

resources.forEach(resource => {
    console.log(`${resource.uri}: ${resource.name}`);
    console.log(`  ${resource.description}`);
});
```

### Reading Scan Results

```typescript
// Read scan result by ID
const scanResult = await handler.readResource({
    uri: 'airs://scan-results/scan_12345'
});

const data = JSON.parse(scanResult.contents[0].text!);
console.log(`Scan status: ${data.status}`);
console.log(`Category: ${data.result?.category}`);
```

### Reading System Statistics

```typescript
// Get cache statistics
const cacheStats = await handler.readResource({
    uri: 'airs://cache-stats/current'
});

const stats = JSON.parse(cacheStats.contents[0].text!);
console.log(`Cache entries: ${stats.count}`);
console.log(`Cache size: ${stats.size} bytes`);

// Get rate limit status
const rateLimitStatus = await handler.readResource({
    uri: 'airs://rate-limit-status/current'
});
```

### Creating Resource References

```typescript
// In tool handlers, create resource references
import { ResourceHandler } from '../resources';

// After scan completes
const scanResult = await airsClient.scanSync(request);

// Create resource reference
const resourceRef = ResourceHandler.createResourceReference(
    'scan-results',
    scanResult.scan_id,
    `Scan Result ${scanResult.scan_id}`,
    scanResult
);

// Include in tool result
return {
    content: [
        {
            type: 'text',
            text: 'Scan completed successfully'
        },
        {
            type: 'resource',
            resource: resourceRef
        }
    ]
};
```

## Integration with Tools

Resources are commonly referenced in tool results:

```typescript
// Tool returns resource reference
const toolResult: ToolsCallResult = {
    content: [
        {
            type: 'text',
            text: `Found ${threats.length} threats`
        },
        {
            type: 'resource',
            resource: {
                uri: `airs://threat-reports/${reportId}`,
                mimeType: 'application/json',
                text: JSON.stringify(threatReport, null, 2)
            }
        }
    ]
};
```

## Error Handling

The module handles various error scenarios:

```typescript
// Invalid URI format
if (!parsed) {
    throw new Error(`Invalid resource URI: ${params.uri}`);
}

// Unknown resource type
default:
    throw new Error(`Unknown resource type: ${type}`);

// Resource not found
if (results.length === 0) {
    throw new Error(`Scan result not found: ${scanId}`);
}
```

## Resource Discovery

### Static Resources

Static resources (cache stats, rate limit status) are listed by `listResources`:

```typescript
const resources: Resource[] = [
    {
        uri: 'airs://cache-stats/current',
        name: 'Cache Statistics',
        description: 'Current cache statistics and performance metrics',
        mimeType: 'application/json',
    },
    // ... other static resources
];
```

### Dynamic Resources

Dynamic resources (scan results, threat reports) are not listed but can be accessed directly when their URIs are known (typically from tool results).

## Best Practices

1. **URI Validation** - Always validate URI format before parsing
2. **Error Handling** - Provide clear error messages for invalid URIs
3. **Resource References** - Include data in resource references when possible
4. **Async Operations** - Use async/await for AIRS client calls
5. **Logging** - Log resource access for debugging

## Performance Considerations

1. **Caching** - Resources are cached by the AIRS client when enabled
2. **Rate Limiting** - Resource reads count against rate limits
3. **Large Resources** - Consider pagination for large result sets
4. **Concurrent Access** - Resources can be read concurrently

## Security Considerations

1. **Access Control** - Resources inherit AIRS API authentication
2. **Data Sensitivity** - Scan results may contain sensitive information
3. **URI Validation** - Prevent injection through URI parameters
4. **Error Messages** - Avoid exposing internal details in errors

## Testing Resources

```typescript
// Test resource URI parsing
const parsed = handler.parseResourceUri('airs://scan-results/123');
assert(parsed?.type === 'scan-results');
assert(parsed?.id === '123');

// Test invalid URI
try {
    await handler.readResource({ uri: 'invalid://uri' });
    assert.fail('Should throw error');
} catch (error) {
    assert(error.message.includes('Invalid resource URI'));
}
```

## Next Steps

- [Tools Module]({{ site.baseurl }}/developers/src-tools/) - Tools that create resource references
- [MCP Types]({{ site.baseurl }}/developers/src-mcp/) - Resource type definitions
- [AIRS Module]({{ site.baseurl }}/developers/src-airs/) - Client used for resource data