# Demiurge Protocol Documentation

**Complete documentation for the Demiurge blockchain ecosystem**

**Status:** Mainnet v1 with fresh genesis | **Treasury:** 1B CGT at Godmode address

---

## Quick Links

| Resource | URL |
|----------|-----|
| Frontend | https://demiurge.cloud |
| RPC Endpoint | https://rpc.demiurge.cloud |
| Status | [STATUS.md](./STATUS.md) |
| Roadmap | [ROADMAP.md](./ROADMAP.md) |

---

## What's New (Mainnet v1)

- **Fresh Genesis** - Chain reset to block #1 with clean state
- **Godmode Account** - Treasury with 1B CGT at `0x00000000000000000000000000000000DEMIURGE`
- **Hybrid Authentication** - Keypair-based login alongside QOR ID
- **Interactive CLI** - Shell mode with animated splash screen
- **Dual Agent Patterns** - Instant keys and pre-registered agent accounts

---

## Documentation by Role

### For Developers
- [Getting Started](./developers/getting-started.md) - Setup and basics
- [Quick Start](./developers/QUICK_START.md) - Fast onboarding
- [Transaction Building](./developers/transaction-building.md) - Create transactions
- [RPC Implementation](./RPC_IMPLEMENTATION_NOTES.md) - API reference
- [SDK Reference](../sdk/README.md) - Core SDK with DemiurgeAuth

### For Game Developers
- [Game Integration Guide](./GAME_INTEGRATION_GUIDE.md) - Integrate games
- [Unreal Engine SDK](../sdk/unreal/README.md) - UE5 plugin
- [DRC-369 Guide](./creators/drc369-complete-guide.md) - NFT assets

### For AI/Agent Developers
- [Agentic Layer](./AGENTIC-LAYER.md) - AI architecture
- [Agent Foundry SDK](../packages/agent-foundry/README.md) - Dual registration patterns

### For CLI Users
- [CLI Guide](../cli/README.md) - Interactive shell and command mode

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

### Authentication
| Document | Description |
|----------|-------------|
| Keypair Auth | Generate Ed25519 keypairs for direct authentication |
| QOR ID Auth | Human-readable identity (username#0001) |
| Hybrid Mode | Use either method based on use case |

### Tokenomics
| Document | Description |
|----------|-------------|
| [CGT Tokenomics](./blockchain/CGT_TOKENOMICS.md) | Token economics |
| Godmode Treasury | 1B CGT at `0x...DEMIURGE` for ecosystem |

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

| SDK | Language | Location | Key Features |
|-----|----------|----------|--------------|
| Core SDK | TypeScript | `sdk/` | DemiurgeClient, DemiurgeAuth, Wallet |
| QOR SDK | TypeScript | `packages/qor-sdk/` | Identity, keypair auth |
| DRC-369 SDK | TypeScript | `packages/drc369-sdk/` | Dynamic NFTs, React hooks |
| Agent Foundry | TypeScript | `packages/agent-foundry/` | Dual patterns: instant keys + pre-registered |
| CLI | TypeScript | `cli/` | Interactive shell, 30+ commands |
| Unreal Plugin | C++ | `sdk/unreal/` | UE5 integration |

---

## CLI Quick Start

```bash
# Install CLI
npm install -g @demiurge/cli

# Interactive shell mode (with animated splash)
demiurge

# Command mode
demiurge chain status
demiurge wallet generate
```

See [cli/README.md](../cli/README.md) for full documentation.

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

**Mainnet v1**: https://demiurge.cloud  
**Genesis**: Fresh reset with 1B CGT treasury
