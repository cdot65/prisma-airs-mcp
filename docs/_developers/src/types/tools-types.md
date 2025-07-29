---
layout: documentation
title: Tool Types
permalink: /developers/src/types/tools-types/
category: developers
---

# Tool Types (src/types/tools.ts)

The tool types module defines TypeScript interfaces specific to the MCP tools implementation. These types ensure type
safety for tool parameters, results, and error handling.

## Overview

The tool types provide:

- Parameter interfaces for each tool
- Result types for tool outputs
- Error structures for tool failures
- Type-safe tool definitions
- Validation schemas

## Tool Parameter Types

### ScanContentParams

Parameters for the `airs_scan_content` tool.

```typescript
export interface ScanContentParams {
    /** Content to scan for threats */
    content?: string;
    
    /** User prompt or input */
    prompt?: string;
    
    /** AI-generated response */
    response?: string;
    
    /** Additional context */
    context?: string;
    
    /** Security profile name */
    profileName?: string;
    
    /** Force fresh scan (bypass cache) */
    bypassCache?: boolean;
}
```

**Validation Rules:**

- At least one of `content`, `prompt`, `response`, or `context` is required
- `profileName` defaults to configured default if not provided

**Usage Example:**

```typescript
const params: ScanContentParams = {
    content: 'User provided text to analyze',
    profileName: 'strict',
    bypassCache: false
};
```

### ScanAsyncParams

Parameters for the `airs_scan_async` tool.

```typescript
export interface ScanAsyncParams {
    /** Array of scan requests */
    requests: Array<{
        /** Content to scan */
        content?: string;
        
        /** User prompt */
        prompt?: string;
        
        /** AI response */
        response?: string;
        
        /** Context */
        context?: string;
        
        /** Profile name */
        profileName?: string;
        
        /** Optional transaction ID */
        transactionId?: string;
    }>;
    
    /** Batch processing options */
    options?: {
        /** Priority level */
        priority?: 'low' | 'normal' | 'high';
        
        /** Callback URL for results */
        callbackUrl?: string;
        
        /** Maximum processing time */
        timeout?: number;
    };
}
```

### GetScanResultsParams

Parameters for the `airs_get_scan_results` tool.

```typescript
export interface GetScanResultsParams {
    /** Array of scan IDs to retrieve */
    scanIds: string[];
    
    /** Include partial results */
    includePartial?: boolean;
    
    /** Wait for completion */
    waitForCompletion?: boolean;
    
    /** Maximum wait time in milliseconds */
    maxWaitTime?: number;
}
```

### GetThreatReportsParams

Parameters for the `airs_get_threat_reports` tool.

```typescript
export interface GetThreatReportsParams {
    /** Array of report IDs */
    reportIds: string[];
    
    /** Include detailed analysis */
    includeDetails?: boolean;
    
    /** Include remediation suggestions */
    includeRemediation?: boolean;
    
    /** Report format */
    format?: 'json' | 'markdown' | 'html';
}
```

### ClearCacheParams

Parameters for the `airs_clear_cache` tool.

```typescript
export interface ClearCacheParams {
    /** Specific cache keys to clear */
    keys?: string[];
    
    /** Clear by pattern */
    pattern?: string;
    
    /** Clear all cache entries */
    clearAll?: boolean;
    
    /** Only clear expired entries */
    expiredOnly?: boolean;
}
```

## Tool Result Types

### ScanContentResult

Result from content scanning.

```typescript
export interface ScanContentResult {
    /** Scan success status */
    success: boolean;
    
    /** Scan results */
    results?: {
        /** Transaction ID */
        transactionId: string;
        
        /** Threat analysis */
        threats: ThreatSummary;
        
        /** Recommended action */
        action: 'allow' | 'block' | 'review';
        
        /** Risk score (0-100) */
        riskScore: number;
        
        /** Detailed findings */
        findings?: Finding[];
    };
    
    /** Error information if failed */
    error?: ToolError;
    
    /** Performance metrics */
    metrics?: {
        /** Scan duration in ms */
        duration: number;
        
        /** Cache hit */
        cached: boolean;
        
        /** Timestamp */
        timestamp: string;
    };
}

export interface ThreatSummary {
    /** High risk threat count */
    high: number;
    
    /** Medium risk threat count */
    medium: number;
    
    /** Low risk threat count */
    low: number;
    
    /** Threat categories detected */
    categories: string[];
}

export interface Finding {
    /** Finding type */
    type: string;
    
    /** Severity level */
    severity: 'high' | 'medium' | 'low';
    
    /** Finding description */
    description: string;
    
    /** Location in content */
    location?: {
        start: number;
        end: number;
        context: string;
    };
}
```

### ScanAsyncResult

Result from async scanning.

```typescript
export interface ScanAsyncResult {
    /** Operation success */
    success: boolean;
    
    /** Scan ID for tracking */
    scanId?: string;
    
    /** Estimated completion time */
    estimatedCompletion?: string;
    
    /** Current status */
    status?: 'queued' | 'processing' | 'complete' | 'failed';
    
    /** Number of items queued */
    itemCount?: number;
    
    /** Error if failed */
    error?: ToolError;
}
```

### GetScanResultsResult

Result from retrieving scan results.

```typescript
export interface GetScanResultsResult {
    /** Success status */
    success: boolean;
    
    /** Scan results by ID */
    results?: Record<string, ScanResultItem>;
    
    /** Summary statistics */
    summary?: {
        /** Total scans requested */
        total: number;
        
        /** Completed scans */
        completed: number;
        
        /** Failed scans */
        failed: number;
        
        /** Pending scans */
        pending: number;
    };
    
    /** Error if failed */
    error?: ToolError;
}

export interface ScanResultItem {
    /** Scan ID */
    scanId: string;
    
    /** Current status */
    status: 'pending' | 'complete' | 'failed';
    
    /** Scan results if complete */
    results?: ScanContentResult;
    
    /** Error if failed */
    error?: string;
    
    /** Timestamps */
    timestamps: {
        queued: string;
        started?: string;
        completed?: string;
    };
}
```

### ClearCacheResult

Result from cache clearing.

```typescript
export interface ClearCacheResult {
    /** Success status */
    success: boolean;
    
    /** Number of entries cleared */
    cleared?: number;
    
    /** Cache statistics before clear */
    before?: CacheStats;
    
    /** Cache statistics after clear */
    after?: CacheStats;
    
    /** Error if failed */
    error?: ToolError;
}

export interface CacheStats {
    /** Total entries */
    entries: number;
    
    /** Cache size in bytes */
    size: number;
    
    /** Hit rate percentage */
    hitRate: number;
    
    /** Oldest entry age */
    oldestEntry?: string;
}
```

## Error Types

### ToolError

Standard error structure for tool failures.

```typescript
export interface ToolError {
    /** Error code */
    code: string;
    
    /** Human-readable message */
    message: string;
    
    /** Error details */
    details?: Record<string, unknown>;
    
    /** Whether error is retryable */
    retryable?: boolean;
    
    /** Suggested retry after (seconds) */
    retryAfter?: number;
}
```

### Common Error Codes

```typescript
export enum ToolErrorCode {
    /** Invalid input parameters */
    INVALID_INPUT = 'INVALID_INPUT',
    
    /** Rate limit exceeded */
    RATE_LIMITED = 'RATE_LIMITED',
    
    /** API error */
    API_ERROR = 'API_ERROR',
    
    /** Timeout error */
    TIMEOUT = 'TIMEOUT',
    
    /** Authentication error */
    AUTH_ERROR = 'AUTH_ERROR',
    
    /** Internal server error */
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    
    /** Resource not found */
    NOT_FOUND = 'NOT_FOUND',
    
    /** Operation cancelled */
    CANCELLED = 'CANCELLED'
}
```

## Tool Definition Types

### ToolDefinition

Complete tool definition with metadata.

```typescript
export interface ToolDefinition {
    /** Unique tool name */
    name: string;
    
    /** Tool description */
    description: string;
    
    /** Input parameter schema */
    inputSchema: JSONSchema;
    
    /** Output result schema */
    outputSchema?: JSONSchema;
    
    /** Tool metadata */
    metadata?: {
        /** Tool version */
        version?: string;
        
        /** Required permissions */
        permissions?: string[];
        
        /** Rate limits */
        rateLimits?: {
            requests: number;
            window: number;
        };
        
        /** Estimated execution time */
        estimatedDuration?: number;
        
        /** Tags for categorization */
        tags?: string[];
    };
}

export interface JSONSchema {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
    description?: string;
}
```

## Type Guards and Validators

### Parameter Validation

```typescript
/** Validate scan content params */
export function isValidScanParams(params: unknown): params is ScanContentParams {
    if (typeof params !== 'object' || params === null) {
        return false;
    }
    
    const p = params as Record<string, unknown>;
    
    // At least one content field required
    const hasContent = !!(p.content || p.prompt || p.response || p.context);
    
    // Profile name must be string if provided
    const validProfile = !p.profileName || typeof p.profileName === 'string';
    
    return hasContent && validProfile;
}

/** Check if tool error */
export function isToolError(result: unknown): result is ToolError {
    return (
        typeof result === 'object' &&
        result !== null &&
        'code' in result &&
        'message' in result
    );
}

/** Check if scan has threats */
export function hasThreats(result: ScanContentResult): boolean {
    if (!result.success || !result.results) {
        return false;
    }
    
    const { threats } = result.results;
    return threats.high > 0 || threats.medium > 0;
}
```

## Usage Examples

### Type-Safe Tool Implementation

```typescript
import { ScanContentParams, ScanContentResult, ToolError } from '../types/tools';

async function scanContentTool(params: ScanContentParams): Promise<ScanContentResult> {
    // Validate parameters
    if (!isValidScanParams(params)) {
        return {
            success: false,
            error: {
                code: ToolErrorCode.INVALID_INPUT,
                message: 'At least one content field is required',
                retryable: false
            }
        };
    }
    
    try {
        // Perform scan
        const startTime = Date.now();
        const scanResult = await performScan(params);
        
        return {
            success: true,
            results: {
                transactionId: scanResult.tr_id,
                threats: summarizeThreats(scanResult),
                action: determineAction(scanResult),
                riskScore: calculateRiskScore(scanResult),
                findings: extractFindings(scanResult)
            },
            metrics: {
                duration: Date.now() - startTime,
                cached: false,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: mapErrorToToolError(error)
        };
    }
}
```

### Working with Tool Results

```typescript
// Handle tool results with type safety
const result = await scanContentTool(params);

if (result.success && result.results) {
    // TypeScript knows results exists
    const { threats, action, riskScore } = result.results;
    
    if (action === 'block') {
        console.log(`Blocked content with risk score: ${riskScore}`);
        console.log(`Threats: ${threats.categories.join(', ')}`);
    }
} else if (result.error) {
    // Handle error
    if (result.error.retryable) {
        // Retry after suggested time
        setTimeout(() => retry(params), result.error.retryAfter * 1000);
    }
}
```

### Creating Tool Definitions

```typescript
const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
    airs_scan_content: {
        name: 'airs_scan_content',
        description: 'Scan content for security threats',
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string' },
                prompt: { type: 'string' },
                response: { type: 'string' },
                context: { type: 'string' },
                profileName: { 
                    type: 'string',
                    enum: ['default', 'strict', 'permissive']
                }
            },
            additionalProperties: false
        },
        metadata: {
            version: '1.0.0',
            rateLimits: {
                requests: 100,
                window: 60000
            },
            estimatedDuration: 500,
            tags: ['security', 'content-analysis']
        }
    }
};
```

## Best Practices

### 1. Always Include Success Status

```typescript
// Good - clear success indicator
interface ToolResult {
    success: boolean;
    data?: any;
    error?: ToolError;
}

// Bad - ambiguous
interface ToolResult {
    data?: any;
    error?: string;
}
```

### 2. Use Enums for Fixed Values

```typescript
// Good - type safe
enum ProfileName {
    DEFAULT = 'default',
    STRICT = 'strict',
    PERMISSIVE = 'permissive'
}

// Less ideal - string literals
type ProfileName = 'default' | 'strict' | 'permissive';
```

### 3. Include Metrics

```typescript
interface ToolResult {
    success: boolean;
    results?: any;
    metrics?: {
        duration: number;
        cached: boolean;
        timestamp: string;
    };
}
```

### 4. Structured Errors

```typescript
// Good - structured error
error: {
    code: 'RATE_LIMITED',
    message: 'Rate limit exceeded',
    retryAfter: 60
}

// Bad - string error
error: 'Rate limit exceeded'
```

## Testing

### Type Testing

```typescript
import { expectType } from 'tsd';

// Test parameter types
const params: ScanContentParams = { content: 'test' };
expectType<string | undefined>(params.profileName);

// Test result types
const result: ScanContentResult = {
    success: true,
    results: {
        transactionId: '123',
        threats: { high: 0, medium: 0, low: 0, categories: [] },
        action: 'allow',
        riskScore: 0
    }
};
expectType<boolean>(result.success);
```

### Mock Data

```typescript
export const mockScanResult: ScanContentResult = {
    success: true,
    results: {
        transactionId: 'test_123',
        threats: {
            high: 0,
            medium: 1,
            low: 2,
            categories: ['url_categories', 'dlp']
        },
        action: 'review',
        riskScore: 35,
        findings: [
            {
                type: 'url_categories',
                severity: 'medium',
                description: 'Suspicious URL detected',
                location: {
                    start: 10,
                    end: 25,
                    context: 'Visit example.com for more'
                }
            }
        ]
    },
    metrics: {
        duration: 125,
        cached: false,
        timestamp: '2024-01-15T10:30:00Z'
    }
};
```

## Related Documentation

- [Tools Overview]({{ site.baseurl }}/developers/src/tools/overview/) - Tool implementation
- [MCP Types]({{ site.baseurl }}/developers/src/types/mcp-types/) - Protocol types
- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - API types
- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system