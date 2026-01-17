# librocksdb-sys Version Conflict Between sc-cli and sc-service

## Summary

Building a Substrate node binary fails due to an unresolvable `librocksdb-sys` version conflict between `sc-cli` and `sc-service` dependencies. Both crates transitively depend on different versions of `librocksdb-sys` (v0.11.0 and v0.17.3) that cannot coexist due to Cargo's `links` attribute.

## Environment

- **Rust Version:** `rustc 1.84.0` (or latest stable)
- **Cargo Version:** `cargo 1.84.0`
- **OS:** Ubuntu 24.04.3 LTS (also tested on Windows/WSL2)
- **Substrate Versions Tested:** 0.54.0, 0.55.0, 0.56.0, master branch

## Steps to Reproduce

1. Create a new Substrate node project or use existing one
2. Add both `sc-cli` and `sc-service` dependencies:

```toml
# In workspace Cargo.toml or node Cargo.toml
[dependencies]
sc-cli = { version = "0.56.0" }
sc-service = { version = "0.56.0" }
```

3. Attempt to build the node binary:

```bash
cargo check --bin <node-name>
# or
cargo build --release --bin <node-name>
```

## Expected Behavior

The build should succeed, resolving all dependencies without conflicts.

## Actual Behavior

Build fails with `librocksdb-sys` version conflict error:

```
error: failed to select a version for `librocksdb-sys`.
package `librocksdb-sys` links to the native library `rocksdb`, but it conflicts with a previous package which links to `rocksdb` as well:
package `librocksdb-sys v0.11.0+8.1.1`
    ... which satisfies dependency `librocksdb-sys = "^0.11.0"` of package `rocksdb v0.21.0`
failed to select a version for `librocksdb-sys` which could resolve this conflict
```

## Dependency Tree Analysis

### Conflict Path 1 (via sc-cli):
```
sc-cli v0.56.0
└── sc-client-db v0.50.0
    └── kvdb-rocksdb v0.19.0
        └── rocksdb v0.21.0
            └── librocksdb-sys v0.11.0  ← CONFLICT
```

### Conflict Path 2 (via sc-service):
```
sc-service v0.56.0
└── sc-client-db v0.51.0
    └── kvdb-rocksdb v0.21.0
        └── rocksdb v0.24.0
            └── librocksdb-sys v0.17.3  ← CONFLICT
```

### Why This Cannot Be Resolved

The `librocksdb-sys` crate declares `links = "rocksdb"` in its `Cargo.toml`. Cargo's dependency resolver enforces that only **one version** of a linked native library can exist in the dependency graph. This prevents having both `librocksdb-sys v0.11.0` and `librocksdb-sys v0.17.3` simultaneously, making the conflict **unresolvable** without upstream changes.

## Minimal Reproduction Case

**Cargo.toml:**
```toml
[package]
name = "test-substrate-node"
version = "0.1.0"
edition = "2021"

[dependencies]
sc-cli = { version = "0.56.0" }
sc-service = { version = "0.56.0" }
```

**Command:**
```bash
cargo check --bin test-substrate-node
```

**Result:** Build fails with librocksdb-sys conflict

## Versions Tested

| sc-cli | sc-service | Result |
|--------|------------|--------|
| 0.56.0 | 0.56.0 | ❌ Conflict |
| 0.55.0 | 0.55.0 | ❌ Conflict |
| 0.54.0 | 0.54.0 | ❌ Conflict |
| git master | git master | ❌ Conflict |

## Attempted Solutions

### 1. Version Alignment
- **Attempted:** Using same version for both `sc-cli` and `sc-service`
- **Result:** ❌ Conflict persists across all tested versions

### 2. Dependency Override
- **Attempted:** Using `[patch.crates-io]` to force single `librocksdb-sys` version
- **Result:** ❌ Cannot patch crates.io dependency with itself
- **Error:** `patches must point to different sources`

### 3. Git Dependencies
- **Attempted:** Using git dependencies from Substrate master branch
- **Result:** ❌ Same conflict exists in master branch

### 4. Docker Build
- **Attempted:** Building in Docker with isolated environment
- **Result:** ❌ Same conflict occurs in Docker

### 5. Intermediate Dependency Patching
- **Attempted:** Patching `kvdb-rocksdb` or `rocksdb` dependencies
- **Result:** ⚠️ Not attempted (would require forking and maintaining)

## Impact

- **Node Binary Build:** ❌ **BLOCKED** - Cannot build Substrate node binaries
- **Local Development:** ⚠️ **LIMITED** - Can build pallets/runtime separately, but not full node
- **CI/CD:** ❌ **BLOCKED** - Build pipelines fail
- **Production Deployment:** ❌ **BLOCKED** - Cannot deploy blockchain nodes

## Workarounds

1. **Pallet-Only Development:** ✅ Works - Can build individual pallets without node binary
2. **Runtime Build:** ✅ Works - Can build runtime separately
3. **Pre-built Binaries:** ✅ If available - Can use pre-built node binaries
4. **ParityDB Alternative:** ⚠️ Untested - May work if configured to use ParityDB instead of RocksDB

## Additional Context

- This appears to be a **known issue** in the Substrate ecosystem
- The conflict exists across multiple Substrate versions (0.54.0, 0.55.0, 0.56.0, master)
- The issue is **not specific to our project** - it affects any project using both `sc-cli` and `sc-service`
- The root cause is in the dependency tree structure, not in our code
- **Critical Issue:** `sc-cli` and `sc-service` at the same version (0.56.0) depend on different versions of `sc-client-db` (0.50.0 vs 0.51.0), creating an incompatible dependency chain

## Technical Details

### Cargo Links Attribute

The `librocksdb-sys` crate uses Cargo's `links` attribute:

```toml
[package]
links = "rocksdb"
```

This tells Cargo that the crate links to a native library named `rocksdb`. Cargo enforces that only **one version** of a linked native library can exist in the dependency graph to prevent symbol conflicts at link time.

### Why Standard Dependency Resolution Fails

Normal Rust crate version resolution allows multiple versions of the same crate (e.g., `serde v1.0` and `serde v2.0` can coexist). However, native libraries cannot be versioned this way - there can only be one `librocksdb.so` linked into the final binary.

### The Conflict

- `librocksdb-sys v0.11.0` links to RocksDB 8.1.1
- `librocksdb-sys v0.17.3` links to RocksDB 10.4.2
- Both cannot be linked simultaneously
- Cargo cannot choose one over the other because both are required by different parts of the dependency tree

## Related Issues

Please check if there are existing issues:
- Search for: `librocksdb-sys conflict`
- Search for: `sc-cli sc-service rocksdb`
- Search for: `links attribute rocksdb`

## Questions for Maintainers

1. **Version Compatibility:** Is there a recommended version combination of `sc-cli` and `sc-service` that avoids this conflict? We've tested 0.54.0, 0.55.0, 0.56.0, and master - all fail.

2. **Upstream Fix:** Is there a planned fix in an upcoming Substrate release? This seems like a fundamental dependency alignment issue.

3. **Workaround:** Should we use ParityDB instead of RocksDB as a workaround? If so, how do we configure `sc-cli` and `sc-service` to use ParityDB?

4. **Dependency Alignment:** Why do `sc-cli v0.56.0` and `sc-service v0.56.0` depend on different versions of `sc-client-db` (0.50.0 vs 0.51.0)? Should these be aligned?

5. **Recommended Approach:** What is the recommended approach for projects that need both `sc-cli` and `sc-service`?

## Suggested Fix

We believe the fix should involve:

1. **Aligning `sc-client-db` versions:** Ensure `sc-cli` and `sc-service` at the same version use the same `sc-client-db` version
2. **Unifying RocksDB versions:** Ensure the entire dependency chain uses compatible RocksDB/librocksdb-sys versions
3. **Version compatibility matrix:** Provide clear documentation on which versions work together

This would prevent the conflict from occurring in the first place.

## Full Error Output

```
error: failed to select a version for `librocksdb-sys`.
package `librocksdb-sys` links to the native library `rocksdb`, but it conflicts with a previous package which links to `rocksdb` as well:
package `librocksdb-sys v0.11.0+8.1.1`
    ... which satisfies dependency `librocksdb-sys = "^0.11.0"` of package `rocksdb v0.21.0`
    ... which satisfies dependency `rocksdb = "^0.21.0"` of package `kvdb-rocksdb v0.19.0`
    ... which satisfies dependency `kvdb-rocksdb = "^0.19.0"` of package `sc-client-db v0.50.0`
    ... which satisfies dependency `sc-client-db = "^0.50.0"` of package `sc-cli v0.56.0`
    ... which satisfies dependency `sc-cli = "^0.56.0"` of package `demiurge-node v0.1.0`
package `librocksdb-sys v0.17.3+10.4.2`
    ... which satisfies dependency `librocksdb-sys = "^0.17.3"` of package `rocksdb v0.24.0`
    ... which satisfies dependency `rocksdb = "^0.24.0"` of package `kvdb-rocksdb v0.21.0`
    ... which satisfies dependency `kvdb-rocksdb = "^0.21.0"` of package `sc-client-db v0.51.0`
    ... which satisfies dependency `sc-client-db = "^0.51.0"` of package `sc-service v0.56.0`
    ... which satisfies dependency `sc-service = "^0.56.0"` of package `demiurge-node v0.1.0`
failed to select a version for `librocksdb-sys` which could resolve this conflict
```

## Dependency Chain Details

### Path 1: sc-cli → librocksdb-sys v0.11.0
```
demiurge-node v0.1.0
└── sc-cli v0.56.0
    └── sc-client-db v0.50.0
        └── kvdb-rocksdb v0.19.0
            └── rocksdb v0.21.0
                └── librocksdb-sys v0.11.0+8.1.1
```

### Path 2: sc-service → librocksdb-sys v0.17.3
```
demiurge-node v0.1.0
└── sc-service v0.56.0
    └── sc-client-db v0.51.0
        └── kvdb-rocksdb v0.21.0
            └── rocksdb v0.24.0
                └── librocksdb-sys v0.17.3+10.4.2
```

### Key Observation

The issue is that `sc-cli` and `sc-service` depend on **different versions** of `sc-client-db`:
- `sc-cli v0.56.0` → `sc-client-db v0.50.0` (older)
- `sc-service v0.56.0` → `sc-client-db v0.51.0` (newer)

These different `sc-client-db` versions pull in incompatible `kvdb-rocksdb` and `rocksdb` versions, ultimately requiring different `librocksdb-sys` versions.

---

**Report Generated:** January 17, 2026  
**Project:** Demiurge Blockchain  
**Contact:** @Alaustrup (GitHub)
