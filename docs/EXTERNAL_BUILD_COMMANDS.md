# 🔨 External Build Commands (Outside Cursor)

**Use these commands in PowerShell (NOT Cursor terminal) to avoid crashes**

---

## 🚀 Quick Commands

### Open PowerShell
Press `Win + X` → Select "Windows PowerShell" or "Terminal"

### Navigate to Project
```powershell
cd x:\Demiurge-Blockchain\blockchain
```

---

## ✅ Check Build (Fast - No Binary)

```powershell
cargo check --bin demiurge-node
```

**Output:** Shows compilation errors without building binary

---

## 🔨 Build Debug Binary

```powershell
cargo build --bin demiurge-node
```

**Output:** `target\debug\demiurge-node.exe`

---

## 🚀 Build Release Binary (Optimized)

```powershell
cargo build --bin demiurge-node --release
```

**Output:** `target\release\demiurge-node.exe`

---

## 🧹 Clean Build Artifacts

```powershell
cargo clean
```

---

## 🔄 Update Dependencies (After Fixing Cargo.toml)

```powershell
cargo update
```

**Run this after modifying `[patch.crates-io]` or workspace dependencies**

---

## 📊 Check Dependency Tree

```powershell
# Show all dependencies
cargo tree

# Check if patches are applied (should show local paths)
cargo tree -p frame-system | Select-String "substrate"

# Check version conflicts
cargo tree -d
```

---

## 🐛 Save Error Output

```powershell
# Save full error output to file
cargo check --bin demiurge-node 2>&1 | Out-File build-errors.txt

# View errors
notepad build-errors.txt
```

---

## 📝 Full Build Script

Create `build.ps1` in `x:\Demiurge-Blockchain\blockchain\`:

```powershell
# Quick build script
cd x:\Demiurge-Blockchain\blockchain

Write-Host "Checking build..." -ForegroundColor Yellow
cargo check --bin demiurge-node

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuilding..." -ForegroundColor Yellow
    cargo build --bin demiurge-node --release
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Build successful!" -ForegroundColor Green
        $bin = "target\release\demiurge-node.exe"
        if (Test-Path $bin) {
            $size = (Get-Item $bin).Length / 1MB
            Write-Host "Binary: $bin ($([math]::Round($size, 2)) MB)" -ForegroundColor Cyan
        }
    }
}
```

Run with:
```powershell
.\build.ps1
```

---

## 🚀 Quick Build Script

Copy this to `x:\Demiurge-Blockchain\scripts\quick-build.ps1` and run:

```powershell
cd x:\Demiurge-Blockchain
.\scripts\quick-build.ps1
```

Or run directly:

```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo update
cargo check --bin demiurge-node
cargo build --bin demiurge-node --release
```

---

## ⚠️ After Fixing Dependencies

**Important:** After modifying `Cargo.toml` to use local paths:

1. **Run `cargo update`** to refresh `Cargo.lock`
2. **Run `cargo check`** to verify patches are applied
3. **Verify with:** `cargo tree -p frame-system | Select-String "substrate"`

Should show: `X:\Demiurge-Blockchain\substrate\frame\system`

---

## 🔧 Fix FFLONK Dependency Error

If you see: `error: no matching package named fflonk found`

**Quick Fix (Recommended):**
```powershell
cd x:\Demiurge-Blockchain
.\scripts\build-with-fflonk-workaround.ps1
```

**Manual Fix:**
```powershell
cd x:\Demiurge-Blockchain\blockchain

# Copy working Cargo.lock from Substrate fork
Copy-Item ..\substrate\Cargo.lock .\Cargo.lock -Force

# Update dependencies (will fail on fflonk - that's OK, it's optional)
cargo update

# Check build (fflonk errors can be ignored - dependency is optional)
cargo check --bin demiurge-node

# Build (fflonk warnings won't block the build)
cargo build --bin demiurge-node --release
```

**Note:** `fflonk` is only needed for `bandersnatch-experimental` feature, which we're not using. The errors are harmless and won't block compilation.

See `docs/FFLONK_DEPENDENCY_FIX.md` for details.

---

## 🔧 Fix time Crate Compilation Error

If you see: `error[E0282]: type annotations needed for Box<_>` in `time` crate

**Quick Fix:**
```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo update -p time
cargo check --bin demiurge-node
```

**If that doesn't work:**
```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo update -p time --precise 0.3.34
cargo check --bin demiurge-node
```

**Or use the script:**
```powershell
cd x:\Demiurge-Blockchain
.\scripts\fix-time-crate-error.ps1
```

---

## 🔧 Fix wasm-bindgen Version Error

If you see: `error: older versions of the wasm-bindgen crate are incompatible with current versions of Rust; please update to wasm-bindgen v0.2.88`

**Quick Fix:**
```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo update -p wasm-bindgen -p wasm-bindgen-macro -p wasm-bindgen-macro-support -p wasm-bindgen-shared -p wasm-bindgen-backend
cargo check --bin demiurge-node
```

**Or use the script:**
```powershell
cd x:\Demiurge-Blockchain
.\scripts\fix-wasm-bindgen.ps1
```

---

**Last Updated:** January 17, 2026
