# Session Keys Testing Guide

**Date:** January 2026  
**Status:** ✅ Ready for Testing

---

## Overview

This guide covers testing the complete Session Keys functionality end-to-end, from blockchain pallet to frontend integration.

---

## Prerequisites

1. **Blockchain Node Running**
   - Local development node: `ws://localhost:9944`
   - Production node: `wss://demiurge.cloud/rpc`
   - Node must have Session Keys pallet integrated

2. **Frontend Application**
   - Hub app running: `http://localhost:3000`
   - QOR Auth service running: `http://localhost:8080`

3. **Tools**
   - Polkadot.js Apps (for manual testing)
   - Browser console (for debugging)

---

## Testing Checklist

### ✅ Unit Tests (Blockchain)

Run unit tests for the Session Keys pallet:

```bash
cd x:\Demiurge-Blockchain\blockchain
cargo test -p pallet-session-keys
```

**Expected:** All tests pass
- ✅ `can_authorize_session_key`
- ✅ `cannot_authorize_existing_key`
- ✅ `cannot_exceed_max_duration`
- ✅ `can_revoke_session_key`
- ✅ `cannot_revoke_nonexistent_key`
- ✅ `is_session_key_valid_works`
- ✅ `get_active_session_keys_works`
- ✅ `has_active_session_keys_works`
- ✅ `cleanup_expired_keys_works`
- ✅ `multiple_accounts_can_have_session_keys`
- ✅ `cannot_revoke_other_accounts_session_key`
- ✅ `session_key_expiry_is_correct`

---

### ✅ Runtime API Tests

Test the runtime API implementation:

```bash
cd x:\Demiurge-Blockchain\blockchain
cargo test --features runtime
```

**Expected:** Runtime API compiles and is accessible

---

### ✅ Build Tests

Verify the blockchain node builds successfully:

```bash
cd x:\Demiurge-Blockchain\blockchain
cargo check --bin demiurge-node
```

**Expected:** Build completes without errors

---

## Manual Testing Flow

### Step 1: Start Blockchain Node

```bash
cd x:\Demiurge-Blockchain\blockchain
cargo run --bin demiurge-node -- --dev
```

**Verify:**
- Node starts successfully
- WebSocket RPC available at `ws://localhost:9944`
- Session Keys pallet is in runtime

---

### Step 2: Connect Frontend

1. Start the Hub application:
   ```bash
   cd x:\Demiurge-Blockchain\apps\hub
   npm run dev
   ```

2. Open browser: `http://localhost:3000`

3. Verify blockchain connection:
   - Check browser console for connection logs
   - Should see: `[Blockchain] Successfully connected to Demiurge blockchain`

---

### Step 3: Test Session Key Creation

1. **Login with QOR ID**
   - Navigate to wallet page
   - Login with QOR ID credentials
   - Verify primary address is displayed

2. **Create Session Key**
   - Click "Create Session Key" button
   - Set duration (e.g., 1000 blocks ≈ 1.67 hours)
   - Click "Create"
   - Wait for transaction confirmation

3. **Verify Creation**
   - Check transaction hash in browser console
   - Verify session key appears in the list
   - Check expiry time is correct

**Expected Behavior:**
- Transaction submits successfully
- Session key appears in UI
- Expiry block is calculated correctly
- Event `SessionKeyAuthorized` is emitted

---

### Step 4: Test Session Key Query

1. **Refresh Page**
   - Reload the wallet page
   - Session keys should load automatically

2. **Verify Active Keys**
   - Check that previously created keys are displayed
   - Verify expiry times are accurate
   - Check that expired keys are filtered out

**Expected Behavior:**
- Active session keys load correctly
- Expired keys are not shown
- Expiry times are accurate

---

### Step 5: Test Session Key Revocation

1. **Revoke Session Key**
   - Click "Revoke" on an active session key
   - Confirm the action
   - Wait for transaction confirmation

2. **Verify Revocation**
   - Check transaction hash
   - Verify key disappears from list
   - Reload page to confirm persistence

**Expected Behavior:**
- Transaction submits successfully
- Key is removed from UI immediately
- Event `SessionKeyRevoked` is emitted
- Key does not reappear after reload

---

### Step 6: Test Expiry Behavior

1. **Create Short-Duration Key**
   - Create a session key with 10 blocks duration
   - Note the expiry block

2. **Wait for Expiry**
   - Monitor blockchain blocks
   - After expiry block, refresh page
   - Verify key is no longer shown

**Expected Behavior:**
- Key expires automatically
- Expired keys are filtered out
- `is_session_key_valid` returns false after expiry

---

### Step 7: Test Multiple Session Keys

1. **Create Multiple Keys**
   - Create 3-5 session keys with different durations
   - Verify all appear in the list

2. **Test Isolation**
   - Verify each key is independent
   - Revoke one key, others remain active
   - Verify expiry times are independent

**Expected Behavior:**
- All keys display correctly
- Keys are isolated per account
- Expiry times are independent

---

## Using Polkadot.js Apps

### Manual Testing via Polkadot.js Apps

1. **Connect to Node**
   - Open: https://polkadot.js.org/apps
   - Settings → Add custom endpoint: `ws://localhost:9944`
   - Select the custom endpoint

2. **Query Session Keys**
   - Developer → Extrinsics
   - Select `sessionKeys` pallet
   - Test `authorizeSessionKey` and `revokeSessionKey`

3. **Query Storage**
   - Developer → Chain state
   - Select `sessionKeys` pallet
   - Query `sessionKeyExpiry` storage

---

## Runtime API Testing

### Test Runtime API via RPC

```bash
# Using curl (if custom RPC is set up)
curl -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"sessionKeysApi_getActiveSessionKeys","params":["ACCOUNT_ADDRESS"]}' \
  http://localhost:9944
```

**Note:** Runtime API requires custom RPC setup. For now, use storage queries (already implemented in frontend).

---

## Debugging Tips

### Browser Console

Check for errors:
```javascript
// Check blockchain connection
blockchainClient.isConnected()

// Get API instance
blockchainClient.getApi()

// Check session keys manually
blockchainClient.getActiveSessionKeys('YOUR_ADDRESS')
```

### Node Logs

Monitor node logs for:
- Transaction processing
- Event emission
- Storage changes

```bash
# Watch node logs
tail -f node.log | grep -i session
```

### Common Issues

1. **Connection Failed**
   - Verify node is running
   - Check WebSocket URL
   - Verify firewall settings

2. **Transaction Failed**
   - Check account has sufficient balance
   - Verify account is unlocked
   - Check transaction parameters

3. **Session Keys Not Loading**
   - Check browser console for errors
   - Verify storage queries are working
   - Check runtime API availability

---

## Performance Testing

### Load Test

1. **Create Many Session Keys**
   - Create 10+ session keys
   - Measure query performance
   - Check UI responsiveness

2. **Test Cleanup**
   - Create keys with short durations
   - Wait for expiry
   - Verify cleanup performance

**Expected:**
- Query time < 1 second for 10 keys
- UI remains responsive
- Cleanup is efficient

---

## Integration Testing

### End-to-End Flow

1. **User Journey**
   - Login → Create Session Key → Use in Game → Revoke
   - Verify complete flow works

2. **Error Handling**
   - Test with disconnected node
   - Test with invalid parameters
   - Test with expired keys

3. **Edge Cases**
   - Maximum duration (7 days)
   - Minimum duration (1 block)
   - Multiple accounts
   - Concurrent operations

---

## Test Results Template

```
Date: [DATE]
Tester: [NAME]
Node Version: [VERSION]
Frontend Version: [VERSION]

✅ Unit Tests: [PASS/FAIL]
✅ Runtime API: [PASS/FAIL]
✅ Build: [PASS/FAIL]
✅ Create Session Key: [PASS/FAIL]
✅ Query Session Keys: [PASS/FAIL]
✅ Revoke Session Key: [PASS/FAIL]
✅ Expiry Behavior: [PASS/FAIL]
✅ Multiple Keys: [PASS/FAIL]
✅ Error Handling: [PASS/FAIL]

Notes:
[ANY ISSUES OR OBSERVATIONS]
```

---

## Next Steps

After successful testing:

1. **Deploy to Testnet**
   - Deploy node to testnet
   - Deploy frontend to staging
   - Run integration tests

2. **Performance Optimization**
   - Optimize storage queries
   - Add caching if needed
   - Monitor performance metrics

3. **Documentation**
   - Update user documentation
   - Create API documentation
   - Document best practices

---

## Support

For issues or questions:
- Check logs: `blockchain/node.log`
- Browser console: F12 → Console
- Node logs: Terminal output

---

**Status:** ✅ Ready for Testing  
**Last Updated:** January 2026
