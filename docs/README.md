# 📚 Demiurge Blockchain Documentation

**Complete documentation for the Demiurge Blockchain ecosystem**

> *"Eyes gaze upon you, watching as a warden does his prisoners. The ancient texts reveal the secrets of creation."*

---

## 🎯 Quick Navigation

### For Developers 👨‍💻
- **[Developer Documentation](./developers/)** - Complete integration guides
  - [Getting Started](./developers/getting-started.md) - Setup and basics
  - [RPC API Reference](./developers/rpc-api-reference.md) - All RPC methods
  - [Chain Operations](./developers/chain-operations.md) - Query blockchain state
  - [Transaction Building](./developers/transaction-building.md) - Create transactions
  - [Module Integration](./developers/module-integration.md) - Integrate modules

### For Creators 🎨
- **[Creator Documentation](./creators/)** - Complete creator guides
  - [DRC-369 Complete Guide](./creators/drc369-complete-guide.md) - Stateful NFTs
  - [Asset Management](./creators/asset-management.md) - Manage your assets
  - [Mining Operations](./creators/mining-operations.md) - Staking and rewards
  - [P2P Features](./creators/p2p-features.md) - Trading and P2P

### Architecture 🏗️
- **[Architecture Documentation](./architecture/)** - Technical architecture
  - [Ultimate Blockchain Design](./architecture/ULTIMATE_BLOCKCHAIN_DESIGN.md) - Complete design
  - [Architecture Overview](./architecture/ARCHITECTURE.md) - Technical breakdown
  - [Component Map](./architecture/COMPONENT_MAP.md) - All components
  - [Consensus Design](./architecture/CONSENSUS_DESIGN.md) - Consensus mechanism
  - [Consensus Algorithm](./architecture/CONSENSUS_ALGORITHM_DESIGN.md) - Algorithm details

### Deployment 🚀
- **[Deployment Documentation](./deployment/)** - Deployment guides
  - [Deployment Guide](./deployment/DEPLOYMENT.md) - Complete deployment
  - [Testnet Deployment](./deployment/TESTNET_DEPLOYMENT.md) - Testnet setup

---

## 📖 Core Documentation

### Framework & Modules
- **[Module Specifications](./MODULE_SPECS.md)** - All module specifications
- **[ZK Features](./ZK_FEATURES.md)** - Zero-knowledge privacy features
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Migration from Substrate

### Blockchain Features
- **[CGT Tokenomics](./blockchain/CGT_TOKENOMICS.md)** - Token economics
- **[DRC-369 Architecture](./blockchain/DRC369_ARCHITECTURE.md)** - Stateful NFT standard
- **[DRC-369 Atomic Swaps](./blockchain/DRC369_ATOMIC_SWAPS.md)** - Atomic swap protocol
- **[Next-Gen Gaming Architecture](./blockchain/NEXT_GEN_GAMING_ARCHITECTURE.md)** - Gaming architecture

### Identity & Authentication
- **[QOR ID Specification](./identity/QOR_ID_SPEC.md)** - QOR ID system
- **[QOR ID Wallet Integration](./QOR_ID_WALLET_INTEGRATION.md)** - Wallet integration
- **[Session Keys Integration](./SESSION_KEYS_QOR_ID_INTEGRATION.md)** - Session keys guide

### Development Guides
- **[Frontend Integration Plan](./FRONTEND_INTEGRATION_PLAN.md)** - Frontend integration
- **[Frontend Recommendations](./FRONTEND_RECOMMENDATIONS.md)** - Best practices
- **[Game Integration Guide](./GAME_INTEGRATION_GUIDE.md)** - Game integration
- **[RPC Implementation Notes](./RPC_IMPLEMENTATION_NOTES.md)** - RPC API

### Project Status
- **[Status](./STATUS.md)** - Current project status
- **[Roadmap](./ROADMAP.md)** - Development roadmap

### Testing & User Guides
- **[User Testing Guide](./USER_TESTING_GUIDE.md)** - User testing guide

### Design & Systems
- **[Design System](./design/DEMIURGE_DESIGN_SYSTEM.md)** - Design guidelines
- **[Monad Config](./systems/MONAD_CONFIG.md)** - Server configuration

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

- **Getting Started**: See [Developer Getting Started](./developers/getting-started.md)
- **RPC Endpoint**: `http://51.210.209.112:9944`
- **Frontend**: `http://51.210.209.112:3000`
- **Development Page**: `/development` (in frontend)

---

## 📋 Documentation Index

See **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** for complete index.

---

**The flame burns eternal. The code serves the will.**
