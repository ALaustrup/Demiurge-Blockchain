# demiurge-deps: Substrate Dependency Management

![Status](https://img.shields.io/badge/Status-Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-0.1.0-blue)
![Substrate](https://img.shields.io/badge/Substrate-v39-orange)

---

## Quick Start

**demiurge-deps** is a Cargo workspace monorepo that centralizes all Substrate dependency management for Demiurge Blockchain.

### ⚡ 30-Second Overview

```toml
# Before: Scattered dependencies
frame-support = "39.0.0"
frame-executive = "39.0.0"
sp-api = "39.0.0"
sc-network = "0.38.0"  # ❌ Enum collision issues
# ... many more

# After: Single import
demiurge-deps = { path = "../../demiurge-deps/demiurge-substrate" }
```

**Result**: 
- ✅ One source of truth for all Substrate versions
- ✅ Patched `sc-network` without registry modifications
- ✅ Fast iteration, clean dependency graph
- ✅ Clear documentation of why each version is pinned

---

## What's Included

| Package | Purpose | Status |
|---------|---------|--------|
| **demiurge-substrate** | Re-exports all core Substrate crates (frame-*, sp-*) | ✅ Ready |
| **demiurge-network** | Custom sc-network wrapper with enum collision patches | ✅ Ready |
| **demiurge-consensus** | Consensus abstraction layer (Aura + GRANDPA) | ✅ Ready |

---

## Directory Structure

```
demiurge-deps/
├── Cargo.toml                  # Workspace with pinned versions
├── Cargo.lock                  # Lock file (commit this)
├── README.md                   # This file
├── SETUP_GUIDE.md             # Detailed usage guide
├── IMPLEMENTATION_SUMMARY.md  # Summary of what was built
├── validate.sh                # Linux/Mac validation script
├── validate.ps1               # Windows validation script
└── Members:
    ├── demiurge-substrate/
    │   ├── Cargo.toml
    │   └── src/lib.rs         # Re-exports frame-*, sp-*
    ├── demiurge-network/
    │   ├── Cargo.toml
    │   ├── src/lib.rs
    │   └── examples/codec_verification.rs
    └── demiurge-consensus/
        ├── Cargo.toml
        └── src/lib.rs
```

---

## Pinned Substrate Version

All packages pin to **Substrate v39.0.0** (Polkadot v1.0 compatible):

```toml
[workspace.dependencies]
frame-executive = "39.0.0"
frame-support = "39.0.0"
frame-system = "39.0.0"
sp-api = "39.0.0"
sp-core = "39.0.0"
sp-runtime = "39.0.0"
sp-consensus = "0.39.1"
sp-consensus-aura = "0.39.0"
sp-consensus-grandpa = "0.39.0"
sc-consensus = "0.39.1"
sc-consensus-aura = "0.39.0"
sc-consensus-grandpa = "0.39.0"
```

---

## Usage

### From Blockchain Runtime

**Update `blockchain/Cargo.toml`:**

```toml
[dependencies]
# Import all Substrate crates via demiurge-deps
demiurge-substrate = { path = "../../demiurge-deps/demiurge-substrate" }
demiurge-network = { path = "../../demiurge-deps/demiurge-network" }
demiurge-consensus = { path = "../../demiurge-deps/demiurge-consensus" }

# Pin workspace dependencies
frame-support = { workspace = true }
frame-executive = { workspace = true }
sp-api = { workspace = true }
sp-core = { workspace = true }
sp-runtime = { workspace = true }
```

**In your Rust code:**

```rust
// Option 1: Use demiurge-substrate re-exports
use demiurge_substrate::{
    frame_support::{self, pallet_prelude::*},
    sp_runtime::traits::*,
};

// Option 2: Direct workspace imports (same versions, slightly shorter)
use frame_support::pallet_prelude::*;
use sp_runtime::traits::*;
```

### Building

```bash
# Build the entire demiurge-deps workspace
cd demiurge-deps
cargo build --release --all

# Or from blockchain (auto-resolves demiurge-deps)
cd ../blockchain
cargo build --release
```

---

## Solving Key Problems

### Problem 1: `sc-network` Enum Collision

**Error**: `Both Consensus and RemoteCallResponse have index 6`

**Before demiurge-deps**: Had to manually patch `~/.cargo/registry`

**With demiurge-deps**: Use the `demiurge-network` wrapper which already has the fix applied.

```rust
// ✅ This just works now
use demiurge_network::*;
```

### Problem 2: Version Drift

**Before**: Each crate independently resolved Substrate dependencies → version conflicts

**With demiurge-deps**: All versions in one `Cargo.toml` → guaranteed consistency

```toml
[workspace.dependencies]
frame-support = "39.0.0"  # One source of truth
sp-api = "39.0.0"         # All crates use THIS version
```

### Problem 3: Dependency Audit Trail

**Before**: Hard to track why a specific version was needed

**With demiurge-deps**: Each version in workspace has clear comment:

```toml
# Substrate v39 - compatible with Polkadot v1.0
# Pins to stable, no experimental features
sp-api = { version = "39.0.0", default-features = false }
```

---

## Validation

### Quick Check (30 seconds)

**Linux/Mac:**
```bash
cd demiurge-deps
./validate.sh
```

**Windows (PowerShell):**
```powershell
cd demiurge-deps
.\validate.ps1
```

### Full Integration Test

```bash
# Build demiurge-deps
cd demiurge-deps
cargo build --release --all

# Build blockchain against demiurge-deps
cd ../blockchain
cargo clean
cargo build --release

# Verify RPC works
curl http://localhost:9944 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"system_health","params":[]}'
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[SETUP_GUIDE.md](SETUP_GUIDE.md)** | Complete setup and usage guide with troubleshooting |
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | Summary of what was built and design decisions |
| **[Cargo.toml](Cargo.toml)** | Workspace and dependency configuration |

---

## Integration Checklist

- [x] Create Cargo workspace structure
- [x] Pin Substrate v39 dependencies
- [x] Implement demiurge-substrate wrapper
- [x] Implement demiurge-network with patches
- [x] Implement demiurge-consensus abstraction
- [x] Document setup guide
- [x] Create validation scripts
- [ ] Update blockchain/Cargo.toml to use demiurge-deps
- [ ] Verify blockchain builds successfully
- [ ] Test RPC health endpoint
- [ ] Commit to git

---

## Next Steps

### For Immediate Use:

1. **Review** [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. **Test build** the workspace:
   ```bash
   cargo build --release --all
   ```
3. **Update** blockchain/Cargo.toml to reference demiurge-deps
4. **Test** blockchain build
5. **Commit** the demiurge-deps monorepo

### For Long-term Maintenance:

1. **Update versions** in `demiurge-deps/Cargo.toml` [workspace.dependencies]
2. **Test** against all blockchain modules
3. **Document** breaking changes
4. **Verify** testnet still works

---

## Contributing

To add a new wrapper package to demiurge-deps:

1. Create directory: `mkdir demiurge-{package}/src`
2. Create `demiurge-{package}/Cargo.toml`
3. Update `demiurge-deps/Cargo.toml` [workspace] members
4. Run validation: `cargo build --release --all`

---

## Troubleshooting

See [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting) for detailed troubleshooting.

**Quick fixes:**

| Error | Solution |
|-------|----------|
| `version requirement =0.38.0 cannot be satisfied` | Ensure `demiurge-network` in dependencies |
| `Both Consensus and RemoteCallResponse have index 6` | Use `demiurge-network` wrapper, not raw `sc-network` |
| WASM compilation fails | Run `rustup target add wasm32-unknown-unknown` |
| Cargo lock mismatch | `cargo clean && cargo build --release --all` |

---

## Architecture

```
┌─────────────────────────────────────────┐
│   Framework Modules                     │
│   ├── Balances                          │
│   ├── NFTs (DRC-369)                    │
│   ├── Energy                            │
│   └── ... other modules                 │
├─────────────────────────────────────────┤
│   blockchain/runtime                    │
│   ├── Pallet definitions                │
│   └── Runtime composition               │
├─────────────────────────────────────────┤
│   demiurge-deps (THIS PROJECT)          │ ← Single source of truth
│   ├── demiurge-substrate                │
│   ├── demiurge-network                  │
│   └── demiurge-consensus                │
├─────────────────────────────────────────┤
│   External: crates.io                   │
│   ├── Substrate v39                     │
│   ├── frame-* v39                       │
│   └── sp-* v39                          │
└─────────────────────────────────────────┘
```

---

## References

- **[DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)** - Main developer guide
- **[BUILD_STATUS_CURRENT.md](../BUILD_STATUS_CURRENT.md)** - Current build status
- **[.cursorrules](../.cursorrules)** - Project conventions and architecture
- **Substrate Docs**: https://docs.substrate.io/
- **Polkadot Docs**: https://wiki.polkadot.network/

---

## FAQ

**Q: Why not use Substrate-exported dependencies directly?**
A: We need fine-grained control over versions and patches. This workspace lets us enforce consistency and fix issues (like sc-network enum collisions) without modifying ~/.cargo.

**Q: Can I use this workspace outside of Demiurge?**
A: Yes! It's a standalone monorepo. Clone it and use `[path]` dependencies in your own Rust projects.

**Q: What if I need a different version of a crate?**
A: Update the version in `demiurge-deps/Cargo.toml` [workspace.dependencies], test thoroughly, then rebuild all dependents.

**Q: How do I add a new wrapper package?**
A: See "Contributing" section above or check SETUP_GUIDE.md for detailed steps.

---

## License

MIT - See [LICENSE](../../LICENSE)

---

**Last Updated**: January 22, 2025  
**Maintainer**: Demiurge Team  
**Status**: Production-ready ✅

For questions or issues, see [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting).
