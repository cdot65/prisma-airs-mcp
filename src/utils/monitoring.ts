import * as Sentry from '@sentry/node';
import type { ErrorRequestHandler, Express, NextFunction, Request, Response } from 'express';
import { getLogger } from './logger.js';

/**
 * Check if monitoring is enabled based on environment variables
 */
export function isMonitoringEnabled(): boolean {
    return process.env.MONITORING_ENABLED === 'true' && !!process.env.SENTRY_DSN;
}

/**
 * Setup Sentry request handler for Express application
 * This must be called BEFORE all routes
 */
export function setupExpressRequestHandler(_app: Express): void {
    if (isMonitoringEnabled()) {
        // For Sentry v8+, we don't need the request handler anymore
        // as it's handled automatically by the SDK
        getLogger().info('Sentry request tracking enabled');
    }
}

/**
 * Setup Sentry error handler for Express application
 * This must be called after all controllers and before any other error middleware
 */
export function setupExpressErrorHandler(app: Express): void {
    if (isMonitoringEnabled()) {
        Sentry.setupExpressErrorHandler(app);
        getLogger().info('Sentry error handler initialized');
    }
}

/**
 * Capture an exception with optional context
 * Automatically filters out sensitive data
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
    if (isMonitoringEnabled()) {
        Sentry.captureException(error, {
            extra: context ? sanitizeData(context) : undefined,
            // Don't include user data for privacy
            user: undefined,
        });
    }
}

/**
 * Add a breadcrumb for debugging
 * Breadcrumbs help track the sequence of events leading to an error
 */
export function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>,
): void {
    if (isMonitoringEnabled()) {
        Sentry.addBreadcrumb({
            message,
            category,
            level: 'info',
            data: data ? sanitizeData(data) : undefined,
            timestamp: Date.now() / 1000,
        });
    }
}

/**
 * Start a new span for performance monitoring
 */
export function startSpan(name: string, op: string): void {
    if (isMonitoringEnabled()) {
        Sentry.startSpan(
            {
                name,
                op,
            },
            () => {
                // Span will be automatically ended when this callback completes
            },
        );
    }
}

/**
 * Create custom error handler middleware that works with Sentry
 */
export function createErrorHandler(): ErrorRequestHandler {
    const logger = getLogger();

    return (err: Error, req: Request, res: Response, _next: NextFunction) => {
        // Log the error locally
        logger.error('Request error', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
        });

        // If monitoring is enabled, capture the error with context
        if (isMonitoringEnabled()) {
            Sentry.withScope((scope) => {
                scope.setContext('request', {
                    method: req.method,
                    path: req.path,
                    query: req.query,
                    // Don't include body or headers (may contain sensitive data)
                });
                scope.setTag('http.status_code', res.statusCode);

                // Actually capture the exception!
                Sentry.captureException(err);
            });
        }

        // Send error response
        res.status(res.statusCode >= 400 ? res.statusCode : 500).json({
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
            // Include Sentry error ID if available
            errorId: (res as { sentry?: string }).sentry,
            timestamp: new Date().toISOString(),
        });
    };
}

/**
 * Remove sensitive data from objects before sending to Sentry
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = [
        'token',
        'key',
        'secret',
        'password',
        'auth',
        'api',
        'credential',
        'private',
    ];

    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // Check if key contains sensitive words
        if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeData(value as Record<string, unknown>);
        } else if (typeof value === 'string' && value.length > 100) {
            // Truncate long strings that might contain sensitive data
            sanitized[key] = value.substring(0, 100) + '...[truncated]';
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Log monitoring status on startup
 */
export function logMonitoringStatus(): void {
    const logger = getLogger();

    if (isMonitoringEnabled()) {
        logger.info('Monitoring enabled', {
            provider: 'Sentry',
            environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1',
            profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1',
        });
    } else {
        logger.info('Monitoring disabled', {
            reason: !process.env.SENTRY_DSN
                ? 'No SENTRY_DSN provided'
                : 'MONITORING_ENABLED is not true',
        });
    }
}
