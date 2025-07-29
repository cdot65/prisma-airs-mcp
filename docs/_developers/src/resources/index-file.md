---
layout: documentation
title: Resources Index
permalink: /developers/src/resources/index-file/
category: developers
---

MCP resource handler providing URI-based access to AIRS data and system information. Enables retrieval of scan results, threat reports, and operational metrics.

## Core Purpose

- Provide URI-based data access
- Manage static and dynamic resources
- Parse and validate resource URIs
- Format data for MCP protocol

## Key Components

### ResourceHandler Class

```typescript
export class ResourceHandler {
    // Resource types
    SCAN_RESULT: 'scan-results'
    THREAT_REPORT: 'threat-reports'
    CACHE_STATS: 'cache-stats'
    RATE_LIMIT_STATUS: 'rate-limit-status'
    
    // MCP methods
    listResources(): Returns static resources
    readResource(): Reads specific resource by URI
}
```

### URI Format

```text
airs://{type}/{id}

Examples:
- airs://scan-results/scan_12345
- airs://cache-stats/current
- airs://threat-reports/report_67890
```

## Resource Types

### Static Resources

Always available system information:

- **Cache Statistics**: Current cache performance
- **Rate Limit Status**: Current quota availability

### Dynamic Resources

Created from operations:

- **Scan Results**: Individual scan data
- **Threat Reports**: Detailed threat analysis

## Integration in Application

- **Used By**: MCP server for resource requests
- **Data Source**: AIRS client for dynamic data
- **Pattern**: URI-based resource addressing
- **Format**: JSON content with metadata

## Data Flow

### Static Resources Flow

1. Client lists available resources
2. Handler returns system resources
3. Client reads specific resource
4. Handler generates current data

### Dynamic Resources Flow

1. Tool creates scan/report
2. Returns resource URI
3. Client reads via URI
4. Handler fetches from AIRS

## Key Features

### URI Parsing

```typescript
parseResourceUri('airs://scan-results/scan_123')
// Returns: { type: 'scan-results', id: 'scan_123' }
```

### Resource Creation

```typescript
ResourceHandler.createResourceReference(
    'scan-results',
    scanId,
    'Scan Results',
    data
)
```

### Error Handling

- Invalid URI validation
- Resource not found errors
- Detailed error logging

## Usage Example

```typescript
// List static resources
const resources = handler.listResources({});
// Returns cache-stats and rate-limit-status

// Read dynamic resource
const result = await handler.readResource({
    uri: 'airs://scan-results/scan_12345'
});
// Returns scan data as JSON
```

## Related Modules

- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Creates resource URIs
- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - Data source
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
