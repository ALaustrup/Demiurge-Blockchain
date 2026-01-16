# 🚀 External Build Guide - Demiurge Blockchain

## ⚠️ CRITICAL: Always Build Externally

**Cursor crashes during large Rust builds.** Always use external terminals or CI/CD.

---

## Quick Commands

### Windows (PowerShell)

```powershell
# Standard build
.\scripts\build-external.ps1

# Clean build
.\scripts\build-external.ps1 -Clean

# Docker build
.\scripts\build-external.ps1 -Docker

# Check only (fast)
.\scripts\build-external.ps1 -Check
```

### Linux/Mac/WSL (Bash)

```bash
# Make executable (first time only)
chmod +x scripts/build-external.sh

# Standard build
./scripts/build-external.sh

# Clean build
./scripts/build-external.sh --clean

# Docker build
./scripts/build-external.sh --docker

# Check only (fast)
./scripts/build-external.sh --check
```

### Docker (Any Platform)

```bash
cd blockchain
docker build -t demiurge-node:latest .
docker run -it --rm demiurge-node:latest --dev
```

### Makefile (Linux/Mac/WSL)

```bash
cd blockchain
make check          # Fast check
make build-release  # Full build
make build-docker   # Docker build
make run-dev        # Run node
```

---

## Build Times

| Mode | Time | Use Case |
|------|------|----------|
| `cargo check` | ~5 min | Quick validation |
| `cargo build --release` | ~30-60 min | Production binary |
| Docker build | ~45-90 min | Containerized |

---

## Binary Locations

After successful build:

- **Windows**: `blockchain\target\release\demiurge-node.exe`
- **Linux/Mac**: `blockchain/target/release/demiurge-node`

---

## Verify Build

```bash
# Check version
./target/release/demiurge-node --version

# Start dev node
./target/release/demiurge-node --dev --rpc-cors=all
```

---

## Troubleshooting

### "Out of Memory"
```bash
# Reduce parallel jobs
cargo build --release -j 1
```

### "Missing dependencies"
```bash
# Linux: Install build tools
sudo apt-get install -y clang libclang-dev cmake pkg-config libssl-dev

# Windows: Install Visual Studio Build Tools
```

### "Docker build fails"
- Ensure Docker has 8GB+ RAM allocated
- Check disk space (20GB+ free)

---

## CI/CD

GitHub Actions automatically builds on:
- Push to `main`/`develop`
- Pull requests (check only)
- Manual workflow dispatch

See `.github/workflows/build-blockchain.yml`

---

## Full Documentation

See `blockchain/BUILD.md` for complete build documentation.
