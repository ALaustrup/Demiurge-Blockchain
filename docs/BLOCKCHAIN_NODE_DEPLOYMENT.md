# Demiurge Blockchain Node Deployment Guide

## Current Setup

The Demiurge blockchain node is deployed using Parity's official Substrate image with a custom chain specification.

**Current Node**: `parity/substrate:latest` (Substrate 3.0.0-dev)
**Chain**: `Demiurge` (custom local chain spec)
**Status**: Running and operational at `51.210.209.112:19933` (HTTP) and `51.210.209.112:19944` (WebSocket)

## Quick Start

### Deploy the Node

```bash
cd ~/demiurge
docker compose -f docker-compose.substrate-node.yml up -d
```

### Monitor RPC Health

```bash
docker logs -f demiurge-rpc-monitor
```

### Test RPC Endpoints

```bash
# HTTP RPC
curl -X POST http://localhost:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_chain","params":[],"id":1}'

# Check best block
curl -X POST http://localhost:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getHeader","params":[],"id":1}'

# Check connected peers
curl -X POST http://localhost:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_peers","params":[],"id":1}'
```

## Building Custom Demiurge Runtime

To deploy the custom Demiurge runtime with all 11 pallets, you need to:

### 1. Resolve Compilation Issues

The Demiurge blockchain has an sc-network 0.38.0 enum variant collision issue. This can be resolved with:

```bash
# Option A: Patch sc-network in cargo registry (on build server)
for version in 0.38.0 0.39.0 0.40.0; do
  FILE="~/.cargo/registry/src/index.crates.io-*/sc-network-$version/src/protocol/message.rs"
  # Add explicit codec indices to prevent auto-numbering conflicts
  sed -i 's/#\[codec(index = 6)\]/#[codec(index = 5)]/' "$FILE"
  # ... add remaining indices
done

# Option B: Use Docker multi-stage build with patches
docker build -f blockchain/Dockerfile -t demiurge-node:custom .
```

### 2. Build the Custom Node

```bash
cd blockchain
cargo build --release --bin demiurge-node
```

### 3. Create Docker Image

```dockerfile
# Dockerfile.custom
FROM ubuntu:22.04 as runtime
RUN apt-get update && apt-get install -y ca-certificates libssl3
COPY --from=builder /build/blockchain/target/release/demiurge-node /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/demiurge-node"]
```

### 4. Deploy with Custom Image

Update `docker-compose.substrate-node.yml`:

```yaml
services:
  demiurge-node:
    image: demiurge-node:custom  # Use custom build
    # ... rest of config
```

## Pallets Included

The Demiurge runtime includes 11 pallets:

- ✅ `pallet-cgt` - Creator Game Tokens
- ✅ `pallet-qor-identity` - QOR Identity
- ✅ `pallet-drc369` - DRC369 Asset Standard
- ✅ `pallet-game-assets` - Game Assets
- ✅ `pallet-composable-nfts` - Composable NFTs
- ✅ `pallet-dex` - Decentralized Exchange
- ✅ `pallet-fractional-assets` - Fractional Assets
- ✅ `pallet-drc369-ocw` - DRC369 Off-Chain Workers
- ✅ `pallet-governance` - Governance
- ✅ `pallet-session-keys` - Session Keys
- ✅ `pallet-yield-nfts` - Yield-Bearing NFTs

⚠️ `pallet-energy` - Has upstream sp-trie dependency issue (non-blocking)

## Network Configuration

### Peer Discovery

To connect additional validator nodes or sync nodes:

1. **Get Bootstrap Information**:
   ```bash
   curl -X POST http://localhost:19933 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"system_nodeMetadata","params":[],"id":1}'
   ```

2. **Connect Peer** (from another node):
   ```bash
   curl -X POST http://localhost:19933 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"system_addReservedPeer","params":["PEER_ID"],"id":1}'
   ```

### Multi-Node Setup

Deploy multiple nodes with different ports:

```yaml
services:
  validator-1:
    ports:
      - "19944:9944"
      - "19933:9933"
      - "30333:30333"
    command: >
      --validator
      --node-key 0x...  # Deterministic key for validator

  validator-2:
    ports:
      - "29944:9944"
      - "29933:9933"
      - "40333:30333"
    command: >
      --validator
      --node-key 0x...
```

## RPC Endpoints

### Public Interface

- **HTTP RPC**: `http://51.210.209.112:19933`
- **WebSocket RPC**: `ws://51.210.209.112:19944`
- **Metrics**: `http://51.210.209.112:9615/metrics`

### Integration with Hub/QOR Services

For the Hub and QOR Auth services to interact with the blockchain:

```javascript
// Example: Connect PolkadotJS
import { ApiPromise, WsProvider } from '@polkadot/api';

const provider = new WsProvider('ws://51.210.209.112:19944');
const api = await ApiPromise.create({ provider });

// Check chain info
const chain = await api.rpc.system.chain();
console.log(`Connected to chain: ${chain}`);

// Query pallet state
const balance = await api.query.balances.freeBalance(accountId);
console.log(`Balance: ${balance}`);
```

## Monitoring

### Prometheus Metrics

Access Prometheus metrics at: `http://localhost:9615/metrics`

Key metrics to monitor:
- `substrate_node_version` - Node version
- `substrate_node_block_height` - Current block number
- `substrate_syncing_peers` - Number of connected peers
- `substrate_block_import_time_seconds` - Block import performance

### Health Checks

The node includes built-in health checks:

```bash
# Check system health
curl http://localhost:9933/health

# View node logs
docker logs -f demiurge-blockchain-node
```

## Troubleshooting

### Issue: Port Already in Use

```bash
# Kill existing process on port 9933/9944
lsof -i :9933 | awk 'NR==2 {print $2}' | xargs kill -9
```

### Issue: Permission Denied on Data Directory

```bash
docker run --rm -v demiurge_demiurge-chain-data:/data \
  busybox chmod -R 777 /data
```

### Issue: RPC Method Not Found

Ensure you're using the correct RPC version:

```bash
# Check available RPC methods
curl -X POST http://localhost:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"rpc_methods","params":[],"id":1}'
```

## Next Steps

1. **Build Custom Runtime**: Follow "Building Custom Demiurge Runtime" section
2. **Set Up Validators**: Deploy multiple validator nodes with session keys
3. **Connect to Testnet**: Add bootstrap nodes for testnet discovery
4. **Integrate Services**: Connect Hub and QOR Auth to RPC endpoints
5. **Monitor Performance**: Set up Prometheus scraping for metrics

## References

- [Substrate Documentation](https://docs.substrate.io)
- [PolkadotJS API](https://polkadot.js.org/docs/api)
- [Substrate RPC Specification](https://docs.substrate.io/build/custom-rpc/)
