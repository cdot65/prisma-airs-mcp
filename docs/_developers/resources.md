---
layout: documentation
title: MCP Resources
description: Working with MCP resources in Prisma AIRS
category: developers
---

## Overview

MCP Resources provide a standardized way to expose data from the Prisma AIRS system. They follow a URI-based addressing scheme and can represent various types of information including scan results, threat reports, and system statistics.

## Resource URI Scheme

Resources in Prisma AIRS MCP use the `airs://` URI scheme:

```
airs://{resource-type}/{resource-id}
```

Examples:
- `airs://scan-results/scan_123456`
- `airs://threat-reports/rpt_789012`
- `airs://cache-stats`
- `airs://rate-limit-status`

## Available Resources

### System Resources

These resources provide information about the MCP server itself:

#### Cache Statistics
```typescript
// URI: airs://cache-stats
{
  "entries": 150,
  "maxEntries": 1000,
  "hitRate": 0.85,
  "missRate": 0.15,
  "evictions": 23,
  "memoryUsage": "15.2 MB"
}
```

#### Rate Limit Status
```typescript
// URI: airs://rate-limit-status
{
  "limit": 100,
  "remaining": 67,
  "reset": 1674567890,
  "window": "1 minute"
}
```

### Dynamic Resources

These resources are created dynamically based on AIRS operations:

#### Scan Results
```typescript
// URI: airs://scan-results/{scan_id}
{
  "scan_id": "scan_123456",
  "timestamp": "2025-01-20T10:30:00Z",
  "category": "malicious",
  "action": "block",
  "threats_detected": {
    "prompt_injection": true,
    "malicious_code": false,
    "data_leakage": false
  }
}
```

#### Threat Reports
```typescript
// URI: airs://threat-reports/{report_id}
{
  "report_id": "rpt_789012",
  "scan_id": "scan_123456",
  "detailed_analysis": {
    "threat_type": "prompt_injection",
    "confidence": 0.95,
    "severity": "high",
    "recommendations": [...]
  }
}
```

## Implementing Resources

### Resource Handler Registration

```typescript
// Register static resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'airs://cache-stats',
        name: 'Cache Statistics',
        description: 'Current cache performance metrics',
        mimeType: 'application/json'
      },
      {
        uri: 'airs://rate-limit-status',
        name: 'Rate Limit Status',
        description: 'Current rate limiting status',
        mimeType: 'application/json'
      }
    ]
  };
});
```

### Resource Reading Implementation

```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  // Parse URI
  const parsed = parseAIRSUri(uri);
  
  switch (parsed.type) {
    case 'cache-stats':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(getCacheStats())
        }]
      };
      
    case 'scan-results':
      const scanResult = await getScanResult(parsed.id);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(scanResult)
        }]
      };
      
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});
```

### Dynamic Resource Discovery

```typescript
// Maintain a registry of dynamic resources
class ResourceRegistry {
  private resources = new Map<string, ResourceMetadata>();
  
  register(uri: string, metadata: ResourceMetadata): void {
    this.resources.set(uri, {
      ...metadata,
      created: Date.now()
    });
    
    // Auto-expire after TTL
    setTimeout(() => {
      this.resources.delete(uri);
    }, metadata.ttl || 300000); // 5 minutes default
  }
  
  list(): Resource[] {
    return Array.from(this.resources.entries()).map(([uri, meta]) => ({
      uri,
      name: meta.name,
      description: meta.description,
      mimeType: meta.mimeType
    }));
  }
}
```

## Resource Patterns

### Pagination for Large Resources

```typescript
// Support pagination through URI parameters
// airs://scan-results?page=2&limit=50

interface PaginatedResource {
  uri: string;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

async function readPaginatedResource(uri: string): Promise<PaginatedResource> {
  const url = new URL(uri);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  
  const data = await fetchData({ page, limit });
  
  return {
    uri,
    data: data.items,
    pagination: {
      page,
      limit,
      total: data.total,
      hasNext: page * limit < data.total,
      hasPrev: page > 1
    }
  };
}
```

### Resource Streaming

For large resources, implement streaming:

```typescript
// Stream large threat reports
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri.startsWith('airs://large-report/')) {
    return {
      contents: [{
        uri,
        mimeType: 'application/x-ndjson',
        // Stream as newline-delimited JSON
        text: streamLargeReport(uri)
      }]
    };
  }
});

async function* streamLargeReport(uri: string) {
  const reportId = uri.split('/').pop();
  const chunks = await getReportChunks(reportId);
  
  for (const chunk of chunks) {
    yield JSON.stringify(chunk) + '\n';
  }
}
```

### Resource Subscriptions

Implement real-time updates:

```typescript
// Subscribe to resource changes
interface ResourceSubscription {
  uri: string;
  callback: (update: ResourceUpdate) => void;
}

class ResourceSubscriptionManager {
  private subscriptions = new Map<string, Set<ResourceSubscription>>();
  
  subscribe(uri: string, callback: (update: ResourceUpdate) => void): () => void {
    const sub = { uri, callback };
    
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, new Set());
    }
    
    this.subscriptions.get(uri)!.add(sub);
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.get(uri)?.delete(sub);
    };
  }
  
  notify(uri: string, update: ResourceUpdate): void {
    const subs = this.subscriptions.get(uri);
    if (subs) {
      subs.forEach(sub => sub.callback(update));
    }
  }
}
```

## Best Practices

### 1. Resource Naming

- Use descriptive names that clearly indicate content
- Include resource type in the URI path
- Use consistent ID formats

### 2. Resource Lifecycle

```typescript
// Implement proper cleanup
class ResourceManager {
  private cleanupInterval: NodeJS.Timer;
  
  constructor() {
    // Periodic cleanup of expired resources
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredResources();
    }, 60000); // Every minute
  }
  
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
```

### 3. Error Handling

```typescript
// Consistent error responses for resources
async function readResource(uri: string): Promise<ResourceContent> {
  try {
    const resource = await fetchResource(uri);
    if (!resource) {
      throw new MCPError(
        -32001,
        `Resource not found: ${uri}`
      );
    }
    return resource;
  } catch (error) {
    logger.error('Resource read error', { uri, error });
    throw new MCPError(
      -32603,
      'Internal error reading resource'
    );
  }
}
```

### 4. Caching Resources

```typescript
// Cache resource metadata for performance
const resourceCache = new LRUCache<string, ResourceMetadata>({
  max: 1000,
  ttl: 300000 // 5 minutes
});

async function getResourceMetadata(uri: string): Promise<ResourceMetadata> {
  const cached = resourceCache.get(uri);
  if (cached) return cached;
  
  const metadata = await fetchResourceMetadata(uri);
  resourceCache.set(uri, metadata);
  
  return metadata;
}
```

## Client Usage

### Listing Resources

```typescript
// List all available resources
const response = await mcpClient.request({
  method: 'resources/list'
});

console.log('Available resources:');
response.resources.forEach(resource => {
  console.log(`- ${resource.name}: ${resource.uri}`);
});
```

### Reading Resources

```typescript
// Read a specific resource
const response = await mcpClient.request({
  method: 'resources/read',
  params: {
    uri: 'airs://scan-results/scan_123456'
  }
});

const scanResult = JSON.parse(response.contents[0].text);
console.log('Scan result:', scanResult);
```

### Watching Resources

```typescript
// Watch for resource updates
const unsubscribe = mcpClient.watchResource(
  'airs://rate-limit-status',
  (update) => {
    console.log('Rate limit updated:', update);
  }
);

// Stop watching
unsubscribe();
```

## Advanced Topics

### Resource Transformations

```typescript
// Transform resources for different formats
interface ResourceTransformer {
  canTransform(from: string, to: string): boolean;
  transform(content: string, from: string, to: string): string;
}

class JsonToYamlTransformer implements ResourceTransformer {
  canTransform(from: string, to: string): boolean {
    return from === 'application/json' && to === 'application/yaml';
  }
  
  transform(content: string, from: string, to: string): string {
    const json = JSON.parse(content);
    return yaml.dump(json);
  }
}
```

### Resource Aggregation

```typescript
// Aggregate multiple resources
async function aggregateResources(pattern: string): Promise<AggregatedResource> {
  const resources = await findResourcesByPattern(pattern);
  
  const aggregated = {
    uri: `airs://aggregated/${pattern}`,
    count: resources.length,
    data: await Promise.all(
      resources.map(r => readResource(r.uri))
    )
  };
  
  return aggregated;
}
```

## Next Steps

- [Tools]({{ site.baseurl }}/developers/tools) - Implementing MCP tools
- [Prompts]({{ site.baseurl }}/developers/prompts) - Creating interactive prompts
- [Resource Patterns]({{ site.baseurl }}/developers/patterns/resources) - Advanced resource patterns
- [Performance]({{ site.baseurl }}/developers/performance) - Optimizing resource access