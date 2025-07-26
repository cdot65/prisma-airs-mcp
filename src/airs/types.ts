/**
 * TypeScript types generated from Prisma AIRS OpenAPI schema
 */

// Request Types

export interface ScanRequest {
    tr_id?: string;
    ai_profile: AiProfile;
    metadata?: Metadata;
    contents: ContentItem[];
}

export interface AiProfile {
    profile_id?: string;
    profile_name?: string;
}

export interface Metadata {
    app_name?: string;
    app_user?: string;
    ai_model?: string;
    user_ip?: string;
}

export interface ContentItem {
    prompt?: string;
    response?: string;
    code_prompt?: string;
    code_response?: string;
    context?: string;
}

export interface AsyncScanObject {
    req_id: number;
    scan_req: ScanRequest;
}

// Response Types

export interface ScanResponse {
    report_id: string;
    scan_id: string;
    tr_id?: string;
    profile_id?: string;
    profile_name?: string;
    category: 'malicious' | 'benign';
    action: 'block' | 'allow';
    prompt_detected?: PromptDetected;
    response_detected?: ResponseDetected;
    prompt_masked_data?: MaskedData;
    response_masked_data?: MaskedData;
    prompt_detection_details?: PromptDetectionDetails;
    response_detection_details?: ResponseDetectionDetails;
    created_at?: string;
    completed_at?: string;
}

export interface PromptDetected {
    url_cats?: boolean;
    dlp?: boolean;
    injection?: boolean;
    toxic_content?: boolean;
    malicious_code?: boolean;
    agent?: boolean;
    topic_violation?: boolean;
}

export interface ResponseDetected {
    url_cats?: boolean;
    dlp?: boolean;
    db_security?: boolean;
    toxic_content?: boolean;
    malicious_code?: boolean;
    agent?: boolean;
    ungrounded?: boolean;
    topic_violation?: boolean;
}

export interface MaskedData {
    data?: string;
    pattern_detections?: PatternDetection[];
}

export interface PatternDetection {
    pattern?: string;
    locations?: number[][];
}

export interface PromptDetectionDetails {
    topic_guardrails_details?: TopicGuardRails;
}

export interface ResponseDetectionDetails {
    topic_guardrails_details?: TopicGuardRails;
}

export interface TopicGuardRails {
    allowed_topics?: string[];
    blocked_topics?: string[];
}

export interface AsyncScanResponse {
    received: string;
    scan_id: string;
    report_id?: string;
}

export interface ScanIdResult {
    req_id?: number;
    status?: string;
    scan_id?: string;
    result?: ScanResponse;
}

export interface ThreatScanReportObject {
    report_id?: string;
    scan_id?: string;
    req_id?: number;
    transaction_id?: string;
    detection_results?: DetectionServiceResultObject[];
}

export interface DetectionServiceResultObject {
    data_type?: string;
    detection_service?: string;
    verdict?: string;
    action?: string;
    result_detail?: DSDetailResultObject;
}

export interface DSDetailResultObject {
    urlf_report?: UrlfEntryObject[];
    dlp_report?: DlpReportObject;
    dbs_report?: DbsEntryObject[];
    tc_report?: TcReportObject;
    mc_report?: McReportObject;
    agent_report?: AgentReportObject;
    topic_guardrails_report?: TgReportObject;
}

export interface UrlfEntryObject {
    url?: string;
    risk_level?: string;
    action?: string;
    categories?: string[];
}

export interface DlpReportObject {
    dlp_report_id?: string;
    dlp_profile_name?: string;
    dlp_profile_id?: string;
    dlp_profile_version?: number;
    data_pattern_rule1_verdict?: string;
    data_pattern_rule2_verdict?: string;
    data_pattern_detection_offsets?: DlpPatternDetectionsObject[];
}

export interface DlpPatternDetectionsObject {
    data_pattern_id?: string;
    version?: number;
    name?: string;
    high_confidence_detections?: number[][];
    medium_confidence_detections?: number[][];
    low_confidence_detections?: number[][];
}

export interface DbsEntryObject {
    sub_type?: string;
    verdict?: string;
    action?: string;
}

export interface TcReportObject {
    confidence?: string;
    verdict?: string;
}

export interface McReportObject {
    verdict?: string;
    code_analysis_by_type?: McEntryObject[];
    all_code_blocks?: string[];
}

export interface McEntryObject {
    file_type?: string;
    code_sha256?: string;
}

export interface AgentReportObject {
    model_verdict?: string;
    agent_framework?: string;
    agent_patterns?: AgentEntryObject[];
}

export interface AgentEntryObject {
    category_type?: string;
    verdict?: string;
}

export interface TgReportObject {
    allowed_topic_list?: string;
    blocked_topic_list?: string;
    allowedTopics?: string[];
    blockedTopics?: string[];
}

// Error Types

export interface AIRSError {
    status_code: number;
    message: string;
}

export interface AIRSErrorResponse {
    error: {
        message: string;
        retry_after?: {
            interval: number;
            unit: string;
        };
    };
}

// API Client Types

export interface AIRSClientConfig {
    apiUrl: string;
    apiKey: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}

export interface AIRSRequestOptions {
    headers?: Record<string, string>;
    signal?: AbortSignal;
}

// HTTP Error Codes
export enum AIRSErrorCode {
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

// Constants
export const AIRS_API_VERSION = 'v1';
export const AIRS_CONTENT_TYPE = 'application/json';
export const AIRS_AUTH_HEADER = 'x-pan-token';
export const AIRS_MAX_SCAN_IDS = 5;
export const AIRS_MAX_REPORT_IDS = 5;
export const AIRS_SCAN_ID_MAX_LENGTH = 36;
export const AIRS_REPORT_ID_MAX_LENGTH = 37;
