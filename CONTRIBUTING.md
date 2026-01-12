# Contributing to Demiurge-Blockchain

Welcome to the Pleroma. This guide will help you contribute to the cosmic order.

## The Laws

Before contributing, familiarize yourself with [The Laws of the Demiurge-Blockchain](.cursorrules).

## Naming Conventions

We follow Gnostic terminology:

| Term | Usage |
|------|-------|
| **Aeon** | Major features/modules |
| **Archon** | Governance/control systems |
| **Syzygy** | Paired/complementary systems |
| **Pleroma** | The complete system/network |
| **Monad** | The source server |

**Always ask for confirmation before naming new modules.**

## Development Setup

### Prerequisites

- Rust (latest stable)
- Node.js 20+ LTS
- Git
- Docker (recommended)

### Local Development

```bash
# Clone the repository
git clone https://github.com/Alaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain

# Install Rust dependencies (when Cargo.toml exists)
cargo build

# Run tests
cargo test
```

### Server Development (Monad)

High-entropy operations (Substrate/UE5) must use `/data` (RAID 0):

```bash
ssh monad
cd /data/Demiurge-Blockchain
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `aeon/*` | New features |
| `archon/*` | Governance changes |
| `fix/*` | Bug fixes |

## Commit Messages

Format: `[TYPE] Brief description`

Types:
- `[AEON]` - New feature
- `[ARCHON]` - Governance change
- `[SYZYGY]` - Paired system update
- `[FIX]` - Bug fix
- `[DOCS]` - Documentation
- `[REFACTOR]` - Code improvement

Example: `[AEON] Implement Qor ID registration flow`

## Pull Request Process

1. Create a branch from `develop`
2. Make your changes
3. Ensure tests pass
4. Submit PR using the template
5. Await review from the Archons

## Code Standards

- **Rust**: Follow `rustfmt` and `clippy` guidelines
- **TypeScript/JavaScript**: ESLint + Prettier
- **Documentation**: Keep README files updated

## Questions?

Open an issue or reach out to [@Alaustrup](https://github.com/Alaustrup).

---

*"From the Monad, all emanates. To the Pleroma, all returns."*
