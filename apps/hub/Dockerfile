FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/hub/package.json ./apps/hub/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages first
RUN npm run build --workspace=@demiurge/qor-sdk
RUN npm run build --workspace=@demiurge/ui-shared

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build --workspace=@demiurge/hub

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/hub/public ./public
COPY --from=builder /app/apps/hub/.next/standalone ./
COPY --from=builder /app/apps/hub/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
