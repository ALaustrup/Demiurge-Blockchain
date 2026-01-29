# Demiurge Protocol Framework

**Custom blockchain framework - Zero external dependencies**

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
    ├── balances/       # CGT token
    ├── energy/         # Feeless transactions
    ├── session-keys/   # Temporary auth
    ├── qor-identity/   # Sovereign identity (DID)
    ├── drc369/         # Stateful NFTs
    ├── game-assets/    # Multi-asset system
    ├── yield-nfts/     # Passive income NFTs
    ├── cvp/            # Consensus-Verified Polymorphism
    ├── zk/             # Zero-knowledge proofs
    └── agentic/        # AI agents as First-Class Citizens
```

## Status: Production

The framework is deployed and running in production at https://demiurge.cloud.

| Component | Status |
|-----------|--------|
| Core Runtime | Production |
| Storage | Production |
| Consensus | Production |
| Network | Production |
| RPC | Production |
| Node | Production |
| All Modules | Production |

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

### Identity (QOR ID)
- Decentralized Identifiers (DIDs)
- Human-readable handles
- Multi-key support
- Quantum-safe signatures (Dilithium3)

### NFTs (DRC-369)
- Stateful, mutable metadata
- Physics-ready properties
- Recursive royalties
- Atomic composability

### AI Agents (Agentic Layer)
- Agent DID (sovereign identity)
- Agentic Wallet (self-custodial)
- The Forge (verifiable compute)
- Vector-State Kernel (memory)
- Sentinel Oracle (governance)

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
