/**
 * Sentry initialization - must be imported at the very top of the application
 * This file is only executed if monitoring is explicitly enabled
 */

// Load environment variables first
import 'dotenv/config';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Only initialize if explicitly enabled via environment variables
if (process.env.MONITORING_ENABLED === 'true' && process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
        
        // Integrations
        integrations: [
            // HTTP integration is automatically added
            nodeProfilingIntegration(),
        ],
        
        // Performance monitoring - conservative defaults
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'), // 10%
        profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'), // 10%
        
        // Privacy-first configuration
        sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true', // Default: false
        attachStacktrace: true,
        
        // Don't send certain errors
        ignoreErrors: [
            // Ignore client disconnection errors
            'ECONNRESET',
            'EPIPE',
            'ETIMEDOUT',
            // Ignore common client errors
            'NetworkError',
            'Failed to fetch',
        ],
        
        // Filter out sensitive data before sending
        beforeSend(event) {
            // Remove authentication headers
            if (event.request?.headers) {
                delete event.request.headers['x-pan-token'];
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
                delete event.request.headers['x-api-key'];
            }
            
            // Remove request/response bodies (may contain sensitive data)
            if (event.request) {
                delete event.request.data;
                delete event.request.cookies;
            }
            
            // Remove any contexts that might contain sensitive data
            if (event.contexts) {
                // Remove custom contexts that might have AIRS data
                delete event.contexts.airs;
                delete event.contexts.scan;
                delete event.contexts.api;
            }
            
            // Remove or sanitize extra data
            if (event.extra) {
                // Remove any AIRS API responses
                delete event.extra.airsResponse;
                delete event.extra.scanResult;
                delete event.extra.apiKey;
                delete event.extra.token;
            }
            
            // Don't send events from health checks
            if (event.request?.url?.includes('/health') || 
                event.request?.url?.includes('/ready')) {
                return null; // Drop the event
            }
            
            return event;
        },
        
        // Custom sampling for performance monitoring
        tracesSampler(samplingContext) {
            // Don't trace health checks
            if (samplingContext.request?.url?.includes('/health') || 
                samplingContext.request?.url?.includes('/ready')) {
                return 0;
            }
            
            // Lower sampling for high-frequency endpoints
            if (samplingContext.request?.url?.includes('/sse')) {
                return 0.01; // 1% for SSE connections
            }
            
            // Use configured rate for everything else
            return parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');
        },
        
        // Breadcrumb filtering
        beforeBreadcrumb(breadcrumb) {
            // Filter out sensitive breadcrumbs
            if (breadcrumb.category === 'http' && breadcrumb.data) {
                // Remove auth headers from HTTP breadcrumbs
                if (breadcrumb.data.headers) {
                    delete breadcrumb.data.headers['x-pan-token'];
                    delete breadcrumb.data.headers['authorization'];
                }
                
                // Don't log health check requests
                if (breadcrumb.data.url?.includes('/health') || 
                    breadcrumb.data.url?.includes('/ready')) {
                    return null;
                }
            }
            
            // Sanitize console breadcrumbs
            if (breadcrumb.category === 'console' && breadcrumb.message) {
                // Look for potential secrets in console logs
                const sensitivePatterns = [
                    /api[_-]?key/i,
                    /token/i,
                    /secret/i,
                    /password/i,
                    /credential/i,
                ];
                
                for (const pattern of sensitivePatterns) {
                    if (pattern.test(breadcrumb.message)) {
                        breadcrumb.message = '[REDACTED - Potential sensitive data]';
                        break;
                    }
                }
            }
            
            return breadcrumb;
        },
        
        // Release tracking (optional - set via CI/CD)
        release: process.env.SENTRY_RELEASE,
        
        // Server name (optional)
        serverName: process.env.SENTRY_SERVER_NAME || 'prisma-airs-mcp',
        
        // Maximum breadcrumbs to keep
        maxBreadcrumbs: 50,
    });
    
    // Log successful initialization (but don't log DSN)
    console.log('✅ Sentry monitoring initialized for environment:', 
        process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development');
} else {
    // Log why monitoring is disabled (useful for debugging)
    if (process.env.MONITORING_ENABLED !== 'true') {
        console.log('ℹ️  Sentry monitoring disabled: MONITORING_ENABLED is not true');
    } else if (!process.env.SENTRY_DSN) {
        console.log('ℹ️  Sentry monitoring disabled: No SENTRY_DSN provided');
    }
}