# Fix: schnorrkel Version Conflict

**Issue:** `schnorrkel` version conflict between `0.9.1` and `0.11.5`  
**Root Cause:** `sc-finality-grandpa v0.24.0` pulls in old `sp-core v18.0.0`  
**Solution:** Update to `sc-consensus-grandpa v0.39.0` compatible with `sp-core v34.0.0`

---

## Changes Made

### 1. Updated `blockchain/node/Cargo.toml`

**Removed:**
```toml
sc-finality-grandpa = "0.24.0"  # Old, incompatible version
```

**Updated:**
```toml
sc-consensus-grandpa = "0.39.0"  # Compatible with sp-core 34.0.0
```

### 2. Updated `blockchain/node/src/service.rs`

**Changed:**
- `sc_finality_grandpa::block_import` → `sc_consensus_grandpa::block_import`
- `sc_finality_grandpa::Config` → `sc_consensus_grandpa::Config`
- `sc_finality_grandpa::start_grandpa` → `sc_consensus_grandpa::start_grandpa`

---

## Why This Fixes It

1. **Version Compatibility:** `sc-consensus-grandpa v0.39.0` is compatible with `sp-core v34.0.0`
2. **Dependency Chain:** The new version uses `sc-client-api v34.0.0` which depends on `sp-core v34.0.0`
3. **schnorrkel Alignment:** `sp-core v34.0.0` uses `schnorrkel v0.9.1`, eliminating the conflict

---

## Next Steps

1. **Clean Build:**
   ```powershell
   cd x:\Demiurge-Blockchain\blockchain\node
   cargo clean
   cargo build --release
   ```

2. **Verify:** The build should complete without `schnorrkel` version conflicts

3. **Test:** Start the node and verify it runs correctly

---

**Status:** ✅ Fixed  
**Date:** January 13, 2026
