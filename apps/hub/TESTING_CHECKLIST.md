# 🧪 Transaction Flow Testing Checklist

## Quick Start Testing

### 1. Pre-Flight Checks
```bash
# Build WASM package
cd packages/wallet-wasm
wasm-pack build --target web --out-dir pkg

# Copy WASM files to Hub
cd ../../apps/hub
npm run copy-wasm

# Verify files exist
ls public/pkg/
# Should see: wallet_wasm_bg.wasm, wallet_wasm.js, wallet_wasm.d.ts
```

### 2. Start Dev Server
```bash
cd apps/hub
npm run dev
```

### 3. Browser Testing Steps

1. **Open Browser Console** (F12)
2. **Navigate to** `http://localhost:3000/wallet`
3. **Log in** with QOR ID account
4. **Click "Send"** button to open SendCGTModal
5. **Check Console** for:
   - ✅ No WASM initialization errors
   - ✅ "WASM wallet initialized" or similar message
   - ✅ No 404 errors for `/pkg/wallet_wasm_bg.wasm`

### 4. Test Transaction Flow

**With Mock Blockchain:**
```bash
# Set environment variable
export NEXT_PUBLIC_USE_MOCK_BLOCKCHAIN=true
# Or add to .env.local:
# NEXT_PUBLIC_USE_MOCK_BLOCKCHAIN=true

# Restart dev server
npm run dev
```

**Steps:**
1. Open SendCGTModal
2. Enter recipient address (any valid SS58 address)
3. Enter amount (e.g., `0.01` CGT)
4. Click "Send"
5. Verify:
   - ✅ No errors in console
   - ✅ Transaction hash displayed
   - ✅ Success message shown

### 5. Common Issues & Fixes

**Issue: WASM not loading**
- Check `public/pkg/` directory exists
- Run `npm run copy-wasm` again
- Check browser console for 404 errors

**Issue: "transferWithWasm is not a function"**
- Verify BlockchainContext has `transferWithWasm` method
- Check imports in SendCGTModal

**Issue: "Failed to initialize WASM wallet"**
- Verify WASM files are in `public/pkg/`
- Check Next.js config includes WASM support
- Verify `wasm-pack` build succeeded

### 6. Expected Console Output

**Successful Initialization:**
```
[Blockchain] WebSocket connected (or disconnected if mock)
WASM wallet initialized successfully
```

**Successful Transaction:**
```
Generating keypair from QOR ID...
Signing transaction payload...
Transaction submitted: 0x...
```

### 7. Test Results

- [ ] WASM files copied successfully
- [ ] Dev server starts without errors
- [ ] WASM wallet initializes on modal open
- [ ] Keypair generates from QOR ID
- [ ] Transaction signs successfully
- [ ] Transaction hash returned
- [ ] No console errors

---

**Status:** Ready for testing  
**Last Updated:** January 2026
