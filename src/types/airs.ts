/**
 * Centralized AIRS module type definitions
 * All types are prefixed with 'Airs' to avoid namespace conflicts
 */

// Request Types

export interface AirsScanRequest {
    tr_id?: string;
    ai_profile: AirsAiProfile;
    metadata?: AirsMetadata;
    contents: AirsContentItem[];
}

export interface AirsAiProfile {
    profile_id?: string;
    profile_name?: string;
}

export interface AirsMetadata {
    app_name?: string;
    app_user?: string;
    ai_model?: string;
    user_ip?: string;
}

export interface AirsContentItem {
    prompt?: string;
    response?: string;
    code_prompt?: string;
    code_response?: string;
    context?: string;
}

export interface AirsAsyncScanObject {
    req_id: number;
    scan_req: AirsScanRequest;
}

// Response Types

export interface AirsScanResponse {
    report_id: string;
    scan_id: string;
    tr_id?: string;
    profile_id?: string;
    profile_name?: string;
    category: 'malicious' | 'benign';
    action: 'block' | 'allow';
    prompt_detected?: AirsPromptDetected;
    response_detected?: AirsResponseDetected;
    prompt_masked_data?: AirsMaskedData;
    response_masked_data?: AirsMaskedData;
    prompt_detection_details?: AirsPromptDetectionDetails;
    response_detection_details?: AirsResponseDetectionDetails;
    created_at?: string;
    completed_at?: string;
}

export interface AirsPromptDetected {
    url_cats?: boolean;
    dlp?: boolean;
    injection?: boolean;
    toxic_content?: boolean;
    malicious_code?: boolean;
    agent?: boolean;
    topic_violation?: boolean;
}

export interface AirsResponseDetected {
    url_cats?: boolean;
    dlp?: boolean;
    db_security?: boolean;
    toxic_content?: boolean;
    malicious_code?: boolean;
    agent?: boolean;
    ungrounded?: boolean;
    topic_violation?: boolean;
}

export interface AirsMaskedData {
    data?: string;
    pattern_detections?: AirsPatternDetection[];
}

export interface AirsPatternDetection {
    pattern?: string;
    locations?: number[][];
}

export interface AirsPromptDetectionDetails {
    topic_guardrails_details?: AirsTopicGuardRails;
}

export interface AirsResponseDetectionDetails {
    topic_guardrails_details?: AirsTopicGuardRails;
}

export interface AirsTopicGuardRails {
    allowed_topics?: string[];
    blocked_topics?: string[];
}

export interface AirsAsyncScanResponse {
    received: string;
    scan_id: string;
    report_id?: string;
}

export interface AirsScanIdResult {
    req_id?: number;
    status?: string;
    scan_id?: string;
    result?: AirsScanResponse;
}

export interface AirsThreatScanReportObject {
    report_id?: string;
    scan_id?: string;
    req_id?: number;
    transaction_id?: string;
    detection_results?: AirsDetectionServiceResultObject[];
}

export interface AirsDetectionServiceResultObject {
    data_type?: string;
    detection_service?: string;
    verdict?: string;
    action?: string;
    result_detail?: AirsDSDetailResultObject;
}

export interface AirsDSDetailResultObject {
    urlf_report?: AirsUrlfEntryObject[];
    dlp_report?: AirsDlpReportObject;
    dbs_report?: AirsDbsEntryObject[];
    tc_report?: AirsTcReportObject;
    mc_report?: AirsMcReportObject;
    agent_report?: AirsAgentReportObject;
    topic_guardrails_report?: AirsTgReportObject;
}

export interface AirsUrlfEntryObject {
    url?: string;
    risk_level?: string;
    action?: string;
    categories?: string[];
}

export interface AirsDlpReportObject {
    dlp_report_id?: string;
    dlp_profile_name?: string;
    dlp_profile_id?: string;
    dlp_profile_version?: number;
    data_pattern_rule1_verdict?: string;
    data_pattern_rule2_verdict?: string;
    data_pattern_detection_offsets?: AirsDlpPatternDetectionsObject[];
}

export interface AirsDlpPatternDetectionsObject {
    data_pattern_id?: string;
    version?: number;
    name?: string;
    high_confidence_detections?: number[][];
    medium_confidence_detections?: number[][];
    low_confidence_detections?: number[][];
}

export interface AirsDbsEntryObject {
    sub_type?: string;
    verdict?: string;
    action?: string;
}

export interface AirsTcReportObject {
    confidence?: string;
    verdict?: string;
}

export interface AirsMcReportObject {
    verdict?: string;
    code_analysis_by_type?: AirsMcEntryObject[];
    all_code_blocks?: string[];
}

export interface AirsMcEntryObject {
    file_type?: string;
    code_sha256?: string;
}

export interface AirsAgentReportObject {
    model_verdict?: string;
    agent_framework?: string;
    agent_patterns?: AirsAgentEntryObject[];
}

export interface AirsAgentEntryObject {
    category_type?: string;
    verdict?: string;
}

export interface AirsTgReportObject {
    allowed_topic_list?: string;
    blocked_topic_list?: string;
    allowedTopics?: string[];
    blockedTopics?: string[];
}

// Error Types

export interface AirsError {
    status_code: number;
    message: string;
}

export interface AirsErrorResponse {
    error: {
        message: string;
        retry_after?: {
            interval: number;
            unit: string;
        };
    };
}

// API Client Types

export interface AirsClientConfig {
    apiUrl: string;
    apiKey: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}

export interface AirsRequestOptions {
    headers?: Record<string, string>;
    signal?: AbortSignal;
}

// HTTP Error Codes
export enum AirsErrorCode {
    BadRequest = 400,
    Unauthenticated = 401,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    RequestTooLarge = 413,
    UnsupportedMediaType = 415,
    TooManyRequests = 429,
    InternalServerError = 500,
}

// Cache Types (from cache.ts)
export interface AirsCacheConfig {
    ttlSeconds: number;
    maxSize: number;
    enabled?: boolean;
}

// Rate Limiter Types (from rate-limiter.ts)
export interface AirsRateLimiterConfig {
    maxRequests: number;
    windowMs: number;
    enabled?: boolean;
}

// Enhanced Client Types (from index.ts)
export interface AirsEnhancedClientConfig extends AirsClientConfig {
    cache?: AirsCacheConfig;
    rateLimiter?: AirsRateLimiterConfig;
}

// Constants
export const AIRS_API_VERSION = 'v1';
export const AIRS_CONTENT_TYPE = 'application/json';
export const AIRS_AUTH_HEADER = 'x-pan-token';
export const AIRS_MAX_SCAN_IDS = 5;
export const AIRS_MAX_REPORT_IDS = 5;
export const AIRS_SCAN_ID_MAX_LENGTH = 36;
export const AIRS_REPORT_ID_MAX_LENGTH = 37;
