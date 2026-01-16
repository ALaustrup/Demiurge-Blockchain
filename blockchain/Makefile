# Demiurge Blockchain Node - Makefile
# External build system to avoid Cursor crashes

.PHONY: help check build build-release build-docker clean test run-dev run-testnet

# Default target
help:
	@echo "🔨 Demiurge Blockchain Node - Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  make check          - Check compilation (fast, ~5 min)"
	@echo "  make build          - Debug build"
	@echo "  make build-release  - Release build (slow, ~30-60 min)"
	@echo "  make build-docker   - Build Docker image"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make test           - Run tests"
	@echo "  make run-dev        - Run development node"
	@echo "  make run-testnet    - Run testnet node"
	@echo ""
	@echo "⚠️  Always run builds in external terminal, not Cursor!"

# Check compilation only
check:
	@echo "▶ Checking compilation..."
	cargo check --release --workspace

# Debug build
build:
	@echo "▶ Building debug binary..."
	cargo build --bin demiurge-node

# Release build
build-release:
	@echo "▶ Building release binary..."
	@echo "⚠️  This will take 30-60 minutes..."
	cargo build --release --bin demiurge-node
	@echo "✓ Build complete!"
	@echo "Binary: target/release/demiurge-node"

# Docker build
build-docker:
	@echo "▶ Building Docker image..."
	docker build -t demiurge-node:latest .
	@echo "✓ Docker build complete!"

# Clean build artifacts
clean:
	@echo "▶ Cleaning build cache..."
	cargo clean
	@echo "✓ Clean complete!"

# Run tests
test:
	@echo "▶ Running tests..."
	cargo test --workspace

# Run development node
run-dev: build-release
	@echo "▶ Starting development node..."
	./target/release/demiurge-node --dev --rpc-cors=all --rpc-external

# Run testnet node
run-testnet: build-release
	@echo "▶ Starting testnet node..."
	./target/release/demiurge-node \
		--chain=demiurge-testnet \
		--name="Pleroma-Validator" \
		--validator \
		--rpc-cors=all \
		--rpc-external \
		--prometheus-external
