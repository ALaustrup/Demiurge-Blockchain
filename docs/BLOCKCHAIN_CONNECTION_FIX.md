# Blockchain Connection Fix

**Date:** January 17, 2026  
**Issue:** Blockchain connection banner showing "Unable to connect to Monad (Pleroma)"

---

## 🔧 Root Cause

The blockchain node WebSocket proxy was disabled in Nginx, and the frontend was trying to connect directly to the node's IP address instead of going through the Nginx reverse proxy.

---

## ✅ Fixes Applied

### 1. Enabled Nginx WebSocket Proxy ✅
- **File:** `docker/nginx.conf`
- **Changes:**
  - Uncommented `upstream demiurge-node` block
  - Enabled `/rpc` location block with WebSocket proxying
  - Added proper WebSocket headers (`Upgrade`, `Connection: upgrade`)
  - Set long timeouts for WebSocket connections (86400 seconds)

### 2. Updated Frontend to Use Nginx Proxy ✅
- **File:** `apps/hub/src/lib/blockchain.ts`
- **Changes:**
  - Changed connection URL from `ws://51.210.209.112:9944` to `wss://demiurge.cloud/rpc`
  - Uses secure WebSocket (WSS) through Nginx proxy
  - Improved error handling and connection status detection
  - Added connection timeout (10 seconds)
  - Added better logging for debugging

---

## 📋 Changes Summary

### File: `docker/nginx.conf`
```nginx
# Enabled upstream
upstream demiurge-node {
    server demiurge-node:9944;
}

# Enabled WebSocket proxy
location /rpc {
    proxy_pass http://demiurge-node;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

### File: `apps/hub/src/lib/blockchain.ts`
```typescript
// Changed from:
return 'ws://51.210.209.112:9944';

// To:
return 'wss://demiurge.cloud/rpc';
```

---

## 🚀 Deployment Steps

### 1. Restart Nginx
```bash
cd /data/Demiurge-Blockchain
docker compose -f docker/docker-compose.production.yml restart nginx
```

### 2. Verify Blockchain Node is Running
```bash
docker ps --filter 'name=demiurge-node'
docker logs demiurge-node --tail 50
```

### 3. If Node is Not Running, Start It
```bash
cd /data/Demiurge-Blockchain
docker compose -f docker/docker-compose.production.yml up -d demiurge-node
```

### 4. Test WebSocket Connection
```bash
# Test WebSocket endpoint through Nginx
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://demiurge.cloud/rpc
```

### 5. Rebuild Hub (if needed)
```bash
cd /data/Demiurge-Blockchain
docker compose -f docker/docker-compose.production.yml build hub
docker compose -f docker/docker-compose.production.yml up -d hub
```

---

## 🧪 Testing

**Steps:**
1. Visit: `https://demiurge.cloud`
2. Check browser console for blockchain connection logs
3. Verify blockchain status banner disappears after connection
4. Test blockchain features (balance queries, etc.)

**Expected Behavior:**
- ✅ WebSocket connects to `wss://demiurge.cloud/rpc`
- ✅ Connection established successfully
- ✅ Blockchain status banner disappears
- ✅ No connection errors in console

---

## 🔍 Troubleshooting

### Node Not Running
If the blockchain node container is not running:
```bash
docker compose -f docker/docker-compose.production.yml up -d demiurge-node
docker logs demiurge-node --follow
```

### WebSocket Connection Fails
Check Nginx logs:
```bash
docker logs demiurge-nginx --tail 100
```

Verify Nginx configuration:
```bash
docker exec demiurge-nginx nginx -t
```

### Port 9944 Not Accessible
The node should be accessible within Docker network. Verify:
```bash
docker network inspect demiurge-network | grep demiurge-node
```

---

## 📝 Notes

- **WebSocket Protocol:** Using `wss://` (secure WebSocket) through Nginx
- **Connection Timeout:** 10 seconds for initial connection
- **WebSocket Timeout:** 86400 seconds (24 hours) for long-lived connections
- **Error Handling:** Connection failures are logged but don't crash the app

---

**Status:** Configuration updated. Ready for deployment and testing.

**Next Steps:** 
1. Deploy Nginx configuration
2. Verify blockchain node is running
3. Test connection in browser
