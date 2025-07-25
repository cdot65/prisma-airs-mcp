import winston from 'winston';
import { getConfig } from '../config';

let logger: winston.Logger | null = null;

/**
 * Create and configure Winston logger
 */
export function createLogger(): winston.Logger {
  if (logger) {
    return logger;
  }

  const config = getConfig();
  const { environment, logLevel } = config.server;

  const formats = [winston.format.timestamp(), winston.format.errors({ stack: true })];

  if (environment === 'development') {
    formats.push(winston.format.colorize(), winston.format.simple());
  } else {
    formats.push(winston.format.json());
  }

  logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(...formats),
    defaultMeta: {
      service: config.mcp.serverName,
      version: config.mcp.serverVersion,
    },
    transports: [
      new winston.transports.Console({
        silent: environment === 'test',
      }),
    ],
  });

  return logger;
}

/**
 * Get logger instance
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    return createLogger();
  }
  return logger;
}
