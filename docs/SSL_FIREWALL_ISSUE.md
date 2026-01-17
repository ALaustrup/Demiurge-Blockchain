# SSL Certificate Setup - Firewall Issue

**Date:** January 17, 2026  
**Issue:** Certbot cannot obtain SSL certificates due to firewall blocking port 80

---

## 🔴 Current Issue

Certbot is failing with:
```
Timeout during connect (likely firewall problem)
```

This indicates that Let's Encrypt cannot reach port 80 on the server to validate domain ownership.

---

## 🔧 Solutions

### Option 1: Configure OVH Firewall (Recommended)

Since this is an OVH server, you need to configure the firewall in OVH Manager:

1. **Log into OVH Manager**
2. **Go to:** Dedicated Servers → Your Server → Firewall
3. **Add Rules:**
   - Port 80 (HTTP) - Allow from Anywhere
   - Port 443 (HTTPS) - Allow from Anywhere
4. **Apply changes**

### Option 2: Use DNS-01 Challenge (Alternative)

If port 80 cannot be opened, use DNS validation instead:

```bash
sudo certbot certonly --manual --preferred-challenges dns \
    -d demiurge.cloud \
    -d www.demiurge.cloud \
    --email admin@demiurge.cloud \
    --agree-tos
```

This will require adding TXT records to DNS for validation.

### Option 3: Temporary Port 80 Access

If you can temporarily open port 80:

1. **Configure OVH Firewall** to allow port 80
2. **Run Certbot** again
3. **After certificates are obtained**, you can restrict port 80 if desired (Nginx will handle HTTPS on 443)

---

## 📋 Current Status

- ✅ **DNS Configured:** demiurge.cloud → 51.210.209.112
- ✅ **UFW Firewall:** Ports 80/443 allowed locally
- ❌ **OVH Firewall:** Needs configuration (likely blocking port 80)
- ❌ **Certificates:** Not obtained yet

---

## 🚀 Next Steps

1. **Configure OVH Firewall** to allow ports 80 and 443
2. **Re-run Certbot:**
   ```bash
   sudo certbot certonly --standalone \
       --preferred-challenges http \
       -d demiurge.cloud \
       -d www.demiurge.cloud \
       --email admin@demiurge.cloud \
       --agree-tos \
       --non-interactive
   ```
3. **Copy certificates:**
   ```bash
   sudo cp /etc/letsencrypt/live/demiurge.cloud/fullchain.pem /etc/nginx/ssl/demiurge.cloud/
   sudo cp /etc/letsencrypt/live/demiurge.cloud/privkey.pem /etc/nginx/ssl/demiurge.cloud/
   ```
4. **Start Nginx:**
   ```bash
   cd /data/Demiurge-Blockchain
   docker compose -f docker/docker-compose.production.yml up -d nginx
   ```

---

**Status:** Waiting for OVH firewall configuration to allow port 80 access
