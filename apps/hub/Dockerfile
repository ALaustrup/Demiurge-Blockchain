FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/hub/package.json ./apps/hub/
COPY packages ./packages

# Install dependencies (use npm install if package-lock.json missing)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages first
RUN npm run build --workspace=@demiurge/qor-sdk
RUN npm run build --workspace=@demiurge/ui-shared

# Build wallet-wasm (Rust/WASM package)
RUN cd packages/wallet-wasm && \
    if [ -f Cargo.toml ]; then \
      curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh && \
      wasm-pack build --target web --out-dir pkg || echo "wallet-wasm build skipped (optional)"; \
    fi

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
# Copy node_modules for standalone mode
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
