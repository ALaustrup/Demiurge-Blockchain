# Demiurge Protocol Documentation

> The Sovereign Creative Substrate - A Next-Generation Blockchain for Gaming, AI, and the Open Metaverse

**Status:** Mainnet v1 Live | **Block Time:** 6s | **RPC:** `rpc.demiurge.cloud:9944`

---

## Quick Links

| Resource | URL |
|----------|-----|
| **Live Platform** | https://demiurge.cloud |
| **RPC Endpoint** | https://rpc.demiurge.cloud (port 9944) |
| **GitHub** | https://github.com/ALaustrup/Demiurge-Blockchain |

---

## Documentation Map

### Getting Started
| Document | Description |
|----------|-------------|
| [Quick Start](./getting-started/quick-start.md) | 5-minute introduction |
| [Installation](./getting-started/installation.md) | Set up development environment |
| [First Transaction](./getting-started/first-transaction.md) | Send your first CGT transfer |

### Architecture
| Document | Description |
|----------|-------------|
| [Overview](./architecture/README.md) | System architecture |
| [Consensus](./architecture/consensus.md) | Hybrid PoS + BFT mechanism |
| [Modules](./architecture/modules.md) | Runtime module system |
| [Network](./architecture/network.md) | LibP2P networking layer |

### Specifications
| Document | Description |
|----------|-------------|
| [DRC-369](./specifications/drc369.md) | Dynamic NFT standard with physics |
| [CGT Tokenomics](./specifications/cgt-tokenomics.md) | Token economics |
| [CVP](./specifications/cvp.md) | Consensus-Verified Polymorphism |
| [QOR ID](./specifications/qor-id.md) | Decentralized identity |
| [Physics Integration](./specifications/physics.md) | Game engine physics metadata |

### Developers
| Document | Description |
|----------|-------------|
| [Developer Guide](./developers/README.md) | Complete developer reference |
| [RPC Reference](./developers/rpc-reference.md) | All RPC methods documented |
| [TypeScript SDK](./developers/sdk/typescript.md) | `@demiurge/sdk` usage |
| [Unreal Engine](./developers/game-engines/unreal.md) | UE5 integration |
| [Unity](./developers/game-engines/unity.md) | Unity integration |

### Operations
| Document | Description |
|----------|-------------|
| [Deployment](./operations/deployment.md) | Production deployment guide |
| [Testnet](./operations/testnet.md) | Run a local testnet |
| [Monitoring](./operations/monitoring.md) | Node monitoring |

### Applications
| Document | Description |
|----------|-------------|
| [SOPHIA](./applications/sophia.md) | AI Assistant integration |
| [VYB](./applications/vyb.md) | Social network features |
| [Hub](./applications/hub.md) | Web platform |

---

## Project Structure

```
Demiurge-Blockchain/
├── framework/              # Rust blockchain core
│   ├── core/              # Runtime engine
│   ├── consensus/         # PoS + BFT consensus
│   ├── network/           # LibP2P networking
│   ├── rpc/               # JSON-RPC server
│   ├── storage/           # RocksDB backend
│   └── modules/           # Runtime modules
│       ├── balances/      # CGT token
│       ├── energy/        # Feeless transactions
│       ├── drc369/        # Dynamic NFTs
│       ├── cvp/           # Security mutations
│       └── agentic/       # AI agents
├── apps/
│   ├── hub/               # Next.js web platform
│   ├── sophia/            # SOPHIA AI interface
│   └── games/             # Game integrations
├── packages/              # TypeScript SDKs
│   ├── qor-sdk/           # Identity SDK
│   ├── drc369-sdk/        # NFT SDK
│   └── agent-foundry/     # Agent SDK
├── sdk/                   # Core protocol SDK
├── cli/                   # Command-line interface
├── services/              # Backend services
├── testnet/               # Multi-node testnet
└── docs/                  # This documentation
```

---

## Current Status

### Live Systems
- **Blockchain Node:** Producing blocks every 6 seconds
- **RPC API:** 22+ methods verified and operational
- **Web Platform:** https://demiurge.cloud
- **Authentication:** Hybrid keypair + QOR ID

### Verified Functionality (as of Feb 2026)
| Module | Status | Tests |
|--------|--------|-------|
| Chain Health | Operational | Passing |
| Consensus | Active | 1 validator |
| Balances | Operational | Transfer verified |
| Energy | Operational | Regeneration active |
| DRC-369 | Operational | Physics integration complete |
| Session Keys | Operational | Key management working |

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | Feb 2026 | Mainnet v1 launch, fresh genesis |
| 0.9.0 | Jan 2026 | DRC-369 physics integration |
| 0.8.0 | Jan 2026 | CVP security system |
| 0.7.0 | Dec 2025 | Agentic layer complete |

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Key Areas:**
- Game engine integrations
- SDK improvements
- Documentation
- Security research

---

**Last Updated:** February 2026  
**Maintainer:** [@ALaustrup](https://github.com/ALaustrup)
