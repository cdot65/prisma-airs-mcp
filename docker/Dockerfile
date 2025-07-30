# Multi-stage Dockerfile for Prisma AIRS MCP Server
# Optimized for production deployment
# Supports multi-platform builds (linux/amd64, linux/arm64)

# Build arguments
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG VERSION=latest
ARG BUILD_DATE

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run local:build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Re-declare build args for use in this stage
ARG VERSION
ARG BUILD_DATE
ARG TARGETPLATFORM

# Add labels for image metadata
LABEL org.opencontainers.image.title="Prisma AIRS MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for Palo Alto Networks Prisma AIRS"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.platform="${TARGETPLATFORM}"

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nodejs:nodejs /app/version.json ./version.json

# Create logs directory
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port (default 3000)
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Add metadata labels
LABEL org.opencontainers.image.title="Prisma AIRS MCP Server"
LABEL org.opencontainers.image.description="MCP server for integrating with Palo Alto Networks Prisma AIRS"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.source="https://github.com/cdot65/prisma-airs-mcp"
LABEL org.opencontainers.image.url="https://cdot65.github.io/prisma-airs-mcp/"
LABEL org.opencontainers.image.documentation="https://cdot65.github.io/prisma-airs-mcp/"
LABEL org.opencontainers.image.vendor="cdot65"
LABEL org.opencontainers.image.licenses="Apache-2.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]