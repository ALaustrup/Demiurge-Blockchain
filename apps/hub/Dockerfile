# Demiurge Hub - Production Dockerfile
# Multi-stage build for optimized Next.js production image
# Context: Repository root (for workspace packages access)

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json package-lock.json* ./
COPY apps/hub/package.json ./apps/hub/
COPY packages/qor-sdk/package.json ./packages/qor-sdk/
COPY packages/ui-shared/package.json ./packages/ui-shared/
COPY packages/wallet-wasm/package.json ./packages/wallet-wasm/

# Install all workspace dependencies
RUN npm install --omit=dev --workspaces --include-workspace-root || npm install --omit=dev

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages source
COPY packages/ ./packages/

# Copy hub app source
COPY apps/hub/ ./apps/hub/

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
WORKDIR /app/apps/hub
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/hub/public ./public
COPY --from=builder /app/apps/hub/.next/standalone ./
COPY --from=builder /app/apps/hub/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
