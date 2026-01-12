#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🔥 IGNITE DEMIURGE - Unified Launch Protocol
# ═══════════════════════════════════════════════════════════════════════════════
# 
# This script builds and launches the Demiurge Ecosystem on the Monad server.
# 
# Components:
#   1. Substrate Node (Blockchain)
#   2. Qor Auth Service (Identity)
#   3. Instructions for UE5 Client
#
# Usage:
#   ./ignite_demiurge.sh [--dev|--testnet|--production]
#
# Requirements:
#   - Rust 1.84+ with wasm32-unknown-unknown target
#   - Clang 19+ (for RocksDB)
#   - PostgreSQL 18 (for qor-auth)
#   - Docker (optional, for containerized deployment)
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_DIR="$SCRIPT_DIR/blockchain"
SERVICES_DIR="$SCRIPT_DIR/services"
CLIENT_DIR="$SCRIPT_DIR/client/DemiurgeClient"
TARGET_DIR="$BLOCKCHAIN_DIR/target/release"

MODE="${1:---dev}"

echo -e "${PURPLE}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "    🔥 IGNITE DEMIURGE - The Genesis Protocol"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo -e "Mode: ${CYAN}$MODE${NC}"
echo -e "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: SYSTEM UPDATE
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ PHASE 1: SYSTEM PREREQUISITES${NC}"

# Check if running as root or with sudo
if command -v apt-get &> /dev/null; then
    echo "  → Updating system packages..."
    sudo apt-get update -qq
    
    # Install RocksDB dependencies if missing
    if ! dpkg -l | grep -q librocksdb-dev; then
        echo "  → Installing RocksDB dependencies..."
        sudo apt-get install -y -qq \
            librocksdb-dev \
            libclang-dev \
            llvm-dev \
            libc++-dev \
            libc++abi-dev \
            cmake \
            build-essential
    fi
    echo -e "  ${GREEN}✓ System packages updated${NC}"
else
    echo -e "  ${YELLOW}⚠ apt not found, skipping system update${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: RUST ENVIRONMENT CHECK
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}▶ PHASE 2: RUST ENVIRONMENT${NC}"

if ! command -v rustc &> /dev/null; then
    echo -e "  ${RED}✗ Rust not found. Installing...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

RUST_VERSION=$(rustc --version | awk '{print $2}')
echo -e "  → Rust version: ${CYAN}$RUST_VERSION${NC}"

# Ensure WASM target is installed
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "  → Adding WASM target..."
    rustup target add wasm32-unknown-unknown
fi
echo -e "  ${GREEN}✓ WASM target ready${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: BUILD SUBSTRATE NODE
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}▶ PHASE 3: BUILDING SUBSTRATE NODE${NC}"

if [ -d "$BLOCKCHAIN_DIR" ]; then
    cd "$BLOCKCHAIN_DIR"
    
    # Clean build cache if requested
    if [ "$2" = "--clean" ]; then
        echo "  → Cleaning build cache..."
        cargo clean
    fi
    
    echo "  → Building demiurge-node (this may take 10-30 minutes)..."
    echo "  → Using $(nproc) CPU cores..."
    
    # Set environment variables for C++ compilation
    export LIBCLANG_PATH="/usr/lib/llvm-19/lib"
    export CC=clang
    export CXX=clang++
    
    # Build with release profile
    if cargo build --release -j$(nproc) 2>&1 | tee /tmp/demiurge-build.log; then
        echo -e "  ${GREEN}✓ Substrate node built successfully${NC}"
        NODE_BINARY="$TARGET_DIR/demiurge-node"
    else
        echo -e "  ${RED}✗ Build failed. Check /tmp/demiurge-build.log${NC}"
        exit 1
    fi
else
    echo -e "  ${RED}✗ blockchain/ directory not found${NC}"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: VERIFY BUILD
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}▶ PHASE 4: VERIFYING BUILD${NC}"

if [ -f "$NODE_BINARY" ]; then
    NODE_SIZE=$(du -h "$NODE_BINARY" | awk '{print $1}')
    echo -e "  → Binary size: ${CYAN}$NODE_SIZE${NC}"
    echo -e "  → Path: ${CYAN}$NODE_BINARY${NC}"
    
    # Quick version check
    $NODE_BINARY --version && echo -e "  ${GREEN}✓ Binary executable${NC}" || true
else
    echo -e "  ${RED}✗ Binary not found at $NODE_BINARY${NC}"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 5: LAUNCH NODE (optional)
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}▶ PHASE 5: LAUNCH OPTIONS${NC}"

case "$MODE" in
    "--dev")
        echo -e "  → Starting development node..."
        echo ""
        echo -e "${CYAN}To start the node manually:${NC}"
        echo "  $NODE_BINARY --dev --rpc-cors=all --rpc-external"
        echo ""
        echo -e "${CYAN}To run in background:${NC}"
        echo "  nohup $NODE_BINARY --dev --rpc-cors=all > /tmp/demiurge.log 2>&1 &"
        ;;
    "--testnet")
        echo -e "  → Testnet configuration"
        echo "  $NODE_BINARY --chain=demiurge-testnet --name=pleroma-node"
        ;;
    "--production")
        echo -e "  → Production (use Docker Compose)"
        echo "  cd docker && docker-compose -f docker-compose.production.yml up -d"
        ;;
esac

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 6: UE5 CLIENT INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}▶ PHASE 6: UNREAL ENGINE 5 CLIENT${NC}"
echo ""
echo -e "  The UE5 client is built via Unreal Editor (not command-line on Linux)."
echo ""
echo -e "  ${CYAN}To open the project:${NC}"
echo "    1. Locate the UE5 Editor binary:"
echo "       /data/ue5-source/Engine/Binaries/Linux/UnrealEditor"
echo ""
echo "    2. Open the project:"
echo "       /data/ue5-source/Engine/Binaries/Linux/UnrealEditor \\"
echo "         \"$CLIENT_DIR/DemiurgeClient.uproject\""
echo ""
echo "    3. In the Editor, use File > Package Project > Linux/Windows"
echo ""
echo -e "  ${CYAN}Client Structure:${NC}"
echo "    $CLIENT_DIR/"
echo "    ├── DemiurgeClient.uproject"
echo "    └── Source/"
echo "        ├── DemiurgeClient/  (HUD, Game Mode)"
echo "        ├── DemiurgeWeb3/    (Blockchain RPC Bridge)"
echo "        └── QorUI/           (Cyber Glass Design System)"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${PURPLE}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "    ✨ IGNITION COMPLETE"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo ""
echo -e "  ${GREEN}Backend (Rust/Substrate)${NC}: Ready"
echo -e "  ${CYAN}Frontend (C++/UE5)${NC}:       Open in Unreal Editor"
echo -e "  ${YELLOW}RPC Endpoint${NC}:            ws://127.0.0.1:9944"
echo ""
echo -e "  ${PURPLE}The Demiurge awaits your command.${NC}"
echo ""
