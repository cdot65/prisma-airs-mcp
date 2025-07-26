/**
 * Enhanced Prisma AIRS Client Module
 *
 * This module provides an enhanced wrapper around the base Prisma AIRS API client,
 * adding critical production features:
 *
 * 1. **Caching**: Reduces API calls by storing responses with configurable TTL
 * 2. **Rate Limiting**: Prevents API quota exhaustion with token bucket algorithm
 * 3. **Unified Interface**: Single entry point for all AIRS API operations
 * 4. **Performance Optimization**: Automatic cache hit detection for repeated requests
 *
 * The enhanced client orchestrates the base client, cache, and rate limiter to provide
 * a robust, production-ready interface for interacting with the Prisma AIRS API.
 *
 * @example
 * ```typescript
 * import { EnhancedPrismaAirsClient } from './airs';
 *
 * const client = new EnhancedPrismaAirsClient({
 *   apiUrl: 'https://api.airs.example.com',
 *   apiKey: 'your-api-key',
 *   cache: { ttlSeconds: 300, maxSize: 1000, enabled: true },
 *   rateLimiter: { maxRequests: 100, windowMs: 60000, enabled: true }
 * });
 *
 * // All requests automatically benefit from caching and rate limiting
 * const result = await client.scanSync(request);
 * ```
 */

import { PrismaAirsClient } from './client';
import { PrismaAirsCache } from './cache';
import { PrismaAirsRateLimiter } from './rate-limiter';
import { getLogger } from '../utils/logger';
import type { Logger } from 'winston';
import type {
    AirsAsyncScanObject,
    AirsAsyncScanResponse,
    AirsEnhancedClientConfig,
    AirsRequestOptions,
    AirsScanIdResult,
    AirsScanRequest,
    AirsScanResponse,
    AirsThreatScanReportObject,
} from '../types';

export class EnhancedPrismaAirsClient {
    private readonly client: PrismaAirsClient;
    private readonly cache?: PrismaAirsCache;
    private readonly rateLimiter?: PrismaAirsRateLimiter;
    private readonly logger: Logger;

    constructor(config: AirsEnhancedClientConfig) {
        this.logger = getLogger();
        this.client = new PrismaAirsClient(config);

        // Initialize cache if configured
        if (config.cache) {
            this.cache = new PrismaAirsCache(config.cache);
        }

        // Initialize rate limiter if configured
        if (config.rateLimiter) {
            this.rateLimiter = new PrismaAirsRateLimiter(config.rateLimiter);
        }

        this.logger.info('Enhanced Prisma AIRS client initialized', {
            cacheEnabled: !!config.cache,
            rateLimiterEnabled: !!config.rateLimiter,
        });
    }

    /**
     * Send a synchronous scan request with caching and rate limiting
     */
    async scanSync(
        request: AirsScanRequest,
        options?: AirsRequestOptions,
    ): Promise<AirsScanResponse> {
        // Check rate limit
        if (this.rateLimiter) {
            await this.rateLimiter.waitForLimit('scan');
        }

        // Check cache
        const cacheKey = PrismaAirsCache.generateScanKey('sync', request);

        if (this.cache) {
            const cached = this.cache.get<AirsScanResponse>(cacheKey);

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
        requests: AirsAsyncScanObject[],
        options?: AirsRequestOptions,
    ): Promise<AirsAsyncScanResponse> {
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
    async getScanResults(
        scanIds: string[],
        options?: AirsRequestOptions,
    ): Promise<AirsScanIdResult[]> {
        // Check rate limit
        if (this.rateLimiter) {
            await this.rateLimiter.waitForLimit('results');
        }

        // Check cache
        const cacheKey = PrismaAirsCache.generateResultKey('scan-results', scanIds);

        if (this.cache) {
            const cached = this.cache.get<AirsScanIdResult[]>(cacheKey);

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
        options?: AirsRequestOptions,
    ): Promise<AirsThreatScanReportObject[]> {
        // Check rate limit
        if (this.rateLimiter) {
            await this.rateLimiter.waitForLimit('reports');
        }

        // Check cache
        const cacheKey = PrismaAirsCache.generateResultKey('threat-reports', reportIds);

        if (this.cache) {
            const cached = this.cache.get<AirsThreatScanReportObject[]>(cacheKey);

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
    getCacheStats(): ReturnType<PrismaAirsCache['getStats']> | null {
        return this.cache?.getStats() || null;
    }

    /**
     * Get rate limiter statistics
     */
    getRateLimiterStats(): ReturnType<PrismaAirsRateLimiter['getStats']> | null {
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

// Re-export error class for convenience
export { PrismaAirsApiError } from './client.js';
