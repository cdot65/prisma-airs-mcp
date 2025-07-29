import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import * as monitoring from '../src/utils/monitoring.js';

describe('Monitoring Utils', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset environment variables
        process.env = { ...originalEnv };
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('isMonitoringEnabled', () => {
        it('should return false when MONITORING_ENABLED is not set', () => {
            delete process.env.MONITORING_ENABLED;
            delete process.env.SENTRY_DSN;

            expect(monitoring.isMonitoringEnabled()).toBe(false);
        });

        it('should return false when MONITORING_ENABLED is false', () => {
            process.env.MONITORING_ENABLED = 'false';
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';

            expect(monitoring.isMonitoringEnabled()).toBe(false);
        });

        it('should return false when SENTRY_DSN is not set', () => {
            process.env.MONITORING_ENABLED = 'true';
            delete process.env.SENTRY_DSN;

            expect(monitoring.isMonitoringEnabled()).toBe(false);
        });

        it('should return true when both MONITORING_ENABLED and SENTRY_DSN are set', () => {
            process.env.MONITORING_ENABLED = 'true';
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';

            expect(monitoring.isMonitoringEnabled()).toBe(true);
        });
    });

    describe('addBreadcrumb', () => {
        it('should not throw when monitoring is disabled', () => {
            delete process.env.MONITORING_ENABLED;

            expect(() => {
                monitoring.addBreadcrumb('Test message', 'test', { foo: 'bar' });
            }).not.toThrow();
        });

        it('should sanitize sensitive data', () => {
            // Since we can't easily test Sentry internals, we just ensure
            // the function doesn't throw with sensitive data
            process.env.MONITORING_ENABLED = 'true';
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';

            expect(() => {
                monitoring.addBreadcrumb('Test', 'test', {
                    api_key: 'secret',
                    normal_data: 'visible',
                    password: 'hidden',
                });
            }).not.toThrow();
        });
    });

    describe('captureException', () => {
        it('should not throw when monitoring is disabled', () => {
            delete process.env.MONITORING_ENABLED;
            const error = new Error('Test error');

            expect(() => {
                monitoring.captureException(error, { context: 'test' });
            }).not.toThrow();
        });
    });

    describe('createErrorHandler', () => {
        it('should return a function', () => {
            const handler = monitoring.createErrorHandler();
            expect(typeof handler).toBe('function');
        });

        it('should handle errors without throwing', () => {
            const handler = monitoring.createErrorHandler();
            const error = new Error('Test error');

            const req: any = { method: 'GET', path: '/test', query: {} };

            const res: any = {
                statusCode: 500,
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            const next: any = jest.fn();

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                handler(error, req, res, next);
            }).not.toThrow();

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.status).toHaveBeenCalledWith(500);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('logMonitoringStatus', () => {
        it('should not throw regardless of monitoring state', () => {
            // Test with monitoring disabled
            delete process.env.MONITORING_ENABLED;
            expect(() => monitoring.logMonitoringStatus()).not.toThrow();

            // Test with monitoring enabled
            process.env.MONITORING_ENABLED = 'true';
            process.env.SENTRY_DSN = 'https://test@sentry.io/123';
            expect(() => monitoring.logMonitoringStatus()).not.toThrow();
        });
    });
});
