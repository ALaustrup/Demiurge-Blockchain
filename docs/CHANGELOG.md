# Changelog

All notable changes to the Demiurge Protocol.

---

## [1.0.0] - 2026-02-01

### Mainnet v1 Launch

**Core Infrastructure**
- Fresh genesis with clean state
- Block production every 6 seconds
- Hybrid PoS + BFT consensus
- 22+ verified RPC methods

**Modules**
- Balances: CGT transfers, starter bonus, minting
- Energy: Feeless transaction system
- DRC-369: Dynamic NFTs with physics integration
- Session Keys: Temporary authorization
- CVP: Consensus-Verified Polymorphism (security)
- Agentic: AI agent system

**New Features**
- Physics properties for DRC-369 NFTs
- Game engine integration (UE5, Unity)
- Interior mutability storage pattern
- Balance transfer RPC with verification

**Infrastructure**
- RPC endpoint: rpc.demiurge.cloud:9944
- Web platform: demiurge.cloud
- Testnet deployment scripts

---

## [0.9.0] - 2026-01-25

### DRC-369 Physics Integration

- Added physics storage key to DRC-369
- Implemented get_physics, set_physics, has_physics
- Added RPC methods for physics operations
- Created physics validation system

---

## [0.8.0] - 2026-01-20

### CVP Security System

- Bytecode mutation engine
- ZK equivalence proofs
- Attack pattern detection
- Emergency mutation triggers

---

## [0.7.0] - 2025-12-15

### Agentic Layer

- Agent DID system
- Capability-based permissions
- Agent Foundry SDK
- Dual registration patterns (instant keys + pre-registered)

---

## [0.6.0] - 2025-11-01

### Identity System

- QOR ID specification
- Session key management
- Hybrid authentication (keypair + QOR ID)
- Profile management

---

## [0.5.0] - 2025-10-01

### NFT Standard

- DRC-369 specification
- Dynamic state storage
- Nested composition
- Soulbound tokens

---

## [0.4.0] - 2025-09-01

### Token Economics

- CGT token implementation
- Energy-based fee system
- Staking mechanism
- Reward distribution

---

## [0.3.0] - 2025-08-01

### Consensus Engine

- Hybrid PoS + BFT
- Validator registration
- Slashing conditions
- Era-based rewards

---

## [0.2.0] - 2025-07-01

### Network Layer

- LibP2P integration
- Gossipsub messaging
- Kademlia discovery
- Transaction pool

---

## [0.1.0] - 2025-06-01

### Initial Release

- Core runtime engine
- RocksDB storage
- Basic RPC server
- Block production

---

## Upgrade Notes

### Migrating to 1.0.0

1. Update SDK packages:
   ```bash
   npm install @demiurge/sdk@latest
   ```

2. Update RPC endpoint:
   ```typescript
   const client = new DemiurgeClient({
     rpcUrl: 'https://rpc.demiurge.cloud:9944' // Note: port 9944
   });
   ```

3. Physics API (new):
   ```typescript
   const physics = await client.drc369.getPhysics(tokenId);
   ```

---

## Versioning

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)
