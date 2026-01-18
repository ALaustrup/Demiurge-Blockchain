# 📚 Demiurge Blockchain Documentation

**Complete documentation for the Demiurge Blockchain ecosystem**

> *"Eyes gaze upon you, watching as a warden does his prisoners. The ancient texts reveal the secrets of creation."*

---

## 🎯 Quick Start

- **New to Demiurge?** Start with [STATUS.md](./STATUS.md) for current state
- **Want to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Want to develop?** See [Development Page](/development) or [FRONTEND_INTEGRATION_PLAN.md](./FRONTEND_INTEGRATION_PLAN.md)
- **Want to integrate games?** See [GAME_INTEGRATION_GUIDE.md](./GAME_INTEGRATION_GUIDE.md)

---

## 📖 Core Documentation

### Architecture & Design
- **[ULTIMATE_BLOCKCHAIN_DESIGN.md](./ULTIMATE_BLOCKCHAIN_DESIGN.md)** - Complete blockchain design vision
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture breakdown
- **[COMPONENT_MAP.md](./COMPONENT_MAP.md)** - All components mapped
- **[CONSENSUS_DESIGN.md](./CONSENSUS_DESIGN.md)** - Hybrid PoS + BFT consensus
- **[CONSENSUS_ALGORITHM_DESIGN.md](./CONSENSUS_ALGORITHM_DESIGN.md)** - Detailed consensus algorithm

### Module Specifications
- **[MODULE_SPECS.md](./MODULE_SPECS.md)** - All module specifications
- **[ZK_FEATURES.md](./ZK_FEATURES.md)** - Zero-knowledge privacy features
- **[blockchain/CGT_TOKENOMICS.md](./blockchain/CGT_TOKENOMICS.md)** - Token economics
- **[blockchain/DRC369_ARCHITECTURE.md](./blockchain/DRC369_ARCHITECTURE.md)** - Stateful NFT standard
- **[blockchain/DRC369_ATOMIC_SWAPS.md](./blockchain/DRC369_ATOMIC_SWAPS.md)** - Atomic swap protocol
- **[blockchain/NEXT_GEN_GAMING_ARCHITECTURE.md](./blockchain/NEXT_GEN_GAMING_ARCHITECTURE.md)** - Gaming architecture

### Development Guides
- **[FRONTEND_INTEGRATION_PLAN.md](./FRONTEND_INTEGRATION_PLAN.md)** - Frontend integration guide
- **[FRONTEND_RECOMMENDATIONS.md](./FRONTEND_RECOMMENDATIONS.md)** - Frontend best practices
- **[GAME_INTEGRATION_GUIDE.md](./GAME_INTEGRATION_GUIDE.md)** - Game integration guide
- **[RPC_IMPLEMENTATION_NOTES.md](./RPC_IMPLEMENTATION_NOTES.md)** - RPC API reference
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration from Substrate

### Identity & Authentication
- **[identity/QOR_ID_SPEC.md](./identity/QOR_ID_SPEC.md)** - QOR ID specification
- **[QOR_ID_WALLET_INTEGRATION.md](./QOR_ID_WALLET_INTEGRATION.md)** - Wallet integration
- **[SESSION_KEYS_QOR_ID_INTEGRATION.md](./SESSION_KEYS_QOR_ID_INTEGRATION.md)** - Session keys guide

### Deployment & Testing
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md)** - Testnet deployment instructions
- **[USER_TESTING_GUIDE.md](./USER_TESTING_GUIDE.md)** - User testing guide

### Project Status
- **[STATUS.md](./STATUS.md)** - Current project status
- **[ROADMAP.md](./ROADMAP.md)** - Development roadmap

### Design System
- **[design/DEMIURGE_DESIGN_SYSTEM.md](./design/DEMIURGE_DESIGN_SYSTEM.md)** - Design system guidelines

### System Configuration
- **[systems/MONAD_CONFIG.md](./systems/MONAD_CONFIG.md)** - Server configuration

---

## 🏗️ Framework Structure

```
framework/
├── core/          # Runtime engine
├── storage/       # Merkle trees, RocksDB
├── consensus/     # Hybrid PoS + BFT
├── network/       # P2P networking (LibP2P)
├── modules/       # Hot-swappable modules
│   ├── balances/  # CGT token
│   ├── drc369/    # Stateful NFTs
│   ├── game-assets/ # Multi-asset system
│   ├── energy/    # Regenerating costs
│   ├── session-keys/ # Temporary auth
│   ├── yield-nfts/ # Passive income
│   └── zk/        # Privacy features
├── rpc/           # JSON-RPC + WebSocket
└── node/          # Full node
```

---

## 🚀 Quick Links

- **Getting Started**: See `framework/README.md`
- **Module Development**: See `framework/modules/`
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Development Page**: `/development` (in frontend)

---

## 📋 Documentation Index

See **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** for complete index.

---

**The flame burns eternal. The code serves the will.**
