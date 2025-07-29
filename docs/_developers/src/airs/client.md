---
layout: documentation
title: AIRS Client
permalink: /developers/src/airs/client/
category: developers
---

Base REST API client for Prisma AI Runtime Security (AIRS) service. Handles HTTP communication, retries, and error management.

## Core Purpose

- Communicate with Prisma AIRS API endpoints
- Provide typed methods for scanning operations
- Handle authentication and retries
- Transform API errors into typed exceptions

## Key Components

### PrismaAirsClient Class

```typescript
export class PrismaAirsClient {
    constructor(config: AirsClientConfig) {
        // Initialize with API URL, key, timeout settings
    }
    
    // Core scanning methods
    async scanSync(request: AirsScanRequest): Promise<AirsScanResponse>
    async scanAsync(requests: AirsAsyncScanObject[]): Promise<AirsAsyncScanResponse>
    async getScanResults(scanIds: string[]): Promise<AirsScanIdResult[]>
    async getThreatScanReports(reportIds: string[]): Promise<AirsThreatScanReportObject[]>
}
```

### Error Handling

```typescript
export class PrismaAirsApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public responseBody?: unknown
    )
}
```

## API Operations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `scanSync` | `POST /v1/scan/sync/request` | Real-time content scanning |
| `scanAsync` | `POST /v1/scan/async/request` | Batch scanning |
| `getScanResults` | `GET /v1/scan/results` | Retrieve scan results |
| `getThreatScanReports` | `GET /v1/scan/reports` | Get detailed reports |

## Integration in Application

- **Used By**: Enhanced client, tools, and resource handlers
- **Configuration**: Loaded from environment via config module
- **Authentication**: Uses `x-pan-token` header for API key
- **Retry Logic**: Configurable attempts with exponential backoff

## Key Features

- **Type Safety**: Full TypeScript interfaces for requests/responses
- **Error Context**: Detailed error information for debugging
- **Configurable Timeouts**: Per-request timeout control
- **Structured Logging**: Integration with Winston logger

## Related Modules

- [Enhanced Client]({{ site.baseurl }}/developers/src/airs/index-file/) - Adds caching and rate limiting
- [Factory]({{ site.baseurl }}/developers/src/airs/factory/) - Singleton instantiation
- [AIRS Types]({{ site.baseurl }}/developers/src/types/airs-types/) - Type definitions
