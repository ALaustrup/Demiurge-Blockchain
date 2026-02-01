# Demiurge Hub - Production Dockerfile
# Multi-stage build for optimized Next.js production image
# Context: Repository root (for workspace packages access)

# Stage 1: Dependencies (all deps including devDependencies for build)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json package-lock.json* ./
COPY apps/hub/package.json ./apps/hub/
COPY packages/qor-sdk/package.json ./packages/qor-sdk/
COPY packages/ui-shared/package.json ./packages/ui-shared/
COPY packages/wallet-wasm/package.json ./packages/wallet-wasm/
COPY sdk/package.json ./sdk/

# Install all dependencies including devDependencies (needed for build)
RUN npm install --workspaces --include-workspace-root || npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages source
COPY packages/ ./packages/
COPY sdk/ ./sdk/

# Copy hub app source
COPY apps/hub/ ./apps/hub/

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the SDK first (required by Hub)
WORKDIR /app/sdk
RUN npm run build

# Build agent-foundry (required by Hub)
WORKDIR /app/packages/agent-foundry
RUN npm run build || echo "Agent-foundry build skipped"

# Build the application
WORKDIR /app/apps/hub
RUN npm run build

# Stage 3: Runner (production image with all dependencies)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy node_modules for production
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/hub/public ./public
COPY --from=builder /app/apps/hub/.next ./.next
COPY --from=builder /app/apps/hub/package.json ./package.json

# Copy workspace packages (needed for runtime)
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/sdk ./sdk

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
