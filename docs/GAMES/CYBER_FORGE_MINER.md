# ⛏️ Cyber Forge Miner (KillBot Clicker)

**Game ID:** `killBot-clicker`  
**Version:** 1.0.0  
**Status:** ✅ **INTEGRATED** (Needs CGT Integration Update)

---

## 📋 Overview

Cyber Forge Miner is an interactive pattern-matching data breach mini-game where players mine CGT through computational work. Players submit hash data through pattern matching to earn rewards. The game requires QOR ID authentication and connects to the Demiurge ecosystem for currency disbursement.

---

## 🎯 CGT Integration

### Current Status

⚠️ **Needs Update:** The game currently uses a mock API endpoint (`http://51.210.209.112:8082`). It needs to be updated to use the Demiurge blockchain integration system.

### Proposed Earning Rates

| Action | CGT Amount | Probability |
|--------|------------|-------------|
| Work Submit | 0.5 CGT | 100% |
| Pattern Match | 2.0 CGT | 100% |
| Session Complete | 10.0 CGT | 100% |

### Required Updates

1. **Replace APIManager** - Update to use `BlockchainManager.js` template
2. **Integrate HUD API** - Use `window.DemiurgeHUD` for CGT operations
3. **Update Reward System** - Use `/api/games/reward` endpoint
4. **Add QOR ID Auth** - Integrate with QOR ID system

---

## 🔐 QOR ID Integration

### Current Status

⚠️ **Needs Update:** The game has a `LoginScene.js` but it uses mock authentication. It should be updated to use QOR ID authentication.

### Required Changes

1. Remove mock login system
2. Check for `window.DemiurgeHUD` availability
3. Use `window.DemiurgeHUD.getQORID()` for user identification
4. Store game data per QOR ID

---

## 💾 Game Data Storage

### Stored Data

- **Session Data** - Mining session information
- **Hash Rate** - Computational power
- **Balance** - Mined CGT (should sync with blockchain)
- **Rank** - Leaderboard position
- **Uptime** - Session duration

### Storage API

- **GET** `/api/games/data?gameId=killBot-clicker` - Load game data
- **POST** `/api/games/data` - Save game data

---

## 🚀 Game Files

```
apps/hub/public/games/killBot-clicker/
├── index.html              # Entry point
├── main.js                 # Main game logic
├── config.js               # Game configuration
├── config.json             # API configuration (needs update)
├── metadata.json           # Game metadata
├── export-metadata.json    # Rosebud.AI export info
├── managers/
│   ├── APIManager.js       # API integration (needs blockchain update)
│   ├── GameState.js        # Game state management
│   └── SoundManager.js     # Sound management
└── scenes/
    ├── BootScene.js        # Loading scene
    ├── LoginScene.js       # Login (needs QOR ID integration)
    └── GameScene.js        # Main gameplay
```

---

## 🔧 Integration Checklist

- [ ] Replace `APIManager.js` with `BlockchainManager.js` pattern
- [ ] Integrate `window.DemiurgeHUD` API
- [ ] Update CGT earning to use `/api/games/reward`
- [ ] Replace mock login with QOR ID authentication
- [ ] Add game data storage via `/api/games/data`
- [ ] Update `config.json` to use Demiurge API endpoints
- [ ] Add DRC-369 NFT support (if applicable)

---

## 📝 Migration Guide

### Step 1: Add BlockchainManager

Copy `apps/games/TEMPLATE/BlockchainManager.js` to the game directory and import it:

```javascript
import { BlockchainManager } from './BlockchainManager.js';

const blockchain = new BlockchainManager({
  mockMode: false, // Set to true for development
});
```

### Step 2: Update Login

Replace `LoginScene.js` mock authentication:

```javascript
// Old
const result = await apiManager.login(username, password);

// New
const connected = await blockchain.connectDemiurgeWallet();
if (connected) {
  const qorId = await blockchain.getQORID();
  // Proceed with game
}
```

### Step 3: Update CGT Earning

Replace API submission with blockchain rewards:

```javascript
// Old
const result = await apiManager.submitWork(hashData);

// New
await blockchain.sendGameState({
  action: 'work_submit',
  hashData: hashData,
});

// Or use reward API directly
await fetch('/api/games/reward', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    gameId: 'killBot-clicker',
    amount: 0.5,
    reason: 'work_submit',
  }),
});
```

---

## 🎮 How to Play (After Integration)

1. **Authenticate** - Game will check for QOR ID automatically
2. **Start Mining** - Begin pattern-matching computational work
3. **Submit Work** - Submit hash data to earn CGT
4. **Track Earnings** - View your CGT balance in real-time
5. **Disburse** - Withdraw earned CGT to your wallet

---

## 📊 Game Registry

Registered in `apps/hub/src/lib/game-registry.ts`:

```typescript
{
  id: 'killBot-clicker',
  title: 'Cyber Forge Miner',
  description: 'Interactive pattern-matching data breach mini-game...',
  tags: ['clicker', 'mining', 'puzzle', 'cyber', 'cgt-earning'],
  minLevel: 1,
  cgtEarning: { /* ... */ },
  nftSupport: { enabled: false },
}
```

---

## 🔄 Future Enhancements

- [ ] Real blockchain mining integration
- [ ] Competitive mining tournaments
- [ ] NFT rewards for top miners
- [ ] Cross-game asset compatibility
- [ ] Real-time leaderboards

---

## ⚠️ Important Notes

- **Current State:** Game uses mock API and needs blockchain integration
- **Priority:** High - Game should be updated to use Demiurge ecosystem
- **Breaking Changes:** Will require game code updates
- **Testing:** Test thoroughly after integration updates
