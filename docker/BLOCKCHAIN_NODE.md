# 🔗 Blockchain Node in Docker

## Current Status

The Demiurge blockchain node has a known `librocksdb-sys` dependency conflict that prevents it from building in Docker Compose by default.

**Error:**
```
error: failed to select a version for `librocksdb-sys`.
package `librocksdb-sys` links to the native library `rocksdb`, but it conflicts with a previous package
```

## Solutions

### Option 1: Build Externally (Recommended)

Build the blockchain node outside of Docker Compose:

```powershell
# From project root
.\scripts\build-external.ps1 -Docker

# Or manually
cd blockchain
docker build -t demiurge-node:latest .
docker run -d --name demiurge-node \
  -p 9944:9944 -p 9933:9933 -p 30333:30333 -p 9615:9615 \
  -v demiurge-node-data:/data \
  demiurge-node:latest --dev --rpc-cors all --rpc-external --ws-external
```

### Option 2: Use Blockchain Profile (If Fixed)

If the dependency conflict is resolved, you can use the blockchain profile:

```powershell
docker-compose --profile blockchain up -d demiurge-node
```

### Option 3: Run Node Locally

Build and run the node on your host machine:

```powershell
cd blockchain
cargo build --release --bin demiurge-node
.\target\release\demiurge-node.exe --dev --rpc-cors all
```

### Option 4: Use Pre-built Image

If you have a pre-built Docker image:

```powershell
docker run -d --name demiurge-node \
  -p 9944:9944 -p 9933:9933 -p 30333:30333 -p 9615:9615 \
  -v demiurge-node-data:/data \
  demiurge-node:latest --dev --rpc-cors all --rpc-external --ws-external
```

## Development Workflow

For local development, you typically don't need the blockchain node running in Docker:

1. **Start core services** (PostgreSQL, Redis, QOR Auth, Hub):
   ```powershell
   docker-compose --profile dev up -d
   ```

2. **Run blockchain node separately** (if needed):
   - Build externally using scripts
   - Or run locally if you have Rust installed
   - Or use a pre-built binary

3. **Connect Hub to blockchain**:
   - Update `.env` with blockchain RPC URLs
   - Or use environment variables to point to external node

## Connecting Services

If you run the blockchain node separately, update your Hub environment:

```env
NEXT_PUBLIC_BLOCKCHAIN_WS_URL=ws://localhost:9944
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://localhost:9933
```

## More Information

- **Build Guide**: `blockchain/BUILD.md`
- **Dependency Conflict**: `blockchain/DEPENDENCY_CONFLICT_RESOLUTION.md`
- **External Build Scripts**: `scripts/build-external.ps1` or `scripts/build-external.sh`

---

**Note**: The blockchain node is excluded from default Docker Compose startup due to the dependency conflict. This allows other services (PostgreSQL, Redis, QOR Auth, Hub) to start successfully.
