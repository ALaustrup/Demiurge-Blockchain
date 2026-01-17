# librocksdb-sys Version Conflict Between sc-cli and sc-service

## Problem

Building a Substrate node fails with `librocksdb-sys` version conflict. Both `sc-cli` and `sc-service` require incompatible versions that cannot coexist.

## Error

```
error: failed to select a version for `librocksdb-sys`.
package `librocksdb-sys` links to the native library `rocksdb`, but it conflicts with a previous package:
package `librocksdb-sys v0.11.0+8.1.1` (via sc-cli → sc-client-db v0.50.0 → kvdb-rocksdb v0.19.0 → rocksdb v0.21.0)
package `librocksdb-sys v0.17.3+10.4.2` (via sc-service → sc-client-db v0.51.0 → kvdb-rocksdb v0.21.0 → rocksdb v0.24.0)
```

## Reproduction

```toml
[dependencies]
sc-cli = { version = "0.56.0" }
sc-service = { version = "0.56.0" }
```

```bash
cargo check --bin <node-name>
```

## Versions Tested

- sc-cli/sc-service 0.54.0, 0.55.0, 0.56.0, git master → All fail with same conflict

## Impact

- ❌ Cannot build node binaries
- ❌ Blocks local development and CI/CD
- ⚠️ Affects any project using both sc-cli and sc-service

## Questions

1. Is there a compatible version combination?
2. Is a fix planned?
3. Should we use ParityDB instead?

---

**Full report:** See `docs/GITHUB_ISSUE_REPORT.md` for complete details.
