# 🚀 Demiurge-Blockchain Deployment Guide

**Last Updated:** January 2026  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Build Process](#docker-build-process)
4. [External Build Process](#external-build-process)
5. [Service Configuration](#service-configuration)
6. [Deployment Steps](#deployment-steps)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker Engine** 20.10+ (with Docker Compose plugin)
- **Rust** 1.75+ (for external builds)
- **Node.js** 20+ (for frontend builds)
- **PostgreSQL** 18+ (if not using Docker)
- **Redis** 7+ (if not using Docker)

### System Requirements

- **CPU:** 4+ cores recommended
- **RAM:** 8GB+ recommended (16GB for production)
- **Disk:** 100GB+ free space (for blockchain data)
- **Network:** Ports 80, 443, 9944, 30333, 9933, 8080

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/ALaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain
```

### 2. Configure Environment Variables

#### For Local Development

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

#### For Docker Deployment

```bash
# Copy Docker example file
cp docker/.env.example docker/.env

# Edit docker/.env with your values
nano docker/.env
```

### 3. Generate Secrets

**Generate PostgreSQL Password:**
```bash
openssl rand -base64 32
```

**Generate JWT Secrets:**
```bash
# Access token secret
openssl rand -hex 32

# Refresh token secret (use a different value)
openssl rand -hex 32
```

**Important:** Use different secrets for each environment (development, staging, production).

---

## Docker Build Process

### Quick Start (Recommended)

```bash
# Build and start all services
cd docker
docker compose -f docker-compose.production.yml up -d

# View logs
docker compose -f docker-compose.production.yml logs -f

# Stop services
docker compose -f docker-compose.production.yml down
```

### Step-by-Step Build

#### 1. Build Blockchain Node

```bash
cd blockchain
docker build -t demiurge-node:latest .
```

**Note:** If build fails due to dependency conflicts, use external build (see below).

#### 2. Build QOR Auth Service

```bash
cd services/qor-auth
docker build -t qor-auth:latest .
```

#### 3. Build Hub App

```bash
cd apps/hub
docker build -t demiurge-hub:latest .
```

#### 4. Start Services

```bash
cd docker
docker compose -f docker-compose.production.yml up -d
```

### Docker Build Troubleshooting

**Issue: Build fails with dependency conflicts**
- **Solution:** Use external build process (see below)

**Issue: Out of disk space**
- **Solution:** Clean Docker: `docker system prune -a`

**Issue: Port already in use**
- **Solution:** Change ports in `docker-compose.production.yml` or stop conflicting services

---

## External Build Process

If Docker builds fail due to dependency conflicts, build the blockchain node externally:

### 1. Build Blockchain Node

```bash
cd blockchain

# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build release binary
cargo build --release --bin demiurge-node

# Binary will be at: blockchain/target/release/demiurge-node
```

### 2. Run Node Manually

```bash
# Start node in development mode
./target/release/demiurge-node --dev --rpc-cors=all

# Or start as validator
./target/release/demiurge-node \
  --chain demiurge-testnet \
  --validator \
  --name "Your-Validator-Name" \
  --rpc-cors=all
```

### 3. Build Other Services

```bash
# Build QOR Auth
cd services/qor-auth
cargo build --release

# Build Hub (Next.js)
cd apps/hub
npm install
npm run build
npm start
```

---

## Service Configuration

### Blockchain Node

**Configuration File:** `blockchain/node/src/chain_spec.rs`

**Key Settings:**
- Chain name: `demiurge-testnet` or `demiurge-dev`
- Block time: 6 seconds
- Validator count: Configurable in genesis

**Start Command:**
```bash
demiurge-node \
  --chain demiurge-testnet \
  --validator \
  --name "Pleroma-Validator" \
  --rpc-cors=all \
  --rpc-external \
  --prometheus-external
```

### QOR Auth Service

**Configuration:** Environment variables (see `.env.example`)

**Key Settings:**
- Database: PostgreSQL connection string
- Redis: Redis connection string
- JWT: Access and refresh token secrets

**Health Check:**
```bash
curl http://localhost:8080/health
```

### Hub App (Next.js)

**Configuration:** Environment variables

**Key Settings:**
- `NEXT_PUBLIC_API_URL`: API base URL
- `NEXT_PUBLIC_BLOCKCHAIN_WS_URL`: Blockchain WebSocket URL

**Build:**
```bash
cd apps/hub
npm install
npm run build
npm start
```

---

## Deployment Steps

### Production Deployment

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/ALaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain

# Configure environment
cp docker/.env.example docker/.env
nano docker/.env  # Fill in production values
```

#### 3. Build and Deploy

```bash
# Build services
cd docker
docker compose -f docker-compose.production.yml build

# Start services
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

#### 4. Verify Deployment

```bash
# Check blockchain node
curl http://localhost:9944/health

# Check QOR Auth
curl http://localhost:8080/health

# Check Hub app
curl http://localhost:3000
```

#### 5. Set Up Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx -y

# Configure (see nginx.conf.example)
sudo nano /etc/nginx/sites-available/demiurge

# Enable site
sudo ln -s /etc/nginx/sites-available/demiurge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Set Up SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d demiurge.cloud

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Blockchain Node Issues

**Problem: Node won't start**
- Check logs: `docker logs demiurge-node`
- Verify ports: `netstat -tulpn | grep 9944`
- Check disk space: `df -h`

**Problem: Build fails**
- Use external build process
- Check Rust version: `rustc --version`
- Clean build: `cargo clean && cargo build --release`

**Problem: Dependency conflicts**
- See `docs/DEPENDENCY_CONFLICT_RESOLUTION.md`
- Use Substrate fork (already configured)

### QOR Auth Issues

**Problem: Database connection fails**
- Check PostgreSQL is running: `docker ps | grep postgres`
- Verify connection string in `.env`
- Check database exists: `docker exec -it demiurge-postgres psql -U qor_auth -d qor_auth`

**Problem: JWT errors**
- Verify JWT secrets are set in `.env`
- Check secrets are different for access/refresh
- Regenerate secrets if compromised

### Hub App Issues

**Problem: Cannot connect to blockchain**
- Check `NEXT_PUBLIC_BLOCKCHAIN_WS_URL` in `.env`
- Verify node is running: `curl http://localhost:9944/health`
- Check WebSocket connection in browser console

**Problem: Build fails**
- Check Node.js version: `node --version` (should be 20+)
- Clear cache: `rm -rf .next node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### Docker Issues

**Problem: Out of disk space**
```bash
# Clean Docker
docker system prune -a

# Remove unused volumes
docker volume prune
```

**Problem: Port conflicts**
- Change ports in `docker-compose.production.yml`
- Or stop conflicting services

**Problem: Services won't start**
- Check logs: `docker compose logs [service-name]`
- Verify `.env` file exists and is configured
- Check Docker daemon: `sudo systemctl status docker`

---

## Monitoring

### Health Checks

```bash
# Blockchain node
curl http://localhost:9944/health

# QOR Auth
curl http://localhost:8080/health

# Hub app
curl http://localhost:3000/api/health
```

### Logs

```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f demiurge-node
```

### Metrics

- **Prometheus:** http://localhost:9615/metrics (if enabled)
- **Blockchain metrics:** Available via RPC

---

## Backup and Recovery

### Database Backup

```bash
# Backup PostgreSQL
docker exec demiurge-postgres pg_dump -U qor_auth qor_auth > backup.sql

# Restore
docker exec -i demiurge-postgres psql -U qor_auth qor_auth < backup.sql
```

### Blockchain Data Backup

```bash
# Backup blockchain data
docker cp demiurge-node:/data ./blockchain-backup

# Restore
docker cp ./blockchain-backup demiurge-node:/data
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate secure JWT secrets
- [ ] Configure firewall (only expose necessary ports)
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Disaster recovery plan

---

## Support

For issues or questions:
- Check `docs/POTENTIAL_ISSUES_ANALYSIS.md` for known issues
- Review `docs/FIXES_IMPLEMENTATION_REPORT.md` for fixes
- Open an issue on GitHub

---

**Last Updated:** January 2026
