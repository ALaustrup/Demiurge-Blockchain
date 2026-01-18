# 🔧 Substrate Fork & Dependency Fix Plan

> *"Fork, fix, and move forward."*

**Date:** January 2026  
**Branch:** `lesser/dev1`  
**Status:** 📋 **PLANNING**

---

## 🎯 OBJECTIVE

Fork the Substrate repository and fix the `librocksdb-sys` dependency conflict to unblock the blockchain node build.

---

## 🔍 ROOT CAUSE ANALYSIS

### Current Conflict:

**Path 1 (via sc-cli):**
```
sc-cli v0.43.0
└── sc-client-db v0.50.0
    └── kvdb-rocksdb v0.19.0
        └── rocksdb v0.21.0
            └── librocksdb-sys v0.11.0  ← CONFLICT
```

**Path 2 (via sc-service):**
```
sc-service v0.42.0
└── sc-client-db v0.51.0
    └── kvdb-rocksdb v0.21.0
        └── rocksdb v0.24.0
            └── librocksdb-sys v0.17.3  ← CONFLICT
```

### Fix Strategy:

**Option A: Update sc-client-db in sc-cli** (Recommended)
- Fork Substrate
- Update `sc-cli` to use `sc-client-db v0.51.0` (same as sc-service)
- This aligns both paths to use the same `kvdb-rocksdb` version

**Option B: Create compatibility layer**
- Fork `kvdb-rocksdb` or `sc-client-db`
- Create a version that bridges both dependency chains

---

## 📋 STEP-BY-STEP PLAN

### Phase 1: Fork Setup

1. **Fork Substrate Repository**
   ```bash
   # GitHub: https://github.com/paritytech/substrate
   # Fork to: https://github.com/ALaustrup/substrate
   ```

2. **Clone Fork Locally**
   ```bash
   git clone https://github.com/ALaustrup/substrate.git
   cd substrate
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/paritytech/substrate.git
   git fetch upstream
   ```

### Phase 2: Identify Fix Location

**Target Files:**
- `client/cli/Cargo.toml` - sc-cli dependencies
- `client/db/Cargo.toml` - sc-client-db dependencies
- `client/db/src/lib.rs` - May need code updates

**Current Versions to Check:**
```bash
cd substrate
grep -r "sc-client-db" client/cli/Cargo.toml
grep -r "kvdb-rocksdb" client/db/Cargo.toml
```

### Phase 3: Create Fix Branch

```bash
# Create branch from latest upstream
git checkout -b fix/librocksdb-sys-conflict upstream/master

# Or from specific tag matching our Substrate version
git checkout -b fix/librocksdb-sys-conflict v0.43.0
```

### Phase 4: Apply Fix

**Fix Strategy: Update sc-cli to use newer sc-client-db**

1. **Update `client/cli/Cargo.toml`:**
   ```toml
   [dependencies]
   sc-client-db = { version = "0.51.0", path = "../db" }  # Match sc-service version
   ```

2. **Check for API changes:**
   ```bash
   cd client/cli
   cargo check
   ```

3. **Fix any breaking changes** in sc-cli code

4. **Test the fix:**
   ```bash
   # Build sc-cli to verify no conflicts
   cargo build -p sc-cli
   ```

### Phase 5: Use Fork in Demiurge

**Update `blockchain/Cargo.toml`:**
```toml
[patch.crates-io]
# Use our fork with the fix
sc-cli = { git = "https://github.com/ALaustrup/substrate.git", branch = "fix/librocksdb-sys-conflict", package = "sc-cli" }
sc-service = { git = "https://github.com/ALaustrup/substrate.git", branch = "fix/librocksdb-sys-conflict", package = "sc-service" }
sc-client-db = { git = "https://github.com/ALaustrup/substrate.git", branch = "fix/librocksdb-sys-conflict", package = "sc-client-db" }
```

**Or use workspace dependencies:**
```toml
[workspace.dependencies]
sc-cli = { git = "https://github.com/ALaustrup/substrate.git", branch = "fix/librocksdb-sys-conflict", package = "sc-cli" }
sc-service = { git = "https://github.com/ALaustrup/substrate.git", branch = "fix/librocksdb-sys-conflict", package = "sc-service" }
```

### Phase 6: Test Build

```bash
cd blockchain
cargo check --bin demiurge-node
cargo build --release --bin demiurge-node
```

---

## 🔧 ALTERNATIVE APPROACHES

### Approach 1: Minimal Fork (kvdb-rocksdb only)

If the issue is isolated to `kvdb-rocksdb`, fork just that crate:

```bash
# Fork kvdb-rocksdb
git clone https://github.com/paritytech/kvdb-rocksdb.git
# Create compatibility version
```

### Approach 2: Dependency Override

Use Cargo's `[patch]` to override specific versions:

```toml
[patch.crates-io]
librocksdb-sys = { version = "0.17.3" }  # Force single version
rocksdb = { version = "0.24.0" }  # Match sc-service path
```

**Note:** This may not work due to `links` attribute restrictions.

### Approach 3: Wait for Upstream Fix

Monitor Substrate issues:
- https://github.com/paritytech/substrate/issues
- Search: "librocksdb-sys" or "rocksdb conflict"

---

## 📊 EXPECTED OUTCOMES

### Success Criteria:
- ✅ `cargo check --bin demiurge-node` succeeds
- ✅ `cargo build --release --bin demiurge-node` completes
- ✅ No librocksdb-sys conflicts
- ✅ Node binary generated successfully

### Risks:
- ⚠️ Breaking changes in sc-cli API
- ⚠️ Maintenance burden (keeping fork updated)
- ⚠️ Compatibility with other Substrate crates

---

## 🚀 QUICK START COMMANDS

### 1. Fork Repository (GitHub Web UI)
- Go to: https://github.com/paritytech/substrate
- Click "Fork" button
- Fork to: `ALaustrup/substrate`

### 2. Clone and Setup
```bash
git clone https://github.com/ALaustrup/substrate.git
cd substrate
git remote add upstream https://github.com/paritytech/substrate.git
git fetch upstream
```

### 3. Create Fix Branch
```bash
# Find tag matching our Substrate version
git tag | grep "v0.43"

# Create branch
git checkout -b fix/librocksdb-sys-conflict upstream/master
```

### 4. Apply Fix
```bash
# Edit client/cli/Cargo.toml
# Update sc-client-db version to match sc-service
```

### 5. Test Locally
```bash
cargo build -p sc-cli
cargo build -p sc-service
```

### 6. Push and Use
```bash
git push origin fix/librocksdb-sys-conflict
```

---

## 📝 NOTES

- **Repository:** Substrate (not Polkadot) - Substrate is the framework
- **Target:** Fix `sc-cli` to use compatible `sc-client-db` version
- **Maintenance:** Keep fork updated with upstream changes
- **Long-term:** Submit PR to upstream Substrate when fix is stable

---

**Status:** Ready to execute  
**Next:** Fork repository and begin fix

---

*"Fork the path, fix the conflict, build the future."*
