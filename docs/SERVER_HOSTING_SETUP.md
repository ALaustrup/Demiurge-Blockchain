# Server Hosting Setup - Demiurge.Cloud & Demiurge.Guru

## Overview

Complete guide for configuring the Monad server (Pleroma) to host the Demiurge Hub website with HTTPS for both domains.

## Prerequisites

- ✅ Docker & Docker Compose installed
- ✅ Nginx installed
- ✅ Certbot installed
- ✅ DNS records configured (A records pointing to 51.210.209.112)

## DNS Configuration

Ensure these DNS records are configured:

```
demiurge.cloud        A    51.210.209.112
www.demiurge.cloud     A    51.210.209.112
demiurge.guru         A    51.210.209.112
www.demiurge.guru      A    51.210.209.112
```

## Step 1: SSL Certificate Setup

### Option A: Automated Script (Recommended)

```bash
ssh pleroma
sudo bash /tmp/setup-ssl-domains.sh
```

The script will:
1. Check DNS configuration
2. Obtain Let's Encrypt certificates for both domains
3. Copy certificates to Nginx SSL directory
4. Set up auto-renewal

### Option B: Manual Setup

```bash
# Stop Nginx
sudo systemctl stop nginx

# Obtain certificates
sudo certbot certonly --standalone \
    -d demiurge.cloud -d www.demiurge.cloud \
    --email admin@demiurge.cloud --agree-tos --non-interactive

sudo certbot certonly --standalone \
    -d demiurge.guru -d www.demiurge.guru \
    --email admin@demiurge.cloud --agree-tos --non-interactive

# Copy certificates
sudo mkdir -p /etc/nginx/ssl/demiurge.cloud
sudo mkdir -p /etc/nginx/ssl/demiurge.guru
sudo cp /etc/letsencrypt/live/demiurge.cloud/fullchain.pem /etc/nginx/ssl/demiurge.cloud/
sudo cp /etc/letsencrypt/live/demiurge.cloud/privkey.pem /etc/nginx/ssl/demiurge.cloud/
sudo cp /etc/letsencrypt/live/demiurge.guru/fullchain.pem /etc/nginx/ssl/demiurge.guru/
sudo cp /etc/letsencrypt/live/demiurge.guru/privkey.pem /etc/nginx/ssl/demiurge.guru/
```

## Step 2: Build Hub App

```bash
ssh pleroma
cd /data/Demiurge-Blockchain

# Build Hub app
docker compose -f docker/docker-compose.production.yml build hub
```

## Step 3: Start Services

```bash
cd /data/Demiurge-Blockchain
docker compose -f docker/docker-compose.production.yml up -d
```

## Step 4: Verify Configuration

### Test SSL Certificates

```bash
# Test HTTPS
curl -I https://demiurge.cloud
curl -I https://demiurge.guru

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=demiurge.cloud
```

### Test Nginx Config

```bash
# Test Nginx configuration
docker exec demiurge-nginx nginx -t

# Check logs
docker compose -f docker/docker-compose.production.yml logs nginx
```

## Step 5: Verify Games Loading

### Check Game Files

```bash
ssh pleroma
ls -la /data/Demiurge-Blockchain/apps/hub/public/games/
```

### Test Game Access

```bash
# Via HTTPS
curl -I https://demiurge.cloud/games/galaga-creator/

# Check if index.html exists
ls -la /data/Demiurge-Blockchain/apps/hub/public/games/galaga-creator/index.html
```

## Nginx Configuration

The Nginx config (`docker/nginx.conf`) includes:

- **HTTP to HTTPS redirect** for both domains
- **SSL/TLS configuration** with modern protocols
- **Security headers** (HSTS, X-Frame-Options, etc.)
- **Rate limiting** for API endpoints
- **Game file serving** from `/var/www/games/`
- **Proxy to Hub app** (Next.js)
- **Proxy to QOR Auth** API
- **WebSocket support** for blockchain RPC

## Domain Routing

### Demiurge.Cloud (Primary)
- Main Hub application
- Game hosting
- API endpoints
- Blockchain RPC

### Demiurge.Guru (Secondary)
- Currently mirrors .cloud
- Can be configured for:
  - Documentation site
  - Community portal
  - Developer resources
  - Or redirect to .cloud

## Troubleshooting

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check auto-renewal
sudo systemctl status certbot.timer
```

### Nginx Not Starting

```bash
# Check config syntax
docker exec demiurge-nginx nginx -t

# Check logs
docker compose -f docker/docker-compose.production.yml logs nginx

# Verify ports
sudo netstat -tulpn | grep -E '80|443'
```

### Games Not Loading

```bash
# Check game files exist
ls -la /data/Demiurge-Blockchain/apps/hub/public/games/*/index.html

# Check Nginx can access files
docker exec demiurge-nginx ls -la /var/www/games/

# Check Hub app logs
docker compose -f docker/docker-compose.production.yml logs hub
```

### DNS Issues

```bash
# Verify DNS resolution
dig demiurge.cloud
dig demiurge.guru

# Check from server
curl -I http://demiurge.cloud
```

## Auto-Renewal Setup

Certificates auto-renew via systemd timer. The renewal hook automatically copies certificates and restarts Nginx:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## Security Checklist

- [x] HTTPS enforced (HTTP → HTTPS redirect)
- [x] Modern TLS protocols (1.2, 1.3)
- [x] Security headers configured
- [x] Rate limiting enabled
- [x] Auto-renewal configured
- [ ] Firewall rules configured (if needed)
- [ ] DDoS protection (consider Cloudflare)

## Monitoring

### Check Service Status

```bash
docker compose -f docker/docker-compose.production.yml ps
```

### Monitor Logs

```bash
# All services
docker compose -f docker/docker-compose.production.yml logs -f

# Specific service
docker compose -f docker/docker-compose.production.yml logs -f nginx
docker compose -f docker/docker-compose.production.yml logs -f hub
```

### Check SSL Expiry

```bash
sudo certbot certificates
```

---

**Status**: Ready for SSL certificate setup  
**Next**: Run SSL setup script after DNS is configured
