# 🚀 Substrate Fork - Quick Start Guide

## Prerequisites

1. **GitHub Account**: You need to be signed in to GitHub
2. **Fork the Repository**: Fork `paritytech/substrate` to `ALaustrup/substrate`

## Quick Process

### Option A: Automated (Recommended)

Once you've forked on GitHub, run:

```powershell
cd x:\Demiurge-Blockchain
.\scripts\complete-substrate-fix.ps1
```

This will:
1. ✅ Verify fork exists
2. ✅ Clone fork locally
3. ✅ Apply the fix (update sc-client-db to v0.51.0)
4. ✅ Test Substrate build
5. ✅ Commit and push (optional)
6. ✅ Apply fix to Demiurge
7. ✅ Test Demiurge build

### Option B: Step-by-Step

#### Step 1: Fork on GitHub (Manual)
1. Go to: https://github.com/paritytech/substrate
2. Click **"Fork"** button
3. Fork to: `ALaustrup/substrate`
4. Wait for completion

#### Step 2: Setup Local Fork
```powershell
cd x:\Demiurge-Blockchain
.\scripts\verify-and-setup-fork.ps1
```

#### Step 3: Apply Fix in Fork
```powershell
.\scripts\apply-substrate-fix-in-fork.ps1
```

#### Step 4: Test Fix
```powershell
cd substrate
cargo build -p sc-cli
```

#### Step 5: Commit and Push
```powershell
git add client/cli/Cargo.toml
git commit -m "fix: Update sc-cli to use sc-client-db v0.51.0 to resolve librocksdb-sys conflict"
git push origin fix/librocksdb-sys-conflict
```

#### Step 6: Apply to Demiurge
```powershell
cd x:\Demiurge-Blockchain
.\scripts\apply-substrate-fix.ps1
```

#### Step 7: Test Demiurge Build
```powershell
cd blockchain
cargo update
cargo check --bin demiurge-node
```

## What Gets Fixed?

**Problem:**
- `sc-cli v0.43.0` uses `sc-client-db v0.50.0` → `librocksdb-sys v0.11.0`
- `sc-service v0.42.0` uses `sc-client-db v0.51.0` → `librocksdb-sys v0.17.3`
- **Conflict!** ❌

**Solution:**
- Update `sc-cli` to use `sc-client-db v0.51.0` (same as `sc-service`)
- Both now use `librocksdb-sys v0.17.3`
- **No conflict!** ✅

## Troubleshooting

### Fork Not Found
- Make sure you've forked on GitHub first
- Check: https://github.com/ALaustrup/substrate

### Build Fails
- Check Rust toolchain: `rustup show`
- Update Cargo: `cargo update`
- Clear cache: `cargo clean`

### Git Push Fails
- Check authentication: `git remote -v`
- Verify branch: `git branch`

## Files Modified

1. **Substrate Fork:**
   - `client/cli/Cargo.toml` - Updated `sc-client-db` version

2. **Demiurge:**
   - `blockchain/Cargo.toml` - Added `[patch.crates-io]` section

## Success Criteria

- ✅ `cargo build -p sc-cli` succeeds in Substrate fork
- ✅ `cargo check --bin demiurge-node` succeeds in Demiurge
- ✅ No `librocksdb-sys` conflicts

---

**Ready?** Fork the repository, then run the automated script!
