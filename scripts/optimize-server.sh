#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 SERVER OPTIMIZATION SCRIPT - Demiurge Blockchain
# ═══════════════════════════════════════════════════════════════════════════════
#
# Optimizes the server environment for Phase 11: Revolutionary Features development
# Aligns server configuration with current development trajectory
#
# Usage:
#   ./scripts/optimize-server.sh
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BLOCKCHAIN_DIR="$PROJECT_ROOT/blockchain"

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "    🚀 SERVER OPTIMIZATION - Phase 11 Alignment"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# 1. UPDATE REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ Updating repository...${NC}"
cd "$PROJECT_ROOT"

# Handle untracked files that might conflict
if [ -d "client" ] && [ ! -f "client/.gitkeep" ]; then
    echo -e "  → Backing up untracked client directory"
    mv client /tmp/client-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
fi

if [ -d "ue5-source" ]; then
    echo -e "  → UE5 source directory found (will remain untracked)"
fi

# Pull latest changes
git fetch origin main
git pull origin main || echo -e "${YELLOW}  ⚠ Pull had conflicts or issues${NC}"

echo -e "${GREEN}✓ Repository updated${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# 2. VERIFY TOOLCHAIN
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ Verifying toolchain...${NC}"

# Check Rust
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    echo -e "  → Rust: ${CYAN}$RUST_VERSION${NC}"
    
    # Check WASM target
    if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
        echo -e "  → Adding WASM target..."
        rustup target add wasm32-unknown-unknown
    fi
else
    echo -e "${RED}✗ Rust not found. Install from https://rustup.rs/${NC}"
    exit 1
fi

# Check Cargo
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version | awk '{print $2}')
    echo -e "  → Cargo: ${CYAN}$CARGO_VERSION${NC}"
else
    echo -e "${RED}✗ Cargo not found${NC}"
    exit 1
fi

# Check Node.js (for web platform)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  → Node.js: ${CYAN}$NODE_VERSION${NC}"
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "  → npm: ${CYAN}$NPM_VERSION${NC}"
    else
        echo -e "${YELLOW}  ⚠ npm not found${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ Node.js not found (required for web platform)${NC}"
    echo -e "  → Install with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi

echo -e "${GREEN}✓ Toolchain verified${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# 3. OPTIMIZE DIRECTORY STRUCTURE
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ Optimizing directory structure...${NC}"

# Ensure build directories exist
mkdir -p "$PROJECT_ROOT/build"
mkdir -p "$BLOCKCHAIN_DIR/target"

# Create symlink for target if on RAID 0 setup
if [ -d "/data/Demiurge-Blockchain/build" ] && [ ! -L "$BLOCKCHAIN_DIR/target" ]; then
    echo -e "  → Creating target symlink to RAID 0 build directory"
    ln -sf /data/Demiurge-Blockchain/build "$BLOCKCHAIN_DIR/target" || true
fi

# Clean up old build artifacts (optional, commented out by default)
# echo -e "  → Cleaning old build artifacts..."
# find "$BLOCKCHAIN_DIR/target" -name "*.rlib" -mtime +30 -delete 2>/dev/null || true

echo -e "${GREEN}✓ Directory structure optimized${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# 4. UPDATE .GITIGNORE
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ Updating .gitignore...${NC}"

# Ensure ue5-source is ignored (large directory)
if ! grep -q "^ue5-source/" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    echo "" >> "$PROJECT_ROOT/.gitignore"
    echo "# UE5 Source (large, not tracked)" >> "$PROJECT_ROOT/.gitignore"
    echo "ue5-source/" >> "$PROJECT_ROOT/.gitignore"
    echo -e "  → Added ue5-source/ to .gitignore"
fi

# Ensure build logs are ignored
if ! grep -q "^ue5_.*\.log$" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    echo "ue5_*.log" >> "$PROJECT_ROOT/.gitignore"
    echo -e "  → Added UE5 build logs to .gitignore"
fi

echo -e "${GREEN}✓ .gitignore updated${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# 5. CHECK BLOCKCHAIN BUILD STATUS
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ Checking blockchain build status...${NC}"

cd "$BLOCKCHAIN_DIR"

# Check if node binary exists
if [ -f "target/release/demiurge-node" ]; then
    BINARY_SIZE=$(du -h target/release/demiurge-node | awk '{print $1}')
    echo -e "  → Node binary found: ${CYAN}$BINARY_SIZE${NC}"
else
    echo -e "  → Node binary not built (expected for Phase 11)"
    echo -e "  → Build with: ${CYAN}cd blockchain && cargo build --release --bin demiurge-node${NC}"
fi

# Check compilation status
echo -e "  → Checking compilation status..."
if cargo check --workspace --message-format=short 2>&1 | grep -q "Finished"; then
    echo -e "  → ${GREEN}✓ Code compiles${NC}"
else
    echo -e "  → ${YELLOW}⚠ Compilation issues detected (expected - dependency conflicts being resolved)${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# 6. VERIFY PHASE 11 STRUCTURE
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ Verifying Phase 11 structure...${NC}"

# Check for Phase 11 documentation
if [ -f "$PROJECT_ROOT/docs/PHASE11_INITIALIZATION.md" ]; then
    echo -e "  → ${GREEN}✓ Phase 11 documentation present${NC}"
else
    echo -e "  → ${YELLOW}⚠ Phase 11 documentation missing${NC}"
fi

# Check for revolutionary features roadmap
if [ -f "$PROJECT_ROOT/docs/REVOLUTIONARY_FEATURES_ROADMAP.md" ]; then
    echo -e "  → ${GREEN}✓ Revolutionary features roadmap present${NC}"
else
    echo -e "  → ${YELLOW}⚠ Revolutionary features roadmap missing${NC}"
fi

# Check pallets directory structure
if [ -d "$BLOCKCHAIN_DIR/pallets" ]; then
    PALLET_COUNT=$(find "$BLOCKCHAIN_DIR/pallets" -mindepth 1 -maxdepth 1 -type d | wc -l)
    echo -e "  → Pallets directory: ${CYAN}$PALLET_COUNT pallets${NC}"
else
    echo -e "  → ${RED}✗ Pallets directory missing${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# 7. OPTIMIZE FOR DEVELOPMENT
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}▶ Optimizing for Phase 11 development...${NC}"

# Set up environment variables for development
if [ ! -f "$PROJECT_ROOT/.env.development" ]; then
    cat > "$PROJECT_ROOT/.env.development" << EOF
# Phase 11 Development Environment
RUST_BACKTRACE=1
RUST_LOG=info
CARGO_TERM_COLOR=always
EOF
    echo -e "  → Created .env.development"
fi

# Ensure scripts are executable
chmod +x "$PROJECT_ROOT/scripts/"*.sh 2>/dev/null || true
chmod +x "$PROJECT_ROOT/scripts/"*.ps1 2>/dev/null || true

echo -e "${GREEN}✓ Development environment optimized${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Server optimization complete!${NC}"
echo ""
echo -e "Next steps for Phase 11:"
echo -e "  1. ${CYAN}cd blockchain && cargo check --workspace${NC} (verify compilation)"
echo -e "  2. ${CYAN}cd blockchain && cargo build --release --bin demiurge-node${NC} (build node)"
echo -e "  3. ${CYAN}cd blockchain/pallets && mkdir pallet-session-keys${NC} (start Phase 11)"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
