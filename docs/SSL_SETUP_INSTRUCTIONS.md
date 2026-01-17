# SSL Setup Instructions

**Date:** January 17, 2026  
**Status:** Script ready, waiting for DNS configuration

---

## ⚠️ Prerequisites

Before running the SSL setup script, **DNS records must be configured**:

### Required DNS A Records

Point these domains to your server IP: **51.210.209.112**

- `demiurge.cloud` → 51.210.209.112
- `www.demiurge.cloud` → 51.210.209.112  
- `demiurge.guru` → 51.210.209.112
- `www.demiurge.guru` → 51.210.209.112

### Verify DNS Configuration

```bash
# Check if DNS is configured
dig +short demiurge.cloud A
dig +short www.demiurge.cloud A
dig +short demiurge.guru A
dig +short www.demiurge.guru A

# All should return: 51.210.209.112
```

---

## 🚀 Running SSL Setup

### Option 1: Interactive (Recommended)

SSH into the server and run interactively:

```bash
ssh pleroma
sudo bash /tmp/setup-ssl-domains.sh
```

The script will:
1. Check prerequisites
2. Show DNS requirements
3. Wait for you to confirm DNS is configured (press Enter)
4. Create directories
5. Stop Nginx temporarily
6. Obtain SSL certificates from Let's Encrypt
7. Copy certificates to Nginx SSL directory
8. Set up auto-renewal

### Option 2: Non-Interactive (After DNS is Ready)

If DNS is already configured, you can modify the script to skip the prompt:

```bash
ssh pleroma
# Edit script to remove the 'read' line
sudo sed -i '/read -p/d' /tmp/setup-ssl-domains.sh
sudo bash /tmp/setup-ssl-domains.sh
```

---

## 📋 What the Script Does

1. **Creates directories:**
   - `/etc/nginx/ssl/demiurge.cloud/`
   - `/etc/nginx/ssl/demiurge.guru/`
   - `/var/www/certbot/`

2. **Stops Nginx** (temporarily, for Certbot standalone mode)

3. **Obtains SSL certificates:**
   - Uses Certbot standalone mode
   - Requests certificates for both domains
   - Includes www subdomains

4. **Copies certificates:**
   - `fullchain.pem` → SSL certificate chain
   - `privkey.pem` → Private key

5. **Sets up auto-renewal:**
   - Enables Certbot timer
   - Creates renewal hook to reload Nginx

---

## ✅ After SSL Setup

Once certificates are obtained:

1. **Start Nginx:**
   ```bash
   cd /data/Demiurge-Blockchain
   docker compose -f docker/docker-compose.production.yml up -d nginx
   ```

2. **Test SSL:**
   ```bash
   curl -I https://demiurge.cloud
   curl -I https://demiurge.guru
   ```

3. **Verify in browser:**
   - Visit: `https://demiurge.cloud`
   - Visit: `https://demiurge.guru`
   - Check SSL rating: https://www.ssllabs.com/ssltest/

---

## 🔧 Troubleshooting

### DNS Not Configured

If DNS records aren't set up, Certbot will fail with:
```
Failed to obtain certificate for demiurge.cloud
```

**Solution:** Configure DNS records first, then retry.

### Port 80 Already in Use

If port 80 is already in use (by Docker Nginx), the script will stop it temporarily.

**Solution:** The script handles this automatically.

### Certificate Already Exists

If certificates already exist, Certbot will skip creation.

**Solution:** This is fine - certificates will be renewed automatically.

---

## 📝 Notes

- **Email:** Certificates are registered to `admin@demiurge.cloud`
- **Auto-renewal:** Certificates renew automatically every 90 days
- **Renewal hook:** Automatically reloads Nginx after renewal
- **Standalone mode:** Certbot uses standalone mode (requires port 80 free)

---

**Status:** Script ready at `/tmp/setup-ssl-domains.sh`  
**Next Step:** Configure DNS records, then run the script interactively
