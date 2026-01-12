# Demiurge-Blockchain

<div align="center">

![Demiurge](https://img.shields.io/badge/Demiurge-Blockchain-purple?style=for-the-badge)
![CGT](https://img.shields.io/badge/CGT-1B_Supply-gold?style=for-the-badge)
![Substrate](https://img.shields.io/badge/Substrate-Powered-black?style=for-the-badge)

*A Gnostic-inspired blockchain ecosystem*

**[Documentation](./docs)** · **[Contributing](./CONTRIBUTING.md)** · **[Security](./SECURITY.md)**

</div>

---

## 🌌 Philosophy

The Demiurge-Blockchain transcends traditional blockchain architecture by embodying Gnostic cosmology. Every component, every module, every line of code is an emanation from the divine source—the Monad.

> *"From the Monad, all emanates. To the Pleroma, all returns."*

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PLEROMA                              │
│                    (The Fullness)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   AEONS     │  │  ARCHONS    │  │  SYZYGIES   │        │
│   │  (Features) │  │ (Governance)│  │  (Pairs)    │        │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│          │                │                │                │
│   ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐        │
│   │   Qor ID    │  │  Consensus  │  │   Client/   │        │
│   │    CGT      │  │  Validators │  │   Server    │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                        MONAD                                │
│              (The Source Server - Pleroma)                  │
│                    51.210.209.112                           │
└─────────────────────────────────────────────────────────────┘
```

### Core Emanations

| Component | Description | Status |
|-----------|-------------|--------|
| **Qor ID** | Non-dual identity system | 🔨 In Development |
| **CGT** | Creator God Token (1B supply, 8 decimals) | 📋 Planned |
| **Qor Installer** | Setup wizard for new users | 📋 Planned |
| **Qor Launcher** | Central hub for interaction | 📋 Planned |

## 💰 Creator God Token (CGT)

The divine currency of the Demiurge-Blockchain.

```
Symbol:     CGT
Supply:     1,000,000,000
Decimals:   8
Type:       Native Substrate Asset
```

## 🛠️ Technical Stack

- **Blockchain**: [Substrate](https://substrate.io/) - Modular blockchain framework
- **Runtime**: WASM-compiled Rust pallets
- **Game Engine**: Unreal Engine 5 (for immersive experiences)
- **Infrastructure**: Monad server with RAID 0 for high-entropy operations

## 📦 Quick Start

```bash
# Clone the repository
git clone https://github.com/Alaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain

# Run development setup
./scripts/setup-dev.sh

# Build the project (when ready)
cargo build --release
```

## 🚀 Deployment

| Environment | Server | Path |
|-------------|--------|------|
| Production | Monad (Pleroma) | `/data/Demiurge-Blockchain` |
| Development | Local | `./` |

Deploy to Monad:
```bash
./scripts/deploy-monad.sh main
```

## 📁 Project Structure

```
Demiurge-Blockchain/
├── aeons/              # Major features and modules
│   ├── qor-id/         # Identity system
│   └── cgt/            # Creator God Token
├── archons/            # Governance and control
├── syzygies/           # Paired systems
├── tools/              # User-facing applications
│   ├── qor-installer/  # Setup wizard
│   └── qor-launcher/   # Central hub
├── scripts/            # Deployment and utilities
└── .github/            # CI/CD and templates
```

## 🔐 Security

See [SECURITY.md](./SECURITY.md) for our security policy.

- SSH key-only authentication on Monad
- No secrets in version control
- Regular dependency audits
- Explicit confirmation for destructive operations

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Key principles:**
- Use Gnostic naming conventions
- Confirm before naming new modules
- High-entropy ops on `/data` (RAID 0)
- Follow the Laws (`.cursorrules`)

## 📄 License

[To be determined]

## 👤 Author

**Alaustrup** - [GitHub](https://github.com/Alaustrup)

---

<div align="center">

*"In the beginning was the Monad, and the Monad was with the Pleroma..."*

</div>
