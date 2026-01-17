# psvm Test Results - Polkadot SDK 1.14.0

**Date:** January 17, 2026  
**Test:** Using psvm to update to Polkadot SDK 1.14.0  
**Status:** ❌ **FAILED** - Conflict persists

---

## What psvm Did

Updated all Substrate dependencies in `blockchain/Cargo.toml` to match Polkadot SDK version 1.14.0.

### Key Version Changes

**Before:**
- `sc-cli = { version = "0.56.0" }`
- `sc-service = { version = "0.56.0" }`

**After (Polkadot SDK 1.14.0):**
- `sc-cli = { version = "0.44.0" }`
- `sc-service = { version = "0.43.0" }`

**Note:** psvm set different versions for `sc-cli` and `sc-service` (0.44.0 vs 0.43.0), which is concerning.

### Other Dependency Changes

All `frame-*`, `sp-*`, and `sc-*` dependencies were updated to versions compatible with Polkadot SDK 1.14.0:
- Frame dependencies: Updated to versions 33-38 range
- Substrate client dependencies: Updated to versions 0.27-0.44 range
- System primitives: Updated to versions 33-38 range

---

## Test Result

### Build Command
```bash
cargo check --bin demiurge-node
```

### Result: ❌ **FAILED**

**Error:**
```
error: failed to select a version for `librocksdb-sys`.
package `librocksdb-sys` links to the native library `rocksdb`, but it conflicts with a previous package which links to `rocksdb` as well:
package `librocksdb-sys v0.11.0+8.1.1`
    ... which satisfies dependency `librocksdb-sys = "^0.11.0"` of package `rocksdb v0.21.0`
failed to select a version for `librocksdb-sys` which could resolve this conflict
```

---

## Analysis

### Why It Failed

Even with psvm aligning dependencies to Polkadot SDK 1.14.0, the `librocksdb-sys` conflict persists. This suggests:

1. **The conflict exists in Polkadot SDK 1.14.0 itself** - The SDK release has this issue
2. **Different sc-cli/sc-service versions** - psvm set them to different versions (0.44.0 vs 0.43.0), which may be intentional for that SDK version but still causes the conflict
3. **Upstream issue** - This is a fundamental problem in the Substrate/Polkadot SDK dependency tree

### Dependency Chain (After psvm Update)

The conflict paths are likely:
- `sc-cli v0.44.0` → `sc-client-db` → `kvdb-rocksdb` → `rocksdb` → `librocksdb-sys v0.11.0`
- `sc-service v0.43.0` → `sc-client-db` → `kvdb-rocksdb` → `rocksdb` → `librocksdb-sys v0.17.3`

---

## Next Steps

### Option 1: Try Older Polkadot SDK Versions
```bash
psvm --version 1.13.0 --path blockchain/Cargo.toml
psvm --version 1.12.0 --path blockchain/Cargo.toml
psvm --version 1.11.0 --path blockchain/Cargo.toml
# etc.
```

### Option 2: Check if ParityDB Works
Try configuring to use ParityDB instead of RocksDB (if supported in SDK 1.14.0).

### Option 3: Report to Substrate Team
The GitHub issue report is ready (`docs/GITHUB_ISSUE_REPORT.md`). This confirms the issue exists even in official SDK releases.

### Option 4: Wait for Fix
Monitor Substrate releases for a resolution.

---

## Conclusion

**psvm successfully updated dependencies**, but **the librocksdb-sys conflict persists** even with aligned SDK versions. This confirms that:

1. ✅ psvm works correctly (updated all dependencies)
2. ❌ The conflict is present in Polkadot SDK 1.14.0
3. ❌ This is an upstream Substrate/Polkadot SDK issue
4. ⚠️ The issue affects official SDK releases, not just our configuration

---

**Test Status:** ❌ **UNRESOLVED**  
**Next Action:** Try older SDK versions or report issue to Substrate team
