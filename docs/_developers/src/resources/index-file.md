---
layout: documentation
title: Resources Index
permalink: /developers/src/resources/index-file/
category: developers
---

# Resources Index (src/resources/index.ts)

The resources index file implements the MCP resource handler that provides URI-based access to AIRS data and system
information. This module enables clients to retrieve scan results, threat reports, and operational metrics through a
standardized resource interface.

## Overview

The ResourceHandler class:

- Manages static and dynamic resource types
- Parses and validates resource URIs
- Retrieves data from AIRS API and system components
- Formats resource content for MCP protocol
- Provides resource discovery through listing

## Core Implementation

### ResourceHandler Class

```typescript
import { getLogger } from '../utils/logger';
import { getAirsClient } from '../airs/factory';
import type { Logger } from 'winston';

import type {
    McpResource,
    McpResourceContent,
    McpResourcesListParams,
    McpResourcesListResult,
    McpResourcesReadParams,
    McpResourcesReadResult,
} from '../types';

export class ResourceHandler {
    private readonly logger: Logger;
    private readonly airsClient = getAirsClient();

    // Resource URIs follow pattern: airs://{type}/{id}
    private static readonly RESOURCE_TYPES = {
        SCAN_RESULT: 'scan-results',
        THREAT_REPORT: 'threat-reports',
        CACHE_STATS: 'cache-stats',
        RATE_LIMIT_STATUS: 'rate-limit-status',
    } as const;

    constructor() {
        this.logger = getLogger();
    }
```

## Resource Types

### Static Resource Types

Always available system resources:

```typescript
CACHE_STATS: 'cache-stats',
RATE_LIMIT_STATUS: 'rate-limit-status',
```

### Dynamic Resource Types

Created from operations:

```typescript
SCAN_RESULT: 'scan-results',
THREAT_REPORT: 'threat-reports',
```

## Method Implementations

### listResources Method

Returns available static resources.

```typescript
listResources(params: McpResourcesListParams): McpResourcesListResult {
    this.logger.debug('Listing resources', { cursor: params?.cursor });

    const resources: McpResource[] = [
        // Static resources for system status
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

    // Note: Dynamic resources like scan results and threat reports
    // are not listed here but can be accessed directly by URI
    // when returned from tool operations

    return {
        resources,
    };
}
```

**Key Points:**

- Only static resources are listed
- Dynamic resources are accessed via URIs from tool results
- Supports pagination via cursor (future enhancement)

### readResource Method

Reads a specific resource by URI.

```typescript
async readResource(params: McpResourcesReadParams): Promise<McpResourcesReadResult> {
    this.logger.debug('Reading resource', { uri: params.uri });

    const parsed = this.parseResourceUri(params.uri);

    if (!parsed) {
        throw new Error(`Invalid resource URI: ${params.uri}`);
    }

    const { type, id } = parsed;

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

**URI Format:** `airs://{type}/{id}`

- Protocol: `airs://`
- Type: Resource type (e.g., `scan-results`)
- ID: Resource identifier (e.g., `scan_12345` or `current`)

## Resource Reading Methods

### Reading Scan Results

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

### Reading Threat Reports

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

### Reading Cache Statistics

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

### Reading Rate Limit Status

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

## Utility Methods

### Creating Resource References

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

**Usage in Tools:**

```typescript
// In tool response
const resourceRef = ResourceHandler.createResourceReference(
    'scan-results',
    scanId,
    'Scan Results',
    scanData
);
```

## Error Handling

### URI Validation

```typescript
const parsed = this.parseResourceUri(params.uri);

if (!parsed) {
    throw new Error(`Invalid resource URI: ${params.uri}`);
}
```

### Resource Not Found

```typescript
if (results.length === 0) {
    throw new Error(`Scan result not found: ${scanId}`);
}
```

### Error Logging

```typescript
catch (error) {
    this.logger.error('Failed to read scan result', {
        scanId,
        error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
}
```

## Data Flow

### Static Resource Flow

```
1. Client requests resource list
2. Handler returns static resources
3. Client requests specific resource
4. Handler generates current data
5. Returns JSON content
```

### Dynamic Resource Flow

```
1. Tool creates scan/report
2. Tool returns resource URI
3. Client stores URI reference
4. Client requests resource data
5. Handler fetches from AIRS API
6. Returns JSON content
```

## Integration Examples

### With Tools Module

```typescript
// Tool creates resource reference
const scanResult = {
    success: true,
    scanId: 'scan_12345',
    resource: ResourceHandler.createResourceReference(
        'scan-results',
        'scan_12345',
        'Security Scan Results'
    )
};

// Client reads resource
const resource = await resourceHandler.readResource({
    uri: 'airs://scan-results/scan_12345'
});
```

### With MCP Server

```typescript
// Handle resource listing
case 'resources/list':
    return this.resourceHandler.listResources(params);

// Handle resource reading
case 'resources/read':
    return await this.resourceHandler.readResource(params);
```

## Testing

### Unit Tests

```typescript
describe('ResourceHandler', () => {
    let handler: ResourceHandler;
    let mockAirsClient: jest.Mocked<EnhancedAirsClient>;

    beforeEach(() => {
        mockAirsClient = createMockAirsClient();
        handler = new ResourceHandler();
        handler['airsClient'] = mockAirsClient;
    });

    describe('parseResourceUri', () => {
        it('should parse valid URIs', () => {
            const result = handler['parseResourceUri'](
                'airs://scan-results/scan_123'
            );
            
            expect(result).toEqual({
                type: 'scan-results',
                id: 'scan_123'
            });
        });

        it('should return null for invalid URIs', () => {
            const result = handler['parseResourceUri']('invalid://uri');
            expect(result).toBeNull();
        });
    });

    describe('listResources', () => {
        it('should return static resources', () => {
            const result = handler.listResources({});
            
            expect(result.resources).toHaveLength(2);
            expect(result.resources[0].uri).toBe(
                'airs://cache-stats/current'
            );
        });
    });

    describe('readResource', () => {
        it('should read scan results', async () => {
            mockAirsClient.getScanResults.mockResolvedValue([
                { scan_id: 'scan_123', status: 'complete' }
            ]);

            const result = await handler.readResource({
                uri: 'airs://scan-results/scan_123'
            });

            expect(result.contents[0].text).toContain('scan_123');
        });

        it('should handle not found errors', async () => {
            mockAirsClient.getScanResults.mockResolvedValue([]);

            await expect(handler.readResource({
                uri: 'airs://scan-results/missing'
            })).rejects.toThrow('Scan result not found: missing');
        });
    });
});
```

### Integration Tests

```typescript
it('should integrate with MCP protocol', async () => {
    const server = new MCPServer();
    const handler = new ResourceHandler();
    
    server.setResourceHandler(handler);
    
    // Test listing
    const listResponse = await server.handleRequest({
        jsonrpc: '2.0',
        method: 'resources/list',
        id: '1'
    });
    
    expect(listResponse.result.resources).toBeDefined();
    
    // Test reading
    const readResponse = await server.handleRequest({
        jsonrpc: '2.0',
        method: 'resources/read',
        params: { uri: 'airs://cache-stats/current' },
        id: '2'
    });
    
    expect(readResponse.result.contents).toHaveLength(1);
});
```

## Performance Considerations

### Caching

- Static resources generate fresh data each read
- Dynamic resources may be cached by AIRS client
- Consider implementing resource-level caching

### Optimization

```typescript
// Batch fetch optimization (future)
private async readMultipleResources(
    uris: string[]
): Promise<McpResourceContent[]> {
    // Parse all URIs
    // Group by type
    // Batch fetch from AIRS
    // Return results
}
```

## Best Practices

### 1. Consistent URI Format

```typescript
// Always use hyphenated, plural resource types
SCAN_RESULT: 'scan-results',      // Good
SCANRESULT: 'scanResult',         // Bad
```

### 2. Error Context

```typescript
// Include helpful context in errors
throw new Error(
    `Scan result not found: ${scanId}. ` +
    `The scan may have expired or been deleted.`
);
```

### 3. Resource Metadata

```typescript
// Always include complete metadata
return {
    uri: resourceUri,
    name: descriptiveName,
    description: helpfulDescription,
    mimeType: 'application/json',
};
```

### 4. Logging

```typescript
// Log at appropriate levels
this.logger.debug('Reading resource', { uri });
this.logger.error('Failed to read resource', { uri, error });
```

## Extending the Module

### Adding New Resource Types

1. **Add type constant**:
   ```typescript
   private static readonly RESOURCE_TYPES = {
       // ... existing types
       NEW_TYPE: 'new-type',
   } as const;
   ```

2. **Add to listing (if static)**:
   ```typescript
   resources.push({
       uri: `airs://new-type/current`,
       name: 'New Resource Type',
       description: 'Description',
       mimeType: 'application/json',
   });
   ```

3. **Add case in readResource**:
   ```typescript
   case ResourceHandler.RESOURCE_TYPES.NEW_TYPE:
       return this.readNewType(id);
   ```

4. **Implement read method**:
   ```typescript
   private async readNewType(id: string): Promise<McpResourcesReadResult> {
       // Implementation
   }
   ```

### Adding Resource Subscriptions

```typescript
// Future enhancement
subscribeToResource(uri: string, callback: (data: any) => void): void {
    // Parse URI
    // Set up polling or WebSocket
    // Call callback on changes
}
```

## Related Documentation

- [Resources Overview]({{ site.baseurl }}/developers/src/resources/overview/) - Module overview
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - Data source
- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Tool integration