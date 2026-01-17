# Phaser.js Integration Guide for Demiurge Blockchain

## Overview

Phaser.js is a powerful 2D HTML5 game framework perfect for building browser-based games that integrate with the Demiurge gaming blockchain. This guide covers how to integrate Phaser games with our on-chain gaming infrastructure.

## Why Phaser.js for Demiurge?

### Perfect Fit for Gaming L1

1. **Browser-Native**: Runs entirely in browser, no downloads required
2. **Web3 Ready**: Easy integration with Web3 wallets and blockchain APIs
3. **Performance**: WebGL/Canvas rendering, optimized for real-time gameplay
4. **Rich Ecosystem**: Physics engines, asset management, scene system
5. **Creator-Friendly**: TypeScript support, extensive documentation

### Integration Points with Demiurge

- **Game Assets Pallet**: In-game currencies and feeless transfers
- **DRC-369 NFTs**: Stateful, evolving game items (weapons, characters, skins)
- **Energy Pallet**: Regenerating resources (mana, stamina)
- **Composable NFTs**: Equippable items and nested ownership
- **QOR Identity**: Player reputation and cross-game identity

---

## Phaser.js Versions & Installation

### Phaser Framework (Game Engine)

**Phaser 3** (Current, Recommended)
- Latest stable: v3.80+
- Full-featured 2D game engine
- WebGL + Canvas rendering
- TypeScript definitions included

**Installation Options:**

```bash
# Via npm (recommended for projects)
npm install phaser

# Via CDN (quick prototyping)
<script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>

# Via yarn
yarn add phaser
```

### Phaser Editor (IDE)

**Phaser Editor Core** (Server-based)
- Runs as web server (localhost:1959)
- Access via browser
- Perfect for cloud/remote development
- Minimal overhead

**Phaser Editor Desktop** (Electron App)
- Native desktop application
- Built-in project templates
- Easier for local development
- Full IDE features

**Recommendation**: Use **Phaser Editor Core** on the Monad server for cloud-based game development, or **Desktop** for local development.

---

## Architecture: Phaser + Demiurge Integration

### Hybrid Architecture Pattern

```
┌─────────────────────────────────────────┐
│         Browser (Phaser Game)           │
│  ┌───────────────────────────────────┐  │
│  │  Phaser Game Engine               │  │
│  │  - Rendering (WebGL/Canvas)        │  │
│  │  - Physics (Arcade/Matter)         │  │
│  │  - Input Handling                  │  │
│  │  - Scene Management                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Demiurge SDK / Web3 Layer        │  │
│  │  - Wallet Connection (Polkadot.js)│  │
│  │  - Contract Interactions          │  │
│  │  - NFT Queries                    │  │
│  │  - Transaction Signing            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↕ WebSocket/HTTP
┌─────────────────────────────────────────┐
│      Demiurge Blockchain (Substrate)    │
│  ┌───────────────────────────────────┐  │
│  │  Game Assets Pallet                │  │
│  │  - Currency transfers              │  │
│  │  - Feeless transactions            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  DRC-369 Pallet                   │  │
│  │  - Stateful NFTs                  │  │
│  │  - Evolving assets                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Energy Pallet                    │  │
│  │  - Regenerating resources         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### On-Chain vs Off-Chain Responsibilities

| Component | Location | Technology |
|-----------|----------|------------|
| **Game Rendering** | Browser (Off-chain) | Phaser.js |
| **Game Logic** | Browser (Off-chain) | JavaScript/TypeScript |
| **Player State** | Blockchain (On-chain) | DRC-369 NFTs, Energy Pallet |
| **Rewards/Currency** | Blockchain (On-chain) | Game Assets Pallet |
| **Ownership** | Blockchain (On-chain) | DRC-369, Composable NFTs |
| **Leaderboards** | Hybrid | On-chain storage + Indexer |

---

## Integration Patterns

### Pattern 1: Wallet Connection & Authentication

```typescript
// phaser-game/src/scenes/BootScene.ts
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';

export class BootScene extends Phaser.Scene {
  private api: ApiPromise | null = null;
  private account: any = null;

  async create() {
    // Initialize Polkadot.js API
    const provider = new WsProvider('wss://demiurge-testnet.io');
    this.api = await ApiPromise.create({ provider });

    // Connect wallet (Polkadot.js extension)
    const extensions = await web3Enable('Demiurge Game');
    const accounts = await web3Accounts();
    
    if (accounts.length > 0) {
      this.account = accounts[0];
      this.scene.start('MainMenuScene', { account: this.account });
    } else {
      // Show wallet connection UI
      this.showWalletPrompt();
    }
  }
}
```

### Pattern 2: Loading On-Chain Assets (DRC-369 NFTs)

```typescript
// phaser-game/src/services/NFTService.ts
import { ApiPromise } from '@polkadot/api';

export class NFTService {
  constructor(private api: ApiPromise, private account: string) {}

  async loadPlayerNFTs(): Promise<GameAsset[]> {
    // Query DRC-369 pallet for owned NFTs
    const nfts = await this.api.query.drc369.assetsByOwner(this.account);
    
    return nfts.map((nft: any) => ({
      uuid: nft.uuid.toString(),
      resources: nft.resources, // Multi-resource support
      state: nft.state, // XP, level, durability, etc.
      // Select appropriate resource for Phaser (2D image)
      spriteUrl: this.selectResource(nft.resources, 'game_2d')
    }));
  }

  selectResource(resources: any[], context: string): string {
    // DRC-369 multi-resource polymorphism
    // Select 2D sprite for Phaser game
    const gameResource = resources.find(r => 
      r.context.includes(context) && r.type === 'Image'
    );
    return gameResource?.uri || resources[0].uri;
  }
}
```

### Pattern 3: In-Game Currency (Game Assets Pallet)

```typescript
// phaser-game/src/services/CurrencyService.ts
export class CurrencyService {
  async transferCurrency(
    to: string, 
    currencyId: number, 
    amount: number
  ): Promise<void> {
    // Feeless transfer via Game Assets Pallet
    const tx = this.api.tx.gameAssets.transfer(
      currencyId,
      to,
      amount
    );

    // Sign and send (developer-sponsored = feeless)
    await tx.signAndSend(this.account, ({ status }) => {
      if (status.isInBlock) {
        console.log('Currency transferred!');
        // Update game UI
        this.updateCurrencyDisplay();
      }
    });
  }

  async getBalance(currencyId: number): Promise<number> {
    const balance = await this.api.query.gameAssets.balance(
      currencyId,
      this.account
    );
    return balance.toNumber();
  }
}
```

### Pattern 4: Regenerating Energy (Energy Pallet)

```typescript
// phaser-game/src/services/EnergyService.ts
export class EnergyService {
  async getEnergy(): Promise<EnergyState> {
    const energy = await this.api.query.energy.energy(this.account);
    return {
      current: energy.current.toNumber(),
      max: energy.max.toNumber(),
      regenRate: energy.regenRate.toNumber(), // per block
      lastUpdate: energy.lastUpdate.toNumber()
    };
  }

  async useEnergy(amount: number): Promise<boolean> {
    // Check if player has enough energy
    const state = await this.getEnergy();
    if (state.current < amount) {
      return false; // Show "Not enough energy" message
    }

    // Consume energy on-chain
    const tx = this.api.tx.energy.consume(amount);
    await tx.signAndSend(this.account);
    return true;
  }

  // Update energy display in Phaser UI
  updateEnergyBar(scene: Phaser.Scene, energy: EnergyState) {
    const energyBar = scene.add.graphics();
    const width = 200;
    const height = 20;
    const percent = energy.current / energy.max;

    energyBar.fillStyle(0x00ff00);
    energyBar.fillRect(10, 10, width * percent, height);
  }
}
```

### Pattern 5: Stateful NFT Updates (DRC-369)

```typescript
// phaser-game/src/services/GameStateService.ts
export class GameStateService {
  async updateNFTState(
    nftUuid: string, 
    updates: { xp?: number; level?: number }
  ): Promise<void> {
    // Update DRC-369 NFT state on-chain
    const tx = this.api.tx.drc369.updateState(
      nftUuid,
      updates
    );

    await tx.signAndSend(this.account, ({ status }) => {
      if (status.isInBlock) {
        // Refresh NFT data in game
        this.refreshNFT(nftUuid);
      }
    });
  }

  async evolveNFT(nftUuid: string, evolutionStage: number): Promise<void> {
    // Trigger NFT evolution (changes sprite/resources)
    const tx = this.api.tx.drc369.evolve(nftUuid, evolutionStage);
    await tx.signAndSend(this.account);
    
    // Reload NFT resources (new sprite for evolved form)
    await this.reloadNFTAssets(nftUuid);
  }
}
```

---

## Phaser Game Structure for Demiurge

### Recommended Project Structure

```
phaser-demiurge-game/
├── src/
│   ├── scenes/
│   │   ├── BootScene.ts          # Wallet connection, API init
│   │   ├── MainMenuScene.ts      # Game selection, NFT gallery
│   │   ├── GameScene.ts          # Main gameplay
│   │   └── InventoryScene.ts     # NFT inventory, equipping
│   ├── services/
│   │   ├── BlockchainService.ts  # Polkadot.js API wrapper
│   │   ├── NFTService.ts         # DRC-369 interactions
│   │   ├── CurrencyService.ts    # Game Assets Pallet
│   │   └── EnergyService.ts      # Energy Pallet
│   ├── entities/
│   │   ├── Player.ts             # Player character (linked to NFT)
│   │   ├── Item.ts               # Game items (DRC-369 NFTs)
│   │   └── Currency.ts           # In-game currency display
│   ├── ui/
│   │   ├── WalletUI.ts           # Wallet connection UI
│   │   ├── NFTGallery.ts         # Display owned NFTs
│   │   └── EnergyBar.ts          # Energy display
│   └── main.ts                   # Phaser game config
├── assets/
│   ├── sprites/                  # Game sprites
│   ├── nfts/                     # NFT resources (from IPFS)
│   └── ui/                       # UI elements
├── package.json
└── tsconfig.json
```

### Example: Complete Game Scene with Blockchain Integration

```typescript
// src/scenes/GameScene.ts
import { NFTService } from '../services/NFTService';
import { CurrencyService } from '../services/CurrencyService';
import { EnergyService } from '../services/EnergyService';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private nftService!: NFTService;
  private currencyService!: CurrencyService;
  private energyService!: EnergyService;
  private playerNFT: any = null;

  init(data: { account: any; api: ApiPromise }) {
    // Initialize blockchain services
    this.nftService = new NFTService(data.api, data.account.address);
    this.currencyService = new CurrencyService(data.api, data.account);
    this.energyService = new EnergyService(data.api, data.account);
  }

  async preload() {
    // Load player NFT sprite (from DRC-369 resources)
    const nfts = await this.nftService.loadPlayerNFTs();
    if (nfts.length > 0) {
      this.playerNFT = nfts[0];
      this.load.image('player', this.playerNFT.spriteUrl);
    } else {
      this.load.image('player', 'assets/default-player.png');
    }
  }

  async create() {
    // Create player sprite from NFT
    this.player = this.add.sprite(400, 300, 'player');
    
    // Load energy state
    const energy = await this.energyService.getEnergy();
    this.energyService.updateEnergyBar(this, energy);

    // Load currency balance
    const balance = await this.currencyService.getBalance(1); // Currency ID 1
    this.add.text(10, 40, `Gold: ${balance}`, { color: '#FFD700' });

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  async update() {
    // Handle player movement
    if (this.cursors.left.isDown) {
      this.player.x -= 5;
    }
    // ... other movement

    // Check for collectibles (trigger on-chain rewards)
    this.checkCollectibles();
  }

  async checkCollectibles() {
    // When player collects item, award currency on-chain
    const collectible = this.getCollectibleAt(this.player.x, this.player.y);
    if (collectible) {
      // Consume energy
      const hasEnergy = await this.energyService.useEnergy(10);
      if (!hasEnergy) {
        this.showMessage('Not enough energy!');
        return;
      }

      // Award currency
      await this.currencyService.transferCurrency(
        this.account.address,
        1, // Currency ID
        100 // Amount
      );

      // Update NFT XP
      if (this.playerNFT) {
        await this.nftService.updateNFTState(this.playerNFT.uuid, {
          xp: this.playerNFT.state.xp + 10
        });
      }

      // Remove collectible from scene
      collectible.destroy();
    }
  }
}
```

---

## Server Installation: Phaser Editor Core

### On Monad Server (Pleroma)

```bash
# SSH to server
ssh pleroma

# Create games directory
mkdir -p /data/Demiurge-Blockchain/games
cd /data/Demiurge-Blockchain/games

# Download Phaser Editor Core
wget https://github.com/phaserjs/phaser-editor-core/releases/latest/download/PhaserEditor-Core-linux-x64.zip
unzip PhaserEditor-Core-linux-x64.zip
cd PhaserEditor

# Run Phaser Editor server
./PhaserEditor -project /data/Demiurge-Blockchain/games -public

# Access at: http://51.210.209.112:1959/editor
```

### Integration with Hub App

Add Phaser Editor to Docker Compose:

```yaml
# docker/docker-compose.production.yml
services:
  phaser-editor:
    image: phasereditor/core:latest
    container_name: demiurge-phaser-editor
    ports:
      - "1959:1959"
    volumes:
      - ./games:/projects
    networks:
      - demiurge-network
```

---

## Best Practices

### 1. Async Blockchain Calls

**Problem**: Blockchain calls are async, Phaser game loop is synchronous.

**Solution**: Use Phaser's event system and promises:

```typescript
// ❌ Bad: Blocks game loop
const balance = await this.api.query.gameAssets.balance(...);
this.updateUI(balance);

// ✅ Good: Non-blocking
this.api.query.gameAssets.balance(...).then(balance => {
  this.events.emit('balance-updated', balance);
});

this.events.on('balance-updated', (balance) => {
  this.updateUI(balance);
});
```

### 2. Transaction Feedback

Always show transaction status:

```typescript
async executeTransaction(tx: any) {
  // Show loading UI
  this.showLoading('Processing transaction...');

  await tx.signAndSend(this.account, ({ status, events }) => {
    if (status.isInBlock) {
      this.hideLoading();
      this.showSuccess('Transaction confirmed!');
    } else if (status.isFinalized) {
      // Transaction finalized
    }
  });
}
```

### 3. Caching On-Chain Data

Cache frequently accessed data to reduce RPC calls:

```typescript
class CacheService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private TTL = 5000; // 5 seconds

  async getCached(key: string, fetcher: () => Promise<any>) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

### 4. Asset Loading from IPFS

DRC-369 NFTs store resources on IPFS. Use IPFS gateway:

```typescript
function loadIPFSResource(ipfsHash: string): string {
  // Use public IPFS gateway
  return `https://ipfs.io/ipfs/${ipfsHash}`;
  // Or use your own gateway: `https://ipfs.demiurge.io/ipfs/${ipfsHash}`
}
```

---

## Integration Checklist

- [ ] Set up Phaser project (npm/yarn)
- [ ] Install Polkadot.js API (`@polkadot/api`)
- [ ] Install Polkadot.js extension (`@polkadot/extension-dapp`)
- [ ] Create blockchain service layer
- [ ] Implement wallet connection flow
- [ ] Load player NFTs (DRC-369)
- [ ] Integrate currency system (Game Assets Pallet)
- [ ] Add energy system (Energy Pallet)
- [ ] Implement NFT state updates
- [ ] Add transaction feedback UI
- [ ] Test on Demiurge testnet
- [ ] Deploy to Hub app

---

## Example Games Ideas

### 1. **NFT Battle Arena**
- Players use DRC-369 character NFTs
- Battle outcomes update NFT XP/level
- Winners earn game currency
- Energy system limits battles per day

### 2. **Collectible Platformer**
- Collect items that mint as DRC-369 NFTs
- Equip items (Composable NFTs)
- Trade items on marketplace
- Energy regenerates for new levels

### 3. **Idle Clicker**
- Earn game currency over time
- Purchase upgrades (stateful NFTs)
- NFTs evolve based on progress
- Cross-game currency via Game Assets Pallet

---

## Resources

- **Phaser.js Docs**: https://phaser.io/phaser3/docs
- **Polkadot.js API**: https://polkadot.js.org/docs/api
- **Demiurge Docs**: `/docs` directory
- **DRC-369 Spec**: `/docs/blockchain/DRC369_ARCHITECTURE.md`
- **Game Integration Guide**: `/docs/GAME_INTEGRATION_GUIDE.md`

---

**Next Steps**: Create a starter template Phaser game integrated with Demiurge blockchain!
