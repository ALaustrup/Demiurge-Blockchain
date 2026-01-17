#!/bin/bash
# Test Different Substrate Version Combinations
# This script tests various version combinations to find one that resolves librocksdb-sys conflict
# Run on server: bash scripts/test-node-build-versions.sh

set -e

cd "$(dirname "$0")/../blockchain" || exit 1

echo "🧪 Testing Substrate Version Combinations for librocksdb-sys Conflict Resolution"
echo "================================================================================"
echo ""

# Backup original Cargo.toml
cp Cargo.toml Cargo.toml.backup

# Test configurations
declare -a TEST_CONFIGS=(
    "0.56.0:0.56.0"
    "0.55.0:0.55.0"
    "0.54.0:0.54.0"
)

for config in "${TEST_CONFIGS[@]}"; do
    IFS=':' read -r sc_cli_ver sc_service_ver <<< "$config"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Testing: sc-cli=$sc_cli_ver, sc-service=$sc_service_ver"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Update versions in Cargo.toml
    sed -i "s/sc-cli = { version = \".*\"/sc-cli = { version = \"$sc_cli_ver\"/" Cargo.toml
    sed -i "s/sc-service = { version = \".*\"/sc-service = { version = \"$sc_service_ver\"/" Cargo.toml
    
    # Test dependency resolution (lightweight check)
    echo "Running: cargo check --bin demiurge-node --message-format=short 2>&1 | grep -E '(error|librocksdb|conflict)' | head -20"
    
    if timeout 120 cargo check --bin demiurge-node --message-format=short 2>&1 | grep -q "librocksdb-sys.*conflict"; then
        echo "❌ FAILED: librocksdb-sys conflict still present"
        echo ""
    elif timeout 120 cargo check --bin demiurge-node --message-format=short 2>&1 | grep -q "error:"; then
        echo "⚠️  OTHER ERROR: Check output above"
        echo ""
    else
        echo "✅ SUCCESS: No librocksdb-sys conflict detected!"
        echo "✅ Version combination $sc_cli_ver/$sc_service_ver appears to work"
        echo ""
        echo "Recommended configuration:"
        echo "  sc-cli = { version = \"$sc_cli_ver\" }"
        echo "  sc-service = { version = \"$sc_service_ver\" }"
        echo ""
        
        # Restore backup
        cp Cargo.toml.backup Cargo.toml
        exit 0
    fi
    
    # Clean for next test
    cargo clean --bin demiurge-node 2>/dev/null || true
done

# Restore original
cp Cargo.toml.backup Cargo.toml
rm Cargo.toml.backup

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ All tested version combinations still have librocksdb-sys conflict"
echo "📋 Next steps:"
echo "   1. Try dependency override with [patch.crates-io]"
echo "   2. Use Docker build (may resolve differently)"
echo "   3. Wait for Substrate fix"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 1
