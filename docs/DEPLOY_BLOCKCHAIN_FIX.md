# Deploy Blockchain Connection Fix

**Date:** January 17, 2026  
**Status:** Ready for deployment

---

## 🚀 Quick Deployment

### Option 1: Using Deployment Script (Recommended)

1. **Copy files to server:**
   ```bash
   # From your local machine
   scp docker/nginx.conf ubuntu@51.210.209.112:/tmp/nginx.conf
   scp apps/hub/src/lib/blockchain.ts ubuntu@51.210.209.112:/tmp/blockchain.ts
   scp scripts/deploy-blockchain-fix.sh ubuntu@51.210.209.112:/tmp/deploy-blockchain-fix.sh
   ```

2. **SSH to server and run script:**
   ```bash
   ssh ubuntu@51.210.209.112
   sudo bash /tmp/deploy-blockchain-fix.sh
   ```

### Option 2: Manual Deployment

1. **SSH to server:**
   ```bash
   ssh ubuntu@51.210.209.112
   cd /data/Demiurge-Blockchain
   ```

2. **Copy updated files:**
   ```bash
   # Copy nginx.conf (if you uploaded it)
   cp /tmp/nginx.conf docker/nginx.conf
   
   # Copy blockchain.ts (if you uploaded it)
   cp /tmp/blockchain.ts apps/hub/src/lib/blockchain.ts
   ```

3. **Test Nginx configuration:**
   ```bash
   docker compose -f docker/docker-compose.production.yml exec nginx nginx -t
   ```

4. **Restart Nginx:**
   ```bash
   docker compose -f docker/docker-compose.production.yml restart nginx
   ```

5. **Check/Start blockchain node:**
   ```bash
   # Check if running
   docker ps --filter 'name=demiurge-node'
   
   # If not running, start it
   docker compose -f docker/docker-compose.production.yml up -d demiurge-node
   ```

6. **Rebuild and restart Hub:**
   ```bash
   docker compose -f docker/docker-compose.production.yml build hub
   docker compose -f docker/docker-compose.production.yml up -d hub
   ```

---

## ✅ Verification

### 1. Check Service Status
```bash
docker compose -f docker/docker-compose.production.yml ps
```

Expected output:
- `demiurge-nginx`: Up
- `demiurge-hub`: Up
- `demiurge-node`: Up

### 2. Check Nginx Logs
```bash
docker logs demiurge-nginx --tail 50
```

Look for:
- No configuration errors
- WebSocket upgrade headers in access logs

### 3. Check Blockchain Node Logs
```bash
docker logs demiurge-node --tail 50
```

Look for:
- Node started successfully
- Listening on port 9944
- No errors

### 4. Test WebSocket Connection
```bash
# Test WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://demiurge.cloud/rpc
```

Expected: HTTP 101 Switching Protocols

### 5. Browser Testing
1. Visit: `https://demiurge.cloud`
2. Open browser console (F12)
3. Look for `[Blockchain]` logs:
   - `[Blockchain] WebSocket connected`
   - `[Blockchain] Successfully connected to Demiurge blockchain at wss://demiurge.cloud/rpc`
4. Verify blockchain status banner disappears

---

## 🔧 Troubleshooting

### Nginx Configuration Error
If Nginx fails to start:
```bash
# Check configuration
docker compose -f docker/docker-compose.production.yml exec nginx nginx -t

# View error logs
docker logs demiurge-nginx --tail 100
```

### Blockchain Node Not Starting
```bash
# Check node logs
docker logs demiurge-node --tail 100

# Check if port 9944 is available
netstat -tuln | grep 9944

# Restart node
docker compose -f docker/docker-compose.production.yml restart demiurge-node
```

### WebSocket Connection Fails
1. **Check Nginx proxy:**
   ```bash
   docker logs demiurge-nginx | grep rpc
   ```

2. **Verify upstream:**
   ```bash
   docker network inspect demiurge-network | grep demiurge-node
   ```

3. **Test direct connection (from server):**
   ```bash
   curl http://demiurge-node:9944
   ```

### Hub Not Connecting
1. **Check Hub logs:**
   ```bash
   docker logs demiurge-hub --tail 100
   ```

2. **Verify environment variables:**
   ```bash
   docker compose -f docker/docker-compose.production.yml exec hub env | grep BLOCKCHAIN
   ```

3. **Rebuild Hub:**
   ```bash
   docker compose -f docker/docker-compose.production.yml build --no-cache hub
   docker compose -f docker/docker-compose.production.yml up -d hub
   ```

---

## 📋 Files Changed

- `docker/nginx.conf` - Enabled WebSocket proxy for `/rpc`
- `apps/hub/src/lib/blockchain.ts` - Updated to use `wss://demiurge.cloud/rpc`

---

## 🔄 Rollback

If something goes wrong:

```bash
cd /data/Demiurge-Blockchain

# Restore nginx.conf backup
cp docker/nginx.conf.backup.* docker/nginx.conf

# Restart Nginx
docker compose -f docker/docker-compose.production.yml restart nginx

# Revert blockchain.ts (if you have a backup)
git checkout apps/hub/src/lib/blockchain.ts

# Rebuild Hub
docker compose -f docker/docker-compose.production.yml build hub
docker compose -f docker/docker-compose.production.yml up -d hub
```

---

**Status:** Ready for deployment  
**Next Step:** Run deployment script or follow manual steps above
