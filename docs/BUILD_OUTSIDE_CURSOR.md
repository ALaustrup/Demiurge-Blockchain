# 🔨 Building Outside Cursor

**Date:** January 17, 2026  
**Purpose:** Avoid Cursor crashes during blockchain builds

---

## 🚀 Quick Start

### Option 1: PowerShell Script (Recommended)

```powershell
# Navigate to project root
cd x:\Demiurge-Blockchain

# Run check (fast, no compilation)
.\scripts\build-blockchain-external.ps1 -Check

# Build debug binary
.\scripts\build-blockchain-external.ps1 -Build

# Build release binary (optimized)
.\scripts\build-blockchain-external.ps1 -Build -Release

# Clean build artifacts
.\scripts\build-blockchain-external.ps1 -Clean
```

### Option 2: Direct Cargo Commands

Open **PowerShell** (not Cursor terminal) and run:

```powershell
# Navigate to blockchain directory
cd x:\Demiurge-Blockchain\blockchain

# Check compilation (fast)
cargo check --bin demiurge-node

# Build debug binary
cargo build --bin demiurge-node

# Build release binary (optimized, slower)
cargo build --bin demiurge-node --release

# Clean build artifacts
cargo clean
```

---

## 📋 Common Commands

### Check Specific Package

```powershell
cd x:\Demiurge-Blockchain\blockchain

# Check runtime
cargo check --package demiurge-runtime

# Check a specific pallet
cargo check --package pallet-energy

# Check all workspace members
cargo check --workspace
```

### Build Specific Target

```powershell
cd x:\Demiurge-Blockchain\blockchain

# Build node binary
cargo build --bin demiurge-node

# Build with verbose output
cargo build --bin demiurge-node --verbose

# Build with specific features
cargo build --bin demiurge-node --features runtime-benchmarks
```

### Update Dependencies

```powershell
cd x:\Demiurge-Blockchain\blockchain

# Update Cargo.lock
cargo update

# Update specific dependency
cargo update -p frame-system
```

### View Dependency Tree

```powershell
cd x:\Demiurge-Blockchain\blockchain

# Show dependency tree
cargo tree

# Show dependency tree for specific package
cargo tree -p frame-system

# Show only conflicts
cargo tree -d
```

---

## 🔍 Troubleshooting

### Check Build Errors

```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo check --bin demiurge-node 2>&1 | Select-Object -First 100
```

### View Full Error Output

```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo check --bin demiurge-node 2>&1 | Out-File build-errors.txt
notepad build-errors.txt
```

### Check Dependency Versions

```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo tree -p frame-system -p frame-support -p sp-api -p sp-runtime
```

### Verify Patches Are Applied

```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo tree -p frame-system | Select-String "substrate"
```

Should show paths like `X:\Demiurge-Blockchain\substrate\frame\system` if patches are working.

---

## 📊 Build Output Locations

### Debug Build
- **Binary:** `x:\Demiurge-Blockchain\blockchain\target\debug\demiurge-node.exe`
- **Size:** ~50-100 MB

### Release Build
- **Binary:** `x:\Demiurge-Blockchain\blockchain\target\release\demiurge-node.exe`
- **Size:** ~20-40 MB (optimized)

### Build Logs
- **Check log:** `x:\Demiurge-Blockchain\blockchain\build-check.log` (if using script)
- **Build log:** `x:\Demiurge-Blockchain\blockchain\build.log` (if using script)

---

## ⚡ Performance Tips

1. **Use `cargo check`** for quick validation (no binary generation)
2. **Use `--release`** only when you need the optimized binary
3. **Clean build** (`cargo clean`) if you suspect stale artifacts
4. **Build specific packages** instead of entire workspace when possible

---

## 🐛 Common Issues

### "Patch was not used in the crate graph"

This is usually harmless - it means the patch isn't needed for that specific dependency path. Check if the build succeeds anyway.

### Version Conflicts

If you see version conflicts:
1. Check `blockchain/Cargo.toml` patches
2. Verify Substrate fork paths exist
3. Run `cargo update` to refresh lock file

### Out of Memory

If builds fail due to memory:
1. Close other applications
2. Use `cargo check` instead of `cargo build`
3. Build in release mode (uses less memory during optimization)

---

## 📝 Notes

- **Always use PowerShell** (not Cmd) for better error handling
- **Build logs** are saved automatically when using the script
- **Release builds** take longer but produce optimized binaries
- **Check builds** are faster and catch most compilation errors

---

**Last Updated:** January 17, 2026
