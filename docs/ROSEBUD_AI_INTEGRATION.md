# 🎮 Rosebud.AI Game Integration Guide

**Best Practice Approach for Demiurge Blockchain Integration**

---

## Overview

When creating games with Rosebud.AI for the Demiurge ecosystem, use the **BlockchainManager** pattern below. This wraps the automatically-injected `window.DemiurgeHUD` API and provides a clean, testable interface.

---

## Recommended Approach: BlockchainManager Class

### Why This Approach?

1. **Automatic HUD Injection**: The Demiurge Hub automatically injects `window.DemiurgeHUD` into your game
2. **Clean Abstraction**: `BlockchainManager` wraps the HUD API with connection state management
3. **Development-Friendly**: Includes mock mode for testing without blockchain connection
4. **Type-Safe**: Easy to extend with TypeScript if needed

---

## Implementation Template

### BlockchainManager.js

```javascript
/**
 * Demiurge Blockchain Manager
 * 
 * Wraps the automatically-injected window.DemiurgeHUD API
 * Provides connection state management and fallback/mock mode
 */
class BlockchainManager {
  constructor(options = {}) {
    this.isWalletConnected = false;
    this.qorId = null;
    this.balance = '0';
    this.assets = [];
    this.mockMode = options.mockMode || false; // Enable for development/testing
    this.onConnectionChange = options.onConnectionChange || null;
    
    // Check if HUD is available (injected by Demiurge Hub)
    this.hudAvailable = typeof window !== 'undefined' && window.DemiurgeHUD;
    
    if (!this.hudAvailable && !this.mockMode) {
      console.warn('DemiurgeHUD not available. Enable mockMode for development.');
    }
  }

  /**
   * Check if wallet is connected
   * @returns {Promise<boolean>}
   */
  async connectDemiurgeWallet() {
    if (this.mockMode) {
      // Mock mode for development
      this.isWalletConnected = true;
      this.qorId = 'mock_user_123';
      this.balance = '100000000000'; // 1000 CGT in smallest units
      this.assets = [];
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      return true;
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available. Game must be loaded in Demiurge Hub.');
    }

    try {
      // Get QOR ID to verify connection
      this.qorId = await window.DemiurgeHUD.getQORID();
      this.balance = await window.DemiurgeHUD.getCGTBalance();
      this.assets = await window.DemiurgeHUD.getUserAssets();
      
      this.isWalletConnected = true;
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      this.isWalletConnected = false;
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
      return false;
    }
  }

  /**
   * Get current CGT balance
   * @returns {Promise<string>} Balance in smallest units (8 decimals)
   */
  async getDemiurgeBalance() {
    if (this.mockMode) {
      return this.balance || '100000000000'; // Mock: 1000 CGT
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      this.balance = await window.DemiurgeHUD.getCGTBalance();
      return this.balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get balance as CGT (human-readable)
   * @returns {Promise<number>} Balance in CGT
   */
  async getBalanceInCGT() {
    const balanceStr = await this.getDemiurgeBalance();
    const balanceBigInt = BigInt(balanceStr);
    return Number(balanceBigInt) / 100_000_000; // 8 decimals
  }

  /**
   * Spend CGT (for in-game purchases)
   * @param {number} amount - Amount in CGT (will be converted to smallest units)
   * @param {string} reason - Reason for spending (e.g., 'upgrade_weapon')
   * @returns {Promise<string>} Transaction hash
   */
  async spendCGT(amount, reason = 'game_purchase') {
    if (this.mockMode) {
      // Mock transaction
      const currentBalance = BigInt(this.balance);
      const amountInSmallestUnits = BigInt(Math.floor(amount * 100_000_000));
      
      if (currentBalance < amountInSmallestUnits) {
        throw new Error('Insufficient balance');
      }
      
      this.balance = (currentBalance - amountInSmallestUnits).toString();
      return `0x${Math.random().toString(16).substr(2, 64)}`; // Mock tx hash
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      const amountInSmallestUnits = Math.floor(amount * 100_000_000);
      const txHash = await window.DemiurgeHUD.spendCGT(amountInSmallestUnits, reason);
      
      // Update local balance
      await this.getDemiurgeBalance();
      
      return txHash;
    } catch (error) {
      console.error('Failed to spend CGT:', error);
      throw error;
    }
  }

  /**
   * Get user's DRC-369 assets (NFTs)
   * @returns {Promise<Array>} Array of asset objects with UUIDs
   * 
   * Note: Returns basic asset info (UUIDs). Use getAssetMetadata(uuid) for full details.
   */
  async getUserAssets() {
    if (this.mockMode) {
      return this.assets || [
        { uuid: 'mock_asset_001', name: 'Mock Weapon' },
        { uuid: 'mock_asset_002', name: 'Mock Shield' }
      ];
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      this.assets = await window.DemiurgeHUD.getUserAssets();
      return this.assets;
    } catch (error) {
      console.error('Failed to get assets:', error);
      throw error;
    }
  }

  /**
   * Get full metadata for a specific DRC-369 asset
   * @param {string} assetUuid - Asset UUID
   * @returns {Promise<Object>} Full asset metadata
   */
  async getAssetMetadata(assetUuid) {
    if (this.mockMode) {
      return {
        uuid: assetUuid,
        name: 'Mock Asset',
        creatorQorId: 'creator#0001',
        creatorAccount: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        assetType: 'virtual',
        xpLevel: 10,
        experiencePoints: 5000,
        durability: 100,
        killCount: 0,
        classId: 1,
        isSoulbound: false,
        royaltyFeePercent: 25,
        mintedAt: Date.now(),
        metadata: {
          description: 'A powerful asset',
          image: '/placeholder-nft.jpg',
          attributes: {
            attack: 100,
            defense: 50,
            rarity: 'rare'
          }
        }
      };
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      // Fetch metadata from backend API
      const response = await fetch(`/api/assets/${assetUuid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch asset metadata: ${response.status}`);
      }
      const data = await response.json();
      return data.asset || data;
    } catch (error) {
      console.error('Failed to get asset metadata:', error);
      throw error;
    }
  }

  /**
   * Get all user assets with full metadata
   * @returns {Promise<Array>} Array of full asset objects
   */
  async getUserAssetsWithMetadata() {
    const assets = await this.getUserAssets();
    const assetsWithMetadata = await Promise.all(
      assets.map(async (asset) => {
        try {
          const metadata = await this.getAssetMetadata(asset.uuid);
          return { ...asset, ...metadata };
        } catch (error) {
          console.warn(`Failed to fetch metadata for ${asset.uuid}:`, error);
          return asset; // Return basic asset if metadata fetch fails
        }
      })
    );
    return assetsWithMetadata;
  }

  /**
   * Check if user owns a specific asset
   * @param {string} assetUuid - Asset UUID to check
   * @returns {Promise<boolean>}
   */
  async ownsAsset(assetUuid) {
    if (this.mockMode) {
      return this.assets.some(asset => asset.uuid === assetUuid);
    }

    if (!this.hudAvailable) {
      return false;
    }

    try {
      return await window.DemiurgeHUD.ownsAsset(assetUuid);
    } catch (error) {
      console.error('Failed to check asset ownership:', error);
      return false;
    }
  }

  /**
   * Update user's XP (for leveling system)
   * @param {number} xp - XP to add
   * @param {string} source - Source of XP (e.g., 'level_complete', 'enemy_defeated')
   */
  updateAccountXP(xp, source = 'game') {
    if (this.mockMode) {
      console.log(`[MOCK] Would award ${xp} XP from ${source}`);
      return;
    }

    if (!this.hudAvailable) {
      console.warn('DemiurgeHUD not available, XP not updated');
      return;
    }

    try {
      window.DemiurgeHUD.updateAccountXP(xp, source);
    } catch (error) {
      console.error('Failed to update XP:', error);
    }
  }

  /**
   * Get user's QOR ID
   * @returns {Promise<string>}
   */
  async getQORID() {
    if (this.mockMode) {
      return this.qorId || 'mock_user_123';
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      this.qorId = await window.DemiurgeHUD.getQORID();
      return this.qorId;
    } catch (error) {
      console.error('Failed to get QOR ID:', error);
      throw error;
    }
  }

  /**
   * Send game state to blockchain (for achievements, leaderboards, etc.)
   * @param {Object} data - Game state data
   * @returns {Promise<string>} Transaction hash or state ID
   */
  async sendGameState(data) {
    if (this.mockMode) {
      console.log('[MOCK] Would send game state:', data);
      return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // For now, this is a placeholder
    // In the future, this could call a custom RPC endpoint
    // or use a specific blockchain extrinsic
    
    console.warn('sendGameState is not yet implemented. Use updateAccountXP for XP updates.');
    
    // You could extend this to:
    // - Store achievements on-chain
    // - Update leaderboard scores
    // - Record game events for analytics
    
    return null;
  }

  /**
   * Open social platform overlay
   */
  openSocial() {
    if (this.mockMode) {
      console.log('[MOCK] Would open social platform');
      return;
    }

    if (!this.hudAvailable) {
      console.warn('DemiurgeHUD not available');
      return;
    }

    try {
      window.DemiurgeHUD.openSocial();
    } catch (error) {
      console.error('Failed to open social:', error);
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.isWalletConnected = false;
    this.qorId = null;
    this.balance = '0';
    this.assets = [];
    
    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlockchainManager;
}
```

---

## Usage Example

### In Your Rosebud.AI Game

```javascript
// Initialize BlockchainManager
const blockchain = new BlockchainManager({
  mockMode: false, // Set to true for development/testing
  onConnectionChange: (connected) => {
    console.log('Wallet connected:', connected);
    updateUI();
  }
});

// On game start
async function initGame() {
  try {
    // Connect wallet
    const connected = await blockchain.connectDemiurgeWallet();
    
    if (connected) {
      console.log('Connected! QOR ID:', await blockchain.getQORID());
      
      // Get balance
      const balance = await blockchain.getBalanceInCGT();
      console.log(`Balance: ${balance} CGT`);
      
      // Update UI
      updateBalanceDisplay(balance);
    } else {
      console.warn('Wallet not connected');
    }
  } catch (error) {
    console.error('Failed to initialize blockchain:', error);
  }
}

// Award XP when player completes a level
function onLevelComplete() {
  blockchain.updateAccountXP(50, 'level_complete');
}

// Purchase upgrade
async function purchaseUpgrade(upgradeId, cost) {
  try {
    const balance = await blockchain.getBalanceInCGT();
    
    if (balance < cost) {
      alert('Insufficient CGT balance!');
      return;
    }
    
    const txHash = await blockchain.spendCGT(cost, `upgrade_${upgradeId}`);
    console.log('Purchase successful! TX:', txHash);
    
    // Apply upgrade
    applyUpgrade(upgradeId);
    
    // Update balance display
    const newBalance = await blockchain.getBalanceInCGT();
    updateBalanceDisplay(newBalance);
  } catch (error) {
    console.error('Purchase failed:', error);
    alert('Purchase failed: ' + error.message);
  }
}

// Check if player owns premium skin
async function checkPremiumSkin(skinId) {
  const owns = await blockchain.ownsAsset(skinId);
  if (owns) {
    unlockSkin(skinId);
  }
}
```

---

## Rosebud.AI Prompt Template

Use this prompt when creating games:

```
I am building a browser-based [GENRE] game that integrates with the Demiurge Blockchain ecosystem.

The game will be loaded in an iframe by the Demiurge Hub, which automatically injects a `window.DemiurgeHUD` API.

Please include a BlockchainManager.js file that:
1. Wraps the window.DemiurgeHUD API
2. Manages wallet connection state (isWalletConnected)
3. Provides methods:
   - connectDemiurgeWallet() - Connect and verify wallet
   - getDemiurgeBalance() - Get CGT balance (returns string in smallest units)
   - getBalanceInCGT() - Get balance as human-readable CGT number
   - spendCGT(amount, reason) - Spend CGT for in-game purchases
   - getUserAssets() - Get user's DRC-369 NFT assets
   - ownsAsset(uuid) - Check if user owns specific asset
   - updateAccountXP(xp, source) - Award XP to player
   - getQORID() - Get user's QOR ID
   - sendGameState(data) - Placeholder for future state sync
4. Includes mockMode for development/testing
5. Handles errors gracefully

The game should:
- Initialize BlockchainManager on load
- Display CGT balance in UI
- Allow spending CGT for upgrades/purchases
- Award XP for achievements
- Check for NFT ownership for premium content
```

---

## DRC-369 Asset Integration

### Understanding DRC-369 Assets

DRC-369 is the Demiurge blockchain's programmable NFT standard. Assets are connected to players via:

1. **QOR ID**: Player's identity (e.g., `username#0001`)
2. **On-Chain Wallet**: Substrate account address (linked to QOR ID)
3. **Asset Ownership**: Assets are owned by the wallet address, accessible via QOR ID

### Asset Connection Flow

```
Player → QOR ID → On-Chain Wallet Address → DRC-369 Assets
```

When a player connects their wallet:
1. QOR ID is retrieved (via `getQORID()`)
2. On-chain wallet address is linked to QOR ID
3. Assets owned by that address are fetched (`getUserAssets()`)
4. Full metadata can be retrieved for each asset (`getAssetMetadata(uuid)`)

### DRC-369 Asset Structure

```javascript
{
  // Core Identity
  uuid: string,                    // Unique 32-byte hash (hex string)
  name: string,                    // Asset name (e.g., "Chronos Glaive")
  creatorQorId: string,            // Creator's QOR ID (e.g., "creator#1234")
  creatorAccount: string,          // Creator's wallet address
  owner: string,                   // Current owner's wallet address
  
  // Asset Type
  assetType: 'virtual' | 'real-world' | 'hybrid',
  
  // Stateful Properties (Module 4: DNA)
  xpLevel: number,                 // Current level (calculated from XP)
  experiencePoints: number,         // Total XP accumulated
  durability: number,               // 0-100, decreases with use
  killCount: number,               // Number of enemies defeated
  classId: number,                 // Asset class (can evolve)
  customState: Object,              // Game-specific key-value pairs
  
  // Trading Properties
  isSoulbound: boolean,            // Cannot be traded if true
  royaltyFeePercent: number,       // Royalty percentage (0-100, where 25 = 2.5%)
  mintedAt: number,                // Block number when minted
  
  // Metadata
  metadata: {
    description: string,
    image: string,                  // IPFS URL or CDN link
    attributes: Object,             // Custom attributes (attack, defense, etc.)
    // Multi-Resource (Module 1)
    resources: [                   // Different outputs for different contexts
      {
        type: 'Image',             // For marketplace display
        uri: 'ipfs://...',
        priority: 10,
        context: ['marketplace']
      },
      {
        type: '3D_Model',         // For game rendering
        uri: 'ipfs://...',
        priority: 9,
        context: ['game', 'vr']
      }
    ],
    // Nesting (Module 2)
    parentUuid: string | null,     // If nested inside another asset
    childrenUuids: string[],       // Assets nested inside this one
    equipmentSlots: [              // Equippable slots
      {
        slotName: 'RightHand',
        equippedChild: 'sword-uuid',
        requiredTrait: 'WEAPON_CLASS'
      }
    ],
    // Delegation (Module 3)
    delegation: {
      delegatedUser: string | null, // User who can use (may differ from owner)
      expiresAtBlock: number | null, // Auto-revokes at this block
      delegatedAtBlock: number
    }
  }
}
```

### Using Assets in Games

#### Example 1: Check for Premium Weapon

```javascript
// Check if player owns a specific weapon
async function checkPremiumWeapon() {
  const weaponUuid = 'chronos-glaive-uuid-here';
  const owns = await blockchain.ownsAsset(weaponUuid);
  
  if (owns) {
    // Get full metadata
    const metadata = await blockchain.getAssetMetadata(weaponUuid);
    
    // Apply weapon stats
    player.attack += metadata.metadata.attributes.attack || 0;
    player.weaponModel = metadata.metadata.resources.find(
      r => r.context.includes('game')
    )?.uri;
    
    console.log(`Equipped ${metadata.name}!`);
  }
}
```

#### Example 2: Display Player Inventory

```javascript
// Show all owned assets
async function displayInventory() {
  const assets = await blockchain.getUserAssetsWithMetadata();
  
  assets.forEach(asset => {
    console.log(`${asset.name} (Level ${asset.xpLevel})`);
    console.log(`  Durability: ${asset.durability}/100`);
    console.log(`  Kill Count: ${asset.killCount}`);
    
    // Check if asset has game resources
    const gameResource = asset.metadata?.resources?.find(
      r => r.context.includes('game')
    );
    if (gameResource) {
      console.log(`  3D Model: ${gameResource.uri}`);
    }
  });
}
```

#### Example 3: Use Asset State in Gameplay

```javascript
// Use asset durability and stats
async function useWeapon(weaponUuid) {
  const metadata = await blockchain.getAssetMetadata(weaponUuid);
  
  // Check durability
  if (metadata.durability <= 0) {
    alert('Weapon is broken!');
    return;
  }
  
  // Apply weapon stats
  const attackBonus = metadata.metadata.attributes.attack || 0;
  const damage = calculateDamage(player.baseAttack + attackBonus);
  
  // Reduce durability (would need backend call to update on-chain)
  // For now, this is handled by the blockchain when state updates occur
  
  // Award XP to weapon
  // Note: XP updates happen via updateAccountXP or backend integration
}
```

#### Example 4: Check Nested Assets

```javascript
// Check if player's character has equipped items
async function checkEquippedItems(characterUuid) {
  const character = await blockchain.getAssetMetadata(characterUuid);
  
  if (character.metadata?.equipmentSlots) {
    character.metadata.equipmentSlots.forEach(slot => {
      if (slot.equippedChild) {
        console.log(`${slot.slotName}: Equipped ${slot.equippedChild}`);
        
        // Get equipped item metadata
        blockchain.getAssetMetadata(slot.equippedChild).then(item => {
          applyItemStats(item);
        });
      }
    });
  }
}
```

---

## Backend API Endpoints

The Demiurge Hub provides backend APIs for fetching asset metadata:

### Get Asset Metadata

**Endpoint:** `GET /api/assets/:uuid`

**Response:**
```json
{
  "asset": {
    "uuid": "0x7a1f9c3e8b2d4f6a5e9c1d8b7a3f2e5c",
    "name": "Chronos Glaive",
    "creatorQorId": "creator#1234",
    "creatorAccount": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "assetType": "virtual",
    "xpLevel": 50,
    "experiencePoints": 50000,
    "durability": 75,
    "killCount": 142,
    "classId": 2,
    "isSoulbound": false,
    "royaltyFeePercent": 25,
    "mintedAt": 123456,
    "metadata": {
      "description": "A weapon that bends time around its blade.",
      "image": "ipfs://QmXxxx...",
      "attributes": {
        "attack": 150,
        "speed": 1.8,
        "rarity": "legendary",
        "element": "time"
      },
      "resources": [
        {
          "type": "Image",
          "uri": "ipfs://QmXxxx.../card.png",
          "priority": 10,
          "context": ["marketplace"]
        },
        {
          "type": "3D_Model",
          "uri": "ipfs://QmXxxx.../glaive.glb",
          "priority": 9,
          "context": ["game", "vr"]
        }
      ]
    }
  }
}
```

### Get User's Assets

**Endpoint:** `GET /api/assets/user/:address`

**Response:**
```json
{
  "assets": [
    {
      "uuid": "0x7a1f9c3e...",
      "name": "Chronos Glaive",
      "xpLevel": 50
    },
    {
      "uuid": "0x8b2e4d5f...",
      "name": "Void Shield",
      "xpLevel": 30
    }
  ]
}
```

### Implementation Notes

The backend API endpoints are implemented in:
- **Frontend API Route**: `apps/hub/src/app/api/assets/[uuid]/route.ts` (to be created)
- **Blockchain Client**: `apps/hub/src/lib/blockchain.ts` - `getUserAssets()` method
- **Blockchain Pallet**: `blockchain/pallets/pallet-drc369/src/lib.rs` - On-chain storage

### Creating Backend API Endpoint

Here's a template for creating the asset metadata endpoint:

```typescript
// apps/hub/src/app/api/assets/[uuid]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { blockchainClient } from '@/lib/blockchain';

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;
    
    if (!uuid) {
      return NextResponse.json(
        { error: 'Asset UUID required' },
        { status: 400 }
      );
    }

    // Query blockchain for asset metadata
    const asset = await blockchainClient.getAssetMetadata(uuid);
    
    return NextResponse.json({ asset });
  } catch (error: any) {
    console.error('Failed to fetch asset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}
```

---

## Key Points

1. **Automatic Injection**: `window.DemiurgeHUD` is automatically injected - no manual setup needed
2. **Mock Mode**: Enable `mockMode: true` for development without blockchain connection
3. **Balance Format**: Balances are in smallest units (8 decimals). Use `getBalanceInCGT()` for display
4. **Error Handling**: Always wrap blockchain calls in try/catch
5. **Connection State**: Use `onConnectionChange` callback to update UI when wallet connects/disconnects
6. **DRC-369 Assets**: Assets are linked via QOR ID → Wallet Address → Asset Ownership
7. **Asset Metadata**: Use `getAssetMetadata(uuid)` to fetch full asset details including stats, resources, and state
8. **Asset State**: Assets have evolving state (XP, durability, kill count) that updates on-chain
9. **Multi-Resource**: Assets can have different resources for different contexts (marketplace vs game)
10. **Nesting**: Assets can contain other assets (equipment system)

---

## Testing

### With Mock Mode
```javascript
const blockchain = new BlockchainManager({ mockMode: true });
await blockchain.connectDemiurgeWallet(); // Always succeeds
const balance = await blockchain.getBalanceInCGT(); // Returns 1000 CGT
```

### In Production
```javascript
const blockchain = new BlockchainManager({ mockMode: false });
// Automatically uses window.DemiurgeHUD when loaded in Hub
```

---

## Backend Implementation

### Asset Metadata API Endpoint

The Demiurge Hub provides a backend API endpoint for fetching DRC-369 asset metadata:

**File:** `apps/hub/src/app/api/assets/[uuid]/route.ts`

**Usage:**
```javascript
// In your game
const response = await fetch(`/api/assets/${assetUuid}`);
const { asset } = await response.json();
```

**Blockchain Client Method:**

The `BlockchainClient` class (`apps/hub/src/lib/blockchain.ts`) includes:
- `getUserAssets(address)` - Get all assets owned by an address
- `getAssetMetadata(uuid)` - Get full metadata for a specific asset

### How Assets Connect to Players

1. **Player Identity (QOR ID)**
   - Each player has a unique QOR ID (e.g., `username#0001`)
   - QOR ID is linked to an on-chain wallet address

2. **Wallet Address**
   - Substrate account address (SS58 format)
   - Stored in QOR ID profile: `profile.on_chain.address`

3. **Asset Ownership**
   - DRC-369 assets are owned by wallet addresses
   - Query: `pallet-drc369.ownerItems(address)` returns all asset UUIDs
   - Query: `pallet-drc369.assets(uuid)` returns full metadata

4. **Game Integration Flow**
   ```
   Player connects → Get QOR ID → Get wallet address → Query assets → Fetch metadata → Use in game
   ```

### Real-World Game Integration Example

Here's a complete example of integrating DRC-369 assets into a Rosebud.AI game:

```javascript
// Initialize blockchain manager
const blockchain = new BlockchainManager({
  mockMode: false,
  onConnectionChange: (connected) => {
    if (connected) {
      loadPlayerAssets();
    }
  }
});

// Load player's assets on game start
async function loadPlayerAssets() {
  try {
    // Get QOR ID and verify connection
    const qorId = await blockchain.getQORID();
    console.log('Player QOR ID:', qorId);
    
    // Get all assets with full metadata
    const assets = await blockchain.getUserAssetsWithMetadata();
    console.log(`Player owns ${assets.length} assets`);
    
    // Process each asset
    assets.forEach(asset => {
      // Check asset type and apply to game
      if (asset.metadata?.attributes?.weapon) {
        unlockWeapon(asset);
      } else if (asset.metadata?.attributes?.skin) {
        unlockSkin(asset);
      } else if (asset.metadata?.attributes?.powerup) {
        unlockPowerup(asset);
      }
      
      // Use asset resources (3D models, images, etc.)
      const gameResource = asset.metadata?.resources?.find(
        r => r.context.includes('game')
      );
      if (gameResource) {
        loadAssetModel(asset.uuid, gameResource.uri);
      }
    });
  } catch (error) {
    console.error('Failed to load assets:', error);
  }
}

// Unlock weapon from asset
function unlockWeapon(asset) {
  const attack = asset.metadata.attributes.attack || 0;
  const durability = asset.durability;
  
  // Add weapon to player inventory
  player.weapons.push({
    uuid: asset.uuid,
    name: asset.name,
    attack: attack,
    durability: durability,
    level: asset.xpLevel
  });
  
  // Apply weapon stats if equipped
  if (isEquipped(asset)) {
    player.baseAttack += attack;
  }
}

// Check if asset is equipped (via nesting/equipment slots)
function isEquipped(asset) {
  // Check if asset is in an equipment slot of player's character
  // This would require checking parent asset's equipment slots
  return false; // Simplified
}

// Use asset state in gameplay
async function useWeaponInCombat(weaponUuid) {
  const weapon = await blockchain.getAssetMetadata(weaponUuid);
  
  // Check durability
  if (weapon.durability <= 0) {
    showMessage('Weapon is broken!');
    return false;
  }
  
  // Apply weapon stats
  const damage = calculateDamage(weapon.metadata.attributes.attack);
  
  // Note: Durability reduction would be handled by backend/blockchain
  // when game state updates are synced
  
  // Award XP to weapon (via backend integration)
  // This would typically happen through game state sync
  
  return true;
}
```

## Next Steps

1. Copy `BlockchainManager.js` into your Rosebud.AI game project
2. Initialize it in your game's main file
3. Use the methods throughout your game code
4. Test with `mockMode: true` first
5. Deploy and test in the Demiurge Hub
6. Integrate DRC-369 assets for weapons, skins, powerups, etc.
7. Use asset metadata (stats, resources, state) in gameplay

---

**Ready to build?** Use the prompt template above and integrate `BlockchainManager` with DRC-369 assets into your game! 🚀
