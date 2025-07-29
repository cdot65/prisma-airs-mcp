---
layout: documentation
title: Resources Overview
permalink: /developers/src/resources/overview/
category: developers
---

The resources module (`src/resources/`) implements MCP resource handlers that provide access to AIRS data and system
status information. Resources enable clients to retrieve scan results, threat reports, and system metrics through a
URI-based interface.

## Module Structure

```text
src/resources/
└── index.ts   # Resource handler implementation
```

## Architecture

```text
┌─────────────────────────────────────────┐
│            MCP Client                   │
│     (Claude, IDE, Tools)                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Resource Request                │
│    • List available resources           │
│    • Read resource by URI               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         ResourceHandler                 │
│    • URI parsing and routing            │
│    • Resource type management           │
│    • Data retrieval                     │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┬──────────┐
         ▼                 ▼          ▼
┌────────────────┐ ┌────────────┐ ┌──────────┐
│  AIRS Client   │ │ Cache Stats│ │Rate Limit│
│ • Scan results │ │ • Metrics  │ │ • Status │
│ • Threat reports│ │ • Performance│ │ • Quotas │
└────────────────┘ └────────────┘ └──────────┘
```

## Resource Types

### Static Resources

Always available system status resources:

1. **Cache Statistics** (`airs://cache-stats/current`)
    - Current cache performance metrics
    - Hit/miss ratios
    - Memory usage
    - Entry counts

2. **Rate Limit Status** (`airs://rate-limit-status/current`)
    - Current rate limiting status
    - Available quotas
    - Reset times
    - Bucket information

### Dynamic Resources

Created from tool operations:

1. **Scan Results** (`airs://scan-results/{scanId}`)
    - Complete scan result data
    - Threat analysis details
    - Recommendations
    - Metadata

2. **Threat Reports** (`airs://threat-reports/{reportId}`)
    - Detailed threat analysis
    - Evidence and examples
    - Remediation guidance
    - Risk assessments

## URI Scheme

### Resource URI Format

```text
airs://{resource-type}/{resource-id}
```

**Components:**

- `airs://` - Protocol identifier
- `{resource-type}` - Type of resource (e.g., scan-results, cache-stats)
- `{resource-id}` - Unique identifier or 'current' for static resources

**Examples:**

```text
airs://scan-results/scan_12345
airs://threat-reports/report_67890
airs://cache-stats/current
airs://rate-limit-status/current
```

## Resource Lifecycle

### Static Resources Lifecycle

```text
Client Request
      │
      ▼
List Resources ──► Returns static resources
      │
      ▼
Read Resource ──► Generate current data
      │
      ▼
Return JSON
```

### Dynamic Resources Lifecycle

```text
Tool Operation
      │
      ▼
Generate Data ──► Create resource URI
      │
      ▼
Return URI ──► Client stores reference
      │
      ▼
Read Request ──► Fetch from AIRS API
      │
      ▼
Return Data
```

## Data Formats

### Resource Listing Response

```json
{
  "resources": [
    {
      "uri": "airs://cache-stats/current",
      "name": "Cache Statistics",
      "description": "Current cache statistics and performance metrics",
      "mimeType": "application/json"
    },
    {
      "uri": "airs://rate-limit-status/current",
      "name": "Rate Limit Status",
      "description": "Current rate limiting status and quotas",
      "mimeType": "application/json"
    }
  ]
}
```

### Resource Content Response

```json
{
  "contents": [
    {
      "uri": "airs://scan-results/scan_12345",
      "mimeType": "application/json",
      "text": "{\"scan_id\": \"scan_12345\", ...}"
    }
  ]
}
```

## Resource Content Examples

### Cache Statistics

```json
{
  "size": 2048576,
  "count": 150,
  "enabled": true,
  "hitRate": 0.85,
  "missRate": 0.15,
  "evictions": 25,
  "ttl": 300,
  "maxSize": 10485760,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Rate Limit Status

```json
{
  "bucketCount": 3,
  "enabled": true,
  "buckets": {
    "scanSync": {
      "capacity": 100,
      "available": 85,
      "refillRate": 10,
      "lastRefill": "2024-01-15T10:29:00Z"
    },
    "scanAsync": {
      "capacity": 50,
      "available": 45,
      "refillRate": 5,
      "lastRefill": "2024-01-15T10:29:00Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Scan Result

```json
{
  "scan_id": "scan_12345",
  "transaction_id": "tr_67890",
  "status": "complete",
  "results": {
    "prompt_guard_result": {
      "high_risk_categories": [],
      "medium_risk_categories": [
        {
          "category": "url_categories",
          "severity": "medium",
          "confidence": 0.85
        }
      ],
      "low_risk_categories": [],
      "action": "review",
      "risk_score": 45
    }
  },
  "timestamp": "2024-01-15T10:25:00Z"
}
```

## Integration Patterns

### Tool-Resource Integration

```typescript
// Tool returns resource URI
const scanResult = await tools.call('airs_scan_content', {
    content: 'text to scan'
});

// Extract resource URI
const resourceUri = scanResult.resourceUri; // "airs://scan-results/scan_12345"

// Later, read the resource
const resource = await resources.read(resourceUri);
const scanData = JSON.parse(resource.contents[0].text);
```

### Resource References in Responses

```typescript
// Tools can embed resource references
return {
    success: true,
    message: 'Scan complete',
    resources: [
        {
            uri: 'airs://scan-results/scan_12345',
            name: 'Scan Results',
            mimeType: 'application/json'
        }
    ]
};
```

## Error Handling

### Common Errors

1. **Invalid URI Format**

   ```text
   Error: Invalid resource URI: airs://invalid
   ```

2. **Resource Not Found**

   ```text
   Error: Scan result not found: scan_99999
   ```

3. **Access Denied**

   ```text
   Error: Unauthorized access to resource
   ```

### Error Response Format

```json
{
  "error": {
    "code": -32602,
    "message": "Invalid resource URI: airs://invalid",
    "data": {
      "uri": "airs://invalid",
      "expectedFormat": "airs://{type}/{id}"
    }
  }
}
```

## Performance Considerations

### Caching Strategy

- Static resources generate fresh data on each read
- Dynamic resources may be cached by the AIRS client
- Resource metadata is lightweight for listing
- Large resources are fetched on-demand

### Optimization Tips

1. **Batch Resource Reads**
    - Read multiple resources in sequence
    - Minimize API calls

2. **Use Resource URIs**
    - Store URIs instead of data
    - Fetch only when needed

3. **Monitor Rate Limits**
    - Check rate limit status before bulk operations
    - Implement backoff strategies

## Security Considerations

### Access Control

- Resources inherit API key authentication
- No direct file system access
- Sanitized data output
- Rate limiting applies

### Data Privacy

- Resources contain only processed results
- No raw sensitive data exposure
- Audit logging for access
- Time-limited resource validity

## Best Practices

### 1. Resource Naming

```typescript
// Use descriptive, consistent names
const RESOURCE_TYPES = {
    SCAN_RESULT: 'scan-results',      // Plural, hyphenated
    THREAT_REPORT: 'threat-reports',
    CACHE_STATS: 'cache-stats',
    RATE_LIMIT_STATUS: 'rate-limit-status'
};
```

### 2. URI Construction

```typescript
// Use helper methods for URI construction
static createResourceUri(type: string, id: string): string {
    return `airs://${type}/${id}`;
}
```

### 3. Error Messages

```typescript
// Provide helpful error context
throw new Error(
    `Resource not found: ${uri}. ` +
    `Ensure the resource exists and you have access.`
);
```

### 4. Resource Metadata

```typescript
// Include useful metadata
return {
    uri: resourceUri,
    name: 'Scan Results',
    description: `Results for scan ${scanId}`,
    mimeType: 'application/json',
    created: new Date().toISOString()
};
```

## Testing Resources

### Unit Tests

```typescript
describe('ResourceHandler', () => {
    it('should parse resource URIs correctly', () => {
        const handler = new ResourceHandler();
        const parsed = handler.parseResourceUri('airs://scan-results/123');
        
        expect(parsed).toEqual({
            type: 'scan-results',
            id: '123'
        });
    });
});
```

### Integration Tests

```typescript
it('should read cache statistics', async () => {
    const handler = new ResourceHandler();
    const result = await handler.readResource({
        uri: 'airs://cache-stats/current'
    });
    
    expect(result.contents[0].mimeType).toBe('application/json');
    const data = JSON.parse(result.contents[0].text);
    expect(data).toHaveProperty('size');
    expect(data).toHaveProperty('count');
});
```

## Monitoring and Debugging

### Logging

```typescript
logger.debug('Listing resources', { cursor: params?.cursor });
logger.debug('Reading resource', { uri: params.uri });
logger.error('Failed to read scan result', { scanId, error });
```

### Metrics

- Resource access frequency
- Read latencies
- Error rates by type
- Cache hit rates

## Future Enhancements

### Planned Features

1. **Resource Subscriptions**
    - Real-time updates
    - Change notifications
    - WebSocket support

2. **Resource Templates**
    - Parameterized URIs
    - Dynamic generation
    - Custom formats

3. **Bulk Operations**
    - Multi-resource reads
    - Batch fetching
    - Parallel processing

4. **Resource Versioning**
    - Historical data access
    - Change tracking
    - Audit trails

## Related Documentation

- [Resources Index]({{ site.baseurl }}/developers/src/resources/index-file/) - Implementation details
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [Tools Module]({{ site.baseurl }}/developers/src/tools/overview/) - Tool integration
- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - Data source
