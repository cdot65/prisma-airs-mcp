/**
 * Centralized Config module type definitions
 * All types are prefixed with 'Config' to avoid namespace conflicts
 */

// Main configuration type
export interface Config {
    server: ConfigServer;
    airs: ConfigAirs;
    cache: ConfigCache;
    rateLimit: ConfigRateLimit;
    mcp: ConfigMcp;
}

// Server configuration
export interface ConfigServer {
    port: number;
    environment: 'development' | 'production' | 'test';
    logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// Prisma AIRS configuration
export interface ConfigAirs {
    apiUrl: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    defaultProfileId?: string;
    defaultProfileName?: string;
}

// Cache configuration
export interface ConfigCache {
    ttlSeconds: number;
    maxSize: number;
    enabled: boolean;
}

// Rate limiting configuration
export interface ConfigRateLimit {
    maxRequests: number;
    windowMs: number;
    enabled: boolean;
}

// MCP configuration
export interface ConfigMcp {
    serverName: string;
    serverVersion: string;
    protocolVersion: string;
}
