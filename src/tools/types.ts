/**
 * Type definitions for tool handler arguments
 */

// Scan content arguments
export interface ScanContentArgs {
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
export interface AsyncScanRequestItem {
  reqId: number;
  prompt?: string;
  response?: string;
  context?: string;
  profileName?: string;
  profileId?: string;
}

// Async scan arguments
export interface ScanAsyncArgs {
  requests: AsyncScanRequestItem[];
}

// Get scan results arguments
export interface GetScanResultsArgs {
  scanIds: string[];
}

// Get threat reports arguments
export interface GetThreatReportsArgs {
  reportIds: string[];
}

// Import the types from airs/types
import type { ScanResponse } from '../airs';

// Scan response with detected threats - use ScanResponse directly
export type ScanResponseWithDetected = ScanResponse;
