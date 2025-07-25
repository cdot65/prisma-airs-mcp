/**
 * Prisma AIRS API Client
 * Implements REST API integration with authentication, retry logic, and error handling
 */

import { getLogger } from '../utils/logger.js';
import type { Logger } from 'winston';
import {
  type AIRSClientConfig,
  type AIRSRequestOptions,
  type ScanRequest,
  type ScanResponse,
  type AsyncScanObject,
  type AsyncScanResponse,
  type ScanIdResult,
  type ThreatScanReportObject,
  type AIRSErrorResponse,
  AIRSErrorCode,
  AIRS_API_VERSION,
  AIRS_CONTENT_TYPE,
  AIRS_AUTH_HEADER,
  AIRS_MAX_SCAN_IDS,
  AIRS_MAX_REPORT_IDS,
} from './types.js';

export class AIRSAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number, // Exposed for error handling by consumers
    public response?: AIRSErrorResponse,
  ) {
    super(message);
    this.name = 'AIRSAPIError';
  }
}

export class PrismaAIRSClient {
  private readonly logger: Logger;
  private readonly config: Required<AIRSClientConfig>;
  private readonly baseUrl: string;

  constructor(config: AIRSClientConfig) {
    this.logger = getLogger();
    this.config = {
      timeout: 30000, // 30 seconds default
      maxRetries: 3,
      retryDelay: 1000, // 1 second initial delay
      ...config,
    };

    // Ensure API URL ends without trailing slash
    this.baseUrl = `${this.config.apiUrl.replace(/\/$/, '')}/${AIRS_API_VERSION}`;

    this.logger.info('Prisma AIRS client initialized', {
      baseUrl: this.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  /**
   * Send a synchronous scan request
   */
  async scanSync(request: ScanRequest, options?: AIRSRequestOptions): Promise<ScanResponse> {
    return this.makeRequest<ScanResponse>('POST', '/scan/sync/request', request, options);
  }

  /**
   * Send an asynchronous scan request
   */
  async scanAsync(
    requests: AsyncScanObject[],
    options?: AIRSRequestOptions,
  ): Promise<AsyncScanResponse> {
    return this.makeRequest<AsyncScanResponse>('POST', '/scan/async/request', requests, options);
  }

  /**
   * Get scan results by scan IDs
   */
  async getScanResults(scanIds: string[], options?: AIRSRequestOptions): Promise<ScanIdResult[]> {
    if (scanIds.length === 0) {
      throw new AIRSAPIError('No scan IDs provided', AIRSErrorCode.BadRequest);
    }

    if (scanIds.length > AIRS_MAX_SCAN_IDS) {
      throw new AIRSAPIError(
        `Too many scan IDs: maximum ${AIRS_MAX_SCAN_IDS} allowed`,
        AIRSErrorCode.BadRequest,
      );
    }

    const params = new URLSearchParams();
    params.append('scan_ids', scanIds.join(','));

    return this.makeRequest<ScanIdResult[]>(
      'GET',
      `/scan/results?${params.toString()}`,
      undefined,
      options,
    );
  }

  /**
   * Get threat scan reports by report IDs
   */
  async getThreatScanReports(
    reportIds: string[],
    options?: AIRSRequestOptions,
  ): Promise<ThreatScanReportObject[]> {
    if (reportIds.length === 0) {
      throw new AIRSAPIError('No report IDs provided', AIRSErrorCode.BadRequest);
    }

    if (reportIds.length > AIRS_MAX_REPORT_IDS) {
      throw new AIRSAPIError(
        `Too many report IDs: maximum ${AIRS_MAX_REPORT_IDS} allowed`,
        AIRSErrorCode.BadRequest,
      );
    }

    const params = new URLSearchParams();
    params.append('report_ids', reportIds.join(','));

    return this.makeRequest<ThreatScanReportObject[]>(
      'GET',
      `/scan/reports?${params.toString()}`,
      undefined,
      options,
    );
  }

  /**
   * Make an HTTP request with retry logic and error handling
   */
  private async makeRequest<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: AIRSRequestOptions,
    retryCount = 0,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      [AIRS_AUTH_HEADER]: this.config.apiKey,
      'Content-Type': AIRS_CONTENT_TYPE,
      Accept: AIRS_CONTENT_TYPE,
      ...options?.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      this.logger.debug('Making AIRS API request', {
        method,
        url,
        retryCount,
      });

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: options?.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      // Parse response
      const responseData = this.parseResponse(responseText, url, response.status);

      if (!response.ok) {
        const errorResponse = responseData as AIRSErrorResponse;

        // Handle rate limiting with retry
        if (
          response.status === Number(AIRSErrorCode.TooManyRequests) &&
          retryCount < this.config.maxRetries
        ) {
          const retryAfter = errorResponse.error?.retry_after;
          const delay = retryAfter
            ? this.calculateRetryDelay(retryAfter)
            : this.config.retryDelay * Math.pow(2, retryCount);

          this.logger.warn('Rate limited, retrying after delay', {
            url,
            retryCount,
            delay,
          });

          await this.sleep(delay);
          return this.makeRequest<T>(method, path, body, options, retryCount + 1);
        }

        // Handle other errors
        this.handleAPIError(errorResponse, response.status, url);
      }

      this.logger.debug('AIRS API request successful', {
        url,
        status: response.status,
      });

      return responseData as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout and network errors with retry
      if (
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof TypeError && error.message.includes('fetch'))
      ) {
        if (retryCount < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, retryCount);

          this.logger.warn('Request failed, retrying', {
            url,
            retryCount,
            delay,
            error: error.message,
          });

          await this.sleep(delay);
          return this.makeRequest<T>(method, path, body, options, retryCount + 1);
        }
      }

      // Re-throw AIRSAPIError as-is
      if (error instanceof AIRSAPIError) {
        throw error;
      }

      // Wrap other errors
      this.logger.error('Unexpected error during API request', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new AIRSAPIError(error instanceof Error ? error.message : 'Unknown error', 0);
    }
  }

  /**
   * Calculate retry delay from retry_after response
   */
  private calculateRetryDelay(retryAfter: { interval: number; unit: string }): number {
    const { interval, unit } = retryAfter;

    switch (unit.toLowerCase()) {
      case 'second':
      case 'seconds':
        return interval * 1000;
      case 'minute':
      case 'minutes':
        return interval * 60 * 1000;
      default:
        return this.config.retryDelay;
    }
  }

  /**
   * Sleep for the specified duration
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse response text to JSON
   */
  private parseResponse(responseText: string, url: string, status: number): unknown {
    try {
      return responseText ? JSON.parse(responseText) : {};
    } catch {
      this.logger.error('Failed to parse API response', {
        url,
        status,
        responseText,
      });
      throw new AIRSAPIError('Invalid JSON response from API', status);
    }
  }

  /**
   * Handle API error responses
   */
  private handleAPIError(errorResponse: AIRSErrorResponse, status: number, url: string): never {
    const errorMessage = errorResponse.error?.message || `HTTP ${status} error`;
    this.logger.error('AIRS API error', {
      url,
      status,
      error: errorMessage,
    });
    throw new AIRSAPIError(errorMessage, status, errorResponse);
  }
}
