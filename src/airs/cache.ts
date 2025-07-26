/**
 * Cache implementation for Prisma AIRS API responses
 * Implements TTL-based caching with size limits
 */

import { getLogger } from '../utils/logger.js';
import type { Logger } from 'winston';

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    size: number;
}

export interface CacheConfig {
    ttlSeconds: number;
    maxSize: number;
    enabled?: boolean;
}

export class AIRSCache {
    private readonly cache = new Map<string, CacheEntry<unknown>>();
    private readonly logger: Logger;
    private currentSize = 0;

    constructor(private readonly config: CacheConfig) {
        this.logger = getLogger();

        if (this.config.enabled !== false) {
            // Start periodic cleanup
            this.startCleanup();
        }

        this.logger.info('AIRS cache initialized', {
            ttlSeconds: config.ttlSeconds,
            maxSize: config.maxSize,
            enabled: config.enabled !== false,
        });
    }

    /**
     * Get an item from the cache
     */
    get<T>(key: string): T | undefined {
        if (this.config.enabled === false) {
            return undefined;
        }

        const entry = this.cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) {
            return undefined;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.delete(key);
            return undefined;
        }

        this.logger.debug('Cache hit', { key });
        return entry.data;
    }

    /**
     * Set an item in the cache
     */
    set<T>(key: string, data: T, ttlOverride?: number): void {
        if (this.config.enabled === false) {
            return;
        }

        const size = this.estimateSize(data);
        const ttl = ttlOverride || this.config.ttlSeconds;
        const expiresAt = Date.now() + ttl * 1000;

        // Check if we need to make room
        if (this.currentSize + size > this.config.maxSize) {
            this.evictOldest();
        }

        // Remove old entry if exists
        if (this.cache.has(key)) {
            this.delete(key);
        }

        // Add new entry
        this.cache.set(key, {
            data,
            expiresAt,
            size,
        });

        this.currentSize += size;

        this.logger.debug('Cache set', {
            key,
            size,
            expiresAt: new Date(expiresAt).toISOString(),
        });
    }

    /**
     * Delete an item from the cache
     */
    delete(key: string): boolean {
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        this.cache.delete(key);
        this.currentSize -= entry.size;

        this.logger.debug('Cache delete', { key });
        return true;
    }

    /**
     * Clear all items from the cache
     */
    clear(): void {
        this.cache.clear();
        this.currentSize = 0;

        this.logger.debug('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        count: number;
        enabled: boolean;
    } {
        return {
            size: this.currentSize,
            count: this.cache.size,
            enabled: this.config.enabled !== false,
        };
    }

    /**
     * Generate cache key for scan requests
     */
    static generateScanKey(method: string, data: unknown): string {
        const hash = this.simpleHash(JSON.stringify(data));
        return `scan:${method}:${hash}`;
    }

    /**
     * Generate cache key for result requests
     */
    static generateResultKey(type: string, ids: string[]): string {
        return `${type}:${ids.sort().join(',')}`;
    }

    /**
     * Estimate the size of data in bytes
     */
    private estimateSize(data: unknown): number {
        try {
            return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
        } catch {
            return 1000; // Default size if serialization fails
        }
    }

    /**
     * Evict oldest entries until we have enough space
     */
    private evictOldest(): void {
        const sortedEntries = Array.from(this.cache.entries()).sort(
            ([, a], [, b]) => a.expiresAt - b.expiresAt,
        );

        for (const [key] of sortedEntries) {
            if (this.currentSize <= this.config.maxSize * 0.9) {
                break;
            }

            this.delete(key);
        }
    }

    /**
     * Remove expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let removedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            this.logger.debug('Cache cleanup completed', { removedCount });
        }
    }

    /**
     * Start periodic cleanup
     */
    private startCleanup(): void {
        const intervalMs = Math.min(this.config.ttlSeconds * 1000, 60000); // Max 1 minute

        setInterval(() => {
            this.cleanup();
        }, intervalMs);
    }

    /**
     * Simple hash function for cache keys
     */
    private static simpleHash(str: string): string {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash).toString(36);
    }
}
