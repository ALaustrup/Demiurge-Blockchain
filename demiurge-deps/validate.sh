#!/bin/bash

# demiurge-deps Validation Script
# Purpose: Verify the monorepo is properly configured and ready to use

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[demiurge-deps] Validation Script${NC}"
echo "======================================"
echo ""

# Check 1: Workspace members exist
echo -e "${YELLOW}[1/5] Checking workspace members...${NC}"
members=("demiurge-substrate" "demiurge-network" "demiurge-consensus")
for member in "${members[@]}"; do
    if [ -d "$member" ]; then
        echo -e "${GREEN}✓${NC} Found $member/"
    else
        echo -e "${RED}✗${NC} Missing $member/"
        exit 1
    fi
done
echo ""

# Check 2: Cargo.toml structure
echo -e "${YELLOW}[2/5] Checking Cargo.toml configuration...${NC}"
if grep -q "^members =" Cargo.toml; then
    echo -e "${GREEN}✓${NC} Workspace members defined"
else
    echo -e "${RED}✗${NC} Missing [workspace] members"
    exit 1
fi

if grep -q "^\[workspace.dependencies\]" Cargo.toml; then
    echo -e "${GREEN}✓${NC} Workspace dependencies defined"
else
    echo -e "${RED}✗${NC} Missing [workspace.dependencies]"
    exit 1
fi
echo ""

# Check 3: Build workspace
echo -e "${YELLOW}[3/5] Building demiurge-deps workspace...${NC}"
if cargo build --release --all 2>&1 | tail -5; then
    echo -e "${GREEN}✓${NC} Workspace builds successfully"
else
    echo -e "${RED}✗${NC} Build failed"
    exit 1
fi
echo ""

# Check 4: Verify dependencies
echo -e "${YELLOW}[4/5] Verifying pinned versions...${NC}"
if grep -q "sp-api = { version = \"39.0.0\"" Cargo.toml; then
    echo -e "${GREEN}✓${NC} sp-api pinned to 39.0.0"
else
    echo -e "${RED}✗${NC} sp-api version mismatch"
    exit 1
fi

if grep -q "frame-support = { version = \"39.0.0\"" Cargo.toml; then
    echo -e "${GREEN}✓${NC} frame-support pinned to 39.0.0"
else
    echo -e "${RED}✗${NC} frame-support version mismatch"
    exit 1
fi
echo ""

# Check 5: Documentation
echo -e "${YELLOW}[5/5] Checking documentation...${NC}"
if [ -f "SETUP_GUIDE.md" ]; then
    echo -e "${GREEN}✓${NC} SETUP_GUIDE.md present"
else
    echo -e "${RED}✗${NC} Missing SETUP_GUIDE.md"
    exit 1
fi

if [ -f "IMPLEMENTATION_SUMMARY.md" ]; then
    echo -e "${GREEN}✓${NC} IMPLEMENTATION_SUMMARY.md present"
else
    echo -e "${RED}✗${NC} Missing IMPLEMENTATION_SUMMARY.md"
    exit 1
fi
echo ""

echo -e "${GREEN}======================================"
echo "✓ All validation checks passed!"
echo "=====================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review SETUP_GUIDE.md"
echo "2. Update blockchain/Cargo.toml to use demiurge-deps"
echo "3. Test blockchain build: cd ../blockchain && cargo build --release"
echo "4. Commit: git add -A && git commit -m 'feat: Add demiurge-deps monorepo'"
