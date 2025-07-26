/**
 * Enhanced Prisma AIRS client with caching and rate limiting
 */

import { PrismaAIRSClient } from './client.js';
import { AIRSCache, type CacheConfig } from './cache.js';
import { AIRSRateLimiter, type RateLimiterConfig } from './rate-limiter.js';
import { getLogger } from '../utils/logger.js';
import type { Logger } from 'winston';
import type {
    AIRSClientConfig,
    AIRSRequestOptions,
    ScanRequest,
    ScanResponse,
    AsyncScanObject,
    AsyncScanResponse,
    ScanIdResult,
    ThreatScanReportObject,
} from './types.js';

export interface EnhancedAIRSClientConfig extends AIRSClientConfig {
    cache?: CacheConfig;
    rateLimiter?: RateLimiterConfig;
}

export class EnhancedPrismaAIRSClient {
    private readonly client: PrismaAIRSClient;
    private readonly cache?: AIRSCache;
    private readonly rateLimiter?: AIRSRateLimiter;
    private readonly logger: Logger;

    constructor(config: EnhancedAIRSClientConfig) {
        this.logger = getLogger();
        this.client = new PrismaAIRSClient(config);

        // Initialize cache if configured
        if (config.cache) {
            this.cache = new AIRSCache(config.cache);
        }

        // Initialize rate limiter if configured
        if (config.rateLimiter) {
            this.rateLimiter = new AIRSRateLimiter(config.rateLimiter);
        }

        this.logger.info('Enhanced Prisma AIRS client initialized', {
            cacheEnabled: !!config.cache,
            rateLimiterEnabled: !!config.rateLimiter,
        });
    }

    /**
     * Send a synchronous scan request with caching and rate limiting
     */
    async scanSync(request: ScanRequest, options?: AIRSRequestOptions): Promise<ScanResponse> {
        // Check rate limit
        if (this.rateLimiter) {
            await this.rateLimiter.waitForLimit('scan');
        }

        // Check cache
        const cacheKey = AIRSCache.generateScanKey('sync', request);

        if (this.cache) {
            const cached = this.cache.get<ScanResponse>(cacheKey);

            if (cached) {
                this.logger.debug('Returning cached scan result', { cacheKey });
                return cached;
            }
        }

        // Make request
        const response = await this.client.scanSync(request, options);

        // Cache successful response
        if (this.cache && response) {
            this.cache.set(cacheKey, response);
        }

        return response;
    }

    /**
     * Send an asynchronous scan request with rate limiting
     */
    async scanAsync(
        requests: AsyncScanObject[],
        options?: AIRSRequestOptions,
    ): Promise<AsyncScanResponse> {
        // Check rate limit
        if (this.rateLimiter) {
            await this.rateLimiter.waitForLimit('scan');
        }

        // Async scans are not cached as they return scan IDs for polling
        return this.client.scanAsync(requests, options);
    }

    /**
     * Get scan results by scan IDs with caching and rate limiting
     */
    async getScanResults(scanIds: string[], options?: AIRSRequestOptions): Promise<ScanIdResult[]> {
        // Check rate limit
        if (this.rateLimiter) {
            await this.rateLimiter.waitForLimit('results');
        }

        // Check cache
        const cacheKey = AIRSCache.generateResultKey('scan-results', scanIds);

        if (this.cache) {
            const cached = this.cache.get<ScanIdResult[]>(cacheKey);

            if (cached) {
                this.logger.debug('Returning cached scan results', { cacheKey });
                return cached;
            }
        }

        // Make request
        const results = await this.client.getScanResults(scanIds, options);

        // Cache successful response if all results are complete
        if (this.cache && results) {
            const allComplete = results.every((r) => r.status === 'complete');

            if (allComplete) {
                this.cache.set(cacheKey, results);
            }
        }

        return results;
    }

    /**
     * Get threat scan reports by report IDs with caching and rate limiting
     */
    async getThreatScanReports(
        reportIds: string[],
        options?: AIRSRequestOptions,
    ): Promise<ThreatScanReportObject[]> {
        // Check rate limit
        if (this.rateLimiter) {
            await this.rateLimiter.waitForLimit('reports');
        }

        // Check cache
        const cacheKey = AIRSCache.generateResultKey('threat-reports', reportIds);

        if (this.cache) {
            const cached = this.cache.get<ThreatScanReportObject[]>(cacheKey);

            if (cached) {
                this.logger.debug('Returning cached threat reports', { cacheKey });
                return cached;
            }
        }

        // Make request
        const reports = await this.client.getThreatScanReports(reportIds, options);

        // Cache successful response
        if (this.cache && reports) {
            this.cache.set(cacheKey, reports);
        }

        return reports;
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): ReturnType<AIRSCache['getStats']> | null {
        return this.cache?.getStats() || null;
    }

    /**
     * Get rate limiter statistics
     */
    getRateLimiterStats(): ReturnType<AIRSRateLimiter['getStats']> | null {
        return this.rateLimiter?.getStats() || null;
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache?.clear();
    }

    /**
     * Reset rate limits
     */
    resetRateLimits(): void {
        this.rateLimiter?.clear();
    }
}

// Re-export types for convenience
export * from './types.js';
export { AIRSAPIError } from './client.js';
