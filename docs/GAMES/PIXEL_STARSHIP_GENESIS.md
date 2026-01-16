# 🎮 Pixel Starship Genesis (Galaga Creator)

**Game ID:** `galaga-creator`  
**Version:** 1.0.0  
**Status:** ✅ **FULLY INTEGRATED**

---

## 📋 Overview

Pixel Starship Genesis is an infinite procedural space shooter game where players control a starship to defeat enemy swarms, collect coins, and unlock powerful ship skins. The game is fully integrated with the Demiurge Blockchain ecosystem, supporting real CGT transactions and DRC-369 NFT assets.

---

## 🎯 CGT Integration

### Earning CGT

Players can earn Creator God Token (CGT) through various in-game actions:

| Action | CGT Amount | Probability |
|--------|------------|-------------|
| Enemy Kill | 1 CGT | 10% chance |
| Boss Defeat | 10 CGT | 100% (guaranteed) |
| Coin Collection | 50 CGT | 100% (guaranteed) |

**Implementation:**
- Rewards are batched every 5 seconds or when queue reaches 10 rewards
- Submitted via `/api/games/reward` endpoint
- Creates on-chain transactions to player's wallet
- Rate limited: Max 100 rewards per minute per user

**Files:**
- `apps/hub/public/games/galaga-creator/blockchain-integration.js` - Reward batching system
- `apps/hub/src/app/api/games/reward/route.ts` - Reward API endpoint

### Spending CGT

Players can spend CGT to unlock ship skins:

| Skin | Price | Description |
|------|-------|-------------|
| Default | Free | Standard player ship |
| Carmine Fury | 50 CGT | Red-themed ship skin |
| Auric Titan | 150 CGT | Gold-themed ship skin |
| Void Stalker | 300 CGT | Dark-themed ship skin |

**Implementation:**
- Uses `window.DemiurgeHUD.spendCGT()` for on-chain transactions
- Requires wallet password confirmation
- Updates local state immediately
- Saves game data after purchase

**Files:**
- `apps/hub/public/games/galaga-creator/scenes/MarketplaceScene.js` - Marketplace with CGT spending
- `apps/hub/src/app/api/games/spend/route.ts` - CGT spending API endpoint

---

## 🎨 DRC-369 NFT Support

### Supported Asset Types

- **Ship Skins** - Exclusive ship skins that can be equipped in-game

### Exclusive Assets

| UUID | Name | Description |
|------|------|-------------|
| `galaga-exclusive-skin-001` | Chronos Glaive Ship | Exclusive ship skin for Pixel Starship Genesis owners |

### Integration

Games can check for owned DRC-369 assets using:
```javascript
// Check if user owns a specific asset
const ownsAsset = await window.DemiurgeHUD.ownsAsset('galaga-exclusive-skin-001');

// Get all user assets
const assets = await window.DemiurgeHUD.getUserAssets();
```

**Files:**
- `apps/hub/src/lib/blockchain.ts` - Asset metadata fetching
- `apps/hub/src/components/GameWrapper.tsx` - Asset filtering by game

---

## 🔐 QOR ID Integration

### Authentication

- Players must be logged in with QOR ID to play
- Game data is stored per QOR ID
- CGT rewards are disbursed to player's on-chain wallet address

### XP System

Players can earn XP through gameplay:
- Defeating enemies: +1 XP per kill
- Boss defeats: +10 XP
- High scores: +5 XP per 1000 points

XP updates are sent via `window.DemiurgeHUD.updateAccountXP(xp, source)`.

---

## 💾 Game Data Storage

### Stored Data

- **Score & High Score** - Current and best scores
- **CGT Earned** - Total CGT earned in this game
- **Upgrades** - Ammo, speed, laser, defense, bombs levels
- **Owned Skins** - List of unlocked ship skins
- **Equipped Skin** - Currently active skin
- **Kill Count** - Total enemies defeated
- **Play Time** - Total time played (in seconds)

### Storage API

- **GET** `/api/games/data?gameId=galaga-creator` - Load game data
- **POST** `/api/games/data` - Save game data

**Auto-save:**
- Every 30 seconds during gameplay
- On game over
- After purchases

---

## 🚀 Game Files

```
apps/hub/public/games/galaga-creator/
├── index.html              # Entry point
├── main.js                 # Main game logic
├── config.js               # Game configuration
├── blockchain-integration.js  # CGT & blockchain integration
├── AudioManager.js         # Sound management
├── metadata.json           # Game metadata
├── export-metadata.json    # Rosebud.AI export info
├── entities/
│   ├── Player.js           # Player ship entity
│   └── Enemy.js            # Enemy entities
└── scenes/
    ├── BootScene.js        # Loading scene
    ├── MenuScene.js        # Main menu
    ├── GameScene.js        # Main gameplay
    ├── MarketplaceScene.js # CGT marketplace
    └── UpgradeScene.js     # Ship upgrades
```

---

## 🔧 Technical Details

### Blockchain Integration

The game uses the `BlockchainIntegration` class for all blockchain operations:

```javascript
import { blockchainIntegration } from './blockchain-integration.js';

// Initialize
await blockchainIntegration.init();

// Load balance
const balance = await blockchainIntegration.loadBalance();

// Award CGT
await blockchainIntegration.awardCGT(amount, reason);

// Spend CGT
await blockchainIntegration.spendCGT(amount, reason);

// Save game data
await blockchainIntegration.saveGameData(gameState);
```

### HUD API

The game communicates with the Demiurge Hub via `window.DemiurgeHUD`:

```javascript
// Get CGT balance
const balance = await window.DemiurgeHUD.getCGTBalance();

// Spend CGT
const txHash = await window.DemiurgeHUD.spendCGT(amount, reason);

// Get QOR ID
const qorId = await window.DemiurgeHUD.getQORID();

// Get user assets
const assets = await window.DemiurgeHUD.getUserAssets();

// Check asset ownership
const owns = await window.DemiurgeHUD.ownsAsset(uuid);

// Update XP
window.DemiurgeHUD.updateAccountXP(xp, source);
```

---

## 📊 Game Registry

Registered in `apps/hub/src/lib/game-registry.ts`:

```typescript
{
  id: 'galaga-creator',
  title: 'Pixel Starship Genesis',
  description: 'Infinite procedural gameplay with enemy swarms...',
  tags: ['action', 'arcade', 'shooter', 'space', 'cgt-earning', 'nft-support'],
  minLevel: 1,
  cgtEarning: { /* ... */ },
  nftSupport: { enabled: true, assetTypes: ['ship_skin'] },
}
```

---

## 🎮 How to Play

1. **Start Game** - Navigate to `/portal` and click on Pixel Starship Genesis
2. **Earn CGT** - Defeat enemies, collect coins, and defeat bosses
3. **Spend CGT** - Visit the Marketplace to unlock ship skins
4. **Equip NFTs** - If you own DRC-369 ship skin NFTs, they'll appear in your inventory
5. **Track Progress** - Your scores, kills, and CGT earnings are saved automatically

---

## 🔄 Future Enhancements

- [ ] On-chain game data storage via pallet-game-data
- [ ] Leaderboards with CGT rewards
- [ ] Tournament mode with entry fees
- [ ] Cross-game NFT compatibility
- [ ] Real-time multiplayer battles

---

## 📝 Notes

- Game requires QOR ID authentication
- CGT transactions require blockchain connection
- Game data is stored server-side (will migrate to on-chain)
- Rate limiting prevents reward abuse
