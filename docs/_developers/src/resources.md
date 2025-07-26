---
layout: documentation
title: Resources Module (src/resources/)
permalink: /developers/src/resources/
category: developers
---

# Resources Module Documentation

The resources module provides MCP resource handlers for accessing Prisma AIRS data. Resources represent external data sources that can be read by AI models, including scan results, threat reports, and system statistics.

## Module Overview

The resources module implements the MCP resource interface to provide:

- Resource URI scheme for AIRS data
- Static and dynamic resource listing
- Scan result retrieval
- Threat report access
- Cache statistics monitoring
- Rate limit status checking
- Resource reference creation for tool results

## Architecture

The module follows the MCP resource specification, providing structured access to AIRS data through a URI-based system.

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

| Type                | URI Pattern                        | Description              |
| ------------------- | ---------------------------------- | ------------------------ |
| `scan-results`      | `airs://scan-results/{scanId}`     | Individual scan results  |
| `threat-reports`    | `airs://threat-reports/{reportId}` | Detailed threat reports  |
| `cache-stats`       | `airs://cache-stats/current`       | Current cache statistics |
| `rate-limit-status` | `airs://rate-limit-status/current` | Rate limiting status     |

## Implementation Details

### Resource Handler Class

```typescript
export class ResourceHandler {
    private readonly logger: Logger;
    private airsClient?: EnhancedPrismaAirsClient;
    
    constructor() {
        this.logger = getLogger();
    }
    
    listResources(params?: McpResourcesListParams): McpResourcesListResult {
        const resources: McpResource[] = [
            {
                uri: 'airs://cache-stats/current',
                name: 'Cache Statistics',
                description: 'Current cache performance metrics',
                mimeType: 'application/json'
            },
            {
                uri: 'airs://rate-limit-status/current',
                name: 'Rate Limit Status',
                description: 'Current rate limiting status',
                mimeType: 'application/json'
            }
        ];
        
        return { resources };
    }
    
    async readResource(params: McpResourcesReadParams): Promise<McpResourcesReadResult> {
        const uri = params.uri;
        const parsed = this.parseResourceUri(uri);
        
        switch (parsed.type) {
            case 'cache-stats':
                return this.readCacheStats();
            case 'rate-limit-status':
                return this.readRateLimitStatus();
            case 'scan-results':
                return this.readScanResults(parsed.id!);
            case 'threat-reports':
                return this.readThreatReports(parsed.id!);
            default:
                throw new Error(`Unknown resource type: ${parsed.type}`);
        }
    }
}
```

### URI Parsing

```typescript
private parseResourceUri(uri: string): ParsedResourceUri {
    const match = uri.match(/^airs:\/\/([^\/]+)(?:\/(.+))?$/);
    
    if (!match) {
        throw new Error(`Invalid resource URI: ${uri}`);
    }
    
    return {
        type: match[1],
        id: match[2]
    };
}
```

## Available Resources

### 1. Scan Results

**URI Pattern:** `airs://scan-results/{scanId}`  
**MIME Type:** `application/json`  
**Description:** Retrieves detailed scan results by scan ID

#### Content Structure

```typescript
interface ScanResultResource {
    scan_id: string;
    status: 'complete' | 'in_progress' | 'failed';
    scan_type: 'Prompt' | 'Response';
    scanned_text?: string;
    detected: boolean;
    findings?: AirsSecurityFinding[];
    metadata?: {
        profile_name?: string;
        scan_time?: string;
        processing_time_ms?: number;
    };
}
```

#### Implementation

```typescript
private async readScanResults(scanId: string): Promise<McpResourcesReadResult> {
    const airsClient = this.getAirsClient();
    
    try {
        const results = await airsClient.getScanResults([scanId]);
        
        if (results.length === 0) {
            throw new Error(`Scan results not found: ${scanId}`);
        }
        
        const result = results[0];
        
        return {
            contents: [{
                uri: `airs://scan-results/${scanId}`,
                mimeType: 'application/json',
                text: JSON.stringify(result, null, 2)
            }]
        };
    } catch (error) {
        this.logger.error('Failed to read scan results', { scanId, error });
        throw error;
    }
}
```

### 2. Threat Reports

**URI Pattern:** `airs://threat-reports/{reportId}`  
**MIME Type:** `application/json`  
**Description:** Retrieves detailed threat analysis reports

#### Content Structure

```typescript
interface ThreatReportResource {
    report_id: string;
    scan_id: string;
    threat_summary: {
        total_threats: number;
        high_severity: number;
        medium_severity: number;
        low_severity: number;
    };
    detailed_findings: AirsThreatDetail[];
    recommendations: string[];
    created_at: string;
}
```

#### Implementation

```typescript
private async readThreatReports(reportId: string): Promise<McpResourcesReadResult> {
    const airsClient = this.getAirsClient();
    
    try {
        const reports = await airsClient.getThreatScanReports([reportId]);
        
        if (reports.length === 0) {
            throw new Error(`Threat report not found: ${reportId}`);
        }
        
        const report = reports[0];
        
        return {
            contents: [{
                uri: `airs://threat-reports/${reportId}`,
                mimeType: 'application/json',
                text: JSON.stringify(report, null, 2)
            }]
        };
    } catch (error) {
        this.logger.error('Failed to read threat report', { reportId, error });
        throw error;
    }
}
```

### 3. Cache Statistics

**URI:** `airs://cache-stats/current`  
**MIME Type:** `application/json`  
**Description:** Real-time cache performance metrics

#### Content Structure

```typescript
interface CacheStatsResource {
    enabled: boolean;
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
    ttlSeconds: number;
}
```

#### Implementation

```typescript
private readCacheStats(): McpResourcesReadResult {
    const airsClient = this.getAirsClient();
    const stats = airsClient.getCacheStats() || {
        enabled: false,
        size: 0,
        maxSize: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        evictions: 0,
        ttlSeconds: 0
    };
    
    return {
        contents: [{
            uri: 'airs://cache-stats/current',
            mimeType: 'application/json',
            text: JSON.stringify(stats, null, 2)
        }]
    };
}
```

### 4. Rate Limit Status

**URI:** `airs://rate-limit-status/current`  
**MIME Type:** `application/json`  
**Description:** Current rate limiting status and available capacity

#### Content Structure

```typescript
interface RateLimitStatusResource {
    enabled: boolean;
    limits: {
        [bucket: string]: {
            available: number;
            limit: number;
            resetAt: string;
        };
    };
}
```

#### Implementation

```typescript
private readRateLimitStatus(): McpResourcesReadResult {
    const airsClient = this.getAirsClient();
    const stats = airsClient.getRateLimiterStats();
    
    const status = {
        enabled: stats?.enabled || false,
        limits: {}
    };
    
    if (stats?.enabled) {
        // Get status for common buckets
        ['scan', 'results', 'reports'].forEach(bucket => {
            const bucketStatus = airsClient.rateLimiter?.getStatus(bucket);
            if (bucketStatus) {
                status.limits[bucket] = {
                    available: bucketStatus.available,
                    limit: bucketStatus.limit,
                    resetAt: bucketStatus.resetAt.toISOString()
                };
            }
        });
    }
    
    return {
        contents: [{
            uri: 'airs://rate-limit-status/current',
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2)
        }]
    };
}
```

## Resource Templates

The module provides templates for dynamic resources:

```typescript
const resourceTemplates: McpResourceTemplate[] = [
    {
        uriTemplate: 'airs://scan-results/{scanId}',
        name: 'Scan Results',
        description: 'Retrieve results for a specific scan by ID',
        mimeType: 'application/json'
    },
    {
        uriTemplate: 'airs://threat-reports/{reportId}',
        name: 'Threat Reports',
        description: 'Retrieve detailed threat report by ID',
        mimeType: 'application/json'
    }
];
```

## Creating Resource References

The module provides utility functions for creating resource references in tool results:

```typescript
export function createScanResultReference(
    scanId: string,
    scanResult: AirsScanIdResult
): McpResourceReference {
    return {
        uri: `airs://scan-results/${scanId}`,
        title: `Scan Result: ${scanId}`,
        mimeType: 'application/json',
        text: JSON.stringify(scanResult, null, 2)
    };
}

export function createThreatReportReference(
    reportId: string,
    report: AirsThreatScanReportObject
): McpResourceReference {
    return {
        uri: `airs://threat-reports/${reportId}`,
        title: `Threat Report: ${reportId}`,
        mimeType: 'application/json',
        text: JSON.stringify(report, null, 2)
    };
}
```

## Integration with Tools

Resources are often returned as references in tool results:

```typescript
// In tools/index.ts
async function handleGetScanResults(args: ToolsGetScanResultsArgs): Promise<McpToolsCallResult> {
    const results = await airsClient.getScanResults(args.scanIds);
    
    const content: McpToolResultContent[] = results.map(result => ({
        type: 'resource',
        resource: createScanResultReference(result.scan_id, result)
    }));
    
    return { content };
}
```

## Error Handling

### Resource Not Found

```typescript
if (results.length === 0) {
    throw new Error(`Resource not found: ${uri}`);
}
```

### Invalid URI

```typescript
const match = uri.match(/^airs:\/\/([^\/]+)(?:\/(.+))?$/);
if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
}
```

### Client Not Initialized

```typescript
private getAirsClient(): EnhancedPrismaAirsClient {
    if (!this.airsClient) {
        const config = getConfig();
        this.airsClient = new EnhancedPrismaAirsClient({
            apiUrl: config.airs.apiUrl,
            apiKey: config.airs.apiKey,
            // ... other config
        });
    }
    return this.airsClient;
}
```

## Best Practices

### 1. Resource URI Validation

Always validate resource URIs before processing:

```typescript
private validateResourceUri(uri: string): void {
    if (!uri.startsWith('airs://')) {
        throw new Error('Resource URI must start with airs://');
    }
}
```

### 2. Consistent Error Messages

Provide clear error messages for resource access:

```typescript
throw new Error(`Scan results not found: ${scanId}`);
throw new Error(`Invalid resource type: ${type}`);
throw new Error(`Resource access denied: ${uri}`);
```

### 3. Resource Caching

Resources automatically benefit from AIRS client caching:

```typescript
// Scan results are cached by the AIRS client
const results = await airsClient.getScanResults([scanId]);
```

### 4. JSON Formatting

Always format JSON resources for readability:

```typescript
text: JSON.stringify(result, null, 2)
```

## Performance Considerations

- Static resources (cache stats, rate limit) are lightweight
- Dynamic resources leverage AIRS client caching
- Resource listing is paginated for large result sets
- JSON serialization is performed on-demand

## Security Considerations

- Resource URIs are validated before processing
- API keys are never exposed in resource content
- Sensitive data is filtered from resource responses
- Access control follows MCP server permissions

## Next Steps

- [Types Module]({{ site.baseurl }}/developers/src/types/) - Resource type definitions
- [Tools Module]({{ site.baseurl }}/developers/src/tools/) - Tool implementations
- [Transport Module]({{ site.baseurl }}/developers/src/transport/) - Request handling