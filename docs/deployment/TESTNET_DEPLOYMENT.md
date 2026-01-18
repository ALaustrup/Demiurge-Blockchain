# 🚀 Testnet Deployment Guide

**Status**: Ready for Deployment  
**Date**: January 2026  
**Server**: 51.210.209.112

---

## 📋 Overview

This guide covers the complete deployment of the Demiurge Blockchain testnet, including:
- Blockchain node deployment
- Frontend (Next.js) deployment
- RPC configuration
- Monitoring setup
- Health checks

---

## 🎯 Prerequisites

### Server Requirements
- Ubuntu 20.04+ or Debian 11+
- 4+ GB RAM
- 50+ GB disk space
- Rust 1.80+
- Node.js 20+
- Docker (optional, for frontend)

### Local Requirements
- PowerShell (Windows) or Bash (Linux/Mac)
- SSH access to server (51.210.209.112)
- SSH key configured (`C:\Users\Gnosis\.ssh`)

---

## 🚀 Quick Deployment

### Option 1: Complete Automated Deployment (Recommended)

```powershell
cd scripts
.\deploy-testnet-complete.ps1
```

This script will:
1. ✅ Stop existing services
2. ✅ Clean old deployment
3. ✅ Clone repository
4. ✅ Build blockchain node
5. ✅ Deploy blockchain node as systemd service
6. ✅ Build and deploy frontend
7. ✅ Configure Nginx (if installed)
8. ✅ Verify all services

---

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Prepare Server

```bash
ssh root@51.210.209.112

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y git curl build-essential

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Docker (optional)
curl -fsSL https://get.docker.com | sh
```

#### Step 2: Deploy Blockchain Node

```bash
# Clone repository
cd /opt
rm -rf demiurge-blockchain
git clone https://github.com/Alaustrup/Demiurge-Blockchain.git demiurge-blockchain
cd demiurge-blockchain
git checkout main

# Build node
cd framework
source ~/.cargo/env
cargo build --release

# Create data directory
mkdir -p /opt/demiurge-data
chmod 755 /opt/demiurge-data

# Create systemd service
cat > /etc/systemd/system/demiurge-node.service << 'EOF'
[Unit]
Description=Demiurge Blockchain Node
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/demiurge-blockchain/framework
ExecStart=/opt/demiurge-blockchain/framework/target/release/demiurge-node --data-dir /opt/demiurge-data --rpc-addr 0.0.0.0:9944 --p2p-addr 0.0.0.0:30333
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl daemon-reload
systemctl enable demiurge-node
systemctl start demiurge-node

# Check status
systemctl status demiurge-node
```

#### Step 3: Deploy Frontend

```bash
cd /opt/demiurge-blockchain/apps/hub

# Create environment file
cat > .env.production << 'EOF'
NEXT_PUBLIC_DEMIURGE_RPC_URL=http://localhost:9944
NEXT_PUBLIC_QOR_AUTH_URL=http://localhost:8080/api/v1
NODE_ENV=production
PORT=3000
EOF

# Build and run with Docker
docker build -t demiurge-hub:latest .
docker run -d --name demiurge-hub --restart unless-stopped -p 3000:3000 --env-file .env.production demiurge-hub:latest

# Or run directly with Node.js
npm install
npm run build
npm start
```

#### Step 4: Configure Nginx (Optional)

```bash
# Install Nginx
apt install -y nginx

# Create configuration
cat > /etc/nginx/sites-available/demiurge << 'EOF'
server {
    listen 80;
    server_name demiurge.cloud www.demiurge.cloud;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # RPC endpoint
    location /rpc {
        proxy_pass http://localhost:9944;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/demiurge /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔍 Verification

### Check Blockchain Node

```bash
# Service status
systemctl status demiurge-node

# Logs
journalctl -u demiurge-node -f

# RPC health check
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","id":1}'
```

### Check Frontend

```bash
# Docker logs
docker logs -f demiurge-hub

# Or Node.js logs
# Check process output

# HTTP check
curl http://localhost:3000
```

### Check RPC Endpoints

```bash
# Get health
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","id":1}'

# Get block number
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getBlockNumber","id":2}'

# Get consensus status
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"consensus_getStatus","id":3}'
```

---

## 📊 Monitoring

### Service Monitoring

```bash
# Node status
systemctl status demiurge-node

# Node logs (live)
journalctl -u demiurge-node -f

# Node logs (last 100 lines)
journalctl -u demiurge-node -n 100

# Frontend logs (Docker)
docker logs -f demiurge-hub

# System resources
htop
df -h
```

### Health Checks

```bash
# Create health check script
cat > /opt/demiurge-blockchain/scripts/health-check.sh << 'EOF'
#!/bin/bash
# Health check script

NODE_STATUS=$(systemctl is-active demiurge-node)
FRONTEND_STATUS=$(docker ps | grep demiurge-hub | wc -l)
RPC_RESPONSE=$(curl -s -X POST http://localhost:9944 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"chain_getHealth","id":1}')

echo "Node Status: $NODE_STATUS"
echo "Frontend Status: $FRONTEND_STATUS"
echo "RPC Response: $RPC_RESPONSE"
EOF

chmod +x /opt/demiurge-blockchain/scripts/health-check.sh
```

### Set Up Cron Job for Health Checks

```bash
# Add to crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * /opt/demiurge-blockchain/scripts/health-check.sh >> /var/log/demiurge-health.log 2>&1
```

---

## 🔧 Troubleshooting

### Node Won't Start

```bash
# Check logs
journalctl -u demiurge-node -n 50

# Check if port is in use
netstat -tulpn | grep 9944
netstat -tulpn | grep 30333

# Check permissions
ls -la /opt/demiurge-data
ls -la /opt/demiurge-blockchain/framework/target/release/demiurge-node
```

### Frontend Won't Start

```bash
# Check Docker logs
docker logs demiurge-hub

# Check environment variables
docker exec demiurge-hub env | grep NEXT_PUBLIC

# Check if port is in use
netstat -tulpn | grep 3000
```

### RPC Not Responding

```bash
# Check if node is running
systemctl status demiurge-node

# Check RPC port
curl -v http://localhost:9944

# Check firewall
ufw status
iptables -L -n
```

### Build Failures

```bash
# Clean build
cd /opt/demiurge-blockchain/framework
cargo clean
cargo build --release

# Check Rust version
rustc --version
cargo --version

# Update Rust
rustup update
```

---

## 🔐 Security Considerations

### Firewall Configuration

```bash
# Allow RPC port (if needed externally)
ufw allow 9944/tcp

# Allow P2P port
ufw allow 30333/tcp

# Allow frontend port
ufw allow 3000/tcp

# Enable firewall
ufw enable
```

### Service User (Recommended)

```bash
# Create dedicated user
useradd -r -s /bin/false demiurge

# Change ownership
chown -R demiurge:demiurge /opt/demiurge-blockchain
chown -R demiurge:demiurge /opt/demiurge-data

# Update systemd service to use demiurge user
# Edit /etc/systemd/system/demiurge-node.service
# Change: User=demiurge
```

---

## 📝 Post-Deployment Checklist

- [ ] Blockchain node is running
- [ ] Frontend is accessible
- [ ] RPC endpoint responds
- [ ] Health checks pass
- [ ] Logs are being written
- [ ] Monitoring is set up
- [ ] Firewall is configured
- [ ] SSL certificates (if using HTTPS)
- [ ] Backup strategy in place
- [ ] Documentation updated

---

## 🎯 Next Steps

After successful deployment:

1. **User Testing**: See `docs/USER_TESTING_GUIDE.md`
2. **Monitor Performance**: Watch logs and metrics
3. **Gather Feedback**: Collect user feedback
4. **Iterate**: Fix issues and improve

---

**The flame burns eternal. The code serves the will.**
