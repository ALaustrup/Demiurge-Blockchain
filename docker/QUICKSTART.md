# 🚀 Quick Start Guide

Get up and running with Demiurge Docker development environment in 5 minutes.

## Prerequisites Check

```bash
# Check Docker version (24.0+ required)
docker --version

# Check Docker Compose version (2.20+ required)
docker-compose --version
```

## Step 1: Setup Environment

```bash
cd docker

# Copy environment file (if .env doesn't exist)
cp .env.example .env

# Edit .env if needed (defaults work for local dev)
# Windows: notepad .env
# Linux/Mac: nano .env
```

## Step 2: Start Services

### Option A: Basic Setup (Core Services Only)

```bash
docker-compose up -d
```

### Option B: With Development Tools (Recommended)

```bash
# Windows PowerShell
docker-compose --profile dev up -d

# Linux/Mac/Bash
docker-compose --profile dev up -d
```

### Option C: Using Helper Scripts

```bash
# Windows PowerShell
.\scripts\docker-dev.ps1 up -DevTools

# Linux/Mac/Bash
./scripts/docker-dev.sh up --dev-tools
```

## Step 3: Verify Services

```bash
# Check status
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoints
curl http://localhost:8080/health  # QOR Auth
curl http://localhost:3000         # Hub
```

## Step 4: Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Hub** | http://localhost:3000 | - |
| **QOR Auth API** | http://localhost:8080 | - |
| **Adminer** | http://localhost:8081 | Server: `postgres`, User: `qor_auth`, Password: from `.env` |
| **Redis Commander** | http://localhost:8082 | User/Password: from `.env` |

**Note**: Blockchain node is excluded from default startup due to a known dependency conflict. See [BLOCKCHAIN_NODE.md](./BLOCKCHAIN_NODE.md) for options.

## Common Commands

```bash
# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Stop all
docker-compose down

# Rebuild service
docker-compose build [service]
docker-compose up -d [service]
```

## Next Steps

1. **Read the full documentation**: See [README.md](./README.md)
2. **Configure your IDE**: Set up environment variables for local development
3. **Start developing**: Edit code in `apps/hub/` or `services/qor-auth/`
4. **Check blockchain**: Connect to `ws://localhost:9944` with Polkadot.js

## Troubleshooting

### Port Already in Use

Edit `.env` and change the port:
```env
POSTGRES_PORT=5433  # Instead of 5432
HUB_PORT=3001       # Instead of 3000
```

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check Docker resources
docker system df

# Clear Docker build cache (if Dockerfile changes aren't being picked up)
docker builder prune -f

# Restart Docker Desktop (Windows/Mac)
```

### QOR Auth Build Fails

If you see Rust edition 2024 errors, clear Docker cache:

```bash
# Clear build cache
docker builder prune -f

# Rebuild qor-auth
docker-compose build --no-cache qor-auth
docker-compose up -d qor-auth
```

### Database Connection Issues

```bash
# Check PostgreSQL is ready
docker-compose exec postgres pg_isready -U qor_auth

# Check QOR Auth logs
docker-compose logs qor-auth
```

## Need Help?

- Full documentation: [README.md](./README.md)
- Project docs: `../docs/`
- Docker Compose docs: https://docs.docker.com/compose/

---

**Happy coding! 🎭**
