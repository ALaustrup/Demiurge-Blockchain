# 🐳 Demiurge Docker Development Setup

> *"From the Monad, all emanates. To the Pleroma, all returns."*

Complete Docker setup for local development of the Demiurge-Blockchain ecosystem. This configuration is optimized for development workflows with hot reload, development tools, and proper naming aligned with the Monad/Pleroma server conventions.

## 📋 Prerequisites

- **Docker** 24.0+ and **Docker Compose** 2.20+
- **Windows**: Docker Desktop with WSL2 backend (recommended)
- **Linux/Mac**: Docker Engine + Docker Compose plugin

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Navigate to docker directory
cd docker

# Copy environment file
cp .env.example .env

# Edit .env with your preferences (optional)
# Default values work for local development
```

### 2. Start All Services

```bash
# Start all core services (PostgreSQL, Redis, QOR Auth, Hub)
docker-compose up -d

# Start with development tools (Adminer, Redis Commander)
docker-compose --profile dev up -d

# Note: Blockchain node is excluded by default due to librocksdb-sys dependency conflict
# See BLOCKCHAIN_NODE.md for options to run the blockchain node separately

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f qor-auth
docker-compose logs -f hub
```

### 3. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **Hub** | http://localhost:3000 | Next.js main application |
| **QOR Auth** | http://localhost:8080 | Authentication service API |
| **PostgreSQL** | localhost:5432 | Database (qor_auth/qor_auth) |
| **Redis** | localhost:6379 | Session cache |
| **Adminer** | http://localhost:8081 | Database UI (dev profile) |
| **Redis Commander** | http://localhost:8082 | Redis UI (dev profile) |
| **Blockchain WS** | ws://localhost:9944 | Substrate WebSocket RPC |
| **Blockchain RPC** | http://localhost:9933 | Substrate HTTP RPC |
| **Metrics** | http://localhost:9615 | Prometheus metrics |

## 🏗️ Architecture

### Services Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    demiurge-network                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Hub        │  │  QOR Auth    │  │  Blockchain  │    │
│  │  (Next.js)   │◄─┤  (Rust/Axum) │◄─┤  (Substrate) │    │
│  │  :3000       │  │  :8080       │  │  :9944/9933  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                 │                    │           │
│         │                 ▼                    │           │
│         │          ┌──────────────┐            │           │
│         │          │  PostgreSQL  │            │           │
│         │          │  :5432       │            │           │
│         │          └──────────────┘            │           │
│         │                 │                    │           │
│         │                 ▼                    │           │
│         │          ┌──────────────┐            │           │
│         └──────────┤    Redis     │────────────┘           │
│                    │  :6379       │                        │
│                    └──────────────┘                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Adminer    │  │ Redis Cmdr   │                        │
│  │  :8081       │  │  :8082       │                        │
│  │  (dev only)  │  │  (dev only)  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Naming Convention

All Docker components follow the `demiurge-{service}` naming pattern:

- **Containers**: `demiurge-postgres`, `demiurge-redis`, `demiurge-qor-auth`, `demiurge-hub`, `demiurge-node`
- **Volumes**: `demiurge-postgres-data`, `demiurge-redis-data`, `demiurge-node-data`, etc.
- **Network**: `demiurge-network`

This aligns with the production server naming (Monad/Pleroma) for consistency.

## 📦 Service Details

### PostgreSQL 18

- **Image**: `postgres:18-alpine`
- **Port**: 5432 (configurable via `POSTGRES_PORT`)
- **Database**: `qor_auth`
- **User**: `qor_auth`
- **Password**: Set in `.env` (default: `demiurge_dev_password`)
- **Volumes**: 
  - `demiurge-postgres-data`: Persistent data
  - Migrations auto-applied from `../services/qor-auth/migrations`

### Redis 7.4

- **Image**: `redis:7.4-alpine`
- **Port**: 6379 (configurable via `REDIS_PORT`)
- **Features**: AOF persistence, LRU eviction
- **Volume**: `demiurge-redis-data`

### QOR Auth Service

- **Language**: Rust (Axum framework)
- **Port**: 8080 (configurable via `QOR_AUTH_PORT`)
- **Build**: Multi-stage Dockerfile in `../services/qor-auth`
- **Features**:
  - JWT authentication
  - Session management
  - QOR ID system
  - ZK-proof verification (when enabled)
- **Health**: http://localhost:8080/health

### Next.js Hub

- **Framework**: Next.js 15 + React 19
- **Port**: 3000 (configurable via `HUB_PORT`)
- **Mode**: Development with hot reload
- **Volumes**: 
  - Source code mounted for live reload
  - `hub-node-modules`: Cached dependencies
  - `hub-next-cache`: Next.js build cache

### Demiurge Blockchain Node

- **Framework**: Substrate (Rust)
- **Status**: ⚠️ **Optional** - Excluded from default startup due to `librocksdb-sys` dependency conflict
- **Ports**:
  - 9944: WebSocket RPC
  - 9933: HTTP RPC
  - 30333: P2P
  - 9615: Prometheus metrics
- **Mode**: `--dev` (development chain)
- **Node Name**: `Pleroma-Dev` (aligned with production hostname)
- **Volume**: `demiurge-node-data` (uses `/data` path for high-entropy operations)
- **See**: `BLOCKCHAIN_NODE.md` for build and run options

### Development Tools (dev profile)

#### Adminer
- **URL**: http://localhost:8081
- **Purpose**: Database administration UI
- **Login**: 
  - System: PostgreSQL
  - Server: `postgres`
  - Username: `qor_auth`
  - Password: From `.env` (`POSTGRES_PASSWORD`)

#### Redis Commander
- **URL**: http://localhost:8082
- **Purpose**: Redis administration UI
- **Login**: From `.env` (`REDIS_COMMANDER_USER`/`REDIS_COMMANDER_PASSWORD`)

## 🔧 Common Operations

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres redis

# Start with development tools
docker-compose --profile dev up -d
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f qor-auth
docker-compose logs -f hub
docker-compose logs -f demiurge-node

# Last 100 lines
docker-compose logs --tail=100 qor-auth
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart qor-auth
```

### Rebuild Services

```bash
# Rebuild specific service
docker-compose build qor-auth

# Rebuild without cache
docker-compose build --no-cache qor-auth

# Rebuild and restart
docker-compose up -d --build qor-auth
```

### Execute Commands

```bash
# PostgreSQL shell
docker-compose exec postgres psql -U qor_auth -d qor_auth

# Redis CLI
docker-compose exec redis redis-cli

# Node shell
docker-compose exec hub sh

# Run migrations manually
docker-compose exec qor-auth qor-auth migrate
```

### Health Checks

```bash
# Check service status
docker-compose ps

# Check health endpoints
curl http://localhost:8080/health  # QOR Auth
curl http://localhost:3000/api/health  # Hub (if implemented)
```

## 🔐 Environment Variables

Key environment variables (see `.env` for full list):

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | `demiurge_dev_password` | Database password |
| `JWT_ACCESS_SECRET` | `demiurge_dev_jwt_access_secret` | JWT access token secret |
| `JWT_REFRESH_SECRET` | `demiurge_dev_jwt_refresh_secret` | JWT refresh token secret |
| `NODE_NAME` | `Pleroma-Dev` | Blockchain node identity |
| `RUST_LOG` | `info,substrate=debug` | Rust logging level |

**⚠️ Important**: Change default passwords/secrets for any non-local development!

## 🗄️ Volume Management

### List Volumes

```bash
docker volume ls | grep demiurge
```

### Backup Data

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U qor_auth qor_auth > backup.sql

# Backup Redis
docker-compose exec redis redis-cli SAVE
docker cp demiurge-redis:/data/dump.rdb ./redis-backup.rdb
```

### Clean Volumes

```bash
# Remove all volumes (⚠️ deletes all data)
docker-compose down -v

# Remove specific volume
docker volume rm demiurge-postgres-data
```

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check container status
docker-compose ps

# Check network
docker network inspect demiurge-network

# Clear Docker build cache (if Dockerfile changes aren't being picked up)
docker builder prune -f

# Restart Docker daemon (if needed)
```

### Port Conflicts

If ports are already in use:

1. Edit `.env` to change port mappings
2. Or stop conflicting services:
   ```bash
   # Windows
   netstat -ano | findstr :5432
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -i :5432
   kill <PID>
   ```

### Database Connection Issues

```bash
# Check PostgreSQL is healthy
docker-compose exec postgres pg_isready -U qor_auth

# Check connection from service
docker-compose exec qor-auth curl http://localhost:8080/health
```

### Blockchain Node Issues

**Note**: The blockchain node is excluded from default startup due to a known `librocksdb-sys` dependency conflict.

```bash
# Build node externally (recommended)
cd ../blockchain
docker build -t demiurge-node:latest .

# Or use build scripts
../scripts/build-external.ps1 -Docker

# Run node separately
docker run -d --name demiurge-node \
  -p 9944:9944 -p 9933:9933 \
  -v demiurge-node-data:/data \
  demiurge-node:latest --dev --rpc-cors all

# Check node logs
docker logs -f demiurge-node

# Check node health
curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "system_health"}' http://localhost:9933

# See BLOCKCHAIN_NODE.md for more options
```

### Hot Reload Not Working (Hub)

```bash
# Rebuild with no cache
docker-compose build --no-cache hub

# Check volume mounts
docker-compose exec hub ls -la /app/apps/hub
```

## 🔄 Development Workflow

### Typical Development Session

1. **Start services**:
   ```bash
   docker-compose --profile dev up -d
   ```

2. **Verify services**:
   ```bash
   docker-compose ps
   curl http://localhost:8080/health
   ```

3. **Develop locally**:
   - Hub: Edit files in `apps/hub/` (hot reload enabled)
   - QOR Auth: Edit files in `services/qor-auth/` (rebuild needed)
   - Blockchain: Edit files in `blockchain/` (rebuild needed)

4. **Rebuild services** (when needed):
   ```bash
   docker-compose build qor-auth
   docker-compose up -d qor-auth
   ```

5. **View logs**:
   ```bash
   docker-compose logs -f hub qor-auth
   ```

### Hot Reload

- **Hub**: Hot reload enabled via volume mounts
- **QOR Auth**: Requires rebuild (use `cargo-watch` for live reload)
- **Blockchain**: Requires rebuild (use external build for large compilations)

## 🚀 Production Deployment

For production deployment on Monad (51.210.209.112):

```bash
# Use production compose file
docker-compose -f docker-compose.production.yml up -d

# Or deploy via SSH
ssh pleroma@51.210.209.112
cd /path/to/Demiurge-Blockchain/docker
docker-compose -f docker-compose.production.yml up -d
```

See `docker-compose.production.yml` for production-specific configurations.

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Substrate Documentation](https://docs.substrate.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Axum Documentation](https://docs.rs/axum/)

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment: `docker-compose ps`
3. Check health endpoints
4. Review this README
5. Check project documentation in `../docs/`

---

**Remember**: Always build large Rust projects (blockchain node) in external terminals to avoid Cursor crashes!
