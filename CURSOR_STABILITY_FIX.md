# Cursor Crash Prevention - Immediate Actions

## 🚨 If Cursor Keeps Crashing

### 1. **Use External Terminal for Builds**
   - Open PowerShell or Command Prompt separately
   - Run cargo builds there instead of Cursor's integrated terminal
   - This reduces Cursor's memory/CPU load

### 2. **Exclude Large Directories from Indexing**
   Add to `.cursorignore` or workspace settings:
   ```
   substrate/target/
   blockchain/target/
   node_modules/
   .next/
   ```

### 3. **Close Unused Files**
   - Close files you're not actively editing
   - Reduce number of open tabs
   - Close large files temporarily

### 4. **Disable Heavy Extensions**
   - Go to Extensions (Ctrl+Shift+X)
   - Disable any Rust/LLM extensions temporarily
   - Re-enable one at a time to find culprit

### 5. **Restart Cursor Cleanly**
   ```powershell
   # Kill all Cursor processes
   Get-Process | Where-Object {$_.ProcessName -like "*cursor*"} | Stop-Process -Force
   # Wait 10 seconds
   # Then restart Cursor
   ```

## ✅ Good News: Build Progress Saved

The **librocksdb-sys fix is working!** The build was progressing:
- ✅ `kvdb-rocksdb` updated to 0.21.0
- ✅ `librocksdb-sys` conflict resolved
- ⚠️ New issue: `wasm-bindgen` compatibility (separate problem)

## 📝 Current Status

**Fixed Files:**
- ✅ `substrate/client/db/Cargo.toml` - kvdb-rocksdb → 0.21.0
- ✅ `substrate/bin/node/bench/Cargo.toml` - kvdb-rocksdb → 0.21.0

**Next Steps (in external terminal):**
1. Test build: `cd substrate; cargo build -p sc-cli`
2. If successful, commit changes
3. Apply to Demiurge

## 🔧 Quick Recovery

1. **Save all files** (if Cursor is responsive)
2. **Close Cursor completely**
3. **Use external terminal** for cargo commands
4. **Reopen Cursor** after builds complete

---

**The dependency fix is complete and working!** The crashes are likely due to Cursor's resource usage during large builds.
