/**
 * MCP Resource handlers for Prisma AIRS data
 */

import { getLogger } from '../utils/logger.js';
import { getAIRSClient } from '../airs/factory.js';
import type { Logger } from 'winston';
import type {
  Resource,
  ResourcesListParams,
  ResourcesListResult,
  ResourcesReadParams,
  ResourcesReadResult,
  ResourceContent,
} from '../mcp/types.js';

export class ResourceHandler {
  private readonly logger: Logger;
  private readonly airsClient = getAIRSClient();

  // Resource URIs follow pattern: airs://{type}/{id}
  private static readonly RESOURCE_TYPES = {
    SCAN_RESULT: 'scan-results', // Changed to plural to match template
    THREAT_REPORT: 'threat-reports', // Changed to plural to match template
    CACHE_STATS: 'cache-stats',
    RATE_LIMIT_STATUS: 'rate-limit-status',
  } as const;

  constructor() {
    this.logger = getLogger();
  }

  /**
   * List available resources
   */
  listResources(params: ResourcesListParams): ResourcesListResult {
    this.logger.debug('Listing resources', { cursor: params?.cursor });

    const resources: Resource[] = [
      // Static resources for system status
      {
        uri: `airs://${ResourceHandler.RESOURCE_TYPES.CACHE_STATS}/current`,
        name: 'Cache Statistics',
        description: 'Current cache statistics and performance metrics',
        mimeType: 'application/json',
      },
      {
        uri: `airs://${ResourceHandler.RESOURCE_TYPES.RATE_LIMIT_STATUS}/current`,
        name: 'Rate Limit Status',
        description: 'Current rate limiting status and quotas',
        mimeType: 'application/json',
      },
    ];

    // Note: Dynamic resources like scan results and threat reports
    // are not listed here but can be accessed directly by URI
    // when returned from tool operations

    return {
      resources,
    };
  }

  /**
   * Read a specific resource
   */
  async readResource(params: ResourcesReadParams): Promise<ResourcesReadResult> {
    this.logger.debug('Reading resource', { uri: params.uri });

    const parsed = this.parseResourceUri(params.uri);

    if (!parsed) {
      throw new Error(`Invalid resource URI: ${params.uri}`);
    }

    const { type, id } = parsed;

    switch (type) {
      case ResourceHandler.RESOURCE_TYPES.SCAN_RESULT:
        return this.readScanResult(id);

      case ResourceHandler.RESOURCE_TYPES.THREAT_REPORT:
        return this.readThreatReport(id);

      case ResourceHandler.RESOURCE_TYPES.CACHE_STATS:
        return this.readCacheStats();

      case ResourceHandler.RESOURCE_TYPES.RATE_LIMIT_STATUS:
        return this.readRateLimitStatus();

      default:
        throw new Error(`Unknown resource type: ${type}`);
    }
  }

  /**
   * Parse a resource URI
   */
  private parseResourceUri(uri: string): { type: string; id: string } | null {
    const match = uri.match(/^airs:\/\/([^/]+)\/(.+)$/);

    if (!match) {
      return null;
    }

    return {
      type: match[1] || '',
      id: match[2] || '',
    };
  }

  /**
   * Read scan result by scan ID
   */
  private async readScanResult(scanId: string): Promise<ResourcesReadResult> {
    try {
      const results = await this.airsClient.getScanResults([scanId]);

      if (results.length === 0) {
        throw new Error(`Scan result not found: ${scanId}`);
      }

      const result = results[0];
      const content: ResourceContent = {
        uri: `airs://${ResourceHandler.RESOURCE_TYPES.SCAN_RESULT}/${scanId}`,
        mimeType: 'application/json',
      };

      if (result) {
        content.text = JSON.stringify(result, null, 2);
      }

      return { contents: [content] };
    } catch (error) {
      this.logger.error('Failed to read scan result', {
        scanId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Read threat report by report ID
   */
  private async readThreatReport(reportId: string): Promise<ResourcesReadResult> {
    try {
      const reports = await this.airsClient.getThreatScanReports([reportId]);

      if (reports.length === 0) {
        throw new Error(`Threat report not found: ${reportId}`);
      }

      const report = reports[0];
      const content: ResourceContent = {
        uri: `airs://${ResourceHandler.RESOURCE_TYPES.THREAT_REPORT}/${reportId}`,
        mimeType: 'application/json',
      };

      if (report) {
        content.text = JSON.stringify(report, null, 2);
      }

      return { contents: [content] };
    } catch (error) {
      this.logger.error('Failed to read threat report', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Read cache statistics
   */
  private readCacheStats(): ResourcesReadResult {
    const stats = this.airsClient.getCacheStats() || {
      size: 0,
      count: 0,
      enabled: false,
    };

    const content: ResourceContent = {
      uri: `airs://${ResourceHandler.RESOURCE_TYPES.CACHE_STATS}/current`,
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          ...stats,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    };

    return { contents: [content] };
  }

  /**
   * Read rate limit status
   */
  private readRateLimitStatus(): ResourcesReadResult {
    const stats = this.airsClient.getRateLimiterStats() || {
      bucketCount: 0,
      enabled: false,
    };

    const content: ResourceContent = {
      uri: `airs://${ResourceHandler.RESOURCE_TYPES.RATE_LIMIT_STATUS}/current`,
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          ...stats,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    };

    return { contents: [content] };
  }

  /**
   * Create a resource reference for inclusion in tool results
   */
  static createResourceReference(
    type: string,
    id: string,
    _title: string,
    data?: unknown,
  ): ResourceContent {
    const uri = `airs://${type}/${id}`;

    return {
      uri,
      mimeType: 'application/json',
      text: data ? JSON.stringify(data, null, 2) : undefined,
    };
  }
}
