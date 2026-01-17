# 🧪 Transaction Flow Testing Guide

> *"Test everything, trust nothing."*

**Date:** January 2026  
**Branch:** `lesser/dev1`  
**Status:** 📋 **TESTING GUIDE**

---

## 📊 TESTING OVERVIEW

This document provides a comprehensive guide for testing the WASM wallet transaction flow end-to-end.

---

## ✅ PRE-TEST CHECKLIST

### 1. **Build WASM Package**
```bash
cd packages/wallet-wasm
wasm-pack build --target web --out-dir pkg
```

### 2. **Copy WASM Files**
```bash
cd apps/hub
npm run copy-wasm
```

### 3. **Verify Files Exist**
- ✅ `apps/hub/public/pkg/wallet_wasm_bg.wasm` (235 KB)
- ✅ `apps/hub/public/pkg/wallet_wasm.js` (15 KB)
- ✅ `apps/hub/public/pkg/wallet_wasm.d.ts` (2.9 KB)

### 4. **Start Development Server**
```bash
cd apps/hub
npm run dev
```

### 5. **Verify Blockchain Connection**
- Ensure blockchain node is running (or mock is enabled)
- Check WebSocket connection in browser console

---

## 🧪 MANUAL TESTING STEPS

### Test 1: WASM Wallet Initialization

**Steps:**
1. Open browser to `http://localhost:3000`
2. Log in with QOR ID account
3. Navigate to Wallet page (`/wallet`)
4. Open browser DevTools → Console
5. Check for WASM initialization messages

**Expected Results:**
- ✅ No errors in console
- ✅ WASM module loads successfully
- ✅ Wallet page displays without errors

**Console Checks:**
```javascript
// In browser console, verify:
localStorage.getItem('wasm_keypair_*') // Should be null (not stored yet)
```

---

### Test 2: Keypair Generation

**Steps:**
1. Open SendCGTModal (click "Send" button)
2. Wait for modal to open
3. Check browser console for initialization

**Expected Results:**
- ✅ Modal opens without errors
- ✅ WASM wallet initializes (check console)
- ✅ No "Failed to initialize" errors

**Console Checks:**
```javascript
// In browser console:
// Should see: "WASM wallet initialized" or similar
```

---

### Test 3: Address Verification

**Steps:**
1. Note your QOR ID (e.g., `username#0001`)
2. Check wallet page for displayed address
3. Verify address matches expected deterministic address

**Expected Results:**
- ✅ Address displayed matches QOR ID
- ✅ Same QOR ID always generates same address
- ✅ Address format is valid SS58 (starts with `5`)

**Verification:**
```javascript
// In browser console:
import { generateAddressFromQorId } from '@/lib/qor-wallet';
const address = generateAddressFromQorId('your-qor-id#0001');
console.log('Expected address:', address);
// Compare with displayed address
```

---

### Test 4: Transaction Signing (Dry Run)

**Steps:**
1. Open SendCGTModal
2. Enter recipient address (use test address)
3. Enter small amount (e.g., `0.01` CGT)
4. Click "Send"
5. Monitor browser console for errors

**Expected Results:**
- ✅ No WASM initialization errors
- ✅ Keypair generated successfully
- ✅ Transaction payload created
- ✅ Signing process starts

**Console Checks:**
```javascript
// Should see:
// - "Generating keypair from QOR ID..."
// - "Signing transaction payload..."
// - No signature errors
```

---

### Test 5: Full Transaction Flow (With Mock Blockchain)

**Prerequisites:**
- Mock blockchain enabled (`NEXT_PUBLIC_USE_MOCK_BLOCKCHAIN=true`)
- Sufficient balance in mock account

**Steps:**
1. Set environment variable: `NEXT_PUBLIC_USE_MOCK_BLOCKCHAIN=true`
2. Restart dev server
3. Open SendCGTModal
4. Enter recipient address
5. Enter amount
6. Click "Send"
7. Wait for transaction completion

**Expected Results:**
- ✅ Transaction signed successfully
- ✅ Transaction hash returned
- ✅ Success message displayed
- ✅ Transaction appears in history

---

### Test 6: Full Transaction Flow (With Real Blockchain)

**Prerequisites:**
- Blockchain node running and connected
- Account has sufficient balance
- WebSocket connection established

**Steps:**
1. Ensure blockchain node is running
2. Verify connection in browser (check status indicator)
3. Open SendCGTModal
4. Enter recipient address (valid SS58 address)
5. Enter amount (within balance)
6. Click "Send"
7. Monitor transaction status

**Expected Results:**
- ✅ Transaction signed with WASM
- ✅ Transaction submitted to blockchain
- ✅ Transaction hash returned
- ✅ Transaction appears in block explorer (if available)
- ✅ Balance updates after confirmation

---

## 🔍 DEBUGGING CHECKLIST

### Issue: WASM Module Not Loading

**Symptoms:**
- Console error: "Failed to load WASM wallet"
- Modal shows "Initializing Wallet..." indefinitely

**Debug Steps:**
1. Check if WASM files exist in `public/pkg/`
2. Verify file permissions
3. Check browser console for 404 errors
4. Verify Next.js config includes WASM support

**Fix:**
```bash
# Rebuild and copy WASM files
cd packages/wallet-wasm
wasm-pack build --target web --out-dir pkg
cd ../../apps/hub
npm run copy-wasm
```

---

### Issue: Keypair Generation Fails

**Symptoms:**
- Error: "Failed to generate keypair"
- Console shows WASM function errors

**Debug Steps:**
1. Verify WASM module initialized
2. Check QOR ID format (should be `username#0001`)
3. Verify seed format matches expected

**Fix:**
- Ensure QOR ID is properly formatted
- Check WASM module exports are correct

---

### Issue: Transaction Signing Fails

**Symptoms:**
- Error: "Failed to sign transaction"
- Signature validation fails

**Debug Steps:**
1. Verify payload bytes are correct
2. Check signature length (should be 64 bytes)
3. Verify signer address matches fromAddress

**Fix:**
- Ensure payload is properly formatted
- Verify keypair matches address

---

### Issue: Transaction Submission Fails

**Symptoms:**
- Error: "Transaction failed"
- Transaction not appearing on chain

**Debug Steps:**
1. Verify blockchain connection
2. Check account balance
3. Verify transaction nonce
4. Check transaction fees

**Fix:**
- Ensure blockchain node is connected
- Verify sufficient balance
- Check transaction parameters

---

## 📊 TEST RESULTS TEMPLATE

### Test Run: [Date]

**Environment:**
- Node Version: `[version]`
- Browser: `[browser] [version]`
- Blockchain: `[mock/real]`
- QOR ID: `[qor-id]`

**Test Results:**

| Test | Status | Notes |
|------|--------|-------|
| WASM Initialization | ✅/❌ | |
| Keypair Generation | ✅/❌ | |
| Address Verification | ✅/❌ | |
| Transaction Signing | ✅/❌ | |
| Transaction Submission | ✅/❌ | |
| Balance Update | ✅/❌ | |

**Issues Found:**
- [List any issues]

**Next Steps:**
- [List follow-up actions]

---

## 🚀 AUTOMATED TESTING

### Unit Tests

Run unit tests for WASM wallet functions:
```bash
cd apps/hub
npm test -- wasm-wallet.test.ts
```

### Integration Tests

Test full transaction flow:
```bash
npm test -- transaction-flow.test.ts
```

---

## 📝 TESTING CHECKLIST

- [ ] WASM package built successfully
- [ ] WASM files copied to `public/pkg/`
- [ ] Dev server starts without errors
- [ ] WASM wallet initializes on modal open
- [ ] Keypair generates from QOR ID
- [ ] Address matches expected deterministic address
- [ ] Transaction payload signs successfully
- [ ] Transaction submits to blockchain (mock or real)
- [ ] Transaction hash returned
- [ ] Balance updates correctly
- [ ] Transaction appears in history
- [ ] Error handling works correctly
- [ ] UI feedback is appropriate

---

## 🎯 SUCCESS CRITERIA

**Transaction flow is considered successful when:**
- ✅ WASM wallet initializes without errors
- ✅ Keypair generates deterministically from QOR ID
- ✅ Transaction signs successfully
- ✅ Transaction submits to blockchain
- ✅ Transaction hash is returned
- ✅ User receives appropriate feedback
- ✅ No console errors during flow

---

**Status:** 📋 **READY FOR TESTING**  
**Next:** Execute manual tests and document results

---

*"Test thoroughly, deploy confidently."*
