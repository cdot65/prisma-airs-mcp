/**
 * Rate limiter for Prisma AIRS API requests
 * Implements token bucket algorithm with configurable limits
 */

import { getLogger } from '../utils/logger.js';
import type { Logger } from 'winston';
import type { AirsRateLimiterConfig } from '../types';

interface TokenBucket {
    tokens: number;
    lastRefill: number;
}

export class AIRSRateLimiter {
    private readonly logger: Logger;
    private readonly buckets = new Map<string, TokenBucket>();

    constructor(private readonly config: AirsRateLimiterConfig) {
        this.logger = getLogger();

        this.logger.info('AIRS rate limiter initialized', {
            maxRequests: config.maxRequests,
            windowMs: config.windowMs,
            enabled: config.enabled !== false,
        });

        // Periodic cleanup of old buckets
        if (config.enabled !== false) {
            this.startCleanup();
        }
    }

    /**
     * Check if a request is allowed and consume a token if so
     */
    checkLimit(key: string = 'default'): boolean {
        if (this.config.enabled === false) {
            return true;
        }

        const now = Date.now();
        let bucket = this.buckets.get(key);

        if (!bucket) {
            bucket = {
                tokens: this.config.maxRequests,
                lastRefill: now,
            };
            this.buckets.set(key, bucket);
        }

        // Refill tokens based on time elapsed
        const elapsed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor(elapsed / this.config.windowMs) * this.config.maxRequests;

        if (tokensToAdd > 0) {
            bucket.tokens = Math.min(this.config.maxRequests, bucket.tokens + tokensToAdd);
            bucket.lastRefill = now;
        }

        // Check if we have tokens available
        if (bucket.tokens > 0) {
            bucket.tokens--;

            this.logger.debug('Rate limit check passed', {
                key,
                remainingTokens: bucket.tokens,
            });

            return true;
        }

        this.logger.warn('Rate limit exceeded', {
            key,
            nextRefill: new Date(bucket.lastRefill + this.config.windowMs).toISOString(),
        });

        return false;
    }

    /**
     * Wait until a request is allowed
     */
    async waitForLimit(key: string = 'default'): Promise<void> {
        if (this.config.enabled === false) {
            return;
        }

        while (!this.checkLimit(key)) {
            const bucket = this.buckets.get(key);

            if (!bucket) {
                return;
            }

            const waitTime = this.config.windowMs - (Date.now() - bucket.lastRefill);

            this.logger.debug('Waiting for rate limit', {
                key,
                waitTimeMs: waitTime,
            });

            await this.sleep(Math.min(waitTime, 1000));
        }
    }

    /**
     * Get current rate limit status
     */
    getStatus(key: string = 'default'): {
        available: number;
        limit: number;
        resetAt: Date;
    } | null {
        const bucket = this.buckets.get(key);

        if (!bucket) {
            return {
                available: this.config.maxRequests,
                limit: this.config.maxRequests,
                resetAt: new Date(Date.now() + this.config.windowMs),
            };
        }

        return {
            available: bucket.tokens,
            limit: this.config.maxRequests,
            resetAt: new Date(bucket.lastRefill + this.config.windowMs),
        };
    }

    /**
     * Reset rate limit for a specific key
     */
    reset(key: string = 'default'): void {
        this.buckets.delete(key);

        this.logger.debug('Rate limit reset', { key });
    }

    /**
     * Clear all rate limits
     */
    clear(): void {
        this.buckets.clear();

        this.logger.debug('All rate limits cleared');
    }

    /**
     * Get rate limiter statistics
     */
    getStats(): {
        bucketCount: number;
        enabled: boolean;
    } {
        return {
            bucketCount: this.buckets.size,
            enabled: this.config.enabled !== false,
        };
    }

    /**
     * Sleep for the specified duration
     */
    private async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Start periodic cleanup of old buckets
     */
    private startCleanup(): void {
        // Clean up buckets that haven't been used in 2x the window time
        const cleanupInterval = Math.max(this.config.windowMs * 2, 60000);

        setInterval(() => {
            const cutoff = Date.now() - cleanupInterval;
            let removedCount = 0;

            for (const [key, bucket] of this.buckets.entries()) {
                if (bucket.lastRefill < cutoff) {
                    this.buckets.delete(key);
                    removedCount++;
                }
            }

            if (removedCount > 0) {
                this.logger.debug('Rate limiter cleanup completed', { removedCount });
            }
        }, cleanupInterval);
    }
}
