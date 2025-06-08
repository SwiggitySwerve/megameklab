# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json (or yarn.lock if you use yarn)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Set NEXT_TELEMETRY_DISABLED to 1 to disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
# The 'data' directory for SQLite will be created by the app if it doesn't exist,
# or mounted as a volume by the user.
# Our database.ts creates ../data relative to the app's root inside node_modules,
# which means it will try to create /app/data if WORKDIR is /app.
# Ensure the user running the app has permissions to create/write to /app/data if it's not mounted.

# Expose port 3000
EXPOSE 3000

# Set NEXT_TELEMETRY_DISABLED to 1 for runtime as well
ENV NEXT_TELEMETRY_DISABLED 1

# Command to run the application
# Use "npm start" which typically runs "next start"
CMD ["npm", "start"]
