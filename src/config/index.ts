/**
 * Configuration Management Module
 * 
 * This module is responsible for:
 * 1. Loading configuration values from environment variables
 * 2. Applying sensible defaults when environment variables are not set
 * 3. Validating all configuration values at runtime using Zod schemas
 * 4. Providing type-safe access to configuration throughout the application
 * 
 * The configuration is loaded once (singleton pattern) and cached for performance.
 * Invalid configurations will fail fast with detailed error messages.
 * 
 * @example
 * ```typescript
 * import { getConfig } from './config';
 * 
 * const config = getConfig();
 * console.log(config.server.port); // Type-safe access to configuration
 * ```
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config } from '../types';

dotenv.config();

// Read version from version.json if available
let versionFromFile = '1.0.0';
try {
    const versionJson = JSON.parse(readFileSync(join(process.cwd(), 'version.json'), 'utf-8')) as {
        version: string;
    };
    versionFromFile = versionJson.version;
} catch {
    // Fall back to default if file doesn't exist
}

/**
 * Environment configuration schema
 */
const configSchema = z.object({
    // Server configuration
    server: z.object({
        port: z.number().min(1).max(65535),
        environment: z.enum(['development', 'production', 'test']),
        logLevel: z.enum(['error', 'warn', 'info', 'debug']),
    }),

    // Prisma AIRS configuration
    airs: z.object({
        apiUrl: z.string().refine((val) => {
            try {
                // @ts-expect-error - We're only checking if URL is valid
                const _ = new globalThis.URL(val);
                return true;
            } catch {
                return false;
            }
        }, 'Invalid URL'),
        apiKey: z.string().min(1),
        timeout: z.number().min(1000).default(30000),
        retryAttempts: z.number().min(0).default(3),
        retryDelay: z.number().min(100).default(1000),
        // Default profile configuration
        defaultProfileId: z.string().optional(),
        defaultProfileName: z.string().optional(),
    }),

    // Cache configuration
    cache: z.object({
        ttlSeconds: z.number().min(0).default(300),
        maxSize: z.number().min(0).default(1000),
        enabled: z.boolean().default(true),
    }),

    // Rate limiting configuration
    rateLimit: z.object({
        maxRequests: z.number().min(1).default(100),
        windowMs: z.number().min(1000).default(60000),
        enabled: z.boolean().default(true),
    }),

    // MCP configuration
    mcp: z.object({
        serverName: z.string().default('prisma-airs-mcp'),
        serverVersion: z.string().default('1.0.0'),
        protocolVersion: z.string().default('2024-11-05'),
    }),
});

/**
 * Parse and validate configuration from environment variables
 * The Zod schema should produce a Config type from src/types/config.ts
 */
function parseConfig(): Config {
    return configSchema.parse({
        server: {
            port: parseInt(process.env.PORT ?? '3000', 10),
            environment: process.env.NODE_ENV ?? 'development',
            logLevel: process.env.LOG_LEVEL ?? 'info',
        },
        airs: {
            apiUrl: process.env.AIRS_API_URL ?? 'https://service.api.aisecurity.paloaltonetworks.com',
            apiKey: process.env.AIRS_API_KEY ?? '',
            timeout: parseInt(process.env.AIRS_TIMEOUT ?? '30000', 10),
            retryAttempts: parseInt(process.env.AIRS_RETRY_ATTEMPTS ?? '3', 10),
            retryDelay: parseInt(process.env.AIRS_RETRY_DELAY ?? '1000', 10),
            defaultProfileId: process.env.AIRS_DEFAULT_PROFILE_ID,
            defaultProfileName: process.env.AIRS_DEFAULT_PROFILE_NAME,
        },
        cache: {
            ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS ?? '300', 10),
            maxSize: parseInt(process.env.CACHE_MAX_SIZE ?? '1000', 10),
            enabled: process.env.CACHE_ENABLED !== 'false',
        },
        rateLimit: {
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
            enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        },
        mcp: {
            serverName: process.env.MCP_SERVER_NAME ?? 'prisma-airs-mcp',
            serverVersion: process.env.MCP_SERVER_VERSION ?? versionFromFile,
            protocolVersion: process.env.MCP_PROTOCOL_VERSION ?? '2024-11-05',
        },
    });
}

/**
 * Global configuration instance
 */
let config: Config | null = null;

/**
 * Get configuration instance
 */
export function getConfig(): Config {
    if (!config) {
        try {
            config = parseConfig();
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error('Configuration validation failed:', error.issues);
                throw new Error(
                    `Invalid configuration: ${error.issues.map((e) => e.message).join(', ')}`,
                );
            }
            throw error;
        }
    }
    return config;
}
