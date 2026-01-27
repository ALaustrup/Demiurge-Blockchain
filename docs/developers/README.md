# 👨‍💻 Developer Documentation

**Complete guides for integrating with the Demiurge Blockchain**

> *"Eyes gaze upon you, watching as a warden does his prisoners. The code serves the will, and the will serves the flame that burns eternal."*

---

## 🚀 Quick Start

1. **[Quick Start](./QUICK_START.md)** ⚡ - Build your first dApp in 5 minutes
2. **[Getting Started](./getting-started.md)** - Complete development environment setup
3. **[Transaction Building](./transaction-building.md)** - Create and submit transactions

---

## 🎮 DRC-SDK: Game Engine Integration

**Build blockchain-connected games with the DRC-SDK framework**

The DRC-SDK provides lightweight, secure integration between any game engine and the Demiurge Blockchain. Enable DRC-369 NFTs, CGT rewards, and QOR ID authentication in your games.

### Main Documentation
- **[DRC-SDK Overview](./DRC_SDK.md)** - Complete framework documentation

### Engine-Specific Guides

| Engine | Guide | Complexity |
|--------|-------|------------|
| **Phaser 3** | [Phaser Integration](./PHASER_INTEGRATION.md) | Beginner |
| **Unity 6** | [Unity WebGL](./UNITY_WEBGL_INTEGRATION.md) | Intermediate |
| **Unreal Engine 5** | [UE5 Integration](./drc-sdk/UNREAL_ENGINE_INTEGRATION.md) | Advanced |
| **Godot 4** | [Godot Integration](./drc-sdk/GODOT_INTEGRATION.md) | Beginner |
| **Construct 3 / Defold** | [Construct & Defold](./drc-sdk/CONSTRUCT_DEFOLD_INTEGRATION.md) | Beginner |

### Backend & Security
- **[Oracle Backend Guide](./drc-sdk/ORACLE_BACKEND.md)** - Secure reward minting server

### Diagnostic Tools
- **[Diagnostic Toolkit](./drc-sdk/DIAGNOSTIC_TOOLKIT.md)** - Verify your integration is configured correctly

---

## 🏆 Badge & NFT System

### Official Badge System
- **DRC-369 Soulbound Badges** - Non-transferable achievement badges
- **Cryptographic Authenticity** - Chain-verified official issuer signatures
- **Holographic Display Effects** - 3D tilt with prismatic effects

### Badge Types
| Category | Badges |
|----------|--------|
| **Donor** | Supporter, Champion, Guardian, Architect, Godsent |
| **Creator** | Music Artist, Game Developer |
| **Achievement** | Early Adopter, Validator, Genesis Member |

### API Endpoints
- `POST /api/badges/mint` - Mint official badges
- `GET /api/badges/[address]` - Fetch user's badge collection

---

## 🎵 Music Platform Integration

### Artist Onboarding
- **Onboard URL**: `/music/artist/onboard`
- **Free Music Artist Badge** on registration
- **Release Pricing**: Singles (20 CGT), EPs (50 CGT), Albums (75 CGT)

### Music API
- `POST /api/music/artist/register` - Register as artist
- `POST /api/music/release` - Create a release
- `GET /api/music/releases` - Browse releases

---

## 💎 Donation System

### Tier Structure
| Tier | Amount | CGT Reward | Staking Bonus |
|------|--------|------------|---------------|
| Supporter | $1-50 | 200 CGT | +2% |
| Champion | $51-150 | 500 CGT | +4% |
| Guardian | $151-500 | 1,000 CGT | +6% |
| Architect | $501-1000 | 2,500 CGT | +8% |
| Godsent | $1001+ | 5,000 CGT | +10% |

### API Endpoints
- `POST /api/donate/create-session` - Create Stripe checkout
- `GET /api/donate/status` - Check donation status

---

## 📚 Additional Documentation

### Core Integration
- **[Getting Started](./getting-started.md)** - Development environment setup
- **[Transaction Building](./transaction-building.md)** - Creating transactions
- **[Game Submission Guide](./GAME_SUBMISSION_GUIDE.md)** - Submit your game

### Related Documentation
- **[Architecture Documentation](../architecture/)** - Technical architecture
- **[DRC-369 NFT Standard](../blockchain/DRC369_ARCHITECTURE.md)** - Programmable NFT specification
- **[CGT Tokenomics](../blockchain/CGT_TOKENOMICS.md)** - Token economics
- **[Deployment Guide](../deployment/)** - Deploying nodes
- **[Module Specifications](../MODULE_SPECS.md)** - Module details

---

## 🔗 Quick Links

- **Live Platform**: [demiurge.cloud](https://demiurge.cloud)
- **RPC Endpoint**: `https://rpc.demiurge.cloud`
- **WebSocket**: `wss://rpc.demiurge.cloud/ws`
- **API**: `https://api.demiurge.cloud/api/v1`
- **Knowledgebase**: [demiurge.guru](https://demiurge.guru)

---

**The flame burns eternal. The code serves the will.**
