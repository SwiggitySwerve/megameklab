# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy app's package files first for better caching
COPY battletech-editor-app/package.json ./
COPY battletech-editor-app/package-lock.json ./
COPY battletech-editor-app/tsconfig.json ./
COPY battletech-editor-app/next.config.ts ./

# Install Node.js dependencies
RUN npm ci

# Copy the rest of the application source code
COPY battletech-editor-app/. .

# Build the Next.js application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Install runtime dependencies: Python, SQLite, and bash for better script support
RUN apk add --no-cache python3 py3-pip sqlite sqlite-dev bash

# Set NODE_ENV to production for Next.js
ENV NODE_ENV production

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy necessary files from the builder stage
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public

# Copy data directory with all mekfiles and scripts for database initialization
COPY --chown=appuser:appgroup battletech-editor-app/data ./data/

# Copy the initialization script
COPY --chown=appuser:appgroup battletech-editor-app/scripts/init-db.sh ./scripts/init-db.sh

# Make the initialization script executable
RUN chmod +x ./scripts/init-db.sh

# Switch to non-root user
USER appuser

# Expose the port Next.js runs on (default 3000)
EXPOSE 3000

# Use the initialization script as the entry point
# This will check for existing database, initialize if needed, then start the app
CMD ["./scripts/init-db.sh"]
