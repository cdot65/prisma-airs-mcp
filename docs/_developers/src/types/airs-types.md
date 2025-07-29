---
layout: documentation
title: AIRS Types
permalink: /developers/src/types/airs-types/
category: developers
---

# AIRS Types (src/types/airs.ts)

The AIRS types module defines all TypeScript interfaces and types for interacting with the Prisma AI Runtime Security
API. These types ensure type safety when making API requests and handling responses.

## Overview

The AIRS types provide:

- Request and response interfaces for all API endpoints
- Threat category and severity definitions
- Profile and scan result structures
- Error types for API failures
- Comprehensive type safety for AIRS integration

## Request Types

### ScanSyncRequest

Synchronous scan request for immediate content analysis.

```typescript
export interface ScanSyncRequest {
    /** Unique transaction ID for request tracking */
    tr_id: string;
    
    /** Array of content items to scan */
    request: ScanRequestItem[];
}

export interface ScanRequestItem {
    /** User-provided prompt or input text */
    prompt?: string;
    
    /** AI-generated response text */
    response?: string;
    
    /** Additional context for the scan */
    context?: string;
    
    /** Security profile to use for scanning */
    profile_name?: string;
}
```

**Usage Example:**

```typescript
const scanRequest: ScanSyncRequest = {
    tr_id: 'scan_' + Date.now(),
    request: [{
        prompt: 'User input text',
        response: 'AI response text',
        profile_name: 'strict'
    }]
};
```

### ScanAsyncRequest

Asynchronous scan request for batch processing.

```typescript
export interface ScanAsyncRequest {
    /** Array of scan requests to process */
    requests: ScanSyncRequest[];
}
```

**Usage Example:**

```typescript
const batchRequest: ScanAsyncRequest = {
    requests: [
        {
            tr_id: 'batch_1',
            request: [{ prompt: 'First item', profile_name: 'default' }]
        },
        {
            tr_id: 'batch_2',
            request: [{ prompt: 'Second item', profile_name: 'default' }]
        }
    ]
};
```

### GetScanResultsRequest

Request to retrieve scan results by ID.

```typescript
export interface GetScanResultsRequest {
    /** Array of scan IDs to retrieve */
    scan_ids: string[];
}
```

### GetThreatReportsRequest

Request to retrieve detailed threat reports.

```typescript
export interface GetThreatReportsRequest {
    /** Array of report IDs to retrieve */
    report_ids: string[];
}
```

## Response Types

### ScanSyncResponse

Response from synchronous scanning.

```typescript
export interface ScanSyncResponse {
    /** Transaction ID from request */
    tr_id: string;
    
    /** Array of scan results */
    request_results: ScanResult[];
}

export interface ScanResult {
    /** Index of the scanned item */
    index: number;
    
    /** Prompt scanning results */
    prompt_guard_result?: GuardResult;
    
    /** Response scanning results */
    response_guard_result?: GuardResult;
    
    /** Combined analysis results */
    verdict?: Verdict;
}
```

### GuardResult

Security analysis results for content.

```typescript
export interface GuardResult {
    /** High severity threats detected */
    high_risk_categories: ThreatCategory[];
    
    /** Medium severity threats detected */
    medium_risk_categories: ThreatCategory[];
    
    /** Low severity threats detected */
    low_risk_categories: ThreatCategory[];
    
    /** Overall risk score (0-100) */
    risk_score: number;
    
    /** Recommended action (allow/block/review) */
    action: GuardAction;
}
```

### ThreatCategory

Individual threat detection details.

```typescript
export interface ThreatCategory {
    /** Unique category identifier */
    id: string;
    
    /** Human-readable category name */
    name: string;
    
    /** Category type (e.g., 'url', 'dlp', 'injection') */
    type: ThreatType;
    
    /** Severity level (0-100) */
    severity: number;
    
    /** Confidence score (0-100) */
    confidence: number;
    
    /** Detailed description of the threat */
    description?: string;
    
    /** Specific matches or evidence */
    matches?: string[];
    
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
```

### ScanAsyncResponse

Response from asynchronous scanning.

```typescript
export interface ScanAsyncResponse {
    /** Unique scan ID for result retrieval */
    scan_id: string;
    
    /** Estimated completion time */
    estimated_completion?: string;
    
    /** Current status */
    status: 'queued' | 'processing' | 'complete' | 'failed';
}
```

### ScanResultsResponse

Response containing scan results.

```typescript
export interface ScanResultsResponse {
    /** Array of scan results */
    results: ScanResultItem[];
}

export interface ScanResultItem {
    /** Scan ID */
    scan_id: string;
    
    /** Current status */
    status: 'pending' | 'complete' | 'failed';
    
    /** Scan results if complete */
    scan_results?: ScanSyncResponse[];
    
    /** Error details if failed */
    error?: ErrorDetails;
    
    /** Completion timestamp */
    completed_at?: string;
}
```

## Enum Types

### ThreatType

Categories of security threats.

```typescript
export enum ThreatType {
    /** URL-based threats */
    URL_CATEGORIES = 'url_categories',
    
    /** Data loss prevention */
    DLP = 'dlp',
    
    /** Code injection attempts */
    INJECTION = 'injection',
    
    /** Toxic or harmful content */
    TOXIC_CONTENT = 'toxic_content',
    
    /** Malicious code patterns */
    MALICIOUS_CODE = 'malicious_code',
    
    /** Agent manipulation attempts */
    AGENT_THREATS = 'agent_threats',
    
    /** Policy violations */
    TOPIC_VIOLATIONS = 'topic_violations',
    
    /** Database security issues */
    DATABASE_SECURITY = 'database_security',
    
    /** Unverified or false content */
    UNGROUNDED_CONTENT = 'ungrounded_content'
}
```

### GuardAction

Recommended actions based on threat analysis.

```typescript
export enum GuardAction {
    /** Content is safe to proceed */
    ALLOW = 'allow',
    
    /** Content should be blocked */
    BLOCK = 'block',
    
    /** Content requires manual review */
    REVIEW = 'review',
    
    /** Content should be modified */
    MODIFY = 'modify'
}
```

### ProfileName

Pre-configured security profiles.

```typescript
export enum ProfileName {
    /** Balanced security checks */
    DEFAULT = 'default',
    
    /** Maximum security, strict checks */
    STRICT = 'strict',
    
    /** Minimal restrictions */
    PERMISSIVE = 'permissive',
    
    /** Custom profile */
    CUSTOM = 'custom'
}
```

## Error Types

### AIRSAPIError

Custom error class for AIRS API failures.

```typescript
export class AIRSAPIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AIRSAPIError';
    }
}
```

### ErrorDetails

Detailed error information.

```typescript
export interface ErrorDetails {
    /** Error code */
    code: string;
    
    /** Error message */
    message: string;
    
    /** HTTP status code */
    status?: number;
    
    /** Additional error context */
    context?: Record<string, unknown>;
    
    /** Retry information */
    retry?: {
        after: number;
        attempts: number;
    };
}
```

## Utility Types

### PartialScanRequest

Partial scan request for updates.

```typescript
export type PartialScanRequest = Partial<ScanRequestItem>;
```

### ScanStatus

Union type for scan statuses.

```typescript
export type ScanStatus = 'pending' | 'processing' | 'complete' | 'failed';
```

### RiskLevel

Risk level categorization.

```typescript
export type RiskLevel = 'high' | 'medium' | 'low' | 'none';
```

## Type Guards

### Type checking functions

```typescript
/** Check if response has threats */
export function hasThreats(result: GuardResult): boolean {
    return (
        result.high_risk_categories.length > 0 ||
        result.medium_risk_categories.length > 0
    );
}

/** Check if error is AIRS API error */
export function isAIRSAPIError(error: unknown): error is AIRSAPIError {
    return error instanceof AIRSAPIError;
}

/** Check if scan is complete */
export function isScanComplete(status: ScanStatus): boolean {
    return status === 'complete';
}
```

## Usage Examples

### Type-Safe API Calls

```typescript
import { ScanSyncRequest, ScanSyncResponse, hasThreats } from '../types/airs';

async function scanContent(content: string): Promise<boolean> {
    const request: ScanSyncRequest = {
        tr_id: generateId(),
        request: [{
            prompt: content,
            profile_name: ProfileName.STRICT
        }]
    };
    
    const response: ScanSyncResponse = await client.scanSync(request);
    
    // Type-safe access to results
    const result = response.request_results[0];
    if (result.prompt_guard_result && hasThreats(result.prompt_guard_result)) {
        console.log('Threats detected:', result.prompt_guard_result.high_risk_categories);
        return false;
    }
    
    return true;
}
```

### Error Handling

```typescript
import { AIRSAPIError, isAIRSAPIError } from '../types/airs';

try {
    const result = await client.scanSync(request);
} catch (error) {
    if (isAIRSAPIError(error)) {
        // Type-safe error handling
        console.error(`API Error ${error.status}: ${error.message}`);
        
        if (error.status === 429) {
            // Rate limited
            const retryAfter = error.details?.retry?.after;
        }
    }
}
```

### Working with Threat Categories

```typescript
function analyzeThreat(category: ThreatCategory): string {
    switch (category.type) {
        case ThreatType.INJECTION:
            return `Code injection detected: ${category.description}`;
        
        case ThreatType.DLP:
            return `Data leak risk: ${category.matches?.join(', ')}`;
        
        case ThreatType.TOXIC_CONTENT:
            return `Harmful content: Severity ${category.severity}`;
        
        default:
            return `Threat detected: ${category.name}`;
    }
}
```

## Best Practices

### 1. Use Enums for Constants

```typescript
// Good - Type safe
profile_name: ProfileName.STRICT

// Avoid - String literals
profile_name: 'strict'
```

### 2. Validate Response Structure

```typescript
// Always check for required fields
if (response.request_results && response.request_results.length > 0) {
    const result = response.request_results[0];
    // Safe to use result
}
```

### 3. Handle All Threat Levels

```typescript
function processThreat(result: GuardResult) {
    // Check all threat levels
    const allThreats = [
        ...result.high_risk_categories,
        ...result.medium_risk_categories,
        ...result.low_risk_categories
    ];
    
    return allThreats.map(analyzeThreat);
}
```

### 4. Type Narrowing

```typescript
// Use type guards for safety
if (error instanceof AIRSAPIError) {
    // TypeScript knows error has status, code, details
}
```

## Related Documentation

- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - Client implementation
- [Types Overview]({{ site.baseurl }}/developers/src/types/overview/) - Type system overview
- [API Reference]({{ site.baseurl }}/developers/api/airs/) - AIRS API documentation
- [Error Handling]({{ site.baseurl }}/developers/error-handling/) - Error handling guide