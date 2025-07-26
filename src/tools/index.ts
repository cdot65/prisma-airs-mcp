/**
 * MCP Tool handlers for Prisma AIRS operations
 */

import { getLogger } from '../utils/logger.js';
import { getAirsClient } from '../airs/factory.js';
import { getConfig } from '../config';
import { ResourceHandler } from '../resources';
import type { Logger } from 'winston';
import type {
    AirsAsyncScanObject,
    AirsScanRequest,
    McpTool,
    McpToolResultContent,
    McpToolsCallParams,
    McpToolsCallResult,
    McpToolsListParams,
    McpToolsListResult,
    ToolsAsyncScanRequestItem,
    ToolsGetScanResultsArgs,
    ToolsGetThreatReportsArgs,
    ToolsScanAsyncArgs,
    ToolsScanContentArgs,
    ToolsScanResponseWithDetected,
} from '../types';

export class ToolHandler {
    private readonly logger: Logger;
    private readonly airsClient = getAirsClient();

    // Tool names
    private static readonly TOOLS = {
        SCAN_CONTENT: 'airs_scan_content',
        SCAN_ASYNC: 'airs_scan_async',
        GET_SCAN_RESULTS: 'airs_get_scan_results',
        GET_THREAT_REPORTS: 'airs_get_threat_reports',
        CLEAR_CACHE: 'airs_clear_cache',
    } as const;

    constructor() {
        this.logger = getLogger();
    }

    /**
     * List available tools
     */
    listTools(params: McpToolsListParams): McpToolsListResult {
        this.logger.debug('Listing tools', { cursor: params?.cursor });

        const tools: McpTool[] = [
            {
                name: ToolHandler.TOOLS.SCAN_CONTENT,
                title: 'Scan Content for Threats',
                description:
                    'Analyze prompt and/or response content for security threats using Prisma AIRS',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prompt: {
                            type: 'string',
                            description: 'The prompt content to scan',
                        },
                        response: {
                            type: 'string',
                            description: 'The response content to scan',
                        },
                        context: {
                            type: 'string',
                            description: 'Additional context for the scan',
                        },
                        profileName: {
                            type: 'string',
                            description:
                                'Name of the AI security profile to use (defaults to "Prisma AIRS")',
                        },
                        profileId: {
                            type: 'string',
                            description: 'ID of the AI security profile to use',
                        },
                        metadata: {
                            type: 'object',
                            description: 'Additional metadata for the scan',
                            properties: {
                                appName: { type: 'string' },
                                appUser: { type: 'string' },
                                aiModel: { type: 'string' },
                                userIp: { type: 'string' },
                            },
                        },
                    },
                    required: [],
                },
                annotations: {
                    readOnlyHint: false,
                    progressHint: true,
                },
            },
            {
                name: ToolHandler.TOOLS.SCAN_ASYNC,
                title: 'Scan Content Asynchronously',
                description: 'Submit multiple scan requests for asynchronous processing',
                inputSchema: {
                    type: 'object',
                    properties: {
                        requests: {
                            type: 'array',
                            description: 'Array of scan requests',
                            items: {
                                type: 'object',
                                properties: {
                                    reqId: {
                                        type: 'integer',
                                        description: 'Unique identifier for this request',
                                    },
                                    prompt: { type: 'string' },
                                    response: { type: 'string' },
                                    context: { type: 'string' },
                                    profileName: { type: 'string' },
                                    profileId: { type: 'string' },
                                },
                                required: ['reqId'],
                            },
                        },
                    },
                    required: ['requests'],
                },
                annotations: {
                    readOnlyHint: false,
                    progressHint: true,
                },
            },
            {
                name: ToolHandler.TOOLS.GET_SCAN_RESULTS,
                title: 'Get Scan Results',
                description: 'Retrieve results for previously submitted scans',
                inputSchema: {
                    type: 'object',
                    properties: {
                        scanIds: {
                            type: 'array',
                            description: 'Array of scan IDs to retrieve (max 5)',
                            items: { type: 'string' },
                        },
                    },
                    required: ['scanIds'],
                },
                annotations: {
                    readOnlyHint: true,
                },
            },
            {
                name: ToolHandler.TOOLS.GET_THREAT_REPORTS,
                title: 'Get Threat Reports',
                description: 'Retrieve detailed threat scan reports',
                inputSchema: {
                    type: 'object',
                    properties: {
                        reportIds: {
                            type: 'array',
                            description: 'Array of report IDs to retrieve (max 5)',
                            items: { type: 'string' },
                        },
                    },
                    required: ['reportIds'],
                },
                annotations: {
                    readOnlyHint: true,
                },
            },
            {
                name: ToolHandler.TOOLS.CLEAR_CACHE,
                title: 'Clear Cache',
                description: 'Clear the AIRS response cache',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
                annotations: {
                    readOnlyHint: false,
                },
            },
        ];

        return { tools };
    }

    /**
     * Execute a tool
     */
    async callTool(params: McpToolsCallParams): Promise<McpToolsCallResult> {
        this.logger.debug('Calling tool', {
            name: params.name,
            hasArguments: !!params.arguments,
        });

        try {
            switch (params.name) {
                case ToolHandler.TOOLS.SCAN_CONTENT:
                    return this.scanContent(params.arguments || {});

                case ToolHandler.TOOLS.SCAN_ASYNC:
                    return this.scanAsync(params.arguments || {});

                case ToolHandler.TOOLS.GET_SCAN_RESULTS:
                    return this.getScanResults(params.arguments || {});

                case ToolHandler.TOOLS.GET_THREAT_REPORTS:
                    return this.getThreatReports(params.arguments || {});

                case ToolHandler.TOOLS.CLEAR_CACHE:
                    return this.clearCache();

                default:
                    throw new Error(`Unknown tool: ${params.name}`);
            }
        } catch (error) {
            return this.createErrorResult(error);
        }
    }

    /**
     * Scan content synchronously
     */
    private async scanContent(args: Record<string, unknown>): Promise<McpToolsCallResult> {
        const typedArgs = args as ToolsScanContentArgs;
        const scanRequest: AirsScanRequest = {
            tr_id: Date.now().toString(), // Generate unique transaction ID
            ai_profile: {},
            contents: [],
        };

        // Set profile - use configured defaults or fallback to "Prisma AIRS"
        const config = getConfig();
        if (typedArgs.profileName) {
            scanRequest.ai_profile.profile_name = typedArgs.profileName;
        } else if (typedArgs.profileId) {
            scanRequest.ai_profile.profile_id = typedArgs.profileId;
        } else if (config.airs.defaultProfileId) {
            scanRequest.ai_profile.profile_id = config.airs.defaultProfileId;
        } else if (config.airs.defaultProfileName) {
            scanRequest.ai_profile.profile_name = config.airs.defaultProfileName;
        } else {
            // Fallback to hardcoded default
            scanRequest.ai_profile.profile_name = 'Prisma AIRS';
        }

        // Build content
        const content: {
            prompt?: string;
            response?: string;
            context?: string;
        } = {};
        if (typedArgs.prompt) content.prompt = typedArgs.prompt;
        if (typedArgs.response) content.response = typedArgs.response;
        if (typedArgs.context) content.context = typedArgs.context;

        if (Object.keys(content).length === 0) {
            throw new Error('At least one of prompt, response, or context is required');
        }

        scanRequest.contents.push(content);

        // Add metadata if provided
        if (typedArgs.metadata) {
            scanRequest.metadata = {
                app_name: typedArgs.metadata.appName,
                app_user: typedArgs.metadata.appUser,
                ai_model: typedArgs.metadata.aiModel,
                user_ip: typedArgs.metadata.userIp,
            };
        }

        // Perform scan
        const result = await this.airsClient.scanSync(scanRequest);

        // Create tool result
        const contents: McpToolResultContent[] = [
            {
                type: 'text',
                text: `Scan completed. Category: ${result.category}, Action: ${result.action}`,
            },
        ];

        // Add resource reference for detailed results
        if (result.scan_id) {
            contents.push({
                type: 'resource',
                resource: ResourceHandler.createResourceReference(
                    'scan-result',
                    result.scan_id,
                    'Scan Result Details',
                    result,
                ),
            });
        }

        // Add threat summary if threats detected
        if (result.category === 'malicious') {
            const threats = this.summarizeThreats(result);
            contents.push({
                type: 'text',
                text: `Threats detected: ${threats}`,
            });
        }

        return { content: contents };
    }

    /**
     * Scan content asynchronously
     */
    private async scanAsync(args: Record<string, unknown>): Promise<McpToolsCallResult> {
        const typedArgs = args as unknown as ToolsScanAsyncArgs;

        if (!Array.isArray(typedArgs.requests)) {
            throw new Error('requests must be an array');
        }

        const config = getConfig();
        const asyncRequests: AirsAsyncScanObject[] = typedArgs.requests.map(
            (req: ToolsAsyncScanRequestItem) => {
                const scanRequest: AirsScanRequest = {
                    ai_profile: {},
                    contents: [],
                };

                // Set profile - use configured defaults or fallback to "Prisma AIRS"
                if (req.profileName) {
                    scanRequest.ai_profile.profile_name = req.profileName;
                } else if (req.profileId) {
                    scanRequest.ai_profile.profile_id = req.profileId;
                } else if (config.airs.defaultProfileId) {
                    scanRequest.ai_profile.profile_id = config.airs.defaultProfileId;
                } else if (config.airs.defaultProfileName) {
                    scanRequest.ai_profile.profile_name = config.airs.defaultProfileName;
                } else {
                    // Fallback to hardcoded default
                    scanRequest.ai_profile.profile_name = 'Prisma AIRS';
                }

                // Build content
                const content: {
                    prompt?: string;
                    response?: string;
                    context?: string;
                } = {};
                if (req.prompt) content.prompt = req.prompt;
                if (req.response) content.response = req.response;
                if (req.context) content.context = req.context;

                scanRequest.contents.push(content);

                return {
                    req_id: req.reqId,
                    scan_req: scanRequest,
                };
            },
        );

        // Submit async scan
        const result = await this.airsClient.scanAsync(asyncRequests);

        const contents: McpToolResultContent[] = [
            {
                type: 'text',
                text: `Async scan submitted. Scan ID: ${result.scan_id}`,
            },
        ];

        if (result.report_id) {
            contents.push({
                type: 'text',
                text: `Report ID: ${result.report_id}`,
            });
        }

        return { content: contents };
    }

    /**
     * Get scan results
     */
    private async getScanResults(args: Record<string, unknown>): Promise<McpToolsCallResult> {
        const typedArgs = args as unknown as ToolsGetScanResultsArgs;

        if (!Array.isArray(typedArgs.scanIds)) {
            throw new Error('scanIds must be an array');
        }

        const scanIds = typedArgs.scanIds.map(String);
        const results = await this.airsClient.getScanResults(scanIds);

        const contents: McpToolResultContent[] = [
            {
                type: 'text',
                text: `Retrieved ${results.length} scan results`,
            },
        ];

        // Add resource references for each result
        results.forEach((result) => {
            if (result.scan_id) {
                contents.push({
                    type: 'resource',
                    resource: ResourceHandler.createResourceReference(
                        'scan-result',
                        result.scan_id,
                        `Scan Result: ${result.status || 'unknown'}`,
                        result,
                    ),
                });
            }
        });

        return { content: contents };
    }

    /**
     * Get threat reports
     */
    private async getThreatReports(args: Record<string, unknown>): Promise<McpToolsCallResult> {
        const typedArgs = args as unknown as ToolsGetThreatReportsArgs;

        if (!Array.isArray(typedArgs.reportIds)) {
            throw new Error('reportIds must be an array');
        }

        const reportIds = typedArgs.reportIds.map(String);
        const reports = await this.airsClient.getThreatScanReports(reportIds);

        const contents: McpToolResultContent[] = [
            {
                type: 'text',
                text: `Retrieved ${reports.length} threat reports`,
            },
        ];

        // Add resource references for each report
        reports.forEach((report) => {
            if (report.report_id) {
                contents.push({
                    type: 'resource',
                    resource: ResourceHandler.createResourceReference(
                        'threat-report',
                        report.report_id,
                        `Threat Report: ${report.scan_id || 'unknown'}`,
                        report,
                    ),
                });
            }
        });

        return { content: contents };
    }

    /**
     * Clear cache
     */
    private clearCache(): McpToolsCallResult {
        this.airsClient.clearCache();

        return {
            content: [
                {
                    type: 'text',
                    text: 'Cache cleared successfully',
                },
            ],
        };
    }

    /**
     * Summarize threats from scan response
     */
    private summarizeThreats(result: ToolsScanResponseWithDetected): string {
        const threats: string[] = [];

        if (result.prompt_detected) {
            // Extract threats from prompt_detected fields
            if (result.prompt_detected.url_cats) threats.push('prompt_url_cats');
            if (result.prompt_detected.dlp) threats.push('prompt_dlp');
            if (result.prompt_detected.injection) threats.push('prompt_injection');
            if (result.prompt_detected.toxic_content) threats.push('prompt_toxic_content');
            if (result.prompt_detected.malicious_code) threats.push('prompt_malicious_code');
            if (result.prompt_detected.agent) threats.push('prompt_agent');
            if (result.prompt_detected.topic_violation) threats.push('prompt_topic_violation');
        }

        if (result.response_detected) {
            // Extract threats from response_detected fields
            if (result.response_detected.url_cats) threats.push('response_url_cats');
            if (result.response_detected.dlp) threats.push('response_dlp');
            if (result.response_detected.db_security) threats.push('response_db_security');
            if (result.response_detected.toxic_content) threats.push('response_toxic_content');
            if (result.response_detected.malicious_code) threats.push('response_malicious_code');
            if (result.response_detected.agent) threats.push('response_agent');
            if (result.response_detected.ungrounded) threats.push('response_ungrounded');
            if (result.response_detected.topic_violation) threats.push('response_topic_violation');
        }

        return threats.join(', ') || 'unknown threats';
    }

    /**
     * Create error result
     */
    private createErrorResult(error: unknown): McpToolsCallResult {
        let message = 'Unknown error occurred';

        if (error instanceof Error) {
            message = error.message;

            // Include status code for API errors
            if ('statusCode' in error && typeof error.statusCode === 'number') {
                message = `API Error (${error.statusCode}): ${message}`;
            }
        }

        this.logger.error('Tool execution failed', {
            error: message,
        });

        return {
            content: [
                {
                    type: 'text',
                    text: message,
                },
            ],
            isError: true,
        };
    }
}
