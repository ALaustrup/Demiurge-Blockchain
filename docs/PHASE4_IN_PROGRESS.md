# 🚀 Phase 4: CGT Wallet & Blockchain Integration - IN PROGRESS

**Started:** January 13, 2026  
**Status:** 🟡 **IN PROGRESS** (~60% Complete)

---

## ✅ Completed Tasks

### 1. Enhanced Blockchain Client ✅
- ✅ Updated `BlockchainClient` to query balances from `pallet-balances` (via `system.account`)
- ✅ Added `formatCGTBalance()` helper for displaying balances with 8 decimals
- ✅ Enhanced `transferCGT()` with proper transaction handling
- ✅ Improved `getUserAssets()` for DRC-369 asset queries
- ✅ Added connection status methods (`isConnected()`, `getApi()`)

**File:** `apps/hub/src/lib/blockchain.ts`

### 2. Game Directory Structure ✅
- ✅ Created `apps/games/` directory structure
- ✅ Created game registry system (`apps/hub/src/lib/game-registry.ts`)
- ✅ Created game registration API (`apps/hub/src/app/api/games/route.ts`)
- ✅ Created game template (`apps/games/TEMPLATE/`)
- ✅ Added game metadata schema

**Files:**
- `apps/hub/src/lib/game-registry.ts`
- `apps/hub/src/app/api/games/route.ts`
- `apps/games/TEMPLATE/metadata.json`
- `apps/games/TEMPLATE/README.md`

### 3. Wallet UI Components ✅
- ✅ Created `SendCGTModal` component for sending CGT
- ✅ Created `TransactionHistory` component for viewing transactions
- ✅ Updated `WalletDropdown` to support real balance queries
- ✅ Added balance formatting utilities

**Files:**
- `apps/hub/src/components/wallet/SendCGTModal.tsx`
- `apps/hub/src/components/wallet/TransactionHistory.tsx`
- `packages/ui-shared/src/components/WalletDropdown.tsx` (updated)

---

## 🚧 In Progress / Pending

### 1. WASM Wallet Package ⏳
**Status:** Not Started  
**Priority:** HIGH

**Tasks:**
- [ ] Create `packages/wallet-wasm/` Rust crate
- [ ] Implement key generation/management
- [ ] Add secure key storage (encrypted localStorage)
- [ ] Compile to WASM using `wasm-pack`
- [ ] Create TypeScript bindings
- [ ] Integrate with `SendCGTModal`

**Note:** Currently, `SendCGTModal` has a placeholder for keypair loading. The WASM wallet package will provide secure key management.

### 2. Wallet Integration ⏳
**Status:** Partially Complete  
**Priority:** HIGH

**Tasks:**
- [ ] Create wallet page/component that integrates all wallet features
- [ ] Connect `WalletDropdown` to blockchain context in hub app
- [ ] Integrate `SendCGTModal` with wallet page
- [ ] Add QR code generation for receive addresses
- [ ] Test real balance queries with running Substrate node

**Current State:**
- Components created but not fully integrated into hub app
- Need to create a wallet page that uses these components

### 3. Transaction History ⏳
**Status:** Component Created, Query Logic Pending  
**Priority:** MEDIUM

**Tasks:**
- [ ] Implement blockchain event querying for transaction history
- [ ] Query `pallet-cgt` Transferred events
- [ ] Filter by user address (from/to)
- [ ] Add pagination
- [ ] Add transaction status tracking

**Current State:**
- UI component ready
- Needs real blockchain event queries

---

## 📋 Next Steps

### Immediate (Before Game Integration)
1. **Test Blockchain Connection**
   - Start Substrate node (if not running)
   - Test `getCGTBalance()` with a real address
   - Verify connection to `ws://51.210.209.112:9944` or localhost

2. **Integrate Wallet Components**
   - Create `/wallet` page in hub app
   - Connect `WalletDropdown` to `BlockchainContext`
   - Wire up `SendCGTModal` and `TransactionHistory`

3. **WASM Wallet Package** (Optional but Recommended)
   - Create secure key management
   - Enable transaction signing from browser

### For Game Integration
1. **Prepare Game Directory**
   - User should place their game files in `apps/games/[game-id]/`
   - Create `metadata.json` following the template
   - Ensure `index.html` is the entry point

2. **Register Game**
   - Use `POST /api/games` to register the game
   - Or manually add to `game-registry.ts` for development

3. **Test Game Integration**
   - Navigate to `/play/[game-id]`
   - Verify HUD injection works
   - Test `postMessage` communication
   - Verify CGT balance display in game

---

## 🔧 Technical Details

### Blockchain Connection
- **Production:** `ws://51.210.209.112:9944` (Monad server)
- **Development:** `ws://localhost:9944`
- **Config:** `NEXT_PUBLIC_BLOCKCHAIN_WS_URL` environment variable

### CGT Balance Format
- **Storage:** u128 with 8 decimals
- **Unit:** 1 CGT = 100,000,000 smallest units
- **Display:** Format as `{whole}.{fractional}` (e.g., "1000.50000000")

### Game Metadata Schema
```typescript
{
  id: string;              // Unique identifier
  title: string;           // Display name
  description: string;     // Game description
  thumbnail: string;       // Thumbnail image path
  entryPoint: string;      // Main HTML file (usually "index.html")
  version: string;         // Version string
  author?: string;         // Creator name
  tags?: string[];         // Categorization tags
  minLevel?: number;       // Minimum QOR ID level
  cgtPool?: number;        // Current CGT pool (dynamic)
  activeUsers?: number;    // Active users (dynamic)
}
```

---

## 📁 Files Created/Modified

### New Files
- `apps/hub/src/lib/game-registry.ts` - Game registry system
- `apps/hub/src/app/api/games/route.ts` - Game registration API
- `apps/hub/src/components/wallet/SendCGTModal.tsx` - Send CGT modal
- `apps/hub/src/components/wallet/TransactionHistory.tsx` - Transaction history
- `apps/games/TEMPLATE/metadata.json` - Game template metadata
- `apps/games/TEMPLATE/README.md` - Game template documentation

### Modified Files
- `apps/hub/src/lib/blockchain.ts` - Enhanced blockchain client
- `packages/ui-shared/src/components/WalletDropdown.tsx` - Updated for real queries

---

## 🎮 Ready for Game Integration

The infrastructure is ready for your first game! Here's what you need to do:

1. **Place Your Game Files**
   ```
   apps/games/your-game-id/
   ├── index.html
   ├── assets/
   └── metadata.json
   ```

2. **Create metadata.json**
   ```json
   {
     "id": "your-game-id",
     "title": "Your Game Title",
     "description": "Game description",
     "thumbnail": "/games/your-game-id/thumb.jpg",
     "entryPoint": "index.html",
     "version": "1.0.0",
     "author": "Your Name"
   }
   ```

3. **Register the Game**
   - Use the API: `POST /api/games` with your metadata
   - Or add to `game-registry.ts` manually for development

4. **Test**
   - Navigate to `/play/your-game-id`
   - The game will be loaded in an iframe with HUD injection
   - CGT balance and assets will be available via `window.DemiurgeHUD`

---

**Status:** Ready for game integration! 🎮  
**Next:** Integrate wallet components into hub app, then proceed with your game.
