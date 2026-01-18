# Build in External Terminal - Prevents Cursor Crashes

## Why?
Cursor crashes when handling large Rust builds. Use external terminal instead.

## Quick Steps

### 1. Open External PowerShell
   - Press `Win + X`
   - Select "Windows PowerShell" or "Terminal"
   - Navigate to project: `cd x:\Demiurge-Blockchain`

### 2. Test Substrate Build
   ```powershell
   cd substrate
   cargo build -p sc-cli
   ```

### 3. If Build Succeeds, Commit
   ```powershell
   git add client/db/Cargo.toml bin/node/bench/Cargo.toml
   git commit -m "fix: Update kvdb-rocksdb to 0.21.0 to resolve librocksdb-sys conflict"
   git push origin fix/librocksdb-sys-conflict
   ```

### 4. Apply to Demiurge
   ```powershell
   cd x:\Demiurge-Blockchain
   .\scripts\apply-substrate-fix.ps1
   cd blockchain
   cargo check --bin demiurge-node
   ```

## Current Status

✅ **librocksdb-sys conflict RESOLVED!**
- `kvdb-rocksdb` updated to 0.21.0
- `librocksdb-sys` now unified at v0.17.3

⚠️ **New issue:** `wasm-bindgen` compatibility
- This is separate from the original conflict
- Can be addressed after main fix is committed

## Files Modified
- ✅ `substrate/client/db/Cargo.toml`
- ✅ `substrate/bin/node/bench/Cargo.toml`

---

**Use external terminal for all cargo builds to keep Cursor stable!**
