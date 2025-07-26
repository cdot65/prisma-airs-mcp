/**
 * Centralized Tools module type definitions
 * All types are prefixed with 'Tools' to avoid namespace conflicts
 */

// Scan content arguments
export interface ToolsScanContentArgs {
    prompt?: string;
    response?: string;
    context?: string;
    profileName?: string;
    profileId?: string;
    metadata?: {
        appName?: string;
        appUser?: string;
        aiModel?: string;
        userIp?: string;
    };
}

// Async scan request item
export interface ToolsAsyncScanRequestItem {
    reqId: number;
    prompt?: string;
    response?: string;
    context?: string;
    profileName?: string;
    profileId?: string;
}

// Async scan arguments
export interface ToolsScanAsyncArgs {
    requests: ToolsAsyncScanRequestItem[];
}

// Get scan results arguments
export interface ToolsGetScanResultsArgs {
    scanIds: string[];
}

// Get threat reports arguments
export interface ToolsGetThreatReportsArgs {
    reportIds: string[];
}

// Note: ScanResponseWithDetected is just an alias to ScanResponse from AIRS
// We'll define it here as ToolsScanResponseWithDetected for consistency
// In the implementation, this will reference AirsScanResponse from the centralized types
export type ToolsScanResponseWithDetected = import('./airs').AirsScanResponse;
