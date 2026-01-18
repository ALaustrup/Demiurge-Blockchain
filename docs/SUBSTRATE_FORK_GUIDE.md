# 🚀 Substrate Fork & Fix - Complete Guide

> *"Fork the path, fix the conflict, build the future."*

**Date:** January 2026  
**Objective:** Fix `librocksdb-sys` dependency conflict by forking Substrate

---

## 📋 QUICK START

### Step 1: Fork on GitHub (Manual)

1. Go to: https://github.com/paritytech/substrate
2. Click **"Fork"** button (top right)
3. Fork to: `ALaustrup/substrate`
4. Wait for fork to complete

### Step 2: Setup Local Fork

```powershell
cd x:\Demiurge-Blockchain
.\scripts\fork-substrate.ps1
```

Or manually:
```powershell
git clone https://github.com/ALaustrup/substrate.git
cd substrate
git remote add upstream https://github.com/paritytech/substrate.git
git fetch upstream
git checkout -b fix/librocksdb-sys-conflict upstream/master
```

### Step 3: Apply the Fix

**Target:** Update `sc-cli` to use `sc-client-db v0.51.0` (same as `sc-service`)

**File to edit:** `substrate/client/cli/Cargo.toml`

**Change:**
```toml
# Before:
sc-client-db = { version = "0.50.0", path = "../db" }

# After:
sc-client-db = { version = "0.51.0", path = "../db" }
```

### Step 4: Test the Fix

```bash
cd substrate
cargo build -p sc-cli
cargo build -p sc-service
```

### Step 5: Commit and Push

```bash
git add client/cli/Cargo.toml
git commit -m "fix: Update sc-cli to use sc-client-db v0.51.0 to resolve librocksdb-sys conflict"
git push origin fix/librocksdb-sys-conflict
```

### Step 6: Use Fork in Demiurge

```powershell
cd x:\Demiurge-Blockchain
.\scripts\apply-substrate-fix.ps1
```

Then test:
```bash
cd blockchain
cargo update
cargo check --bin demiurge-node
```

---

## 🔍 DETAILED ANALYSIS

### Current Dependency Versions

**In `blockchain/Cargo.toml`:**
- `sc-cli = "0.43.0"`
- `sc-service = "0.42.0"`

**Conflict Chain:**
- `sc-cli v0.43.0` → `sc-client-db v0.50.0` → `kvdb-rocksdb v0.19.0` → `rocksdb v0.21.0` → `librocksdb-sys v0.11.0`
- `sc-service v0.42.0` → `sc-client-db v0.51.0` → `kvdb-rocksdb v0.21.0` → `rocksdb v0.24.0` → `librocksdb-sys v0.17.3`

### Fix Strategy

**Update `sc-cli` to use `sc-client-db v0.51.0`:**

1. This aligns both `sc-cli` and `sc-service` to use the same `sc-client-db` version
2. Both will then use `kvdb-rocksdb v0.21.0` → `rocksdb v0.24.0` → `librocksdb-sys v0.17.3`
3. No more conflict!

---

## 📝 FILES TO MODIFY

### In Substrate Fork:

1. **`client/cli/Cargo.toml`**
   ```toml
   [dependencies]
   sc-client-db = { version = "0.51.0", path = "../db" }  # Update from 0.50.0
   ```

2. **Check for API changes:**
   - Review `client/cli/src/lib.rs` for breaking changes
   - Check if `sc-client-db v0.51.0` API is compatible

### In Demiurge Blockchain:

1. **`blockchain/Cargo.toml`** (via script)
   ```toml
   [patch.crates-io]
   sc-cli = { git = "https://github.com/ALaustrup/substrate.git", branch = "fix/librocksdb-sys-conflict", package = "sc-cli" }
   sc-service = { git = "https://github.com/ALaustrup/substrate.git", branch = "fix/librocksdb-sys-conflict", package = "sc-service" }
   sc-client-db = { git = "https://github.com/ALaustrup/substrate.git", branch = "fix/librocksdb-sys-conflict", package = "sc-client-db" }
   ```

---

## 🧪 TESTING CHECKLIST

- [ ] Fork created on GitHub
- [ ] Local fork cloned
- [ ] Fix branch created
- [ ] `sc-client-db` version updated in `sc-cli`
- [ ] `cargo build -p sc-cli` succeeds
- [ ] `cargo build -p sc-service` succeeds
- [ ] Changes committed and pushed
- [ ] Fork applied to Demiurge `Cargo.toml`
- [ ] `cargo update` runs successfully
- [ ] `cargo check --bin demiurge-node` succeeds
- [ ] `cargo build --release --bin demiurge-node` completes

---

## 🚨 TROUBLESHOOTING

### Issue: Fork not found
**Solution:** Make sure you've forked on GitHub first:
- Go to https://github.com/paritytech/substrate
- Click "Fork"
- Wait for completion

### Issue: API breaking changes
**Solution:** Check `sc-client-db` changelog between v0.50.0 and v0.51.0:
```bash
cd substrate/client/db
git log v0.50.0..v0.51.0
```

### Issue: Build still fails
**Solution:** May need to update other dependencies:
```bash
cargo tree | grep librocksdb-sys
# Check all paths
```

### Issue: Git dependency slow
**Solution:** Use specific commit instead of branch:
```toml
sc-cli = { git = "https://github.com/ALaustrup/substrate.git", rev = "abc1234", package = "sc-cli" }
```

---

## 📊 EXPECTED RESULTS

### Before Fix:
```
error: failed to select a version for `librocksdb-sys`.
package `librocksdb-sys` links to the native library `rocksdb`, but it conflicts
```

### After Fix:
```
✅ Compiling sc-cli v0.43.0
✅ Compiling sc-service v0.42.0
✅ Compiling demiurge-node v0.1.0
✅ Finished release [optimized] target(s)
```

---

## 🎯 SUCCESS CRITERIA

- ✅ No `librocksdb-sys` conflicts
- ✅ `demiurge-node` binary builds successfully
- ✅ All tests pass
- ✅ Fork is maintainable (can sync with upstream)

---

**Status:** Ready to execute  
**Next:** Fork repository on GitHub, then run setup script

---

*"Fork the path, fix the conflict, build the future."*
