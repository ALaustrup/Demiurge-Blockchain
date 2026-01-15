# Blockchain Compilation Guide

## Prerequisites

### 1. Install Protocol Buffers Compiler (protoc)

**Windows (PowerShell):**
```powershell
# Option 1: Using Chocolatey
choco install protoc

# Option 2: Manual Installation
# Download from: https://github.com/protocolbuffers/protobuf/releases
# Extract and add to PATH
```

**Linux:**
```bash
sudo apt-get install protobuf-compiler
# or
sudo yum install protobuf-compiler
```

**macOS:**
```bash
brew install protobuf
```

### 2. Verify Installation
```powershell
protoc --version
# Should output: libprotoc 3.x.x or higher
```

## Compilation Steps

### 1. Check Dependencies
```powershell
cd x:\Demiurge-Blockchain\blockchain
cargo check --workspace
```

### 2. Build Release Version
```powershell
cargo build --release
```

### 3. Build with Benchmarks (Optional)
```powershell
cargo build --release --features runtime-benchmarks
```

### 4. Run Tests
```powershell
cargo test --workspace
```

## Common Issues

### Issue: `protoc` not found
**Solution**: Install protoc and ensure it's in your PATH

### Issue: Compilation errors in pallets
**Solution**: Check for:
- Missing imports
- Type mismatches
- Incorrect trait bounds

### Issue: Workspace member not found
**Solution**: Ensure all pallets are listed in `blockchain/Cargo.toml` members

### Issue: schnorrkel version conflict (sp-core@18.0.0 vs sp-core@38.0.0)
**Status**: Known issue with old transitive dependencies
**Details**: Some old `sc-*` crates pull in `sp-core@18.0.0` which expects `schnorrkel@0.9.1`,
while `substrate-bip39` (transitive dependency) pulls in `schnorrkel@0.11.5`.
**Impact**: Compilation error, but doesn't affect runtime functionality
**Workaround**: Individual pallets compile successfully. The conflict only appears when compiling
the full workspace including the node. This will resolve once all `sc-*` dependencies are updated
to versions compatible with `sp-core@38.0.0`.
**Current Status**: All pallets compile successfully. Node compilation blocked by dependency conflict.

## Expected Build Time

- **First build**: 15-30 minutes (downloads dependencies)
- **Incremental builds**: 2-5 minutes
- **Release build**: 10-20 minutes

## Build Artifacts

After successful compilation:
- **Node binary**: `blockchain/target/release/demiurge-node`
- **Runtime WASM**: `blockchain/target/release/wbuild/demiurge-runtime/demiurge_runtime.wasm`

## Running the Node

```powershell
cd blockchain/node
cargo run --release -- --dev
```

This starts a development node with:
- Local blockchain
- All pallets enabled
- WebSocket RPC on `ws://127.0.0.1:9944`
- HTTP RPC on `http://127.0.0.1:9933`
