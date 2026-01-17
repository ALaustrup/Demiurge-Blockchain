# 🚀 Quick Start: WASM Wallet Testing

## Step 2: Copy WASM Files

### Option A: Using npm script (Recommended)
```bash
cd apps/hub
npm run copy-wasm
```

### Option B: Manual copy (if script doesn't work)
```bash
# From project root
mkdir -p apps/hub/public/pkg
cp packages/wallet-wasm/pkg/* apps/hub/public/pkg/
```

### Option C: PowerShell (Windows)
```powershell
cd apps\hub
npm run copy-wasm

# Or manually:
New-Item -ItemType Directory -Force -Path public\pkg
Copy-Item ..\..\packages\wallet-wasm\pkg\* public\pkg\
```

---

## Step 3: Verify Files Exist

### Option A: Command Line Check

**PowerShell (Windows):**
```powershell
cd apps\hub
Get-ChildItem public\pkg | Format-Table Name, Length -AutoSize
```

**Bash/Linux/Mac:**
```bash
cd apps/hub
ls -lh public/pkg/
```

### Option B: Check Specific Files

**PowerShell:**
```powershell
cd apps\hub
$files = @(
    "public\pkg\wallet_wasm_bg.wasm",
    "public\pkg\wallet_wasm.js",
    "public\pkg\wallet_wasm.d.ts",
    "public\pkg\wallet_wasm_bg.wasm.d.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length / 1KB
        Write-Host "✅ $file ($([math]::Round($size, 2)) KB)"
    } else {
        Write-Host "❌ $file - NOT FOUND"
    }
}
```

**Bash:**
```bash
cd apps/hub
for file in wallet_wasm_bg.wasm wallet_wasm.js wallet_wasm.d.ts wallet_wasm_bg.wasm.d.ts; do
    if [ -f "public/pkg/$file" ]; then
        size=$(du -h "public/pkg/$file" | cut -f1)
        echo "✅ public/pkg/$file ($size)"
    else
        echo "❌ public/pkg/$file - NOT FOUND"
    fi
done
```

### Option C: Expected File Sizes

After copying, you should see:
- ✅ `wallet_wasm_bg.wasm` - ~230 KB (235,274 bytes)
- ✅ `wallet_wasm.js` - ~15 KB (15,448 bytes)
- ✅ `wallet_wasm.d.ts` - ~3 KB (2,927 bytes)
- ✅ `wallet_wasm_bg.wasm.d.ts` - ~1 KB (1,175 bytes)

---

## Quick Verification Script

Save this as `verify-wasm.ps1` in `apps/hub`:

```powershell
# verify-wasm.ps1
Write-Host "Checking WASM files..." -ForegroundColor Cyan

$requiredFiles = @(
    @{Name="wallet_wasm_bg.wasm"; MinSize=200000},
    @{Name="wallet_wasm.js"; MinSize=10000},
    @{Name="wallet_wasm.d.ts"; MinSize=2000},
    @{Name="wallet_wasm_bg.wasm.d.ts"; MinSize=1000}
)

$allGood = $true
foreach ($file in $requiredFiles) {
    $path = "public\pkg\$($file.Name)"
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        if ($size -ge $file.MinSize) {
            Write-Host "✅ $($file.Name) - $([math]::Round($size/1KB, 2)) KB" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($file.Name) - Size too small ($size bytes)" -ForegroundColor Yellow
            $allGood = $false
        }
    } else {
        Write-Host "❌ $($file.Name) - NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host "`n✅ All WASM files verified successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some files are missing or incorrect. Run: npm run copy-wasm" -ForegroundColor Red
}
```

Run it:
```powershell
cd apps\hub
.\verify-wasm.ps1
```

---

## Troubleshooting

### If `npm run copy-wasm` fails:

1. **Check if script exists:**
   ```bash
   cat apps/hub/scripts/copy-wasm.js
   ```

2. **Check source files exist:**
   ```bash
   ls packages/wallet-wasm/pkg/
   ```

3. **Manually copy files:**
   ```bash
   mkdir -p apps/hub/public/pkg
   cp packages/wallet-wasm/pkg/* apps/hub/public/pkg/
   ```

### If files don't appear:

1. **Check directory exists:**
   ```bash
   ls -la apps/hub/public/
   ```

2. **Check permissions:**
   ```bash
   ls -la apps/hub/public/pkg/
   ```

3. **Try copying again:**
   ```bash
   rm -rf apps/hub/public/pkg
   npm run copy-wasm
   ```

---

**Status:** Ready to proceed to Step 4 (Start Development Server)
