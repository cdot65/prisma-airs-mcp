/**
 * Factory for creating configured Prisma AIRS client instances
 */

import { getConfig } from '../config';
import { EnhancedPrismaAirsClient } from './index';
import { getLogger } from '../utils/logger';
import type { Logger } from 'winston';

let clientInstance: EnhancedPrismaAirsClient | null = null;
const logger: Logger = getLogger();

/**
 * Create or get the singleton AIRS client instance
 */
export function getAirsClient(): EnhancedPrismaAirsClient {
    if (!clientInstance) {
        const config = getConfig();

        clientInstance = new EnhancedPrismaAirsClient({
            apiUrl: config.airs.apiUrl,
            apiKey: config.airs.apiKey,
            timeout: config.airs.timeout,
            maxRetries: config.airs.retryAttempts,
            retryDelay: config.airs.retryDelay,
            cache: config.cache.enabled
                ? {
                      ttlSeconds: config.cache.ttlSeconds,
                      maxSize: config.cache.maxSize,
                      enabled: config.cache.enabled,
                  }
                : undefined,
            rateLimiter: config.rateLimit.enabled
                ? {
                      maxRequests: config.rateLimit.maxRequests,
                      windowMs: config.rateLimit.windowMs,
                      enabled: config.rateLimit.enabled,
                  }
                : undefined,
        });

        logger.info('AIRS client instance created', {
            apiUrl: config.airs.apiUrl,
            cacheEnabled: config.cache.enabled,
            rateLimiterEnabled: config.rateLimit.enabled,
        });
    }

    return clientInstance;
}

/**
 * Reset the client instance completely, clearing cache, rate limits, and destroying the singleton.
 * 
 * This function is primarily intended for testing scenarios where you need to:
 * - Reset the client to a clean state between tests
 * - Force recreation of the client with new configuration
 * - Clear all cached data and rate limit states
 * 
 * Note: This is more aggressive than the `airs_clear_cache` tool which only clears the cache.
 * This function destroys the entire client instance, forcing it to be recreated on next use.
 * 
 * @example
 * ```typescript
 * // In test setup/teardown
 * afterEach(() => {
 *   resetAirsClient();
 * });
 * ```
 */
export function resetAirsClient(): void {
    if (clientInstance) {
        clientInstance.clearCache();
        clientInstance.resetRateLimits();
        clientInstance = null;

        logger.info('AIRS client instance reset');
    }
}
