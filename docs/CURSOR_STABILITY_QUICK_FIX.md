# 🚨 Cursor Crash - Quick Fix Guide

**Date:** January 17, 2026  
**Priority:** 🔴 **CRITICAL**

---

## ⚡ Immediate Actions

### 1. Close All Cursor Windows
- Close all Cursor windows completely
- Check Task Manager (Ctrl+Shift+Esc) for lingering `Cursor.exe` processes
- End any remaining processes

### 2. Free Disk Space (CRITICAL)
```powershell
# Run as Administrator
cd x:\Demiurge-Blockchain
.\scripts\free-c-drive-space.ps1
```

**Or manually:**
```powershell
# Clean temp files
Remove-Item -Recurse -Force $env:TEMP\* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force C:\Windows\Temp\* -ErrorAction SilentlyContinue

# Clean Rust build artifacts (if on C:)
# Check: $env:CARGO_HOME or C:\Users\Gnosis\.cargo
```

### 3. Clean Large Build Directories
```powershell
cd x:\Demiurge-Blockchain
.\scripts\clean-build-dirs.ps1 -Force
```

This will free space on X: drive and reduce what Cursor needs to index.

---

## 🔧 Prevent Future Crashes

### 1. Use External Terminal for Builds
**NEVER run `cargo build` in Cursor's integrated terminal.**

Use PowerShell or Windows Terminal instead:
```powershell
# Open external terminal
cd x:\Demiurge-Blockchain\blockchain
cargo check --bin demiurge-node
```

### 2. Close Unused Files
- Close files you're not actively editing
- Use "Close Others" in file tabs
- Reduce Cursor's memory footprint

### 3. Exclude Large Directories
Create `.cursorignore` in project root (if permissions allow):
```
**/target/
**/node_modules/
**/.next/
substrate/target/
blockchain/target/
```

### 4. Monitor Disk Space
Keep C: drive at least **10% free** (93+ GB).

---

## 📊 Current Build Status

**Issue:** `frame-system` compilation errors (version mismatch)
- `sp-block-builder` version conflict resolved
- Now seeing `frame-system` errors

**This can wait** until Cursor is stable. The build issue is separate from Cursor crashes.

---

## ✅ After Stabilizing Cursor

1. **Restart Cursor** (after freeing space)
2. **Continue build debugging** in external terminal
3. **Work on Session Keys** development (doesn't require full build)

---

**Action:** Free disk space NOW, then restart Cursor.
