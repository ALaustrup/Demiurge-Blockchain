# QOR Auth Service - Production Deployment Guide

The QOR Auth service runs continuously on the production server (`51.210.209.112`) to handle all authentication and QOR ID management.

## Quick Start

### 1. Deploy to Server

**Windows (PowerShell):**
```powershell
cd scripts
.\deploy-qor-auth.ps1
```

**Linux/Mac/Git Bash/WSL:**
```bash
cd scripts
chmod +x deploy-qor-auth.sh
./deploy-qor-auth.sh
```

**Note:** For Windows users, see [WINDOWS_DEPLOYMENT.md](./WINDOWS_DEPLOYMENT.md) for detailed instructions.

This will:
- Build the Rust service
- Upload it to the server
- Install it as a systemd service
- Set up the service directory

### 2. Configure Environment

SSH into the server:

```bash
ssh ubuntu@51.210.209.112
```

Edit the environment file:

```bash
sudo nano /opt/demiurge/qor-auth/.env
```

**Required Configuration:**

```env
RUN_ENV=production

# Server
QOR_AUTH__SERVER__HOST=0.0.0.0
QOR_AUTH__SERVER__PORT=8080

# Database (PostgreSQL)
QOR_AUTH__DATABASE__URL=postgres://qor_auth:YOUR_PASSWORD@localhost:5432/qor_auth
QOR_AUTH__DATABASE__MAX_CONNECTIONS=20

# Redis
QOR_AUTH__REDIS__URL=redis://localhost:6379

# JWT Secrets (GENERATE SECURE RANDOM STRINGS!)
QOR_AUTH__JWT__ACCESS_SECRET=GENERATE_SECURE_RANDOM_STRING_HERE
QOR_AUTH__JWT__REFRESH_SECRET=GENERATE_SECURE_RANDOM_STRING_HERE
QOR_AUTH__JWT__ACCESS_EXPIRY_SECS=900
QOR_AUTH__JWT__REFRESH_EXPIRY_SECS=2592000
QOR_AUTH__JWT__ISSUER=qor-auth

# Security
QOR_AUTH__SECURITY__MAX_LOGIN_ATTEMPTS=5
QOR_AUTH__SECURITY__LOCKOUT_DURATION_SECS=900
QOR_AUTH__SECURITY__MAX_SESSIONS=10
QOR_AUTH__SECURITY__PASSWORD_MIN_LENGTH=6

# Substrate RPC
SUBSTRATE_RPC_URL=ws://localhost:9944
```

**Generate Secure JWT Secrets:**

```bash
# Generate random secrets
openssl rand -base64 32  # For ACCESS_SECRET
openssl rand -base64 32  # For REFRESH_SECRET
```

### 3. Start the Service

```bash
cd /opt/demiurge/qor-auth
sudo systemctl start qor-auth
sudo systemctl enable qor-auth  # Enable auto-start on boot
```

### 4. Verify Service Status

```bash
sudo systemctl status qor-auth
```

Check logs:

```bash
sudo journalctl -u qor-auth -f
```

Test the health endpoint:

```bash
curl http://localhost:8080/health
```

## Service Management

### Start/Stop/Restart

```bash
sudo systemctl start qor-auth
sudo systemctl stop qor-auth
sudo systemctl restart qor-auth
```

### View Logs

```bash
# Follow logs in real-time
sudo journalctl -u qor-auth -f

# View last 100 lines
sudo journalctl -u qor-auth -n 100

# View logs from today
sudo journalctl -u qor-auth --since today
```

### Check Status

```bash
sudo systemctl status qor-auth
```

## Frontend Configuration

The frontend automatically connects to the production server when deployed:

- **Production**: `http://51.210.209.112:8080`
- **Development**: `http://localhost:8080`

The SDK automatically detects the environment and uses the correct URL.

## Database Setup

Ensure PostgreSQL and Redis are running:

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check Redis
sudo systemctl status redis
```

Run migrations (if needed):

```bash
cd /opt/demiurge/qor-auth
# Migrations are auto-run on first start, or manually:
sqlx migrate run --database-url "$QOR_AUTH__DATABASE__URL"
```

## Firewall Configuration

Ensure port 8080 is open:

```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:8080/health
```

### Metrics (if enabled)

```bash
curl http://localhost:8080/metrics
```

## Troubleshooting

### Service Won't Start

1. Check logs: `sudo journalctl -u qor-auth -n 50`
2. Verify database connection: `psql -U qor_auth -d qor_auth -c "SELECT 1;"`
3. Verify Redis connection: `redis-cli ping`
4. Check environment file: `cat /opt/demiurge/qor-auth/.env`

### Port Already in Use

```bash
# Check what's using port 8080
sudo lsof -i :8080

# Or use netstat
sudo netstat -tlnp | grep 8080
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U qor_auth -d qor_auth -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis is running
sudo systemctl status redis
```

## Updating the Service

To update the service:

1. Build new version locally: `cargo build --release`
2. Run deployment script: `./scripts/deploy-qor-auth.sh`
3. Restart service: `sudo systemctl restart qor-auth`

## Production Checklist

- [ ] Service installed and configured
- [ ] Environment variables set (especially JWT secrets)
- [ ] Database migrations run
- [ ] Service starts successfully
- [ ] Health endpoint responds
- [ ] Port 8080 accessible
- [ ] Service auto-starts on boot (`systemctl enable`)
- [ ] Logs are being written
- [ ] Frontend can connect to service

## Security Notes

1. **JWT Secrets**: Must be strong, random strings. Never commit to git.
2. **Database Password**: Use strong password, store securely.
3. **Firewall**: Only expose port 8080 if needed. Consider using Nginx reverse proxy.
4. **HTTPS**: In production, use HTTPS with Nginx reverse proxy.
5. **Environment File**: Restrict access: `sudo chmod 600 /opt/demiurge/qor-auth/.env`

## Nginx Reverse Proxy (Recommended)

For production, use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name auth.demiurge.cloud;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then update frontend to use: `https://auth.demiurge.cloud`
