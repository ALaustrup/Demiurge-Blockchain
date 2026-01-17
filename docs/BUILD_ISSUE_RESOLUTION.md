# Blockchain Node Build Issue Resolution

## Current Issue

Build failing with `frame-system` compilation errors after downgrading `sc-cli` and `sc-service` to `0.55.0`.

## Error Analysis

The error indicates version conflicts between:
- `frame-system@37.1.0`
- `frame-system@38.0.0` 
- `frame-system@39.1.0`

## Root Cause

Downgrading `sc-cli`/`sc-service` to `0.55.0` pulled in incompatible `frame-system` versions from transitive dependencies.

## Solutions

### Option 1: Use Compatible Version Set (Recommended)

Align all Substrate dependencies to a known-compatible set:

```toml
# In blockchain/node/Cargo.toml
sc-cli = "0.54.0"
sc-service = "0.54.0"
sc-client-api = "37.0.0"
sc-rpc = "39.0.0"
# ... align other sc-* dependencies
```

### Option 2: Force Frame-System Version

Add to `blockchain/Cargo.toml`:

```toml
[patch.crates-io]
frame-system = "38.0.0"
```

### Option 3: Build Node Externally (Current Workaround)

Build the node outside Docker Compose due to `librocksdb-sys` conflict. This is documented in `docker/BLOCKCHAIN_NODE.md`.

## Recommended Action

For now, **continue with external build** as documented. The `librocksdb-sys` conflict makes Docker builds problematic regardless of version alignment.

Once the node is built externally, it can run as a systemd service or Docker container.

---

**Status**: Build issue documented, external build recommended
