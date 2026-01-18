# 🔧 Fix ChunkLoadError

## Quick Fix Steps

### Step 1: Clear Next.js Cache
```powershell
cd x:\Demiurge-Blockchain\apps\hub
Remove-Item -Recurse -Force .next
```

### Step 2: Clear Node Modules Cache (if needed)
```powershell
Remove-Item -Recurse -Force node_modules\.cache
```

### Step 3: Restart Dev Server
```powershell
npm run dev
```

## Common Causes & Solutions

### 1. Build Cache Corruption
**Solution:** Clear `.next` folder and restart

### 2. Port Already in Use
**Solution:** 
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 3. File System Issues (Windows)
**Solution:** 
- Run PowerShell as Administrator
- Check file permissions
- Ensure antivirus isn't blocking files

### 4. Hot Reload Issues
**Solution:**
- Hard refresh browser: `Ctrl+Shift+R`
- Clear browser cache
- Try incognito mode

## Full Reset (Nuclear Option)

```powershell
cd x:\Demiurge-Blockchain\apps\hub

# Stop dev server (Ctrl+C)

# Clear all caches
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache

# Restart
npm run dev
```

## If Error Persists

1. **Check for syntax errors:**
   ```powershell
   npm run build
   ```

2. **Check console for import errors**

3. **Verify all dependencies installed:**
   ```powershell
   npm install
   ```

4. **Try different port:**
   ```powershell
   npm run dev -- -p 3001
   ```
