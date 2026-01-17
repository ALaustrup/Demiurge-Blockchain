# ✅ Docker Setup Complete

Your Docker development environment for Demiurge-Blockchain has been configured with the following components:

## 📦 What Was Created

### Core Docker Files
- ✅ `docker-compose.yml` - Main development compose file with all services
- ✅ `.env` - Environment configuration file
- ✅ `.env.example` - Example environment file template
- ✅ `.dockerignore` - Optimized build context exclusions

### Service Dockerfiles
- ✅ `services/qor-auth/Dockerfile` - QOR Auth service (Rust/Axum)
- ✅ `apps/hub/Dockerfile.dev` - Next.js Hub development Dockerfile

### Documentation
- ✅ `README.md` - Comprehensive Docker documentation
- ✅ `QUICKSTART.md` - Quick start guide
- ✅ `docker-compose.override.yml.example` - Override file template

### Helper Scripts
- ✅ `scripts/docker-dev.ps1` - PowerShell helper script (Windows)
- ✅ `scripts/docker-dev.sh` - Bash helper script (Linux/Mac/WSL)

## 🏗️ Architecture

### Services Configured

1. **PostgreSQL 18** (`demiurge-postgres`)
   - Database for QOR Auth
   - Auto-migrations on startup
   - Persistent volume

2. **Redis 7.4** (`demiurge-redis`)
   - Session cache
   - AOF persistence
   - LRU eviction

3. **QOR Auth** (`demiurge-qor-auth`)
   - Rust/Axum authentication service
   - JWT + refresh tokens
   - QOR ID system

4. **Next.js Hub** (`demiurge-hub`)
   - Development mode with hot reload
   - Workspace-aware builds
   - Source code mounted for live editing

5. **Demiurge Blockchain Node** (`demiurge-node`)
   - Substrate development node
   - WebSocket + HTTP RPC
   - Prometheus metrics

6. **Adminer** (`demiurge-adminer`) - dev profile
   - Database administration UI

7. **Redis Commander** (`demiurge-redis-commander`) - dev profile
   - Redis administration UI

### Naming Convention

All components follow `demiurge-{service}` naming:
- **Containers**: `demiurge-postgres`, `demiurge-redis`, etc.
- **Volumes**: `demiurge-postgres-data`, `demiurge-redis-data`, etc.
- **Network**: `demiurge-network`

This aligns with production server naming (Monad/Pleroma).

## 🚀 Next Steps

### 1. Start Services

```bash
cd docker

# Basic setup
docker-compose up -d

# With development tools
docker-compose --profile dev up -d
```

### 2. Verify Everything Works

```bash
# Check status
docker-compose ps

# Check health
curl http://localhost:8080/health  # QOR Auth
curl http://localhost:3000         # Hub
```

### 3. Access Services

- **Hub**: http://localhost:3000
- **QOR Auth API**: http://localhost:8080
- **Adminer**: http://localhost:8081 (dev profile)
- **Redis Commander**: http://localhost:8082 (dev profile)
- **Blockchain WS**: ws://localhost:9944
- **Blockchain RPC**: http://localhost:9933

### 4. Start Developing

- Edit `apps/hub/` - Hot reload enabled
- Edit `services/qor-auth/` - Rebuild needed
- Edit `blockchain/` - Rebuild needed (use external terminal)

## 📚 Documentation

- **Quick Start**: See [QUICKSTART.md](./QUICKSTART.md)
- **Full Documentation**: See [README.md](./README.md)
- **Project Docs**: See `../docs/`

## 🔧 Helper Scripts

### Windows PowerShell

```powershell
.\scripts\docker-dev.ps1 up -DevTools
.\scripts\docker-dev.ps1 logs hub -Follow
.\scripts\docker-dev.ps1 restart qor-auth
```

### Linux/Mac/Bash

```bash
./scripts/docker-dev.sh up --dev-tools
./scripts/docker-dev.sh logs hub --follow
./scripts/docker-dev.sh restart qor-auth
```

## ⚙️ Configuration

### Environment Variables

Edit `docker/.env` to customize:
- Ports
- Passwords/secrets
- Node name
- Logging levels

### Override File

Create `docker-compose.override.yml` for local customizations:
```bash
cp docker-compose.override.yml.example docker-compose.override.yml
```

## 🎯 Key Features

✅ **Hot Reload** - Hub supports live code editing  
✅ **Development Tools** - Adminer and Redis Commander available  
✅ **Health Checks** - All services have health monitoring  
✅ **Persistent Data** - Volumes for PostgreSQL, Redis, and blockchain  
✅ **Workspace Support** - Proper npm workspace handling  
✅ **Production Ready** - Separate production compose file  
✅ **Naming Alignment** - Consistent with Monad/Pleroma server  

## 🐛 Troubleshooting

If you encounter issues:

1. Check logs: `docker-compose logs -f [service]`
2. Verify status: `docker-compose ps`
3. Check health endpoints
4. Review [README.md](./README.md) troubleshooting section
5. Ensure Docker has enough resources (4GB+ RAM recommended)

## 📝 Notes

- **Blockchain builds**: Always build large Rust projects in external terminals
- **Port conflicts**: Edit `.env` to change ports if needed
- **Data persistence**: Volumes are created automatically
- **Production**: Use `docker-compose.production.yml` for Monad server

---

**Setup complete! Happy coding! 🎭**

For questions or issues, refer to the documentation or check the project's main README.
