# 🔨 Building Demiurge Blockchain Node

> *"Build externally. Think eternally."*

This guide covers building the Demiurge blockchain node. **Always build in external terminals** to avoid Cursor crashes during large Rust builds.

## ⚠️ Important: External Builds Only

**DO NOT** build inside Cursor. Large Substrate builds (500+ crates) can cause Cursor to crash or become unresponsive.

Always use:
- External terminal (PowerShell, Bash, or CI/CD)
- Docker builds
- GitHub Actions

---

## Quick Start

### Option 1: PowerShell Script (Windows)

```powershell
# In an external PowerShell terminal
.\scripts\build-external.ps1

# With options
.\scripts\build-external.ps1 -Clean      # Clean before building
.\scripts\build-external.ps1 -Docker     # Build with Docker
.\scripts\build-external.ps1 -Check      # Only check compilation
```

### Option 2: Bash Script (Linux/Mac/WSL)

```bash
# Make executable
chmod +x scripts/build-external.sh

# Run build
./scripts/build-external.sh

# With options
./scripts/build-external.sh --clean      # Clean before building
./scripts/build-external.sh --docker     # Build with Docker
./scripts/build-external.sh --check      # Only check compilation
```

### Option 3: Docker Build

```bash
# Build Docker image
cd blockchain
docker build -t demiurge-node:latest .

# Run container
docker run -it --rm demiurge-node:latest --dev
```

### Option 4: Manual Cargo Build

```bash
cd blockchain

# Check only (fast)
cargo check --release

# Full release build (30-60 minutes)
cargo build --release --bin demiurge-node

# Binary location
# Windows: blockchain\target\release\demiurge-node.exe
# Linux:   blockchain/target/release/demiurge-node
```

---

## Prerequisites

### Required

- **Rust 1.84+** - Install from [rustup.rs](https://rustup.rs/)
- **WASM target** - `rustup target add wasm32-unknown-unknown`
- **Cargo** - Included with Rust

### Linux/Mac/WSL

```bash
# Install build dependencies
sudo apt-get update
sudo apt-get install -y \
    clang \
    libclang-dev \
    llvm-dev \
    libc++-dev \
    libc++abi-dev \
    cmake \
    pkg-config \
    libssl-dev
```

### Windows

- **Visual Studio Build Tools** (for C++ compilation)
- Or use **Docker Desktop** for containerized builds

---

## Build Modes

### 1. Check Mode (Fast - ~5 minutes)

Only verifies compilation without creating binary:

```bash
cargo check --release
```

### 2. Release Build (Slow - ~30-60 minutes)

Full optimized binary:

```bash
cargo build --release --bin demiurge-node
```

### 3. Docker Build (Isolated)

Builds in containerized environment:

```bash
docker build -t demiurge-node:latest ./blockchain
```

---

## Build Output

### Binary Location

- **Windows**: `blockchain\target\release\demiurge-node.exe`
- **Linux/Mac**: `blockchain/target/release/demiurge-node`

### Binary Size

- Release binary: ~50-100 MB (stripped)
- Debug binary: ~200-500 MB

### Verify Build

```bash
# Check version
./target/release/demiurge-node --version

# Test node startup
./target/release/demiurge-node --dev --rpc-cors=all
```

---

## Troubleshooting

### Build Fails with "Out of Memory"

**Solution**: Reduce parallel jobs:

```bash
cargo build --release -j 1  # Single-threaded
```

Or increase swap space (Linux).

### Dependency Conflicts

**Solution**: Clean and rebuild:

```bash
cargo clean
cargo build --release
```

### Missing System Dependencies

**Linux**: Install build dependencies (see Prerequisites)

**Windows**: Install Visual Studio Build Tools

### Docker Build Fails

**Solution**: Ensure Docker has enough resources:
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 20+ GB free

---

## CI/CD Integration

### GitHub Actions

Automated builds run on:
- Push to `main` or `develop`
- Pull requests (check only)
- Manual workflow dispatch

See `.github/workflows/build-blockchain.yml`

### Local CI Simulation

```bash
# Run same checks as CI
cargo check --workspace
cargo fmt -- --check
cargo clippy -- -D warnings
```

---

## Performance Tips

1. **Use Docker** for consistent builds across environments
2. **Cache dependencies** - CI/CD caches `target/` directory
3. **Incremental builds** - Only rebuild changed crates
4. **Parallel builds** - Uses all CPU cores by default

---

## Next Steps

After building:

1. **Test the node**:
   ```bash
   ./target/release/demiurge-node --dev
   ```

2. **Connect to RPC**:
   - WebSocket: `ws://127.0.0.1:9944`
   - HTTP: `http://127.0.0.1:9933`

3. **Deploy to production**:
   ```bash
   cd docker
   docker-compose -f docker-compose.production.yml up -d
   ```

---

## Support

For build issues:
1. Check error messages carefully
2. Verify prerequisites are installed
3. Try clean build: `cargo clean && cargo build --release`
4. Check GitHub Actions logs for CI/CD failures
