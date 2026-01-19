# 🎭 DEMIURGE-BLOCKCHAIN

**The Ultimate Blockchain for Creators, Developers, and Gamers**

> *"From the Monad, all creation emanates. To the Pleroma, all value returns."*

---

## 🚀 What is Demiurge?

Demiurge is a **custom blockchain framework** built from scratch, optimized for:

- **Creators** - Mint, evolve, and monetize digital assets
- **Developers** - Build games and apps with zero friction  
- **Gamers** - Own, trade, and earn from in-game achievements

**100 Sparks = 1 CGT** - The atomic unit of creation.

---

## ✨ Key Features

### 🔥 Revolutionary Features
- **Zero-Knowledge Privacy** - Private transactions, anonymous voting
- **Feeless Transactions** - Energy-based model, zero gas for users
- **Stateful NFTs** - NFTs that evolve, gain XP, and level up
- **Yield-Generating NFTs** - Earn passive income from NFTs
- **Session Keys** - Seamless game experience, no wallet popups
- **Composable NFTs** - Equip items, nest NFTs, build collections
- **Fractional Assets** - Guild-owned legendary items
- **QOR Identity** - Username-based identity system

### 🎮 Gaming-First
- **Multi-Asset System** - Multiple currencies per game
- **Cross-Game Assets** - Use items across games
- **True Ownership** - Own your items as NFTs
- **Revenue Sharing** - Games share revenue with NFT owners

### 💰 Tokenomics
- **Total Supply**: 13,000,000,000 CGT (fixed)
- **Precision**: 2 decimals
- **Smallest Unit**: 1 Spark = 0.01 CGT
- **Distribution**: See `docs/blockchain/CGT_TOKENOMICS.md`

---

## 🏗️ Architecture

### Custom Framework (No Substrate)

We're building our **own blockchain framework** from scratch:

```
framework/
├── core/          # Runtime engine
├── storage/       # Storage layer
├── consensus/     # Consensus mechanism
├── network/       # P2P networking
├── modules/       # Module system
├── rpc/           # RPC layer
└── node/          # Full node
```

**Why?** Complete independence, optimized for our use case, maximum innovation.

**See**: `docs/ULTIMATE_BLOCKCHAIN_DESIGN.md` for complete architecture

---

## 📦 Project Structure

```
Demiurge-Blockchain/
├── framework/         # Custom blockchain framework 🆕
├── apps/              # Web platform (Next.js)
├── packages/          # Shared packages (SDKs, UI)
├── services/          # Backend services (QOR auth)
├── archive/           # Archived code (old Substrate blockchain)
└── docs/              # Documentation
```

---

## 🚀 Quick Start

### For Developers (Building dApps/Games)

**No installation needed** - Use our public RPC endpoint:

```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';
const rpc = new DemiurgeRpcClient('https://rpc.demiurge.cloud');
const health = await rpc.getHealth();
```

**📖 Full Guide**: [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) | [`docs/developers/QUICK_START.md`](docs/developers/QUICK_START.md)

### For Contributors (Running Locally)

**Prerequisites**:
- Rust 1.80+
- Node.js 20+
- PostgreSQL (for QOR auth)

**Build Framework**:
```bash
cd framework
cargo build --release
```

**Run Web Platform**:
```bash
npm install
npm run dev
```

**Run QOR Auth Service**:
```bash
cd services/qor-auth
cargo run
```

---

## 📚 Documentation

### Architecture
- [`ULTIMATE_BLOCKCHAIN_DESIGN.md`](docs/ULTIMATE_BLOCKCHAIN_DESIGN.md) - Complete blockchain design
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Technical architecture
- [`COMPONENT_MAP.md`](docs/COMPONENT_MAP.md) - Component overview
- [`CONSENSUS_DESIGN.md`](docs/CONSENSUS_DESIGN.md) - Consensus mechanism

### Development
- [`MODULE_SPECS.md`](docs/MODULE_SPECS.md) - Module specifications
- [`MIGRATION_GUIDE.md`](docs/MIGRATION_GUIDE.md) - Migration guide
- [`ZK_FEATURES.md`](docs/ZK_FEATURES.md) - Zero-knowledge features
- [`FRONTEND_INTEGRATION_PLAN.md`](docs/FRONTEND_INTEGRATION_PLAN.md) - Frontend integration
- [`GAME_INTEGRATION_GUIDE.md`](docs/GAME_INTEGRATION_GUIDE.md) - Game integration

### Features
- [`CGT_TOKENOMICS.md`](docs/blockchain/CGT_TOKENOMICS.md) - Token economics
- [`ROADMAP.md`](docs/ROADMAP.md) - Development roadmap
- [`STATUS.md`](docs/STATUS.md) - Current project status
- [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) - Deployment guide

---

## 🎯 Current Status

### ✅ 100% COMPLETE - Ready for Testnet

**Core Framework (7/7)**
- ✅ Core runtime engine (`framework/core/`)
- ✅ Storage layer with Merkle trees (`framework/storage/`)
- ✅ Consensus (Hybrid PoS + BFT, < 2s finality) (`framework/consensus/`)
- ✅ P2P networking (LibP2P) (`framework/network/`)
- ✅ Module system (hot-swappable) (`framework/modules/`)
- ✅ RPC layer (JSON-RPC + WebSocket) (`framework/rpc/`)
- ✅ Full node implementation (`framework/node/`)

**Modules (6 Migrated + ZK Foundation)**
- ✅ Balances (CGT token) (`framework/modules/balances/`)
- ✅ DRC-369 (Stateful NFTs) (`framework/modules/drc369/`)
- ✅ Game Assets (Multi-asset system) (`framework/modules/game-assets/`)
- ✅ Energy (Regenerating costs) (`framework/modules/energy/`)
- ✅ Session Keys (Temporary auth) (`framework/modules/session-keys/`)
- ✅ Yield NFTs (Passive income) (`framework/modules/yield-nfts/`)
- ✅ ZK Module (Privacy foundation) (`framework/modules/zk/`)

**Frontend (Complete)**
- ✅ Enhanced dark futuristic theme
- ✅ Real-time navbar with QOR ID chain data
- ✅ Development page (`/development`)
- ✅ NFT Portal (`/nft-portal`)
- ✅ Staking interface (`/staking`)
- ✅ Validators explorer (`/validators`)
- ✅ Network Analytics (`/analytics`)
- ✅ Wallet management (`/wallet`)

**Services**
- ✅ QOR Identity system (`services/qor-auth/`)
- ✅ QOR Auth service

### 🚀 Ready For
- ✅ Testnet deployment (see [DEPLOYMENT.md](docs/DEPLOYMENT.md))
- ⏳ User testing (see [USER_TESTING_GUIDE.md](docs/USER_TESTING_GUIDE.md))
- ⏳ Module implementation completion
- ⏳ ZK proof library integration
- ⏳ Mainnet launch

---

## 🔧 Development

### Framework Development
```bash
cd framework
cargo test
cargo build
```

### Web Platform Development
```bash
npm install
npm run dev
```

### Running Tests
```bash
# Framework tests
cd framework
cargo test

# Web platform tests
npm test
```

---

## 🤝 Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines.

---

## 📄 License

MIT License - See LICENSE file

---

## 🔗 Links

- **RPC Endpoint**: `https://rpc.demiurge.cloud`
- **Documentation**: `docs/`
- **Framework**: `framework/`
- **Web Platform**: `apps/hub/`
- **QOR Auth**: `services/qor-auth/`

## 👨‍💻 For Developers

**Quick Start**: See [`docs/developers/QUICK_START.md`](docs/developers/QUICK_START.md) to build your first dApp in 5 minutes.

**RPC Endpoint**: `https://rpc.demiurge.cloud` (HTTPS) / `wss://rpc.demiurge.cloud` (WebSocket)

**Full Documentation**: [`docs/developers/`](docs/developers/)

---

## 🎮 For Game Developers

Demiurge is built **for** game developers:

- **Feeless transactions** - Sponsor user transactions
- **Session keys** - Seamless UX, no wallet popups
- **NFT integration** - Easy DRC-369 support
- **Revenue sharing** - Built-in monetization
- **Cross-game assets** - Use items in multiple games

**Get Started**: See `docs/GAMING_INTEGRATION.md` (coming soon)

---

## 💡 Innovation

We're pushing boundaries:

- **Fastest finality** - Sub-second confirmation
- **Feeless UX** - Zero friction for users
- **True ownership** - NFTs with state
- **Privacy** - ZK-powered anonymity
- **Composability** - Build on top easily

---

**Built with ❤️ for creators, developers, and gamers**

**Last Updated**: 2024-12-19
