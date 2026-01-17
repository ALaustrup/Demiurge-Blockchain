# 🚀 Quick Commands for Testing

## Navigate to Project Directory

**First, always navigate to the project root:**
```powershell
cd x:\Demiurge-Blockchain
```

## Step-by-Step Commands

### 1. Navigate to Hub Directory
```powershell
cd x:\Demiurge-Blockchain\apps\hub
```

### 2. Copy WASM Files
```powershell
npm run copy-wasm
```

### 3. Verify WASM Files
```powershell
Get-ChildItem public\pkg | Format-Table Name, Length -AutoSize
```

### 4. Start Dev Server
```powershell
npm run dev
```

## One-Liner Commands

### Copy WASM and Verify
```powershell
cd x:\Demiurge-Blockchain\apps\hub; npm run copy-wasm; Get-ChildItem public\pkg | Format-Table Name, Length -AutoSize
```

### Start Dev Server
```powershell
cd x:\Demiurge-Blockchain\apps\hub; npm run dev
```

## Full Testing Workflow

```powershell
# 1. Navigate to project
cd x:\Demiurge-Blockchain

# 2. Copy WASM files
cd apps\hub
npm run copy-wasm

# 3. Verify files
Get-ChildItem public\pkg | Format-Table Name, Length -AutoSize

# 4. Start dev server
npm run dev
```

## Troubleshooting

### If "Cannot find path" error:
- Make sure you're in the correct directory
- Use full path: `cd x:\Demiurge-Blockchain\apps\hub`

### If "Missing script: dev" error:
- Make sure you're in `apps\hub` directory
- Check `package.json` exists: `Test-Path package.json`

### Quick Check:
```powershell
# Check current directory
pwd

# Should show: x:\Demiurge-Blockchain\apps\hub

# If not, navigate there:
cd x:\Demiurge-Blockchain\apps\hub
```
