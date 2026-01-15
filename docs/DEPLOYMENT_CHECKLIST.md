# QOR Auth Deployment Checklist

Complete step-by-step guide to get QOR Auth running on the production server.

## Step 1: Check Server Status

Run the diagnostic script to see what's already installed:

```powershell
cd scripts
.\check-server-status.ps1
```

This will tell you:
- ✅ What's already installed and running
- ❌ What needs to be installed
- 🎯 Recommended next steps

## Step 2: Install Dependencies (if needed)

### Option A: Install PostgreSQL

```bash
# SSH to server
ssh pleroma

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createuser -s qor_auth
sudo -u postgres createdb qor_auth

# Set password (optional, but recommended)
sudo -u postgres psql -c "ALTER USER qor_auth WITH PASSWORD 'your_secure_password';"
```

### Option B: Install Redis

```bash
# SSH to server
ssh pleroma

# Install Redis
sudo apt update
sudo apt install redis-server -y

# Start and enable Redis
sudo systemctl start redis
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

## Step 3: Deploy QOR Auth Service

### Recommended: Build Locally and Deploy

**You don't need Rust on the server** - build on Windows and upload the binary:

```powershell
# From Windows PowerShell
cd scripts
.\deploy-qor-auth.ps1
```

This will:
1. Build the service on your Windows machine
2. Create a deployment package
3. Upload to the server
4. Install as a systemd service

### Alternative: Build on Server

If you prefer to build on the server:

```bash
# SSH to server
ssh pleroma

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Clone repository (or upload source)
cd /opt/demiurge
git clone <your-repo-url> Demiurge-Blockchain
# OR upload source code manually

# Build service
cd Demiurge-Blockchain/services/qor-auth
cargo build --release

# Install binary
sudo mkdir -p /opt/demiurge/qor-auth
sudo cp target/release/qor-auth /opt/demiurge/qor-auth/
sudo chmod +x /opt/demiurge/qor-auth/qor-auth
```

## Step 4: Configure Environment

```bash
# SSH to server
ssh pleroma

# Create environment file
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
# On server
openssl rand -base64 32  # For ACCESS_SECRET
openssl rand -base64 32  # For REFRESH_SECRET
```

## Step 5: Run Database Migrations

```bash
# SSH to server
ssh pleroma

# If migrations exist
cd /opt/demiurge/qor-auth
# Migrations should run automatically on first start
# Or manually:
# sqlx migrate run --database-url "$QOR_AUTH__DATABASE__URL"
```

## Step 6: Start the Service

```bash
# SSH to server
ssh pleroma

# Start service
sudo systemctl start qor-auth

# Enable auto-start on boot
sudo systemctl enable qor-auth

# Check status
sudo systemctl status qor-auth

# View logs
sudo journalctl -u qor-auth -f
```

## Step 7: Verify Service is Running

### On Server

```bash
# Check service status
sudo systemctl status qor-auth

# Test health endpoint
curl http://localhost:8080/health

# Check if port is listening
sudo netstat -tlnp | grep 8080
# OR
sudo ss -tlnp | grep 8080
```

### From Windows

```powershell
# Test connection
Test-NetConnection -ComputerName 51.210.209.112 -Port 8080

# Test health endpoint
curl http://51.210.209.112:8080/health
```

## Step 8: Configure Firewall (if needed)

```bash
# SSH to server
ssh pleroma

# Allow port 8080
sudo ufw allow 8080/tcp
sudo ufw reload

# Verify firewall status
sudo ufw status
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u qor-auth -n 50

# Check configuration
cat /opt/demiurge/qor-auth/.env

# Verify database connection
psql -U qor_auth -d qor_auth -h localhost -c "SELECT 1;"

# Verify Redis connection
redis-cli ping
```

### Port Already in Use

```bash
# Find what's using port 8080
sudo lsof -i :8080
# OR
sudo netstat -tlnp | grep 8080

# Stop conflicting service or change port in .env
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U qor_auth -d qor_auth -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo journalctl -u postgresql -n 50
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis is running
sudo systemctl status redis

# Check Redis logs
sudo journalctl -u redis -n 50
```

## Quick Start (All-in-One)

If you want to do everything at once:

```bash
# SSH to server
ssh pleroma

# Install dependencies
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server -y

# Start services
sudo systemctl start postgresql redis
sudo systemctl enable postgresql redis

# Create database
sudo -u postgres createuser -s qor_auth
sudo -u postgres createdb qor_auth

# Then from Windows, deploy:
cd scripts
.\deploy-qor-auth.ps1

# Back on server, configure and start:
sudo nano /opt/demiurge/qor-auth/.env  # Configure
sudo systemctl start qor-auth
sudo systemctl enable qor-auth
```

## Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Redis installed and running
- [ ] QOR Auth binary deployed
- [ ] Environment file configured
- [ ] Database migrations run
- [ ] Service starts successfully
- [ ] Health endpoint responds
- [ ] Port 8080 accessible
- [ ] Service auto-starts on boot
- [ ] Logs are being written
- [ ] Frontend can connect

## Next Steps

Once QOR Auth is running:

1. **Test Registration**: Try creating a new QOR ID account
2. **Test Login**: Verify authentication works
3. **Check Logs**: Monitor for any errors
4. **Update Frontend**: Ensure frontend connects to `http://51.210.209.112:8080`
5. **Set Up Monitoring**: Consider setting up log rotation and monitoring

## Support

If you encounter issues:

1. Run `.\check-server-status.ps1` to diagnose
2. Check service logs: `sudo journalctl -u qor-auth -f`
3. Verify all dependencies are running
4. Check firewall rules
5. Review environment configuration
