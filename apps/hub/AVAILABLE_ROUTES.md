# 📍 Available Routes in Hub

## Public Routes

### Main Pages
- **`/`** - Homepage (Demiurge intro + main dashboard)
- **`/wallet`** - Wallet page (test WASM transaction flow here!)
- **`/portal`** - Game portal
- **`/nft-portal`** - NFT/DRC-369 asset management
- **`/marketplace`** - Marketplace for DRC-369 assets
- **`/social`** - VYB Social platform
- **`/affiliates`** - Affiliates & sponsors page
- **`/login`** - Login page
- **`/games`** - Games listing
- **`/play/[gameId]`** - Play specific game
- **`/admin`** - Admin panel

### Static Files (in `/public`)
- **`/test-wasm.html`** - Standalone WASM wallet test page
- **`/pkg/wallet_wasm_bg.wasm`** - WASM binary (auto-loaded)
- **`/pkg/wallet_wasm.js`** - WASM JavaScript bindings

## Testing WASM Wallet

### Option 1: Standalone Test Page
```
http://localhost:3000/test-wasm.html
```

### Option 2: Wallet Page (Full Integration)
```
http://localhost:3000/wallet
```
Then click "Send" button to test transaction flow.

## Common 404 Issues

### Issue: "This page could not be found"

**Possible causes:**
1. **Dev server not running**
   ```bash
   cd x:\Demiurge-Blockchain\apps\hub
   npm run dev
   ```

2. **Wrong URL**
   - Make sure you're using: `http://localhost:3000` (not `https://`)
   - Check the route exists in the list above

3. **Typo in URL**
   - `/test-wasm.html` (correct)
   - `/test-wasm` (wrong - missing .html)
   - `/test-wasm/index.html` (wrong)

4. **File not in public folder**
   - Static files must be in `apps/hub/public/`
   - Check: `ls apps/hub/public/test-wasm.html`

## Quick Test Commands

### Check if dev server is running:
```powershell
# Should see Next.js output
# If not, start it:
cd x:\Demiurge-Blockchain\apps\hub
npm run dev
```

### Verify test page exists:
```powershell
cd x:\Demiurge-Blockchain\apps\hub
Test-Path public\test-wasm.html
# Should return: True
```

### Access URLs:
- Homepage: `http://localhost:3000`
- Wallet: `http://localhost:3000/wallet`
- Test WASM: `http://localhost:3000/test-wasm.html`

---

**Note:** Make sure the dev server is running before accessing any routes!
