# Windows Deployment Guide - QOR Auth Service

This guide helps you deploy the QOR Auth service from Windows to the production server.

## Prerequisites

1. **Rust/Cargo** installed: https://rustup.rs/
2. **SSH client** (Windows 10+ includes OpenSSH)
3. **Git Bash** or **WSL** (optional, for bash scripts)

## Option 1: PowerShell Deployment (Recommended for Windows)

### Step 1: Set Up SSH Key Authentication

First, set up SSH key authentication to avoid password prompts:

```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to server
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh ubuntu@51.210.209.112 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**Or manually:**
1. Copy your public key: `type $env:USERPROFILE\.ssh\id_ed25519.pub`
2. SSH to server: `ssh ubuntu@51.210.209.112`
3. Run: `mkdir -p ~/.ssh && nano ~/.ssh/authorized_keys`
4. Paste your public key and save

### Step 2: Run PowerShell Deployment Script

```powershell
cd scripts
.\deploy-qor-auth.ps1
```

The script will:
- Build the Rust service
- Create a deployment package
- Upload to the server
- Install as a systemd service

### Step 3: Configure on Server

SSH to the server:

```powershell
ssh ubuntu@51.210.209.112
```

Configure the environment:

```bash
sudo nano /opt/demiurge/qor-auth/.env
```

Update these values:
- `QOR_AUTH__DATABASE__URL` - PostgreSQL connection string
- `QOR_AUTH__JWT__ACCESS_SECRET` - Generate with: `openssl rand -base64 32`
- `QOR_AUTH__JWT__REFRESH_SECRET` - Generate with: `openssl rand -base64 32`

### Step 4: Start Service

```bash
sudo systemctl start qor-auth
sudo systemctl enable qor-auth  # Auto-start on boot
sudo systemctl status qor-auth   # Check status
```

## Option 2: Manual Deployment

If the PowerShell script doesn't work, deploy manually:

### Step 1: Build Locally

```powershell
cd services\qor-auth
cargo build --release
```

### Step 2: Copy Files to Server

```powershell
# Copy binary
scp target\release\qor-auth.exe ubuntu@51.210.209.112:/tmp/qor-auth

# Copy migrations (if they exist)
scp -r migrations ubuntu@51.210.209.112:/tmp/
```

### Step 3: Install on Server

SSH to server and run:

```bash
# Create service directory
sudo mkdir -p /opt/demiurge/qor-auth
sudo chown ubuntu:ubuntu /opt/demiurge/qor-auth

# Move binary
sudo mv /tmp/qor-auth /opt/demiurge/qor-auth/
sudo chmod +x /opt/demiurge/qor-auth/qor-auth

# Copy migrations
sudo cp -r /tmp/migrations /opt/demiurge/qor-auth/ 2>/dev/null || true

# Create systemd service
sudo nano /etc/systemd/system/qor-auth.service
```

Paste this service file:

```ini
[Unit]
Description=QOR Auth Service - Demiurge Blockchain Authentication
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/demiurge/qor-auth
ExecStart=/opt/demiurge/qor-auth/qor-auth
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=qor-auth

Environment="RUN_ENV=production"
Environment="QOR_AUTH__SERVER__HOST=0.0.0.0"
Environment="QOR_AUTH__SERVER__PORT=8080"

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable qor-auth
sudo systemctl start qor-auth
```

## Option 3: Using Git Bash or WSL

If you have Git Bash or WSL installed, you can use the bash script:

```bash
# In Git Bash or WSL
cd scripts
chmod +x deploy-qor-auth.sh
./deploy-qor-auth.sh
```

## Troubleshooting

### SSH Permission Denied

**Problem:** `Permission denied (publickey)`

**Solution:**
1. Generate SSH key: `ssh-keygen -t ed25519`
2. Copy public key to server:
   ```powershell
   type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh ubuntu@51.210.209.112 "cat >> ~/.ssh/authorized_keys"
   ```
3. Test connection: `ssh ubuntu@51.210.209.112`

### Cargo Not Found

**Problem:** `cargo: command not found`

**Solution:**
1. Install Rust: https://rustup.rs/
2. Restart PowerShell after installation
3. Verify: `cargo --version`

### Binary Not Found

**Problem:** Build succeeds but binary not found

**Solution:**
- On Windows, the binary is `qor-auth.exe`
- The script handles this automatically
- If issues persist, check: `services\qor-auth\target\release\`

### Service Won't Start

**On Server:**
```bash
# Check logs
sudo journalctl -u qor-auth -n 50

# Check configuration
cat /opt/demiurge/qor-auth/.env

# Verify database connection
psql -U qor_auth -d qor_auth -c "SELECT 1;"

# Verify Redis connection
redis-cli ping
```

## Verification

After deployment, verify the service is running:

```bash
# On server
curl http://localhost:8080/health

# From Windows
curl http://51.210.209.112:8080/health
```

## Useful Commands

### On Server

```bash
# Service management
sudo systemctl start qor-auth
sudo systemctl stop qor-auth
sudo systemctl restart qor-auth
sudo systemctl status qor-auth

# View logs
sudo journalctl -u qor-auth -f
sudo journalctl -u qor-auth -n 100

# Check if port is open
sudo netstat -tlnp | grep 8080
```

### From Windows

```powershell
# Test connection
Test-NetConnection -ComputerName 51.210.209.112 -Port 8080

# View service status (via SSH)
ssh ubuntu@51.210.209.112 "sudo systemctl status qor-auth"
```

## Next Steps

Once the service is running:

1. **Update Frontend** - The frontend will automatically connect to `http://51.210.209.112:8080` when deployed
2. **Configure Nginx** (optional) - Set up reverse proxy for HTTPS
3. **Monitor Logs** - Set up log rotation and monitoring
4. **Backup Database** - Configure regular PostgreSQL backups

## Security Notes

- **Never commit** `.env` files to git
- **Use strong passwords** for database and JWT secrets
- **Restrict SSH access** to authorized keys only
- **Use firewall** to limit port 8080 access if needed
- **Enable HTTPS** via Nginx reverse proxy in production
