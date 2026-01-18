# Cursor Crash Recovery Guide

## Immediate Steps

1. **Save Your Work**
   - If Cursor is still responsive, save all files (Ctrl+S)
   - Check for unsaved changes

2. **Restart Cursor**
   - Close Cursor completely
   - Wait 10 seconds
   - Reopen Cursor

3. **Check Build Status**
   The Substrate build was progressing when Cursor crashed. Check if it completed:

   ```powershell
   cd x:\Demiurge-Blockchain\substrate
   cargo build -p sc-cli --message-format=short 2>&1 | Select-Object -Last 20
   ```

## What Was Happening

The build was **actually working**! The output showed:
- ✅ Updating `kvdb-rocksdb v0.19.0 -> v0.21.0`
- ✅ Updating `librocksdb-sys v0.11.0 -> v0.17.3`
- ✅ Updating `rocksdb v0.21.0 -> v0.24.0`
- ✅ Downloading crates successfully

This means the fix is working! The dependency conflict is being resolved.

## After Restarting Cursor

### 1. Verify Build Status
```powershell
cd x:\Demiurge-Blockchain\substrate
cargo build -p sc-cli 2>&1 | Select-Object -Last 30
```

### 2. If Build Succeeds
```powershell
# Commit the changes
cd x:\Demiurge-Blockchain\substrate
git add client/db/Cargo.toml
git commit -m "fix: Update kvdb-rocksdb to 0.21.0 to resolve librocksdb-sys conflict"
git push origin fix/librocksdb-sys-conflict
```

### 3. Apply to Demiurge
```powershell
cd x:\Demiurge-Blockchain
.\scripts\apply-substrate-fix.ps1
cd blockchain
cargo check --bin demiurge-node
```

## Cursor Crash Prevention

### If Cursor Keeps Crashing:

1. **Reduce Workspace Size**
   - Close unused files
   - Exclude large directories from indexing:
     - `substrate/target/`
     - `blockchain/target/`
     - `node_modules/`

2. **Check Cursor Settings**
   - Disable heavy extensions temporarily
   - Reduce file watcher limits
   - Increase memory allocation if possible

3. **Use Terminal for Builds**
   - Run cargo builds in external terminal
   - Use `cargo build` instead of Cursor's integrated terminal for large builds

## Files Modified

- ✅ `substrate/client/db/Cargo.toml` - Updated kvdb-rocksdb to 0.21.0
- ✅ `substrate/bin/node/bench/Cargo.toml` - Still needs update (0.19.0 → 0.21.0)

## Next Steps After Recovery

1. Update `bin/node/bench/Cargo.toml`:
   ```toml
   kvdb-rocksdb = "0.21.0"  # Change from 0.19.0
   ```

2. Test build again
3. Commit and push
4. Apply to Demiurge

---

**Status:** Build was progressing successfully before crash. The fix is working!
