/**
 * MCP Prompt handlers for Prisma AIRS workflows
 */

import { getLogger } from '../utils/logger.js';
import type { Logger } from 'winston';
import type {
    Prompt,
    PromptsListParams,
    PromptsListResult,
    PromptsGetParams,
    PromptsGetResult,
    PromptMessage,
} from '../mcp/types.js';

export class PromptHandler {
    private readonly logger: Logger;

    // Prompt names
    private static readonly PROMPTS = {
        SECURITY_ANALYSIS: 'security_analysis',
        THREAT_INVESTIGATION: 'threat_investigation',
        COMPLIANCE_CHECK: 'compliance_check',
        INCIDENT_RESPONSE: 'incident_response',
    } as const;

    constructor() {
        this.logger = getLogger();
    }

    /**
     * List available prompts
     */
    listPrompts(params: PromptsListParams): PromptsListResult {
        this.logger.debug('Listing prompts', { cursor: params?.cursor });

        const prompts: Prompt[] = [
            {
                name: PromptHandler.PROMPTS.SECURITY_ANALYSIS,
                title: 'Security Analysis Workflow',
                description: 'Analyze content for security threats and provide recommendations',
                arguments: [
                    {
                        name: 'content',
                        description: 'The content to analyze (prompt, response, or both)',
                        required: true,
                    },
                    {
                        name: 'context',
                        description: 'Additional context about the content source',
                        required: false,
                    },
                    {
                        name: 'severity_threshold',
                        description: 'Minimum severity level to report (low, medium, high)',
                        required: false,
                    },
                ],
            },
            {
                name: PromptHandler.PROMPTS.THREAT_INVESTIGATION,
                title: 'Threat Investigation Workflow',
                description: 'Investigate detected threats and provide detailed analysis',
                arguments: [
                    {
                        name: 'scan_id',
                        description: 'The scan ID to investigate',
                        required: true,
                    },
                    {
                        name: 'focus_area',
                        description:
                            'Specific threat type to focus on (e.g., injection, dlp, toxic_content)',
                        required: false,
                    },
                ],
            },
            {
                name: PromptHandler.PROMPTS.COMPLIANCE_CHECK,
                title: 'Compliance Check Workflow',
                description: 'Check content against compliance policies and regulations',
                arguments: [
                    {
                        name: 'content',
                        description: 'The content to check for compliance',
                        required: true,
                    },
                    {
                        name: 'regulations',
                        description:
                            'Comma-separated list of regulations to check (e.g., GDPR, HIPAA, PCI)',
                        required: false,
                    },
                    {
                        name: 'profile_name',
                        description: 'Security profile to use for compliance checking',
                        required: false,
                    },
                ],
            },
            {
                name: PromptHandler.PROMPTS.INCIDENT_RESPONSE,
                title: 'Incident Response Workflow',
                description: 'Guide through incident response for detected security issues',
                arguments: [
                    {
                        name: 'incident_type',
                        description:
                            'Type of incident (e.g., data_leak, injection_attempt, malicious_code)',
                        required: true,
                    },
                    {
                        name: 'report_id',
                        description: 'Threat report ID if available',
                        required: false,
                    },
                    {
                        name: 'urgency',
                        description: 'Incident urgency level (low, medium, high, critical)',
                        required: false,
                    },
                ],
            },
        ];

        return { prompts };
    }

    /**
     * Get a specific prompt
     */
    getPrompt(params: PromptsGetParams): PromptsGetResult {
        this.logger.debug('Getting prompt', {
            name: params.name,
            hasArguments: !!params.arguments,
        });

        const args = params.arguments || {};

        switch (params.name) {
            case PromptHandler.PROMPTS.SECURITY_ANALYSIS:
                return this.getSecurityAnalysisPrompt(args);

            case PromptHandler.PROMPTS.THREAT_INVESTIGATION:
                return this.getThreatInvestigationPrompt(args);

            case PromptHandler.PROMPTS.COMPLIANCE_CHECK:
                return this.getComplianceCheckPrompt(args);

            case PromptHandler.PROMPTS.INCIDENT_RESPONSE:
                return this.getIncidentResponsePrompt(args);

            default:
                throw new Error(`Unknown prompt: ${params.name}`);
        }
    }

    /**
     * Get security analysis prompt
     */
    private getSecurityAnalysisPrompt(args: Record<string, string>): PromptsGetResult {
        const content = args.content || '[No content provided]';
        const context = args.context || 'No additional context';
        const threshold = args.severity_threshold || 'low';

        const messages: PromptMessage[] = [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Please perform a comprehensive security analysis of the following content using Prisma AIRS.

**Content to Analyze:**
${content}

**Context:**
${context}

**Requirements:**
1. Use the airs_scan_content tool to analyze the content
2. Report all threats with severity ${threshold} or higher
3. Provide specific examples from the content for each threat found
4. Suggest remediation steps for each identified issue
5. Give an overall security assessment and risk score

Please structure your response with:
- Executive Summary
- Detailed Findings
- Risk Assessment
- Recommendations`,
                },
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `I'll perform a comprehensive security analysis of the provided content using Prisma AIRS. Let me start by scanning the content for potential threats.`,
                },
            },
        ];

        return { messages };
    }

    /**
     * Get threat investigation prompt
     */
    private getThreatInvestigationPrompt(args: Record<string, string>): PromptsGetResult {
        const scanId = args.scan_id || '[No scan ID provided]';
        const focusArea = args.focus_area;

        const messages: PromptMessage[] = [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Please investigate the security scan with ID: ${scanId}

${focusArea ? `Focus specifically on threats related to: ${focusArea}` : 'Investigate all detected threats'}

**Investigation Steps:**
1. Use airs_get_scan_results to retrieve the scan details
2. If a report ID is available, use airs_get_threat_reports for detailed analysis
3. Analyze each detected threat:
   - Threat type and severity
   - Potential impact
   - Attack vectors
   - False positive assessment
4. Provide timeline and correlation analysis
5. Recommend immediate actions and long-term mitigations

Format your investigation as a professional security report.`,
                },
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `I'll investigate the security scan ${scanId} and provide a detailed threat analysis. Let me start by retrieving the scan results.`,
                },
            },
        ];

        return { messages };
    }

    /**
     * Get compliance check prompt
     */
    private getComplianceCheckPrompt(args: Record<string, string>): PromptsGetResult {
        const content = args.content || '[No content provided]';
        const regulations = args.regulations || 'GDPR, HIPAA, PCI-DSS';
        const profileName = args.profile_name;

        const messages: PromptMessage[] = [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Please perform a compliance check on the following content against ${regulations} regulations.

**Content to Check:**
${content}

${profileName ? `**Use Security Profile:** ${profileName}` : ''}

**Compliance Analysis Required:**
1. Use airs_scan_content to identify any data that might violate regulations
2. Check for:
   - Personal Identifiable Information (PII)
   - Protected Health Information (PHI)
   - Payment Card Information (PCI)
   - Sensitive personal data categories
3. Map findings to specific regulatory requirements
4. Assess the compliance risk level
5. Provide remediation guidance

Structure your response as:
- Compliance Summary
- Detailed Findings by Regulation
- Risk Matrix
- Remediation Plan
- Compliance Checklist`,
                },
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `I'll perform a comprehensive compliance check of the content against ${regulations} regulations. Let me start by scanning for sensitive data and potential compliance violations.`,
                },
            },
        ];

        return { messages };
    }

    /**
     * Get incident response prompt
     */
    private getIncidentResponsePrompt(args: Record<string, string>): PromptsGetResult {
        const incidentType = args.incident_type || 'unknown';
        const reportId = args.report_id;
        const urgency = args.urgency || 'medium';

        const messages: PromptMessage[] = [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `SECURITY INCIDENT RESPONSE REQUIRED

**Incident Type:** ${incidentType}
**Urgency Level:** ${urgency}
${reportId ? `**Related Report ID:** ${reportId}` : ''}

Please guide me through the incident response process:

1. **Immediate Actions** (0-15 minutes):
   - Containment steps
   - Evidence preservation
   - Initial assessment

2. **Investigation** (15-60 minutes):
   ${reportId ? '- Use airs_get_threat_reports to analyze the incident' : '- Determine scope and impact'}
   - Identify affected systems/data
   - Determine attack vector

3. **Mitigation** (1-4 hours):
   - Stop the threat
   - Patch vulnerabilities
   - Update security controls

4. **Recovery** (4-24 hours):
   - Restore normal operations
   - Verify security posture
   - Monitor for recurrence

5. **Lessons Learned**:
   - Root cause analysis
   - Process improvements
   - Documentation updates

Provide step-by-step guidance with specific commands and checks.`,
                },
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `I'll guide you through the incident response for this ${urgency} priority ${incidentType} incident. Let's start with immediate containment actions.

**IMMEDIATE ACTIONS REQUIRED:**`,
                },
            },
        ];

        return { messages };
    }
}
