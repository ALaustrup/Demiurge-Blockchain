# 🔧 FFLONK Dependency Fix

**Date:** January 17, 2026  
**Issue:** `bandersnatch_vrfs` requires `fflonk` which cannot be found

---

## Problem

```
error: no matching package named `fflonk` found
location searched: Git repository https://github.com/w3f/fflonk
required by package `bandersnatch_vrfs v0.0.1`
```

**Root Cause:** The `bandersnatch_vrfs` crate (from `w3f/ring-vrf`) depends on `fflonk` from `w3f/fflonk`, but the repository may be inaccessible or the git reference is broken.

---

## Solution Options

### Option 1: Update Cargo.lock (Recommended)

The `fflonk` dependency should be resolved from the Substrate fork's `Cargo.lock`. Try:

```powershell
cd x:\Demiurge-Blockchain\blockchain

# Copy Cargo.lock from Substrate fork
Copy-Item ..\substrate\Cargo.lock .\Cargo.lock -Force

# Update dependencies
cargo update
```

### Option 2: Disable Optional Dependency Resolution

Since `bandersnatch_vrfs` is optional (only enabled with `bandersnatch-experimental` feature), you can work around this by ensuring the feature is not enabled anywhere.

**Verify no features enabled:**
```powershell
cd x:\Demiurge-Blockchain\blockchain
grep -r "bandersnatch-experimental" .
```

Should return nothing (feature is not enabled).

### Option 3: Use Offline Mode (Skip Git Fetching)

Since `bandersnatch_vrfs` is optional and not used, you can use offline mode:

```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo check --bin demiurge-node --offline
```

This uses the git references already in `Cargo.lock` without trying to fetch them.

### Option 4: Use Substrate Cargo.lock

Copy the working `Cargo.lock` from the Substrate fork:

```powershell
cd x:\Demiurge-Blockchain\blockchain
Copy-Item ..\substrate\Cargo.lock .\Cargo.lock
cargo check --bin demiurge-node
```

---

## Quick Fix Commands

**Option A: Use Script (Recommended)**
```powershell
cd x:\Demiurge-Blockchain
.\scripts\fix-fflonk-with-lock.ps1
```

**Option B: Manual Steps (Recommended)**
```powershell
cd x:\Demiurge-Blockchain\blockchain

# Copy Cargo.lock from Substrate fork (has working git references)
Copy-Item ..\substrate\Cargo.lock .\Cargo.lock -Force

# Update dependencies (will fail on fflonk - that's OK, it's optional)
cargo update

# Check build (fflonk errors can be ignored - dependency is optional)
cargo check --bin demiurge-node

# Build (fflonk warnings won't block the build)
cargo build --bin demiurge-node --release
```

**Option C: Use Build Script**
```powershell
cd x:\Demiurge-Blockchain
.\scripts\build-with-fflonk-workaround.ps1
```

---

## Why This Happens

1. **Optional Dependencies:** Even though `bandersnatch_vrfs` is optional, Cargo still resolves all dependencies in the dependency graph to build it.

2. **Git Dependencies:** Git dependencies can fail if:
   - Repository is private or moved
   - Git reference (commit/tag) doesn't exist
   - Network issues accessing GitHub

3. **Substrate Fork:** The Substrate fork's `Cargo.lock` has working git references that were resolved when the fork was created.

---

## Verification

After applying fix, verify:

```powershell
cargo tree -p bandersnatch_vrfs
```

Should show the dependency is resolved (or not present if feature is disabled).

---

**Last Updated:** January 17, 2026
