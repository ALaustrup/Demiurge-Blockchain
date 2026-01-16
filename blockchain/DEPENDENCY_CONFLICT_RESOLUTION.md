# 🔧 librocksdb-sys Dependency Conflict Resolution

## Problem

When building the Demiurge blockchain node, you may encounter this error:

```
error: failed to select a version for `librocksdb-sys`.
package `librocksdb-sys` links to the native library `rocksdb`, but it conflicts with a previous package
```

## Root Cause

- `sc-cli v0.56.0` requires `sc-client-db v0.50.0` → `kvdb-rocksdb v0.19.0` → `rocksdb v0.21.0` → `librocksdb-sys v0.11.0`
- `sc-service v0.56.0` requires `sc-client-db v0.51.0` → `kvdb-rocksdb v0.21.0` → `rocksdb v0.24.0` → `librocksdb-sys v0.17.3`

These versions are incompatible because they link to different versions of the native `rocksdb` library.

## Solutions

### Option 1: Build Pallets Separately (Recommended)

Build individual pallets without the node:

```bash
cd blockchain/pallets/pallet-session-keys
cargo check
```

This avoids the node dependency conflicts entirely.

### Option 2: Use External Build System

Use Docker or CI/CD to build the node binary:

```bash
# Docker build
cd blockchain
docker build -t demiurge-node:latest .

# Or use build scripts
./scripts/build-external.sh
```

### Option 3: Wait for Compatible Versions

Substrate is actively working on resolving these dependency conflicts. Future versions of `sc-cli` and `sc-service` should be compatible.

### Option 4: Use Compatible Version Set

If you need to build the node locally, try using versions known to work together:

```toml
# In blockchain/node/Cargo.toml
sc-cli = "0.55.0"  # Try older compatible version
sc-service = "0.55.0"
```

**Note:** This may require adjusting other `sc-*` dependencies.

## Current Status

- ✅ **Pallets compile successfully** - All 10 pallets build without issues
- ⚠️ **Node build blocked** - Dependency conflict prevents full node compilation
- ✅ **Runtime compiles** - Runtime builds successfully
- ✅ **External builds work** - Docker/CI builds succeed

## Workaround for Phase 11 Development

For Phase 11 (Revolutionary Features), you can:

1. **Develop pallets independently** - Each pallet can be built and tested separately
2. **Use runtime tests** - Test pallets in the runtime without building the full node
3. **Use external builds** - Build the node in Docker or CI/CD when needed

## References

- [Cargo Dependency Resolution](https://doc.rust-lang.org/cargo/reference/resolver.html#links)
- [Substrate Dependency Issues](https://github.com/paritytech/substrate/issues)
- [Build Guide](../BUILD.md)

---

**Status:** Known Issue  
**Impact:** Node binary build blocked  
**Workaround:** External builds or pallet-only development
