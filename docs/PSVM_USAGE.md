# Using psvm to Resolve librocksdb-sys Conflict

## What is psvm?

`psvm` (Polkadot SDK Version Manager) is a tool from ParityTech that automatically updates all Substrate/Polkadot SDK dependencies in your `Cargo.toml` to match a specific Polkadot SDK release version. This ensures all dependencies are compatible with each other.

## Installation

```bash
cargo install --git https://github.com/paritytech/psvm psvm
```

## Available Commands

### List Available Versions
```bash
psvm --list
```

### Check Current Version Compatibility
```bash
psvm --check --path blockchain/Cargo.toml
```

### Update to Specific Version
```bash
psvm --version 1.14.0 --path blockchain/Cargo.toml
```

### Update with Overwrite (for local dependencies)
```bash
psvm --version 1.14.0 --path blockchain/Cargo.toml --overwrite
```

## How This Can Help

The `librocksdb-sys` conflict occurs because `sc-cli` and `sc-service` at the same version depend on different versions of `sc-client-db`, creating incompatible dependency chains.

By using `psvm` to update to a specific Polkadot SDK version, all dependencies will be aligned to versions that are known to work together, potentially resolving the conflict.

## Recommended Approach

1. **Check current version compatibility:**
   ```bash
   cd blockchain
   psvm --check --path Cargo.toml
   ```

2. **Try latest stable version:**
   ```bash
   psvm --version 1.14.0 --path Cargo.toml
   ```

3. **Test build:**
   ```bash
   cargo check --bin demiurge-node
   ```

4. **If conflict persists, try older versions:**
   ```bash
   psvm --version 1.13.0 --path Cargo.toml
   psvm --version 1.12.0 --path Cargo.toml
   # etc.
   ```

## Notes

- `psvm` updates dependencies based on Polkadot SDK releases, not individual crate versions
- This ensures all `sc-*`, `frame-*`, `sp-*` crates are compatible
- May require updating your code if APIs changed between versions
- Always test after updating

---

**Created:** January 17, 2026  
**Tool:** psvm v0.3.1
