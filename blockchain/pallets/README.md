# 🎭 Demiurge Blockchain Pallets

## Overview

This directory contains all custom Substrate pallets for the Demiurge blockchain. Each pallet implements specific functionality for the gaming-focused L1.

---

## 📦 Core Pallets (Implemented)

### 1. `pallet-cgt` - Creator God Token
**Status:** ✅ Complete  
**Purpose:** Native currency (13B supply, 8 decimals)

**Features:**
- Token transfers with fee burning (80%)
- Treasury allocation (20%)
- Deflationary mechanics
- Staking rewards (planned)

---

### 2. `pallet-qor-identity` - QOR ID System
**Status:** ✅ Complete  
**Purpose:** Non-dual identity system

**Features:**
- Username-only registration
- Reputation scoring
- Cross-platform identity
- ZK attestations (planned)

---

### 3. `pallet-drc369` - Programmable Asset Standard
**Status:** ✅ Complete  
**Purpose:** Stateful, evolving NFTs

**Features:**
- Multi-resource polymorphism (2D/3D/VR)
- Native nesting (NFTs own NFTs)
- Dynamic on-chain state (XP, durability, evolution)
- Rental & delegation
- Soulbound support
- Perpetual royalties

---

### 4. `pallet-game-assets` - Multi-Asset System
**Status:** ✅ Complete  
**Purpose:** Game currency management

**Features:**
- Zero-gas transfers (developer staking)
- Automatic liquidity pairs
- Game currency minting
- Transaction sponsorship

---

### 5. `pallet-energy` - Regenerating Currencies
**Status:** ✅ Complete  
**Purpose:** On-chain regenerating resources

**Features:**
- Automatic regeneration via `on_initialize`
- Configurable rates per block
- Maximum caps and minimum floors
- Per-account state tracking

---

### 6. `pallet-composable-nfts` - RMRK-Style NFTs
**Status:** ✅ Complete  
**Purpose:** Equippable and nested NFTs

**Features:**
- Equipment slots
- Parent-child relationships
- Trait validation
- Multi-resource support

---

### 7. `pallet-dex` - Automatic Liquidity DEX
**Status:** ✅ Complete  
**Purpose:** Built-in decentralized exchange

**Features:**
- Constant product AMM
- Auto-pairing for game currencies
- Native token swaps
- Slippage protection

---

### 8. `pallet-fractional-assets` - Guild Ownership
**Status:** ✅ Complete  
**Purpose:** Shared asset ownership

**Features:**
- Share-based ownership
- Time-based access scheduling
- Voting rights
- Period reset logic

---

### 9. `pallet-governance` - Game Studio Governance
**Status:** ✅ Complete  
**Purpose:** Game-specific soft-forks

**Features:**
- Proposal system
- Weighted voting
- Soft-fork execution
- Game-specific rules

---

### 10. `pallet-drc369-ocw` - Off-Chain Workers
**Status:** ✅ Complete  
**Purpose:** Secure external data integration

**Features:**
- Real-time game data queries
- Secure API integration
- Game state synchronization
- Oracle functionality

---

## 🚀 Revolutionary Pallets (Planned)

### Phase 11: Foundation Features

#### `pallet-session-keys` - Session Key Management
**Status:** 📋 Planned  
**Purpose:** Temporary keys for gaming sessions

**Features:**
- Temporary authorization
- Auto-expiry
- Granular permissions
- No wallet popups

---

#### `pallet-yield-nfts` - Yield-Generating NFTs
**Status:** 📋 Planned  
**Purpose:** NFTs that earn passive income

**Features:**
- NFT staking
- Revenue sharing
- Dividend payments
- Yield compounding

---

#### `pallet-dynamic-tokenomics` - Adaptive Tokenomics
**Status:** 📋 Planned  
**Purpose:** Auto-adjusting tokenomics

**Features:**
- Dynamic supply adjustment
- Adaptive fee rates
- Market-responsive rewards
- AI-powered optimization (future)

---

#### `pallet-time-locks` - Scheduled Execution
**Status:** 📋 Planned  
**Purpose:** Time-locked game actions

**Features:**
- Scheduled actions
- Cooldown enforcement
- Future commitments
- Block-based timing

---

### Phase 12: AI & Intelligence

#### `pallet-ai-evolution` - AI-Generated Evolution
**Status:** 📋 Planned  
**Purpose:** NFTs that evolve via AI

**Features:**
- Behavioral DNA analysis
- Adaptive evolution
- Personality systems
- Predictive traits

---

#### `pallet-ai-valuation` - AI Asset Pricing
**Status:** 📋 Planned  
**Purpose:** ML-powered NFT valuation

**Features:**
- Multi-factor analysis
- Predictive pricing
- Automated market making
- Fraud detection

---

### Phase 13: Privacy & Zero-Knowledge

#### `pallet-zk-game-state` - Private Game State
**Status:** 📋 Planned  
**Purpose:** Hidden but verifiable state

**Features:**
- ZK-SNARKs for state transitions
- Selective disclosure
- Private matchmaking
- Hidden inventory

---

#### `pallet-zk-reputation` - Private Reputation
**Status:** 📋 Planned  
**Purpose:** Reputation with ZK-proofs

**Features:**
- ZK-reputation claims
- Cross-game reputation
- Selective disclosure
- Sybil resistance

---

### Phase 14: Cross-Chain & Interoperability

#### `pallet-xcm-assets` - Universal Portability
**Status:** 📋 Planned  
**Purpose:** Cross-chain asset movement

**Features:**
- XCM teleportation
- Multi-chain state sync
- Universal marketplace
- Cross-chain composability

---

#### `pallet-parachain` - Layer 2 Sidechains
**Status:** 📋 Planned  
**Purpose:** Game-specific chains

**Features:**
- Dedicated game chains
- Instant finality
- Zero fees
- Custom consensus

---

## 📁 Directory Structure

```
pallets/
├── pallet-cgt/              # Creator God Token
├── pallet-qor-identity/     # QOR ID System
├── pallet-drc369/           # Programmable Assets
├── pallet-game-assets/      # Multi-Asset System
├── pallet-energy/           # Regenerating Currencies
├── pallet-composable-nfts/  # RMRK-Style NFTs
├── pallet-dex/              # Automatic DEX
├── pallet-fractional-assets/# Guild Ownership
├── pallet-governance/       # Game Governance
├── pallet-drc369-ocw/       # Off-Chain Workers
└── README.md                # This file
```

---

## 🔧 Development Guidelines

### Adding a New Pallet

1. **Create directory:** `pallets/pallet-name/`
2. **Add Cargo.toml** with proper dependencies
3. **Implement pallet** following Substrate patterns
4. **Add to workspace:** Update `blockchain/Cargo.toml`
5. **Integrate runtime:** Add to `runtime/src/lib.rs`
6. **Document:** Update this README

### Testing

```bash
# Test specific pallet
cd pallets/pallet-name
cargo test

# Test all pallets
cd blockchain
cargo test --workspace
```

### Benchmarking

```bash
# Benchmark pallet
cd pallets/pallet-name
cargo build --release --features runtime-benchmarks
./target/release/demiurge-node benchmark pallet --pallet pallet_name
```

---

## 📚 Resources

- **Substrate Docs:** https://docs.substrate.io/
- **FRAME Pallet Template:** https://github.com/substrate-developer-hub/substrate-pallet-template
- **Revolutionary Features:** `../../docs/REVOLUTIONARY_FEATURES_ROADMAP.md`

---

**Last Updated:** January 2026
