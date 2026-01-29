# Demiurge Protocol Documentation

**Complete documentation for the Demiurge blockchain ecosystem**

---

## Quick Links

| Resource | URL |
|----------|-----|
| Frontend | https://demiurge.cloud |
| RPC Endpoint | https://51.210.209.112:9933 |
| Status | [STATUS.md](./STATUS.md) |
| Roadmap | [ROADMAP.md](./ROADMAP.md) |

---

## Documentation by Role

### For Developers
- [Getting Started](./developers/getting-started.md) - Setup and basics
- [Quick Start](./developers/QUICK_START.md) - Fast onboarding
- [Transaction Building](./developers/transaction-building.md) - Create transactions
- [RPC Implementation](./RPC_IMPLEMENTATION_NOTES.md) - API reference

### For Game Developers
- [Game Integration Guide](./GAME_INTEGRATION_GUIDE.md) - Integrate games
- [Unreal Engine SDK](../sdk/unreal/README.md) - UE5 plugin
- [DRC-369 Guide](./creators/drc369-complete-guide.md) - NFT assets

### For AI/Agent Developers
- [Agentic Layer](./AGENTIC-LAYER.md) - AI architecture
- [Agent Foundry SDK](../packages/agent-foundry/README.md) - TypeScript SDK

### For Operators
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Testnet Deployment](./deployment/TESTNET_DEPLOYMENT.md) - Test environments

---

## Core Documentation

### Architecture
| Document | Description |
|----------|-------------|
| [MASTERPLAN.md](./MASTERPLAN.md) | Implementation roadmap |
| [DEMIURGE-LIVING-PROTOCOL.md](./DEMIURGE-LIVING-PROTOCOL.md) | Protocol vision |
| [Architecture Overview](./architecture/ARCHITECTURE.md) | Technical breakdown |
| [Consensus Design](./architecture/CONSENSUS_DESIGN.md) | PoS + BFT |

### Standards
| Document | Description |
|----------|-------------|
| [DRC-369 Specification](./DRC-369-SPECIFICATION.md) | Stateful NFT standard |
| [QOR ID Specification](./identity/QOR_ID_SPEC.md) | Identity system |
| [CVP Specification](./ARCHON_CVP_ZK_SPECIFICATION.md) | ZK bytecode mutation |

### Tokenomics
| Document | Description |
|----------|-------------|
| [CGT Tokenomics](./blockchain/CGT_TOKENOMICS.md) | Token economics |

---

## Framework Structure

```
framework/
├── core/           # Runtime engine
├── storage/        # RocksDB + Merkle trees
├── consensus/      # Hybrid PoS + BFT
├── network/        # LibP2P networking
├── primitives/     # Cryptographic primitives
├── rpc/            # JSON-RPC + WebSocket
├── node/           # Full node
└── modules/
    ├── balances/       # CGT token
    ├── energy/         # Feeless UX
    ├── session-keys/   # Temp auth
    ├── qor-identity/   # Sovereign ID
    ├── drc369/         # Stateful NFTs
    ├── game-assets/    # Multi-assets
    ├── yield-nfts/     # Passive income
    ├── cvp/            # ZK mutations
    ├── zk/             # Privacy
    └── agentic/        # AI agents
```

---

## SDKs

| SDK | Language | Location |
|-----|----------|----------|
| Core SDK | TypeScript | `sdk/` |
| QOR SDK | TypeScript | `packages/qor-sdk/` |
| DRC-369 SDK | TypeScript | `packages/drc369-sdk/` |
| Agent Foundry | TypeScript | `packages/agent-foundry/` |
| Unreal Plugin | C++ | `sdk/unreal/` |

---

## Module Documentation

| Module | README |
|--------|--------|
| Agentic | [framework/modules/agentic/](../framework/modules/agentic/) |
| CVP | [framework/modules/cvp/](../framework/modules/cvp/) |
| DRC-369 | [framework/modules/drc369/](../framework/modules/drc369/) |
| QOR Identity | [framework/modules/qor-identity/](../framework/modules/qor-identity/) |

---

## Archived Documentation

Historical and deprecated documentation is in [archive/](./archive/).

---

**Production**: https://demiurge.cloud
