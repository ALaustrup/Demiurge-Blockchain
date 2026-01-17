# Qor Auth Service - Dockerfile
# Multi-stage build for optimized Rust binary
# Uses Rust nightly for edition 2024 support

# Stage 1: Builder
FROM debian:bookworm-slim as builder

# Install Rust nightly via rustup and build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust nightly toolchain
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain nightly
ENV PATH="/root/.cargo/bin:${PATH}"

# Verify Rust version
RUN rustc --version && cargo --version

WORKDIR /build

# Copy dependency manifests
COPY Cargo.toml Cargo.lock* ./

# Copy source code
COPY src ./src
COPY migrations ./migrations

# Build release binary
RUN cargo build --release --bin qor-auth

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 qor-auth

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/target/release/qor-auth /usr/local/bin/qor-auth

# Copy migrations
COPY --from=builder /build/migrations ./migrations

# Set permissions
RUN chmod +x /usr/local/bin/qor-auth

# Switch to non-root user
USER qor-auth

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command
CMD ["qor-auth"]
