---
layout: documentation
title: Resources Index
permalink: /developers/src/resources/index-file/
category: developers
---

MCP resource handler providing URI-based access to AIRS data, system information, and comprehensive developer documentation. Enables retrieval of scan results, threat reports, operational metrics, API documentation, and integration guides.

## Core Purpose

- Provide URI-based data access
- Manage static and dynamic resources
- Parse and validate resource URIs
- Format data for MCP protocol
- Serve developer documentation at build time

## Key Components

### ResourceHandler Class

```typescript
export class ResourceHandler {
    // Resource types
    static RESOURCE_TYPES = {
        SCAN_RESULT: 'scan-results',
        THREAT_REPORT: 'threat-reports',
        CACHE_STATS: 'cache-stats',
        RATE_LIMIT_STATUS: 'rate-limit-status',
        DEVELOPER_DOCS: 'developer-docs'  // New documentation resources
    };
    
    // MCP methods
    listResources(): Returns all available resources
    readResource(): Reads specific resource by URI
    
    // Private methods
    private parseResourceUri(uri: string): { type: string; id: string }
    private readCacheStats(): McpResourcesReadResult
    private readRateLimitStatus(): McpResourcesReadResult
    private readScanResult(scanId: string): Promise<McpResourcesReadResult>
    private readThreatReport(reportId: string): Promise<McpResourcesReadResult>
    private readDeveloperDoc(docId: string): McpResourcesReadResult  // New
}
```

### Documentation Resources

```typescript
// Auto-generated from docs/*.md and docs/*.yaml
import {
    AIRUNTIMESECURITYAPI_DOC,
    ERRORCODES_DOC,
    USECASES_DOC,
    SCANSERVICE_DOC,
    INTEGRATION_GUIDE_DOC,
    SECURITY_FEATURES_DOC
} from './docs';

const DOCUMENTATION_RESOURCES = {
    'airuntimesecurityapi': {
        content: AIRUNTIMESECURITYAPI_DOC,
        mimeType: 'text/markdown',
        name: 'Prisma AIRS AI Runtime API Intercept',
        description: 'Complete API reference and overview for Prisma AIRS'
    },
    // ... other documentation resources
};
```

### URI Format

```text
airs://{type}/{id}

Examples:
- airs://scan-results/scan_12345
- airs://cache-stats/current
- airs://threat-reports/report_67890
- airs://developer-docs/airuntimesecurityapi
- airs://developer-docs/errorcodes
- airs://developer-docs/scanservice
```

## Resource Types

### Static Resources

Always available system information:

- **Cache Statistics**: Current cache performance
- **Rate Limit Status**: Current quota availability
- **Developer Documentation**: API docs, error codes, integration guides, and examples

### Dynamic Resources

Created from operations:

- **Scan Results**: Individual scan data
- **Threat Reports**: Detailed threat analysis

## Documentation Build Process

The documentation resources are built at compile time:

```typescript
// scripts/build-docs.ts
const docFiles = readdirSync(DOCS_DIR).filter(f => 
    f.endsWith('.md') || f.endsWith('.yaml')
);

// Generate TypeScript exports
for (const file of docFiles) {
    const content = readFileSync(join(DOCS_DIR, file), 'utf-8');
    const constName = file.replace(/\.(md|yaml)$/, '')
        .toUpperCase()
        .replace(/-/g, '_') + '_DOC';
    
    exports += `export const ${constName} = \`${escapedContent}\`;\n\n`;
}

// Integrated into npm build process
// npm run build → build:docs → tsc
```

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

## Implementation Details

### Developer Documentation Handler

```typescript
// In readResource method
case ResourceHandler.RESOURCE_TYPES.DEVELOPER_DOCS:
    return this.readDeveloperDoc(id);

// Private method implementation
private readDeveloperDoc(docId: string): McpResourcesReadResult {
    const doc = DOCUMENTATION_RESOURCES[docId as DocumentationResourceId];
    
    if (!doc) {
        throw new Error(`Developer documentation not found: ${docId}`);
    }
    
    const content: McpResourceContent = {
        uri: `airs://${ResourceHandler.RESOURCE_TYPES.DEVELOPER_DOCS}/${docId}`,
        mimeType: doc.mimeType,
        text: doc.content,
    };
    
    return { contents: [content] };
}
```

### Listing Documentation Resources

```typescript
// In listResources method
Object.entries(DOCUMENTATION_RESOURCES).forEach(([id, doc]) => {
    resources.push({
        uri: `airs://${ResourceHandler.RESOURCE_TYPES.DEVELOPER_DOCS}/${id}`,
        name: doc.name,
        description: doc.description,
        mimeType: doc.mimeType,
    });
});
```

## Usage Examples

### List All Resources

```typescript
// List all resources including documentation
const resources = handler.listResources({});
// Returns:
// - cache-stats
// - rate-limit-status  
// - 6 developer documentation resources

// Response includes:
{
    resources: [
        {
            uri: "airs://cache-stats/current",
            name: "Cache Statistics",
            description: "Current cache statistics and performance metrics",
            mimeType: "application/json"
        },
        {
            uri: "airs://developer-docs/airuntimesecurityapi",
            name: "Prisma AIRS AI Runtime API Intercept",
            description: "Complete API reference and overview for Prisma AIRS",
            mimeType: "text/markdown"
        },
        // ... more resources
    ]
}
```

### Read Documentation Resource

```typescript
// Read API documentation
const result = await handler.readResource({
    uri: 'airs://developer-docs/airuntimesecurityapi'
});

// Returns markdown content
{
    contents: [{
        uri: "airs://developer-docs/airuntimesecurityapi",
        mimeType: "text/markdown",
        text: "# Prisma AIRS AI Runtime API Intercept\n\n..."
    }]
}

// Read OpenAPI specification
const openapi = await handler.readResource({
    uri: 'airs://developer-docs/scanservice'
});

// Returns YAML content
{
    contents: [{
        uri: "airs://developer-docs/scanservice",
        mimeType: "application/x-yaml",
        text: "openapi: 3.0.0\ninfo:\n  title: Prisma AIRS..."
    }]
}
```

## Available Documentation Resources

### Documentation Resource IDs

```typescript
type DocumentationResourceId = 
    | 'airuntimesecurityapi'    // Main API documentation
    | 'errorcodes'              // Error codes reference
    | 'usecases'                // Use cases and examples
    | 'scanservice'             // OpenAPI specification
    | 'integration-guide'       // Integration guide
    | 'security-features';      // Security features guide
```

### Documentation Content

| Resource ID | Name | MIME Type | Description |
|-------------|------|-----------|-------------|
| `airuntimesecurityapi` | Prisma AIRS AI Runtime API Intercept | `text/markdown` | Complete API reference and overview |
| `errorcodes` | Error Codes Reference | `text/markdown` | All error codes and their meanings |
| `usecases` | Use Cases Guide | `text/markdown` | Example use cases and implementations |
| `scanservice` | OpenAPI Specification | `application/x-yaml` | OpenAPI 3.0 spec for scan service |
| `integration-guide` | Integration Guide | `text/markdown` | Step-by-step integration instructions |
| `security-features` | Security Features Guide | `text/markdown` | Detailed security feature documentation |

## Testing Documentation Resources

### Curl Examples

```bash
# List all resources
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": "1", "method": "resources/list", "params": {}}'

# Read API documentation
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": "2", "method": "resources/read", "params": {"uri": "airs://developer-docs/airuntimesecurityapi"}}'

# Read OpenAPI spec
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": "3", "method": "resources/read", "params": {"uri": "airs://developer-docs/scanservice"}}'
```

## Related Modules

- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Creates resource URIs
- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - Data source
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Resources Overview]({{ site.baseurl }}/developers/src/resources/overview/) - Module overview
