# Demiurge Protocol Framework

**Custom blockchain framework - Zero external dependencies**

**Status:** Mainnet v1 with fresh genesis (block #1 reset)

## Architecture

```
framework/
├── core/           # Core runtime engine
├── storage/        # RocksDB + Merkle trees
├── consensus/      # Hybrid PoS + BFT (< 2s finality)
├── network/        # LibP2P P2P networking
├── primitives/     # Cryptographic primitives (PQC, signatures)
├── rpc/            # JSON-RPC 2.0 + WebSocket
├── node/           # Full node implementation
└── modules/        # Runtime modules
    ├── balances/       # CGT token (1B treasury at Godmode)
    ├── energy/         # Feeless transactions
    ├── session-keys/   # Temporary auth + keypair login
    ├── qor-identity/   # Sovereign identity (DID) + hybrid auth
    ├── drc369/         # Stateful NFTs
    ├── game-assets/    # Multi-asset system
    ├── yield-nfts/     # Passive income NFTs
    ├── cvp/            # Consensus-Verified Polymorphism
    ├── zk/             # Zero-knowledge proofs
    └── agentic/        # AI agents (instant keys + pre-registered)
```

## Status: Mainnet v1

The framework is deployed and running in production at https://demiurge.cloud with a fresh genesis.

| Component | Status | Notes |
|-----------|--------|-------|
| Core Runtime | Production | Fresh genesis |
| Storage | Production | Clean state |
| Consensus | Production | 2s block time |
| Network | Production | LibP2P |
| RPC | Production | JSON-RPC 2.0 |
| Node | Production | Full node |
| All Modules | Production | See below |

### Module Status

| Module | Status | Key Features |
|--------|--------|--------------|
| Balances | Production | 1B CGT treasury at Godmode |
| QOR Identity | Production | Hybrid auth (keypair + QOR ID) |
| Agentic | Production | Dual patterns: instant keys + pre-registered |
| DRC-369 | Production | Stateful NFTs with physics |
| CVP | Production | ZK bytecode mutation |

## Quick Start

### Build

```bash
cd framework
cargo build --release
```

### Run Node

```bash
./target/release/demiurge-node \
  --data-dir ./data \
  --rpc-addr 0.0.0.0:9944 \
  --p2p-addr 0.0.0.0:30333 \
  --rpc --p2p
```

### Run Tests

```bash
cargo test --all --features "demiurge-agentic/std"
```

## Key Features

### Consensus
- Hybrid PoS + BFT
- Sub-2-second finality
- Slashing for misbehavior
- Era-based rewards
- Modular Fluidity (hot-swap mechanisms)
- Elastic Sharding (auto-scale)

### Authentication (Hybrid)
- **Keypair Authentication** - Ed25519 keypairs for direct login
- **QOR ID Login** - Human-readable identity (username#0001)
- Decentralized Identifiers (DIDs)
- Multi-key support
- Quantum-safe signatures (Dilithium3)

### NFTs (DRC-369)
- Stateful, mutable metadata
- Physics-ready properties
- Recursive royalties
- Atomic composability

### AI Agents (Agentic Layer)
- **Instant Keys** - Generate agent keypairs on-demand
- **Pre-Registered** - Use existing agent accounts
- Agent DID (sovereign identity)
- Agentic Wallet (self-custodial)
- The Forge (verifiable compute)
- Vector-State Kernel (memory)
- Sentinel Oracle (governance)

### Godmode Administration
- Treasury address: `0x00000000000000000000000000000000DEMIURGE`
- Initial treasury: 1,000,000,000 CGT
- Network governance controls
- Emergency functions

### Security
- CVP (bytecode mutation with ZK proofs)
- Plonky2 circuits
- Post-quantum cryptography
- Signature abstraction layer

## Configuration

### Node Configuration

```toml
[network]
listen_addresses = ["/ip4/0.0.0.0/tcp/30333"]

[rpc]
enabled = true
listen_address = "0.0.0.0:9944"

[validator]
enabled = true

[storage]
path = "./data"
```

## Documentation

- [DEPLOYMENT.md](../docs/DEPLOYMENT.md) - Production deployment guide
- [MASTERPLAN.md](../docs/MASTERPLAN.md) - Implementation vectors
- [AGENTIC-LAYER.md](../docs/AGENTIC-LAYER.md) - AI agent architecture
- [DRC-369-SPECIFICATION.md](../docs/DRC-369-SPECIFICATION.md) - NFT standard

## License

Proprietary - Demiurge Protocol
