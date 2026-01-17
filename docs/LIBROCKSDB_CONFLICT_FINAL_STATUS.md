# 🔧 librocksdb-sys Conflict - Final Testing Status

**Date:** January 17, 2026  
**Status:** 🔴 **UNRESOLVED** - All tested solutions failed

---

## 📊 TEST RESULTS SUMMARY

| Solution | Status | Result |
|----------|--------|--------|
| Version 0.56.0 | ❌ FAILED | librocksdb-sys conflict confirmed |
| Version 0.55.0 | ❌ FAILED | Same conflict |
| Version 0.54.0 | ❌ FAILED | Same conflict |
| Docker Build | ❌ FAILED | Same conflict in Docker |
| Git Dependencies (master) | ❌ FAILED | Same conflict in Substrate master |
| Dependency Override (patch) | ❌ FAILED | Cannot patch crates.io with itself |

---

## 🔍 ROOT CAUSE

The conflict is **fundamental** and exists across all tested Substrate versions:

- `sc-cli` → `sc-client-db v0.50.0` → `kvdb-rocksdb v0.19.0` → `rocksdb v0.21.0` → `librocksdb-sys v0.11.0`
- `sc-service` → `sc-client-db v0.51.0` → `kvdb-rocksdb v0.21.0` → `rocksdb v0.24.0` → `librocksdb-sys v0.17.3`

**Cargo's `links` attribute prevents both versions from coexisting.**

---

## 💡 RECOMMENDED SOLUTIONS

### Option 1: Fork and Fix (RECOMMENDED FOR IMMEDIATE RESOLUTION)

1. Fork `sc-client-db` or `kvdb-rocksdb`
2. Update dependency chain to use single `librocksdb-sys` version
3. Use git dependency pointing to fork

**Pros:** Immediate resolution  
**Cons:** Maintenance burden, need to keep fork updated

### Option 2: Wait for Substrate Fix (RECOMMENDED FOR LONG-TERM)

Monitor Substrate releases and GitHub issues:
- https://github.com/paritytech/substrate/issues
- Search for "librocksdb-sys" or "rocksdb conflict"

**Pros:** No maintenance  
**Cons:** Unknown timeline

### Option 3: Use ParityDB Instead of RocksDB

If possible, configure Substrate to use ParityDB instead of RocksDB:

```toml
sc-service = { version = "0.56.0", default-features = false, features = ["parity-db"] }
```

**Pros:** Avoids RocksDB entirely  
**Cons:** May require runtime changes, different performance characteristics

### Option 4: Build Pallets Only (CURRENT WORKAROUND)

Continue development with pallet-only builds:

```bash
# This works fine
cargo build --release -p pallet-*

# This fails
cargo build --release --bin demiurge-node
```

**Pros:** Development can continue  
**Cons:** Cannot test full node locally

---

## 🎯 IMMEDIATE ACTION PLAN

1. **Continue pallet development** ✅ (Works fine)
2. **Use Docker for node builds** (if needed, may work with different Rust version)
3. **Monitor Substrate for fix** (set up GitHub watch)
4. **Consider Option 3 (ParityDB)** if feasible

---

## 📝 NOTES

- **Cursor Crashes:** Avoid `cargo check` locally - use server
- **This is upstream issue:** Not a problem with our code
- **All versions affected:** 0.54.0, 0.55.0, 0.56.0, and master all have conflict
- **Docker doesn't help:** Same conflict occurs in Docker builds

---

**Last Updated:** January 17, 2026  
**Next Review:** When Substrate releases fix or after implementing Option 1
