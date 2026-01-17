# 🎭 Monad Server Setup Complete

## ✅ Setup Summary

The Monad server (Pleroma) has been configured for optimal blockchain operations.

### System Configuration

- **Hostname:** pleroma
- **OS:** Ubuntu Server 24.04.3 LTS (Noble Numbat)
- **Kernel:** 6.8.0-90-generic
- **RAM:** 125GB available
- **Storage:** 878GB on RAID 1 (root), /data directory ready

### Installed & Configured

#### Core Software
- ✅ Docker 29.1.5
- ✅ Docker Compose v5.0.1
- ✅ Rust nightly (1.94.0) with wasm32-unknown-unknown target
- ✅ Build essentials (gcc, make, pkg-config, libssl-dev)
- ✅ System tools (curl, wget, git, htop, tmux, vim)

#### System Optimizations
- ✅ Kernel parameters tuned for blockchain operations
- ✅ Memory overcommit enabled (for Redis)
- ✅ Network tuning for Substrate P2P
- ✅ File descriptor limits increased

#### Docker Services
- ✅ **PostgreSQL 18** - Running and healthy
- ✅ **Redis 7.4** - Running and healthy  
- ✅ **QOR Auth** - Built and running
- ⚠️ **Demiurge Node** - Requires external build (librocksdb-sys conflict)
- ⚠️ **Nginx** - Config file needed (optional)

#### Repository & Configuration
- ✅ Repository cloned to `/data/Demiurge-Blockchain`
- ✅ Environment variables configured (`docker/.env`)
- ✅ Secure secrets generated
- ✅ Docker network `demiurge-network` created

## 📍 Key Locations

```
/data/Demiurge-Blockchain/          # Main repository
├── docker/                         # Docker configurations
│   ├── docker-compose.production.yml
│   └── .env                        # Environment variables
├── blockchain/                     # Blockchain code
├── services/qor-auth/             # Auth service
└── apps/                          # Frontend apps
```

## 🚀 Service Management

### Check Status
```bash
ssh pleroma
cd /data/Demiurge-Blockchain
docker compose -f docker/docker-compose.production.yml ps
```

### View Logs
```bash
docker compose -f docker/docker-compose.production.yml logs -f [service]
```

### Restart Services
```bash
docker compose -f docker/docker-compose.production.yml restart [service]
```

### Stop All Services
```bash
docker compose -f docker/docker-compose.production.yml down
```

## 🔧 Next Steps

### 1. Verify QOR Auth
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### 2. Build Blockchain Node (External)
Due to `librocksdb-sys` dependency conflict, build externally:

```bash
ssh pleroma
cd /data/Demiurge-Blockchain/blockchain
source ~/.cargo/env
cargo build --release --bin demiurge-node
```

### 3. Run Blockchain Node
```bash
cd /data/Demiurge-Blockchain/blockchain
./target/release/demiurge-node \
  --chain demiurge-testnet \
  --name "Pleroma-Validator" \
  --validator \
  --rpc-cors all \
  --rpc-external \
  --prometheus-external
```

### 4. Optional: Set Up Nginx
Create `/data/Demiurge-Blockchain/docker/nginx.conf` for reverse proxy, or comment out nginx service if not needed.

### 5. Optional: Set Up RAID 0 for /data
For optimal performance, configure RAID 0 on both NVMe drives for `/data` mount point (see `scripts/OVH_PARTITIONING_GUIDE.md`).

## 📊 Service Endpoints

| Service | Port | Endpoint | Status |
|---------|------|----------|--------|
| QOR Auth | 8080 | http://51.210.209.112:8080 | ✅ Running |
| PostgreSQL | 5432 | localhost:5432 | ✅ Running |
| Redis | 6379 | localhost:6379 | ✅ Running |
| Blockchain RPC | 9944 | ws://51.210.209.112:9944 | ⚠️ Pending |
| Blockchain P2P | 30333 | 51.210.209.112:30333 | ⚠️ Pending |

## 🔐 Security Notes

- Environment variables stored in `/data/Demiurge-Blockchain/docker/.env`
- PostgreSQL password: Generated securely
- JWT secrets: Generated securely
- Firewall: Configure via OVH Manager if needed
- SSH: Key-based authentication configured

## 📝 Maintenance

### Update Repository
```bash
ssh pleroma
cd /data/Demiurge-Blockchain
git pull origin main
docker compose -f docker/docker-compose.production.yml build --no-cache qor-auth
docker compose -f docker/docker-compose.production.yml up -d qor-auth
```

### Backup Database
```bash
docker exec demiurge-postgres pg_dump -U qor_auth qor_auth > backup.sql
```

### Monitor Resources
```bash
htop                    # CPU/Memory
docker stats            # Container resources
df -h                   # Disk usage
```

---

**Setup Date:** January 17, 2026  
**Server:** pleroma (51.210.209.112)  
**Status:** ✅ Core services operational
