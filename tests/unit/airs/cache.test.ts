import { describe, it, expect, beforeEach } from '@jest/globals';
import { PrismaAirsCache } from '../../../src/airs/cache';
import type { AirsCacheConfig } from '../../../src/types';

describe('PrismaAirsCache', () => {
    let cache: PrismaAirsCache;
    const config: AirsCacheConfig = {
        ttlSeconds: 300,
        maxSize: 1000,
        enabled: true,
    };

    beforeEach(() => {
        cache = new PrismaAirsCache(config);
    });

    describe('generateScanKey', () => {
        it('should generate same key for identical content regardless of tr_id', () => {
            const request1 = {
                tr_id: '123456789',
                ai_profile: { profile_name: 'Prisma AIRS' },
                contents: [{ prompt: 'test content' }],
            };

            const request2 = {
                tr_id: '987654321', // Different tr_id
                ai_profile: { profile_name: 'Prisma AIRS' },
                contents: [{ prompt: 'test content' }],
            };

            const key1 = PrismaAirsCache.generateScanKey('sync', request1);
            const key2 = PrismaAirsCache.generateScanKey('sync', request2);

            expect(key1).toBe(key2);
        });

        it('should generate different keys for different content', () => {
            const request1 = {
                tr_id: '123456789',
                ai_profile: { profile_name: 'Prisma AIRS' },
                contents: [{ prompt: 'test content 1' }],
            };

            const request2 = {
                tr_id: '123456789',
                ai_profile: { profile_name: 'Prisma AIRS' },
                contents: [{ prompt: 'test content 2' }],
            };

            const key1 = PrismaAirsCache.generateScanKey('sync', request1);
            const key2 = PrismaAirsCache.generateScanKey('sync', request2);

            expect(key1).not.toBe(key2);
        });

        it('should ignore metadata when generating keys', () => {
            const request1 = {
                tr_id: '123456789',
                ai_profile: { profile_name: 'Prisma AIRS' },
                contents: [{ prompt: 'test content' }],
                metadata: { app_name: 'app1' },
            };

            const request2 = {
                tr_id: '987654321',
                ai_profile: { profile_name: 'Prisma AIRS' },
                contents: [{ prompt: 'test content' }],
                metadata: { app_name: 'app2' }, // Different metadata
            };

            const key1 = PrismaAirsCache.generateScanKey('sync', request1);
            const key2 = PrismaAirsCache.generateScanKey('sync', request2);

            expect(key1).toBe(key2);
        });
    });

    describe('cache operations', () => {
        it('should store and retrieve cached data', () => {
            const testData = { result: 'test' };
            cache.set('test-key', testData);

            const retrieved = cache.get('test-key');
            expect(retrieved).toEqual(testData);
        });

        it('should return undefined for non-existent keys', () => {
            const result = cache.get('non-existent');
            expect(result).toBeUndefined();
        });

        it('should clear all cached items', () => {
            cache.set('key1', { data: 1 });
            cache.set('key2', { data: 2 });

            cache.clear();

            expect(cache.get('key1')).toBeUndefined();
            expect(cache.get('key2')).toBeUndefined();
            expect(cache.getStats().count).toBe(0);
        });
    });
});
