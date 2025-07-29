---
layout: documentation
title: AIRS Types
permalink: /developers/src/types/airs-types/
category: developers
---

TypeScript interfaces and types for Prisma AI Runtime Security API integration. Ensures type safety for requests, responses, and error handling.

## Core Purpose

- Define API request/response structures
- Provide threat category types
- Enable type-safe error handling
- Support comprehensive security analysis

## Key Interfaces

### Request Types

```typescript
// Sync scan request
interface AirsScanRequest {
    tr_id?: string
    ai_profile: { profile_name?: string, profile_id?: string }
    contents: Array<{
        prompt?: string
        response?: string
        context?: string
    }>
    metadata?: { app_name?, app_user?, ai_model?, user_ip? }
}

// Async scan object
interface AirsAsyncScanObject {
    req_id: number
    scan_req: AirsScanRequest
}
```

### Response Types

```typescript
// Scan response
interface AirsScanResponse {
    scan_id: string
    category: 'safe' | 'malicious'
    action: 'allow' | 'block' | 'review'
    tr_id: string
    prompt_detected?: ThreatDetection
    response_detected?: ThreatDetection
}

// Threat detection
interface ThreatDetection {
    url_cats?: boolean
    dlp?: boolean
    injection?: boolean
    toxic_content?: boolean
    malicious_code?: boolean
    // ... other threat types
}
```

## Integration in Application

- **Used By**: AIRS client, tools, types validation
- **Pattern**: Strict typing for API contracts
- **Validation**: Type guards and checks
- **Errors**: Custom error classes

## Threat Categories

### Detection Types

- **URL Categories**: Malicious URLs
- **DLP**: Data loss prevention
- **Injection**: Code injection
- **Toxic Content**: Harmful content
- **Malicious Code**: Dangerous patterns
- **Agent Threats**: AI manipulation
- **Topic Violations**: Policy breaches

### Severity Levels

- **Category**: safe, malicious
- **Action**: allow, block, review
- **Risk Score**: Numeric severity

## Error Handling

```typescript
class PrismaAirsApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public responseBody?: unknown
    )
}
```

## Type Guards

```typescript
// Check for threats
function hasThreats(detected: ThreatDetection): boolean {
    return Object.values(detected).some(v => v === true);
}

// Validate response
function isValidScanResponse(res: any): res is AirsScanResponse {
    return res && 
           typeof res.scan_id === 'string' &&
           ['safe', 'malicious'].includes(res.category);
}
```

## Usage Example

```typescript
// Type-safe scan request
const request: AirsScanRequest = {
    ai_profile: { profile_name: 'strict' },
    contents: [{
        prompt: 'User input',
        response: 'AI response'
    }]
};

// Handle response
const response: AirsScanResponse = await client.scanSync(request);
if (response.category === 'malicious') {
    console.log('Threats:', response.prompt_detected);
}
```

## Related Modules

- [AIRS Client]({{ site.baseurl }}/developers/src/airs/client/) - API implementation
- [Tools Types]({{ site.baseurl }}/developers/src/types/tools-types/) - Tool interfaces
- [Config Types]({{ site.baseurl }}/developers/src/types/config-types/) - Configuration
