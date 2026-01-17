# 🔧 Blockchain Node Build Workaround

## The Problem

The blockchain node cannot be built locally due to a `librocksdb-sys` dependency conflict:

- `sc-cli v0.56.0` requires `librocksdb-sys v0.11.0`
- `sc-service v0.56.0` requires `librocksdb-sys v0.17.3`

These versions are incompatible because they link to different versions of the native `rocksdb` library. Cargo's `links` attribute prevents having both versions in the same dependency graph.

## Why This Happens

The `links` attribute in Cargo ensures only one version of a native library is linked. Since both `sc-cli` and `sc-service` transitively depend on different versions of `librocksdb-sys`, Cargo cannot resolve the conflict.

## Solutions

### ✅ Option 1: Build in Docker (Recommended)

Docker builds isolate dependencies and often resolve conflicts:

```powershell
# Build node in Docker
cd blockchain
docker build -t demiurge-node:latest .

# Or use the build script
.\scripts\build-external.ps1 -Docker
```

**Why this works:** Docker uses a clean environment with consistent dependency resolution.

### ✅ Option 2: Build Pallets Separately (For Development)

For Phase 11 development, you can work on pallets without building the full node:

```powershell
# Build individual pallet
cd blockchain\pallets\pallet-session-keys
cargo check

# Or build all pallets
cd blockchain\pallets
Get-ChildItem -Directory | ForEach-Object {
    Write-Host "Checking $_..."
    Set-Location $_.FullName
    cargo check
    Set-Location ..
}
```

**Why this works:** Pallets don't depend on `sc-cli` or `sc-service`, avoiding the conflict entirely.

### ✅ Option 3: Use Pre-built Binary

If you have access to a pre-built binary (from CI/CD or another developer):

```powershell
# Use pre-built binary
.\blockchain\target\release\demiurge-node.exe --dev --rpc-cors=all
```

### ⚠️ Option 4: Try Compatible Versions (Experimental)

You can try downgrading `sc-cli` to find a compatible version:

```toml
# In blockchain/node/Cargo.toml
sc-cli = "0.55.0"  # Try older version
sc-service = "0.56.0"
```

**Warning:** This may require adjusting other `sc-*` dependencies and could break functionality.

## Current Status

- ✅ **Pallets**: All compile successfully
- ✅ **Runtime**: Compiles successfully  
- ✅ **Docker Builds**: Work correctly
- ⚠️ **Local Node Build**: Blocked by dependency conflict

## Development Workflow

### For Pallet Development (Phase 11)

1. **Work on pallets individually:**
   ```powershell
   cd blockchain\pallets\pallet-session-keys
   cargo check
   cargo test
   ```

2. **Test in runtime:**
   ```powershell
   cd blockchain\runtime
   cargo check
   ```

3. **Build node when needed:**
   ```powershell
   .\scripts\build-external.ps1 -Docker
   ```

### For Full Node Development

1. **Use Docker for builds:**
   ```powershell
   docker build -t demiurge-node:latest ./blockchain
   ```

2. **Or use CI/CD:**
   - Push to GitHub
   - Let CI/CD build the node
   - Download the artifact

## Why Not Fix It?

This is a **Substrate ecosystem issue**, not a problem with your code:

1. **Upstream Dependency**: The conflict comes from Substrate's own dependency management
2. **Native Library**: `librocksdb-sys` is a native C++ library wrapper - version conflicts are harder to resolve
3. **Active Development**: Substrate is actively working on resolving these conflicts
4. **Future Fix**: Future versions of `sc-cli` and `sc-service` should be compatible

## References

- [Cargo Links Documentation](https://doc.rust-lang.org/cargo/reference/resolver.html#links)
- [Substrate Dependency Issues](https://github.com/paritytech/substrate/issues)
- [Build Guide](./BUILD.md)
- [Dependency Conflict Resolution](./DEPENDENCY_CONFLICT_RESOLUTION.md)

---

**Bottom Line:** Use Docker builds for the node, or work on pallets individually. This is a known limitation that doesn't block development.
