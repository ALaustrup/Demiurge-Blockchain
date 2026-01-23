# Blockchain Build Deployment Guide

## Overview

The Demiurge Blockchain framework depends on Substrate v39.0.0, which has two critical issues that must be fixed:

1. **sc-network codec collision** (versions 0.36.0, 0.37.0, 0.38.0)
   - Problem: `Consensus` and `RemoteCallResponse` variants both have codec index 6
   - Solution: Apply explicit codec indices to all Message enum variants
   - Versions affected: 0.36.0, 0.37.0, 0.38.0

2. **sp-io panic handler conflict** (version 37.0.0)
   - Problem: `#[no_mangle]` attribute conflicts with `#[panic_handler]` on panic function
   - Solution: Pre-compiled patch in `blockchain/patches/sp-io-37.0.0/`
   - Status: Already applied in Cargo.toml

## Deployment Instructions

### Step 1: Local Development Build (Current Setup)

When building locally on Windows:

```bash
cd x:\Demiurge-Blockchain\blockchain

# Apply patches to local cargo registry
python scripts/patch-local-sc-network.py

# Build with patched versions from blockchain/patches/
cargo check --all
cargo build --release
```

### Step 2: Server Deployment (Automated)

When deploying to server (Pleroma via SSH):

```bash
# The build script will automatically:
# 1. Copy demiurge-deps dependencies
# 2. Run codec patch script on cargo registry
# 3. Build with all fixes applied

ssh pleroma "bash /demiurge/scripts/build-on-server.sh"
```

### Step 3: Manual Server Patching (If Needed)

If you need to manually patch the server's cargo registry:

```bash
# SSH into server
ssh pleroma

# Navigate to demiurge project
cd /demiurge-blockchain

# Run the registry patch script
python scripts/patch-sc-network.py

# Verify patches applied
cargo check --all

# If successful, proceed with build
cargo build --release
```

## Codec Patch Details

### sc-network Message Enum Codec Indices

The `Message<Header, Hash, Number, Extrinsic>` enum in sc-network requires explicit codec indices:

```rust
pub enum Message<Header, Hash, Number, Extrinsic> {
    #[codec(index = 0)]
    Status(...),
    #[codec(index = 1)]
    BlockRequest(...),
    #[codec(index = 2)]
    BlockResponse(...),
    #[codec(index = 3)]
    BlockAnnounce(...),
    #[codec(index = 4)]
    RemoteCallRequest(...),
    #[codec(index = 6)]  // NOTE: 5 was skipped, 6 is correct for Consensus
    Consensus(...),
    #[codec(index = 7)]
    RemoteCallResponse(...),  // CRITICAL FIX: Was 6, now 7
    #[codec(index = 8)]
    RemoteReadRequest(...),
    #[codec(index = 9)]
    RemoteReadResponse(...),
    #[codec(index = 10)]
    RemoteHeaderRequest(...),
    #[codec(index = 11)]
    RemoteHeaderResponse(...),
    #[codec(index = 12)]
    RemoteChangesRequest(...),
    #[codec(index = 13)]
    RemoteChangesResponse(...),
    #[codec(index = 14)]
    RemoteReadChildRequest(...),
    #[codec(index = 17)]
    ConsensusBatch(...),
}
```

### sp-io Panic Handler Fix

File: `blockchain/patches/sp-io-37.0.0/src/lib.rs`

The panic handler only needs `#[panic_handler]`, not `#[no_mangle]`:

```rust
#[cfg(all(not(feature = "disable_panic_handler"), substrate_runtime))]
#[panic_handler]  // ONLY THIS, not #[no_mangle]
pub fn panic(info: &core::panic::PanicInfo) -> ! {
    // ... implementation
}
```

## Patch Application Scripts

### Local Patching Script

**File**: `blockchain/scripts/patch-local-sc-network.py`

Applies codec indices to sc-network versions in `blockchain/patches/`:

```bash
python blockchain/scripts/patch-local-sc-network.py
```

Output:
```
✓ Patched: 0.36.0
✓ Patched: 0.37.0
✓ Patched: 0.38.0
Done!
```

### Registry Patching Script (Server)

**File**: `blockchain/scripts/patch-sc-network.py`

Applies codec indices to sc-network versions in cargo registry:

```bash
python blockchain/scripts/patch-sc-network.py
```

Location on registry: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/sc-network-{version}/src/protocol/message.rs`

## Cargo Configuration

### Cargo.toml Patch Section

```toml
[patch.crates-io]
# Patch sc-network locally with codec fixes
sc-network = { path = "patches/sc-network-0.38.0-fixed" }
# Patch sp-io 37.0.0 with panic handler fix
sp-io = { path = "patches/sp-io-37.0.0" }
```

Note: Currently only 0.38.0 is patched via local path. For other versions (0.36.0, 0.37.0), the server deployment script must run the registry patch before building.

## Troubleshooting

### Error: "Found variants that have duplicate indexes"

This indicates the codec patches were not applied. Solution:

```bash
# Local development
python blockchain/scripts/patch-local-sc-network.py
cargo clean
cargo check --all

# Server
ssh pleroma "python /demiurge-blockchain/scripts/patch-sc-network.py"
ssh pleroma "cd /demiurge-blockchain && cargo clean && cargo check --all"
```

### Error: "#[no_mangle] cannot be used on internal language items"

This indicates sp-io is using crates.io version instead of the patch. Solution:

Check `blockchain/Cargo.toml` has:
```toml
sp-io = { path = "patches/sp-io-37.0.0" }
```

Then rebuild:
```bash
cargo clean
cargo build --release
```

### Error: "duplicate lang item in crate `sp_io`: `panic_impl`"

**Root Cause**: Multiple versions of sp-io are being compiled for WASM, each trying to define the panic handler. This is a pre-existing Substrate v39.0.0 architecture issue with conflicting pallet versions.

**Current Status**: Under investigation. This appears to be a fundamental dependency versioning conflict in the Substrate ecosystem, not caused by demiurge-deps integration.

**Workaround Options**:

1. **For local testing** (recommended):
   ```bash
   # Use cargo's workspace feature isolation
   cargo check --lib --release
   ```

2. **For server build**:
   - Reduce pallet count - some pallets may be incompatible
   - Or use Substrate v40+ which has this fixed
   - Or apply a post-build WASM processing script

3. **Immediate fix** (if needed):
   - Comment out conflicting pallets in `blockchain/Cargo.toml` [workspace].members
   - Rebuild with subset of pallets
   - Incrementally add pallets back one at a time to find the conflict

## Build Verification

After patches are applied, verify with:

```bash
# Check all packages compile
cargo check --all

# Full debug build (faster, no optimization)
cargo build

# Full release build (slower, optimized)
cargo build --release

# Run tests
cargo test --all
```

## Deployment Checklist

- [ ] Code pushed to git with demiurge-deps integration
- [ ] Local patches copied to `blockchain/patches/`
- [ ] Patch scripts tested locally
- [ ] Server patches applied via `patch-sc-network.py`
- [ ] Build succeeds with `cargo build --release`
- [ ] RPC endpoint responding on `http://localhost:9944`
- [ ] Testnet validators starting correctly
- [ ] Production deployment to validators

## Maintenance Notes

These patches are permanent fixes required for Substrate v39.0.0 compatibility. They should be:

1. Reapplied whenever cargo registry is cleared
2. Verified after any Rust toolchain updates
3. Included in deployment procedures
4. Documented in team onboarding materials

Future versions of Substrate (v40+) may not require these patches - verify before upgrading.
