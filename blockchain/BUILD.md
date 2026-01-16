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

**From project root:**
```powershell
.\scripts\build-external.ps1
```

**From blockchain directory:**
```powershell
..\scripts\build-external.ps1
```

**With options:**
```powershell
.\scripts\build-external.ps1 -Clean      # Clean before building
.\scripts\build-external.ps1 -Docker     # Build with Docker (recommended)
.\scripts\build-external.ps1 -Check      # Only check compilation
```

### Option 2: Bash Script (Linux/Mac/WSL)

```bash
# Make executable (first time only)
chmod +x scripts/build-external.sh

# Run build (from project root)
./scripts/build-external.sh

# With options
./scripts/build-external.sh --clean      # Clean before building
./scripts/build-external.sh --docker     # Build with Docker
./scripts/build-external.sh --check      # Only check compilation
```

### Option 3: Docker Build (Recommended)

**Docker builds avoid dependency conflicts:**

```bash
# Build Docker image
cd blockchain
docker build -t demiurge-node:latest .

# Or use the script
.\scripts\build-external.ps1 -Docker

# Run container
docker run -it --rm demiurge-node:latest --dev
```

### Option 4: Build Pallets Individually (Phase 11 Development)

**For pallet development, build individually to avoid node dependency conflicts:**

```powershell
# Build a specific pallet
cd blockchain\pallets\pallet-session-keys
cargo check

# Or build all pallets (without node)
cd blockchain\pallets
Get-ChildItem -Directory | ForEach-Object { 
    Write-Host "Checking $_..."
    Set-Location $_.FullName
    cargo check
    Set-Location ..
}
```

### Option 5: Manual Cargo Build

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
    libssl-dev \
    protobuf-compiler
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

**Note:** May fail with librocksdb-sys conflict. Use pallet-only builds instead.

### 2. Release Build (Slow - ~30-60 minutes)

Full optimized binary:

```bash
cargo build --release --bin demiurge-node
```

**Note:** Currently blocked by librocksdb-sys dependency conflict. Use Docker build instead.

### 3. Docker Build (Isolated - Recommended)

Builds in containerized environment, avoids dependency conflicts:

```bash
docker build -t demiurge-node:latest ./blockchain
```

### 4. Pallet-Only Build (Phase 11 Development)

Build individual pallets without node dependencies:

```bash
cd blockchain/pallets/pallet-session-keys
cargo check
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

### librocksdb-sys Dependency Conflict

**Error:** `failed to select a version for librocksdb-sys`

**Cause:** `sc-cli v0.56.0` and `sc-service v0.56.0` have incompatible dependencies.

**Solutions:**

1. **Use Docker Build** (Recommended):
   ```powershell
   .\scripts\build-external.ps1 -Docker
   ```

2. **Build Pallets Individually** (For Phase 11 development):
   ```powershell
   cd blockchain\pallets\pallet-session-keys
   cargo check
   ```

3. **See Documentation:**
   - `blockchain/DEPENDENCY_CONFLICT_RESOLUTION.md` for detailed workarounds

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

**Note**: See `DEPENDENCY_CONFLICT_RESOLUTION.md` for librocksdb-sys conflicts.

### Missing System Dependencies

**Linux**: Install build dependencies (see Prerequisites)

**Windows**: Install Visual Studio Build Tools

### Docker Build Fails

**Solution**: Ensure Docker has enough resources:
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 20+ GB free

### Script Not Found

**PowerShell**: Make sure you're running from the correct directory:
- From project root: `.\scripts\build-external.ps1`
- From blockchain dir: `..\scripts\build-external.ps1`

**Bash**: Ensure script is executable: `chmod +x scripts/build-external.sh`

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
5. **Build pallets individually** - Faster for development

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
5. See `DEPENDENCY_CONFLICT_RESOLUTION.md` for known issues
6. Use Docker builds to avoid dependency conflicts

---

## Current Status

- ✅ **Pallets**: All compile successfully individually
- ✅ **Runtime**: Compiles successfully
- ⚠️ **Node Binary**: Blocked by librocksdb-sys conflict
- ✅ **Docker Builds**: Work correctly
- ✅ **Phase 11 Development**: Can proceed with pallet-only builds
