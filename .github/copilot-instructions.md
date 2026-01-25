# 🎭 Demiurge-Blockchain AI Agent Instructions

## Big Picture Architecture

**Demiurge** is a gaming-first blockchain platform with **three core layers**:

1. **Framework** (`framework/`) - Custom Rust blockchain from scratch
   - **NOT Substrate** - Complete independence, custom consensus
   - Hybrid PoS + BFT consensus with < 2s finality
   - Modular architecture: `core/`, `consensus/`, `network/`, `storage/`, `rpc/`
   - **Key insight**: Uses `libp2p` for P2P, `rocksdb` for storage, `tokio` for async runtime

2. **Frontend Ecosystem** (`apps/`, `packages/`) - TypeScript/Next.js monorepo managed by Turbo
   - `apps/hub/` - Main web platform (Next.js)
   - `apps/nft/` - NFT portal
   - `apps/guru/`, `apps/games/`, `apps/social/` - Feature apps
   - `packages/qor-sdk/` - QOR Identity SDK
   - `packages/ui-shared/` - Shared components
   - Connected via RPC to blockchain (no wallet plugins, feeless transactions via energy model)

3. **Backend Services** (`services/`) - Rust/Axum services
   - `services/qor-auth/` - QOR Identity service (JWT, auth)
   - PostgreSQL + Redis for persistence

## Project-Specific Conventions

### Naming & Identity (Gnostic Philosophy)
- **Monad** = Physical server hostname
- **Pleroma** = Destination entity/host
- **Aeons/Archons/Syzygies** = Internal module organization names (ask before creating new modules)
- **CGT** = Creator God Token (13B supply, 2 decimals, atomic unit = Spark = 0.01 CGT)
- **QOR ID** = Username-based identity system (not wallet-based)

### Build Process (Critical for All Builds)
The blockchain uses Substrate-compatible dependencies but **NOT the Substrate framework**:
- Builds require explicit patch for `sc-network-0.38.0` enum variant collision
- Patch file location: `~/.cargo/registry/src/index.crates.io-*/sc-network-0.38.0/src/protocol/message.rs`
- Add `#[codec(index = X)]` attributes to fix variant index collisions
- **Build time**: 30-60 minutes on first build
- **Build scripts**: `scripts/build-demiurge-node.sh` (local), `scripts/build-on-server.sh` (remote SSH)
- Docker build via `blockchain/Dockerfile` (multi-stage, optimized for release builds)

### Module System
Located in `framework/modules/`:
- **Balances** - CGT token management
- **DRC-369** - Stateful NFTs (can evolve, gain XP)
- **Game Assets** - Multi-asset per-game systems
- **Energy** - Regenerating transaction cost model (feeless UX)
- **Session Keys** - Temporary authorization for games
- **Yield NFTs** - Passive income generation
- **ZK** - Zero-knowledge proofs framework

Each module has trait-based design. Deploy new modules via update proposals → voting → runtime upgrade.

### RPC Architecture
- **Endpoint**: `https://rpc.demiurge.cloud` (production), `http://localhost:9944` (local dev)
- **Protocol**: JSON-RPC 2.0 + WebSocket
- Implementation in `framework/rpc/`
- TypeScript client: `packages/qor-sdk/` and `apps/hub/src/lib/demiurge-rpc.ts`
- **Key difference**: Custom RPC methods (not Polkadot API), no Substrate dependencies in clients

### Development Workflow Patterns
1. **Local dev**: Clone → `npm install` → `docker-compose up` (postgres/redis) → `npm run dev` (Turbo watches all)
2. **Blockchain changes**: Edit `framework/modules/*` → `cargo build --release` → Test via `framework/testnet/`
3. **Frontend changes**: Edit `apps/*/` → Auto-rebuild via Turbo, connects to local RPC on port 9944
4. **Cross-layer testing**: Use integration tests that spawn local node + connect frontend RPC client

## Critical Dependencies & Integration Points

### Monorepo Structure (Turbo)
```
Root package.json workspaces: ["apps/*", "packages/*"]
turbo.json defines tasks: build, dev, lint, clean, generate:wasm
```
- **Cache invalidation**: Changes in files matching `globalDependencies: ["**/.env.*local"]`
- **Dev mode**: `turbo run dev` (persistent, no cache), watch all workspaces
- **Build**: `turbo run build` (cached, outputs: `.next/**`, `dist/**`, `pkg/**`)

### Custom Blockchain Runtime Dependencies
- **Workspace root**: `framework/Cargo.toml` (Rust workspace)
- Uses `sp-*` crates (sp-api, sp-core, sp-runtime) @ v39.0.0
- Uses `frame-*` crates for module foundation (frame-system, frame-support, frame-executive)
- **Consensus**: Custom hybrid PoS + BFT (NOT Substrate consensus)
- **Storage**: Merkle tree based (custom implementation, not Substrate storage trie)

### Common Build Failures & Fixes
1. **"Both `Consensus` and `RemoteCallResponse` have index `6`"** → Apply sc-network patch (see Build Process)
2. **WASM compilation fails** → Ensure `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
3. **Missing cargo binary** → Use `~/.cargo/bin/cargo` explicitly (not just `cargo`)
4. **Docker multiplatform builds** → Scripts use `--build-arg BUILDKIT_INLINE_CACHE=1`

## Immediate Productivity Essentials

### Reading Checklist (In Order)
1. `.cursorrules` - Project identity and conventions
2. [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - 5-min quick start + RPC endpoints
3. [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - System integration
4. [docs/INTEGRATION_QUICK_REFERENCE.md](docs/INTEGRATION_QUICK_REFERENCE.md) - Module APIs
5. [framework/README.md](framework/README.md) - Custom blockchain status

### Key Files for Different Tasks
- **Adding features to blockchain**: `framework/modules/*/src/lib.rs` (trait definitions)
- **RPC methods**: `framework/rpc/src/` (JSON-RPC handlers)
- **Frontend integration**: `apps/hub/src/lib/demiurge-rpc.ts` (RPC client initialization)
- **Game integration**: `docs/GAME_INTEGRATION_GUIDE.md` + `docs/SESSION_KEYS_QOR_ID_INTEGRATION.md`
- **Deployment**: `scripts/build-demiurge-node.sh`, `demiurge-server.sh` (watch/check/redeploy)

## Testing & Validation

### Unit Tests
```bash
# Rust tests
cd framework && cargo test --release

# TypeScript tests
npm run test (in app directory)
```

### Integration Testing
- **Testnet**: `framework/testnet/` spawns local node for integration tests
- **RPC validation**: Connect TypeScript client to local node on 9944, verify module calls
- **Docker validation**: Build image, run container, verify RPC health endpoint

### Common Validation Checks
1. Blockchain binary compiles: `test -f ~/demiurge/blockchain/target/release/demiurge-node`
2. RPC responsive: `curl http://localhost:9944 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"system_health","params":[]}'`
3. Module accessible: RPC method returns event logs for that module

## Troubleshooting Patterns

### SSH Remote Builds (Monad → Pleroma)
- Use `ssh pleroma "command"` from scripts
- Example: `ssh pleroma "test -f ~/demiurge/blockchain/target/release/demiurge-node && echo 'Binary exists!'"` (check build status)
- Real-time logs: `ssh pleroma "docker build ... | tail -f"` (detachable with Ctrl+C)

### Dependency Hell Resolutions
- **Bandersnatch VRF stub**: `stubs/bandersnatch_vrfs` (stubbed, we don't use experimental features)
- **Substrate fork**: No local fork - use crates.io versions with patches
- **WASM imports**: Use `frame-support` macros, avoid direct pallets imports in runtime

## Code Patterns to Follow

### Adding a New Module
1. Create `framework/modules/{module_name}/`
2. Define trait in `lib.rs` (inherit `pallet::*` style if extending)
3. Implement functions (storage, hooks, RPC methods)
4. Add to module registry in runtime
5. Deploy via governance proposal + voting

### Connecting Frontend to New Blockchain Feature
1. Add RPC method in `framework/rpc/src/methods.rs`
2. Add TypeScript call signature in `apps/hub/src/lib/demiurge-rpc.ts`
3. Use `demiurgeRpc.call(method, params)` from frontend
4. No wallet popups - auth via QOR ID JWT from `qor-auth` service

### Environment Variables
- **Blockchain RPC URL**: `NEXT_PUBLIC_DEMIURGE_RPC_URL` (frontend, defaults to localhost:9944 or rpc.demiurge.cloud)
- **QOR Auth URL**: `NEXT_PUBLIC_QOR_AUTH_URL`
- **.env.*local** files trigger Turbo rebuild (in globalDependencies)

---

**Last Updated**: 2025-01-22  
**Status**: Production-ready framework, active development on modules and frontend integration
