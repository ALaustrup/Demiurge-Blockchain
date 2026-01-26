# QOR Auth Service - Production Dockerfile
# Multi-stage build for optimized Rust production image

# Stage 1: Builder
FROM rust:1.82-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files first for dependency caching
COPY Cargo.toml Cargo.lock* ./

# Create dummy main.rs for dependency caching
RUN mkdir -p src && echo "fn main() {}" > src/main.rs

# Build dependencies only (for caching)
RUN cargo build --release && rm -rf src target/release/deps/qor_auth*

# Copy actual source code
COPY src ./src
COPY config ./config
COPY migrations ./migrations

# Build the application
RUN cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 qorauth \
    && useradd --system --uid 1001 --gid qorauth qorauth

# Copy binary from builder
COPY --from=builder /app/target/release/qor-auth /usr/local/bin/qor-auth

# Copy config and migrations
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations

# Create data directory
RUN mkdir -p /data && chown -R qorauth:qorauth /data /app

USER qorauth

EXPOSE 8080

ENV RUST_LOG=info,qor_auth=debug

CMD ["qor-auth"]
