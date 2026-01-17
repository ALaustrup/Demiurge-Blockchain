# 🎭 Demiurge-Blockchain

<div align="center">

![Demiurge](https://img.shields.io/badge/Demiurge-Blockchain-purple?style=for-the-badge)
![CGT](https://img.shields.io/badge/CGT-13B_Supply-gold?style=for-the-badge)
![Substrate](https://img.shields.io/badge/Substrate-Powered-black?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active_Development-green?style=for-the-badge)

**A Next-Generation Gaming Blockchain Ecosystem**

**[Documentation](./docs)** · **[Contributing](./CONTRIBUTING.md)** · **[Security](./SECURITY.md)**

</div>

---

## 🌌 Vision

Demiurge-Blockchain is a revolutionary gaming-focused L1 blockchain that combines:

- **Zero-Gas Gaming** - Feeless transactions via developer staking
- **Stateful NFTs** - NFTs with on-chain XP, durability, and evolution
- **Multi-Resource Assets** - One NFT, multiple outputs (2D/3D/VR)
- **Composable NFTs** - NFTs that own other NFTs (RMRK-style)
- **Regenerating Currencies** - On-chain energy systems
- **Game-Specific Governance** - Soft-forks for game studios
- **Revolutionary Features** - AI evolution, ZK privacy, cross-chain portability

> *"From the Monad, all emanates. To the Pleroma, all returns."*

---

## 🚀 Quick Start

### Prerequisites

- **Rust** 1.84+ with `wasm32-unknown-unknown` target
- **Node.js** 18+ and npm 9+
- **Docker** & Docker Compose (for services)
- **PostgreSQL** 18+ (or use Docker)
- **Redis** 7.4+ (or use Docker)

### Installation

```bash
# Clone repository
git clone https://github.com/Alaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain

# Install dependencies
npm install

# Start services (PostgreSQL, Redis, QOR Auth)
cd docker
docker-compose up -d

# Build blockchain node (external terminal recommended)
cd ../blockchain
cargo build --release --bin demiurge-node

# Start development hub
cd ../apps/hub
npm run dev
```

**See:** [`blockchain/BUILD.md`](./blockchain/BUILD.md) for detailed build instructions.

---

## 📐 Architecture

### Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Blockchain** | Substrate (Rust) | Gaming-optimized L1 with 13 custom pallets |
| **Web Hub** | Next.js 15 + React 19 | Central platform (Demiurge.Cloud) |
| **Identity** | QOR ID | Non-dual identity system |
| **Currency** | CGT | Creator God Token (13B supply, 2 decimals, 100 Sparks = 1 CGT) |
| **NFT Standard** | DRC-369 | Programmable, evolving assets |
| **Auth Service** | Rust (Axum) | QOR ID authentication |

### Project Structure

```
Demiurge-Blockchain/
├── blockchain/          # Substrate blockchain
│   ├── node/           # Node implementation
│   ├── runtime/        # WASM runtime
│   └── pallets/        # 13 custom pallets
├── apps/               # Frontend applications
│   ├── hub/            # Next.js main website
│   └── games/          # Embedded games
├── packages/           # Shared packages
│   ├── qor-sdk/        # QOR ID SDK
│   └── ui-shared/      # Shared UI components
├── services/           # Backend services
│   └── qor-auth/       # Authentication service
├── docs/               # Documentation
└── scripts/            # Deployment & utilities
```

---

## 💰 Creator God Token (CGT)

**Tokenomics:**
- **Total Supply:** 13,000,000,000 CGT (fixed)
- **Decimals:** 2
- **Smallest Unit:** 1 Spark (0.01 CGT)
- **Conversion:** 100 Sparks = 1 CGT (Sparks are like Sats to Bitcoin)
- **Fee Model:** 80% burned, 20% to treasury

**Distribution:**
- 40% - Pleroma Mining (Play-to-Earn)
- 20% - Archon Staking (Validator rewards)
- 15% - Demiurge Treasury (DAO)
- 15% - Core Team (4-year vesting)
- 10% - Genesis Offering

---

## 🎮 Key Features

### Blockchain Pallets

1. **pallet-cgt** - Creator God Token
2. **pallet-qor-identity** - QOR ID system
3. **pallet-drc369** - Stateful, evolving NFTs
4. **pallet-game-assets** - Multi-asset system (zero-gas)
5. **pallet-energy** - Regenerating currencies
6. **pallet-composable-nfts** - RMRK-style composables
7. **pallet-dex** - Automatic liquidity DEX
8. **pallet-fractional-assets** - Guild ownership
9. **pallet-governance** - Game studio soft-forks
10. **pallet-drc369-ocw** - Off-chain workers

**See:** [`blockchain/pallets/README.md`](./blockchain/pallets/README.md) for details.

### Revolutionary Features (Phase 11+)

- **Session Keys** - Eliminate wallet popups
- **Yield-Generating NFTs** - Passive income from NFTs
- **Dynamic Tokenomics** - Auto-adjusting economy
- **AI-Generated Evolution** - NFTs evolve via AI
- **ZK Privacy** - Private game state
- **Cross-Chain Portability** - Universal assets

**See:** [`docs/REVOLUTIONARY_FEATURES_ROADMAP.md`](./docs/REVOLUTIONARY_FEATURES_ROADMAP.md)

---

## 📚 Documentation

### Essential Docs

- **[Master Roadmap](./docs/MASTER_ROADMAP.md)** - Complete development plan
- **[Development Roadmap](./docs/DEVELOPMENT_ROADMAP.md)** - Detailed phase breakdown
- **[Revolutionary Features](./docs/REVOLUTIONARY_FEATURES_ROADMAP.md)** - 40+ cutting-edge features
- **[Build Guide](./blockchain/BUILD.md)** - Building the blockchain node
- **[Pallets Documentation](./blockchain/pallets/README.md)** - All pallet details

### Architecture & Guides

- **[DRC-369 Architecture](./docs/blockchain/DRC369_ARCHITECTURE.md)** - NFT standard
- **[Game Integration Guide](./docs/GAME_INTEGRATION_GUIDE.md)** - Integrating games
- **[QOR ID Specification](./docs/identity/QOR_ID_SPEC.md)** - Identity system
- **[Design System](./docs/design/DEMIURGE_DESIGN_SYSTEM.md)** - UI/UX guidelines

---

## 🛠️ Development

### Current Status

**Phase 11: Revolutionary Features Foundation** (Active)
- Session Keys implementation
- Yield-Generating NFTs
- Dynamic Tokenomics Engine

**See:** [`docs/PHASE11_INITIALIZATION.md`](./docs/PHASE11_INITIALIZATION.md)

### Build Commands

```bash
# Check compilation
cd blockchain
cargo check --release

# Build release binary
cargo build --release --bin demiurge-node

# Run development node
./target/release/demiurge-node --dev --rpc-cors=all
```

**Note:** Large builds should be done in external terminal to avoid Cursor crashes.

---

## 🚀 Deployment

### Production Server

- **IP:** 51.210.209.112
- **Hostname:** Pleroma
- **Environment:** Production

### Docker Deployment

```bash
cd docker
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔐 Security

- SSH key-only authentication
- No secrets in version control
- Regular dependency audits
- Security policy: [`SECURITY.md`](./SECURITY.md)

---

## 🤝 Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines.

**Key Principles:**
- Follow Gnostic naming conventions
- Use external builds for large Rust projects
- Document all new features
- Follow the Laws (`.cursorrules`)

---

## 📄 License

[To be determined]

---

## 👤 Author

**Alaustrup** - [GitHub](https://github.com/Alaustrup)

---

<div align="center">

*"The future of blockchain gaming is not just about games on blockchain—it's about reimagining what games can be when they're truly decentralized, composable, and owned by players."*

</div>
