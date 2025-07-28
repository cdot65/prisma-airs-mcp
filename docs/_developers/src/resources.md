---
layout: documentation
title: Resources Module
permalink: /developers/src/resources/
category: developers
---

# Resource Handlers (src/resources/)

The resources module provides MCP resource handlers for accessing Prisma AIRS data. Resources represent external data
sources that can be read by AI models, including scan results, threat reports, and system statistics.

## Module Structure

```
src/resources/
└── index.ts    # Resource handler implementation
```

**Note**: Resource types are centralized in `src/types/mcp.ts` with the prefix `Mcp` to avoid namespace conflicts.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         MCP Resource Request            │
│  (via HttpServerTransport.readResource) │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      ResourceHandler.readResource       │
│  • Parse URI: airs://{type}/{id}        │
│  • Validate format                      │
│  • Route to handler                     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┬──────────────┐
        │                   │             │              │
┌───────▼────────┐ ┌────────▼──────┐ ┌────▼────┐ ┌───────▼──────┐
│ Scan Results   │ │ Threat Reports│ │Cache    │ │Rate Limit    │
│ • Dynamic      │ │ • Dynamic     │ │Stats    │ │Status        │
│ • By scan ID   │ │ • By report ID│ │• Static │ │• Static      │
└───────┬────────┘ └────────┬──────┘ └────┬────┘ └───────┬──────┘
        │                   │             │              │
        └─────────┬─────────┴─────────────┴──────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        AIRSClient (singleton)           │
│  • Data retrieval                       │
│  • Caching                              │
│  • Statistics                           │
└─────────────────────────────────────────┘
```

## Type System

All resource-related types are defined in `src/types/mcp.ts` with the `Mcp` prefix:

```typescript
import type {
    McpResource,
    McpResourceTemplate,
    McpResourceContent,
    McpResourcesListParams,
    McpResourcesListResult,
    McpResourcesReadParams,
    McpResourcesReadResult
} from '../types';
```

## Resource URI Scheme

All resources follow the URI pattern: `airs://{type}/{id}`

### Resource Types

| Type                | URI Pattern                        | Description              | Listed |
|---------------------|------------------------------------|--------------------------|--------|
| `scan-results`      | `airs://scan-results/{scanId}`     | Individual scan results  | No     |
| `threat-reports`    | `airs://threat-reports/{reportId}` | Detailed threat reports  | No     |
| `cache-stats`       | `airs://cache-stats/current`       | Current cache statistics | Yes    |
| `rate-limit-status` | `airs://rate-limit-status/current` | Rate limiting status     | Yes    |

**Note**: Dynamic resources (scan-results, threat-reports) are not listed by `listResources()` but can be accessed
directly when their URIs are returned from tool operations.

## Implementation Details

### Resource Handler Class

```typescript
export class ResourceHandler {
    private readonly logger: Logger;
    private readonly airsClient = getAirsClient();

    // Resource URIs follow pattern: airs://{type}/{id}
    private static readonly RESOURCE_TYPES = {
        SCAN_RESULT: 'scan-results',      // Plural to match URI pattern
        THREAT_REPORT: 'threat-reports',  // Plural to match URI pattern
        CACHE_STATS: 'cache-stats',
        RATE_LIMIT_STATUS: 'rate-limit-status',
    } as const;

    constructor() {
        this.logger = getLogger();
    }

    listResources(params: McpResourcesListParams): McpResourcesListResult {
        const resources: McpResource[] = [
            {
                uri: `airs://${ResourceHandler.RESOURCE_TYPES.CACHE_STATS}/current`,
                name: 'Cache Statistics',
                description: 'Current cache statistics and performance metrics',
                mimeType: 'application/json',
            },
            {
                uri: `airs://${ResourceHandler.RESOURCE_TYPES.RATE_LIMIT_STATUS}/current`,
                name: 'Rate Limit Status',
                description: 'Current rate limiting status and quotas',
                mimeType: 'application/json',
            },
        ];

        return {resources};
    }

    async readResource(params: McpResourcesReadParams): Promise<McpResourcesReadResult> {
        const parsed = this.parseResourceUri(params.uri);

        if (!parsed) {
            throw new Error(`Invalid resource URI: ${params.uri}`);
        }

        const {type, id} = parsed;

        switch (type) {
            case ResourceHandler.RESOURCE_TYPES.SCAN_RESULT:
                return this.readScanResult(id);
            case ResourceHandler.RESOURCE_TYPES.THREAT_REPORT:
                return this.readThreatReport(id);
            case ResourceHandler.RESOURCE_TYPES.CACHE_STATS:
                return this.readCacheStats();
            case ResourceHandler.RESOURCE_TYPES.RATE_LIMIT_STATUS:
                return this.readRateLimitStatus();
            default:
                throw new Error(`Unknown resource type: ${type}`);
        }
    }
}
```

### URI Parsing

@formatter:off
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

## Available Resources

### 1. Scan Results

**URI Pattern:** `airs://scan-results/{scanId}`  
**MIME Type:** `application/json`  
**Description:** Retrieves detailed scan results by scan ID

#### Implementation

@formatter:off
```typescript
private async readScanResult(scanId: string): Promise<McpResourcesReadResult> {
    try {
        const results = await this.airsClient.getScanResults([scanId]);

        if (results.length === 0) {
            throw new Error(`Scan result not found: ${scanId}`);
        }
        
        const result = results[0];
        const content: McpResourceContent = {
            uri: `airs://${ResourceHandler.RESOURCE_TYPES.SCAN_RESULT}/${scanId}`,
            mimeType: 'application/json',
        };
        
        if (result) {
            content.text = JSON.stringify(result, null, 2);
        }
        
        return { contents: [content] };
    } catch (error) {
        this.logger.error('Failed to read scan result', {
            scanId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
```

#### Content Structure

The scan result returns the complete `AirsScanIdResult` from the AIRS API, including:

- Scan status and metadata
- Detected threats in prompt/response
- Security findings and details
- Processing information

### 2. Threat Reports

**URI Pattern:** `airs://threat-reports/{reportId}`  
**MIME Type:** `application/json`  
**Description:** Retrieves detailed threat analysis reports

#### Implementation

@formatter:off
```typescript
private async readThreatReport(reportId: string): Promise<McpResourcesReadResult> {
    try {
        const reports = await this.airsClient.getThreatScanReports([reportId]);

        if (reports.length === 0) {
            throw new Error(`Threat report not found: ${reportId}`);
        }
        
        const report = reports[0];
        const content: McpResourceContent = {
            uri: `airs://${ResourceHandler.RESOURCE_TYPES.THREAT_REPORT}/${reportId}`,
            mimeType: 'application/json',
        };
        
        if (report) {
            content.text = JSON.stringify(report, null, 2);
        }
        
        return { contents: [content] };
    } catch (error) {
        this.logger.error('Failed to read threat report', {
            reportId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}

```

#### Content Structure

The threat report returns the complete `AirsThreatScanReportObject` from the AIRS API, containing:

- Report metadata and scan associations
- Detailed threat analysis
- Security recommendations
- Severity classifications

### 3. Cache Statistics

**URI:** `airs://cache-stats/current`  
**MIME Type:** `application/json`  
**Description:** Real-time cache performance metrics

#### Implementation

@formatter:off
```typescript
private readCacheStats(): McpResourcesReadResult {
    const stats = this.airsClient.getCacheStats() || {
        size: 0,
        count: 0,
        enabled: false,
    };

    const content: McpResourceContent = {
        uri: `airs://${ResourceHandler.RESOURCE_TYPES.CACHE_STATS}/current`,
        mimeType: 'application/json',
        text: JSON.stringify(
            {
                ...stats,
                timestamp: new Date().toISOString(),
            },
            null,
            2,
        ),
    };

    return { contents: [content] };
}
```

#### Content Structure

The cache statistics resource returns:

```json
{
  "size": 2048,
  // Current cache size in bytes
  "count": 5,
  // Number of cached entries
  "enabled": true,
  // Whether caching is enabled
  "timestamp": "2024-03-20T10:30:00.000Z"
}
```

**Note**: Prior to v1.0.3, the cache was ineffective due to including unique transaction IDs in cache keys. The fix
ensures only content and profile are used for key generation, enabling proper cache hits.

**Important**: In multi-pod deployments, each pod maintains its own cache. The statistics shown are for the specific pod
that handles your request.

### 4. Rate Limit Status

**URI:** `airs://rate-limit-status/current`  
**MIME Type:** `application/json`  
**Description:** Current rate limiting status and available capacity

#### Implementation

@formatter:off
```typescript
private readRateLimitStatus(): McpResourcesReadResult {
    const stats = this.airsClient.getRateLimiterStats() || {
        bucketCount: 0,
        enabled: false,
    };

    const content: McpResourceContent = {
        uri: `airs://${ResourceHandler.RESOURCE_TYPES.RATE_LIMIT_STATUS}/current`,
        mimeType: 'application/json',
        text: JSON.stringify(
            {
                ...stats,
                timestamp: new Date().toISOString(),
            },
            null,
            2,
        ),
    };

    return { contents: [content] };
}
```

#### Content Structure

The rate limit status includes:

- `bucketCount`: Number of rate limit buckets
- `enabled`: Whether rate limiting is enabled
- `timestamp`: When the stats were generated

**Note**: The actual implementation returns simplified stats. For detailed bucket information, the AIRS client would
need to expose per-bucket status.

## Creating Resource References

The module provides a static utility method for creating resource references in tool results:

@formatter:off
```typescript
static createResourceReference(
    type: string,
    id: string,
    _title: string,
    data?: unknown,
): McpResourceContent {
    const uri = `airs://${type}/${id}`;

    return {
        uri,
        mimeType: 'application/json',
        text: data ? JSON.stringify(data, null, 2) : undefined,
    };
}

```

### Usage Example

```typescript
// In tools, create a resource reference for scan results
const resourceRef = ResourceHandler.createResourceReference(
    'scan-results',       // Resource type
    result.scan_id,       // Unique ID
    'Scan Result Details', // Title (currently unused)
    result                // Full data object
);
```

## Integration with Tools

Resources are often returned as references in tool results:

```typescript
// In tools/index.ts - scanContent method
if (result.scan_id) {
    contents.push({
        type: 'resource',
        resource: ResourceHandler.createResourceReference(
            'scan-result',    // Note: singular form used here
            result.scan_id,
            'Scan Result Details',
            result,
        ),
    });
}

// In tools/index.ts - getScanResults method
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
```

**Important Note**: The tools use singular form ('scan-result', 'threat-report') when creating references, while the
resource handler expects plural form ('scan-results', 'threat-reports'). This is handled internally by the resource type
constants.

## Error Handling

### Resource Not Found

```typescript
if (results.length === 0) {
    throw new Error(`Scan result not found: ${scanId}`);
}
// or
if (reports.length === 0) {
    throw new Error(`Threat report not found: ${reportId}`);
}
```

### Invalid URI

```typescript
const parsed = this.parseResourceUri(params.uri);

if (!parsed) {
    throw new Error(`Invalid resource URI: ${params.uri}`);
}
```

### Unknown Resource Type

```typescript
default:
throw new Error(`Unknown resource type: ${type}`);
```

### Error Logging

All errors are logged with context before being thrown:

```typescript
this.logger.error('Failed to read scan result', {
    scanId,
    error: error instanceof Error ? error.message : 'Unknown error',
});
```

## Best Practices

### 1. URI Pattern Consistency

Always use the defined constants for resource types:

```typescript
// Good - uses constant
uri: `airs://${ResourceHandler.RESOURCE_TYPES.SCAN_RESULT}/${scanId}`

// Bad - hardcoded string
uri: `airs://scan-results/${scanId}`
```

### 2. Error Context

Always include relevant context in error messages:

```typescript
this.logger.error('Failed to read scan result', {
    scanId,
    error: error instanceof Error ? error.message : 'Unknown error',
});
```

### 3. Resource Data Inclusion

Include full data in resource references when available:

```typescript
// Include data for immediate access
return {
    uri,
    mimeType: 'application/json',
    text: data ? JSON.stringify(data, null, 2) : undefined,
};
```

### 4. Null Safety

Always check for existence before accessing properties:

```typescript
if (result) {
    content.text = JSON.stringify(result, null, 2);
}
```

## Performance Considerations

1. **Caching**: Dynamic resources benefit from AIRS client caching layer
2. **Lightweight Stats**: Static resources (cache, rate limit) have minimal overhead
3. **On-demand Serialization**: JSON formatting only when resources are read
4. **Singleton Client**: Single AIRS client instance reduces connection overhead

## Security Considerations

1. **URI Validation**: All URIs are parsed and validated before processing
2. **No Credential Exposure**: API keys are never included in resource content
3. **Error Sanitization**: Internal errors don't expose sensitive details
4. **Type Safety**: Full TypeScript typing prevents runtime errors

## Type System

The resources module uses centralized types from `src/types/`:

### MCP Resource Types

| Type                     | Module    | Purpose                            |
|--------------------------|-----------|------------------------------------|
| `McpResource`            | `./types` | Resource definition with metadata  |
| `McpResourceContent`     | `./types` | Resource content with URI and data |
| `McpResourcesListParams` | `./types` | Parameters for listing resources   |
| `McpResourcesListResult` | `./types` | Result of resource listing         |
| `McpResourcesReadParams` | `./types` | Parameters for reading a resource  |
| `McpResourcesReadResult` | `./types` | Result of resource reading         |

## Dependencies

### External Dependencies

| Module    | Purpose            |
|-----------|--------------------|
| `winston` | Structured logging |

### Internal Dependencies

| Module            | Import            | Purpose               |
|-------------------|-------------------|-----------------------|
| `../utils/logger` | `getLogger()`     | Logger instance       |
| `../airs/factory` | `getAirsClient()` | AIRS client singleton |
| `../types`        | Various types     | Type definitions      |

## Related Documentation

- [Types Module]({{ site.baseurl }}/developers/src/types/) - Resource type definitions
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Tools that create resource references
- [Transport Module]({{ site.baseurl }}/developers/src/transport/) - How resources are exposed via MCP
- [AIRS Module]({{ site.baseurl }}/developers/src/airs/) - Client used for data retrieval

## Summary

The resources module provides a clean URI-based abstraction for accessing AIRS data through the MCP protocol. It
supports both static system resources and dynamic scan/report data, with proper error handling, logging, and type safety
throughout.
