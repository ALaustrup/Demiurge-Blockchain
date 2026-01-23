# demiurge-deps: Dependency Management Monorepo

**Status**: ✅ Complete  
**Last Updated**: 2025-01-22  
**Version**: 0.1.0

---

## Overview

The **demiurge-deps** monorepo is a **Cargo workspace** that centralizes all Demiurge Substrate dependency management. It provides:

1. **Single source of truth** for pinned Substrate crate versions
2. **Wrapper packages** that enforce dependency constraints
3. **Patched dependencies** for known compatibility issues
4. **Consolidated configuration** to prevent version drift across the blockchain

### Key Problems Solved

| Problem | Solution | Location |
|---------|----------|----------|
| Conflicting `sc-network` enum variants | Custom wrapper with patches | `demiurge-network/` |
| Version drift between packages | Workspace dependencies | `Cargo.toml` ([workspace.dependencies]) |
| Runtime compilation failures | Pinned to Substrate v39 (compatible with Polkadot v1.0) | All members |
| WASM target issues | Explicit `wasm32-unknown-unknown` configuration | Build scripts reference this |

---

## Structure

```
demiurge-deps/
├── Cargo.toml                    # Workspace root with pinned versions
├── demiurge-substrate/           # Re-exports core Substrate crates
├── demiurge-network/             # Custom sc-network wrapper with patches
└── demiurge-consensus/           # Consensus layer abstraction
```

### Member Packages

#### 1. **demiurge-substrate** (`demiurge-substrate/`)
**Purpose**: Single import point for all Substrate runtime dependencies.

```toml
# Instead of:
frame-support = "39.0.0"
frame-executive = "39.0.0"
sp-api = "39.0.0"
...

# You do:
demiurge-substrate = { path = "demiurge-deps/demiurge-substrate" }
```

Re-exports:
- `frame-*` (executive, support, system)
- `sp-*` (api, core, runtime, consensus, etc.)
- Codec utilities (parity-scale-codec, scale-info)

#### 2. **demiurge-network** (`demiurge-network/`)
**Purpose**: Fixed `sc-network` implementation with enum variant collision patches.

**Why separate?**
- `sc-network v0.38.0` has a codec enum collision: both `Consensus` and `RemoteCallResponse` use index 6
- This wrapper provides a clean fix without modifying `~/.cargo` registry
- Custom implementation avoids pulling in unused Substrate consensus machinery

**Usage in runtime**:
```rust
use demiurge_network::*;  // Safe to use, patches already applied
```

#### 3. **demiurge-consensus** (`demiurge-consensus/`)
**Purpose**: Consensus abstraction layer for Aura + GRANDPA.

Provides:
- Unified consensus trait interfaces
- Consensus initialization helpers
- Network integration for consensus gossip

---

## Dependency Versions (Reference)

All pinned to **Substrate v39.0.0** (compatible with Polkadot v1.0):

```toml
[Substrate Core]
frame-executive = "39.0.0"
frame-support = "39.0.0"
frame-system = "39.0.0"

[Primitives]
sp-api = "39.0.0"
sp-core = "39.0.0"
sp-runtime = "39.0.0"
sp-io = "39.0.0"

[Consensus]
sp-consensus = "0.39.1"
sp-consensus-aura = "0.39.0"
sp-consensus-grandpa = "0.39.0"
sc-consensus = "0.39.1"
sc-consensus-aura = "0.39.0"
sc-consensus-grandpa = "0.39.0"

[Utilities]
parity-scale-codec = "3.6.5"
scale-info = "2.11.1"
```

---

## Usage in Main Blockchain

### From `blockchain/runtime/Cargo.toml`:

```toml
[dependencies]
# Use demiurge-substrate for most dependencies
demiurge-substrate = { path = "../../demiurge-deps/demiurge-substrate" }
demiurge-network = { path = "../../demiurge-deps/demiurge-network" }
demiurge-consensus = { path = "../../demiurge-deps/demiurge-consensus" }

# Re-export from demiurge-substrate
frame-executive = { workspace = true }  # From demiurge-deps/Cargo.toml [workspace.dependencies]
frame-support = { workspace = true }
frame-system = { workspace = true }
```

### In Rust Code:

```rust
// Option 1: Use demiurge-substrate re-exports
use demiurge_substrate::{
    frame_support::{self, pallet_prelude::*},
    sp_runtime::traits::*,
};

// Option 2: Direct workspace dependencies (identical pins)
use frame_support::pallet_prelude::*;
use sp_runtime::traits::*;
```

---

## Build Process

### Local Build (with demiurge-deps)

```bash
# Install Rust toolchain (one-time)
rustup toolchain install nightly-2024-01-01
rustup target add wasm32-unknown-unknown

# Build demiurge-deps workspace first
cd demiurge-deps
cargo build --release --all

# Then build blockchain runtime (automatically resolves demiurge-deps)
cd ../blockchain
cargo build --release
```

### Applying Patches

The `demiurge-network` package includes an example of how to patch dependencies:

**If sc-network enum collision reappears:**

1. Edit `demiurge-deps/demiurge-network/src/lib.rs`
2. Add fix (add `#[codec(index = X)]` to duplicate variants)
3. Rebuild: `cargo build --release --all`

**Registry patch location** (for reference, not needed with our wrapper):
```
~/.cargo/registry/src/index.crates.io-*/sc-network-0.38.0/src/protocol/message.rs
```

---

## Troubleshooting

### Error: "version requirement `=0.38.0` for package `sc-network` cannot be satisfied"

**Solution**: Ensure `demiurge-deps/demiurge-network` is in the `[dependencies]` of your Cargo.toml:

```toml
demiurge-network = { path = "../../demiurge-deps/demiurge-network" }
```

### Error: "Both `Consensus` and `RemoteCallResponse` have index `6`"

**Solution**: You're not using the patched `demiurge-network`. Switch to:

```rust
use demiurge_network::*;  // Already patched
```

### WASM Target Issues

```bash
# Ensure WASM target is installed
rustup target add wasm32-unknown-unknown

# Force rebuild WASM runtime
cargo build --release --target wasm32-unknown-unknown --package blockchain-runtime
```

### Cargo Lock Mismatch

```bash
# Clean and rebuild to sync Cargo.lock
cargo clean
cargo build --release --all
```

---

## Maintenance

### Updating Substrate Version

1. Update all versions in `demiurge-deps/Cargo.toml` ([workspace.dependencies])
2. Test with: `cd demiurge-deps && cargo check --all`
3. Update `blockchain/Cargo.toml` to reference new patches if needed
4. Rebuild blockchain: `cargo build --release`
5. Run testnet validation: `framework/testnet/run-testnet.sh`

### Adding New Wrapper Package

Example: Adding `demiurge-storage` wrapper

```bash
# 1. Create directory
mkdir demiurge-deps/demiurge-storage

# 2. Create Cargo.toml
cat > demiurge-deps/demiurge-storage/Cargo.toml << 'EOF'
[package]
name = "demiurge-storage"
version.workspace = true
edition.workspace = true

[dependencies]
sp-storage = { version = "39.0.0" }
sp-database = { version = "17.0.0" }
# ... other storage crates
EOF

# 3. Update demiurge-deps/Cargo.toml [workspace] members
members = ["demiurge-substrate", "demiurge-network", "demiurge-consensus", "demiurge-storage"]

# 4. Create lib.rs
touch demiurge-deps/demiurge-storage/src/lib.rs

# 5. Verify
cargo build --release --all
```

---

## Related Documentation

- **Main Blockchain**: [blockchain/README.md](../blockchain/README.md)
- **Framework RPC**: [framework/README.md](../framework/README.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)
- **Build Status**: [BUILD_STATUS_CURRENT.md](../BUILD_STATUS_CURRENT.md)

---

## Next Steps

After **demiurge-deps** is committed:

1. ✅ Verify blockchain builds against demiurge-deps
2. ✅ Test RPC health against local node
3. ✅ Validate testnet with new dependency structure
4. 📋 Document in main README.md
5. 🚀 Use as single source of truth for all dependency management

---

**Questions?** See [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) or check the `.cursorrules` file for architecture context.
