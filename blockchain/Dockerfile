# Demiurge Blockchain Node - Production Dockerfile
# Multi-stage build for optimized binary size

# Stage 1: Builder
# Use Rust 1.85+ for edition2024 support
FROM rust:1.85-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    clang \
    libclang-dev \
    llvm-dev \
    libc++-dev \
    libc++abi-dev \
    cmake \
    pkg-config \
    libssl-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /build

# Copy blockchain directory (when build context is repo root)
COPY blockchain/ .

# Build the node binary
# Docker will cache layers based on Cargo.toml/Cargo.lock changes

# Build the node binary
RUN cargo build --release --bin demiurge-node

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 demiurge

# Copy binary from builder
COPY --from=builder /build/target/release/demiurge-node /usr/local/bin/demiurge-node

# Set permissions
RUN chmod +x /usr/local/bin/demiurge-node

# Switch to non-root user
USER demiurge

# Create data directory
RUN mkdir -p /data

# Expose ports
EXPOSE 9944 9933 30333 9615

# Default command
ENTRYPOINT ["demiurge-node"]
CMD ["--help"]
