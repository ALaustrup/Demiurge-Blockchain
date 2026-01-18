# 🚨 IMMEDIATE CURSOR CRASH FIX

## Critical Issue
**C: Drive has only 0.9% free space (8.39 GB / 930.58 GB)**

This is causing Cursor to crash. **Free up space immediately.**

## Step 1: Free C: Drive Space (CRITICAL)

### Option A: Clean Windows Temp Files (Fastest)
```powershell
# Run as Administrator
Remove-Item -Recurse -Force $env:TEMP\* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force C:\Windows\Temp\* -ErrorAction SilentlyContinue
```

### Option B: Clean Cargo Cache (if on C:)
```powershell
# Check where Cargo cache is
cargo --version
$env:CARGO_HOME

# If on C:, clean it
cargo clean --release
```

### Option C: Clean Large Build Directories on X:
```powershell
cd x:\Demiurge-Blockchain
.\scripts\clean-build-dirs.ps1 -Force
```

This will free space on X: drive, which may help if Cursor is using X: for some operations.

## Step 2: Restart Cursor

1. **Close Cursor completely** (check Task Manager for lingering processes)
2. **Wait 30 seconds**
3. **Reopen Cursor**

## Step 3: Verify `.cursorignore` is Working

The `.cursorignore` file has been created to prevent Cursor from indexing:
- `target/` directories (Rust builds)
- `node_modules/` (Node.js dependencies)
- `.next/` (Next.js builds)

After restarting, Cursor should use less memory and be more stable.

## Step 4: Use External Terminal for Builds

**Never run `cargo build` inside Cursor's integrated terminal for large projects.**

Use PowerShell or Windows Terminal instead:
```powershell
# Open external terminal
cd x:\Demiurge-Blockchain\substrate
cargo build -p sc-cli
```

## Prevention

1. **Monitor C: drive space** - Keep at least 10% free (93+ GB)
2. **Regular cleanup** - Run `clean-build-dirs.ps1` weekly
3. **Use external terminal** - For all Rust builds
4. **Close unused files** - Reduce Cursor's memory footprint

## Current Disk Status

- **C:** 0.9% free (8.39 GB) ⚠️ **CRITICAL**
- **X:** 23.56% free (224.74 GB) ✅ OK
- **E:** 36.39% free (338.92 GB) ✅ OK

---

**Action Required:** Free C: drive space NOW before continuing any work.
