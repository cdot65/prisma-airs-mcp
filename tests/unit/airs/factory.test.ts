import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { getAirsClient, resetAirsClient } from '../../../src/airs/factory';
import { EnhancedPrismaAirsClient } from '../../../src/airs';
import { getConfig } from '../../../src/config';
import type { Config } from '../../../src/types';

// Mock dependencies
jest.mock('../../../src/config');
jest.mock('../../../src/utils/logger', () => ({
    getLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }),
}));
jest.mock('../../../src/airs/index');

describe('AIRS Factory', () => {
    const mockConfig: Config = {
        server: {
            port: 3000,
            environment: 'test',
            logLevel: 'info',
        },
        airs: {
            apiUrl: 'https://test.api.com',
            apiKey: 'test-key',
            timeout: 5000,
            retryAttempts: 3,
            retryDelay: 1000,
            defaultProfileId: 'test-profile-id',
            defaultProfileName: 'test-profile',
        },
        cache: {
            enabled: true,
            ttlSeconds: 300,
            maxSize: 100,
        },
        rateLimit: {
            enabled: true,
            maxRequests: 10,
            windowMs: 60000,
        },
        mcp: {
            serverName: 'test-server',
            serverVersion: '1.0.0',
            protocolVersion: '1.0',
        },
    };

    const mockClearCache = jest.fn();
    const mockResetRateLimits = jest.fn();
    
    const mockClient = {
        clearCache: mockClearCache,
        resetRateLimits: mockResetRateLimits,
        scanSync: jest.fn(),
        scanAsync: jest.fn(),
        getScanResults: jest.fn(),
        getThreatReports: jest.fn(),
        getCacheStats: jest.fn(),
        getRateLimitStatus: jest.fn(),
    } as unknown as EnhancedPrismaAirsClient;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup mock implementations
        (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValue(mockConfig);
        
        // Mock the EnhancedPrismaAirsClient constructor
        const MockedClient = EnhancedPrismaAirsClient as jest.MockedClass<typeof EnhancedPrismaAirsClient>;
        MockedClient.mockClear();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        MockedClient.mockImplementation(() => mockClient as any);
    });

    afterEach(() => {
        // Always reset the client after each test to ensure isolation
        resetAirsClient();
    });

    describe('getAirsClient', () => {
        it('should create a new client instance on first call', () => {
            const client = getAirsClient();

            expect(EnhancedPrismaAirsClient).toHaveBeenCalledTimes(1);
            expect(EnhancedPrismaAirsClient).toHaveBeenCalledWith({
                apiUrl: mockConfig.airs.apiUrl,
                apiKey: mockConfig.airs.apiKey,
                timeout: mockConfig.airs.timeout,
                maxRetries: mockConfig.airs.retryAttempts,
                retryDelay: mockConfig.airs.retryDelay,
                cache: {
                    ttlSeconds: mockConfig.cache.ttlSeconds,
                    maxSize: mockConfig.cache.maxSize,
                    enabled: mockConfig.cache.enabled,
                },
                rateLimiter: {
                    maxRequests: mockConfig.rateLimit.maxRequests,
                    windowMs: mockConfig.rateLimit.windowMs,
                    enabled: mockConfig.rateLimit.enabled,
                },
            });

            // Note: Logger calls are not tested due to module-level initialization
            // The logger is created when the factory module loads, before our mocks

            expect(client).toBe(mockClient);
        });

        it('should return the same instance on subsequent calls', () => {
            const client1 = getAirsClient();
            const client2 = getAirsClient();

            expect(client1).toBe(client2);
            expect(EnhancedPrismaAirsClient).toHaveBeenCalledTimes(1);
        });

        it('should create client without cache when cache is disabled', () => {
            const configWithoutCache = {
                ...mockConfig,
                cache: { ...mockConfig.cache, enabled: false },
            };
            (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValue(configWithoutCache);

            getAirsClient();

            expect(EnhancedPrismaAirsClient).toHaveBeenCalledWith(
                expect.objectContaining({
                    cache: undefined,
                })
            );
        });

        it('should create client without rate limiter when rate limiting is disabled', () => {
            const configWithoutRateLimit = {
                ...mockConfig,
                rateLimit: { ...mockConfig.rateLimit, enabled: false },
            };
            (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValue(configWithoutRateLimit);

            getAirsClient();

            expect(EnhancedPrismaAirsClient).toHaveBeenCalledWith(
                expect.objectContaining({
                    rateLimiter: undefined,
                })
            );
        });
    });

    describe('resetAirsClient', () => {
        it('should clear cache, reset rate limits, and destroy the instance', () => {
            // Create a client first
            const client = getAirsClient();
            expect(client).toBe(mockClient);

            // Reset the client
            resetAirsClient();

            expect(mockClearCache).toHaveBeenCalledTimes(1);
            expect(mockResetRateLimits).toHaveBeenCalledTimes(1);
            // Note: Logger calls are not tested due to module-level initialization
        });

        it('should force creation of new instance after reset', () => {
            // Create initial client
            const client1 = getAirsClient();
            expect(EnhancedPrismaAirsClient).toHaveBeenCalledTimes(1);

            // Reset the client
            resetAirsClient();

            // Get client again - should create new instance
            const client2 = getAirsClient();
            expect(EnhancedPrismaAirsClient).toHaveBeenCalledTimes(2);
            expect(client1).toBe(mockClient); // Both point to mock, but in real scenario would be different
            expect(client2).toBe(mockClient); // New instance in real scenario
        });

        it('should handle reset when no client exists', () => {
            // Reset without creating a client first
            resetAirsClient();

            // Should not throw and should not call any methods
            expect(mockClearCache).not.toHaveBeenCalled();
            expect(mockResetRateLimits).not.toHaveBeenCalled();
        });

        it('should allow configuration changes between resets', () => {
            // Create client with initial config
            getAirsClient();
            expect(EnhancedPrismaAirsClient).toHaveBeenCalledTimes(1);

            // Reset the client
            resetAirsClient();

            // Change configuration
            const newConfig = {
                ...mockConfig,
                airs: {
                    ...mockConfig.airs,
                    apiUrl: 'https://new.api.com',
                    apiKey: 'new-key',
                },
            };
            (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValue(newConfig);

            // Create new client with new config
            getAirsClient();

            expect(EnhancedPrismaAirsClient).toHaveBeenCalledTimes(2);
            expect(EnhancedPrismaAirsClient).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    apiUrl: 'https://new.api.com',
                    apiKey: 'new-key',
                })
            );
        });
    });

    describe('Integration scenarios', () => {
        it('should properly isolate tests using resetAirsClient in beforeEach/afterEach', () => {
            // Simulate test 1
            const client1 = getAirsClient();
            expect(client1).toBeDefined();
            expect(EnhancedPrismaAirsClient).toHaveBeenCalledTimes(1);
            
            // Simulate afterEach
            resetAirsClient();
            
            // Clear mock counts (simulating new test)
            jest.clearAllMocks();
            
            // Simulate test 2
            const client2 = getAirsClient();
            expect(client2).toBeDefined();
            expect(EnhancedPrismaAirsClient).toHaveBeenCalledTimes(1); // Should be 1, not 2
        });
    });
});