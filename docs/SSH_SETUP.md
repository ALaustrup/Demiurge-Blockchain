# 🔐 SSH Key Setup for Server Deployment

**Server**: 51.210.209.112

---

## Issue

SSH key not found at `C:\Users\Gnosis\.ssh\id_rsa`

---

## Solutions

### Option 1: Generate New SSH Key

```powershell
# Generate new SSH key
ssh-keygen -t rsa -b 4096 -f C:\Users\Gnosis\.ssh\id_rsa -N '""'

# Copy public key to server (you'll need to enter password once)
type C:\Users\Gnosis\.ssh\id_rsa.pub | ssh root@51.210.209.112 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Option 2: Use Existing Key (if different name)

Check what keys exist:
```powershell
cd C:\Users\Gnosis\.ssh
Get-ChildItem -Force | Where-Object { $_.Name -like "*id*" -or $_.Name -like "*rsa*" -or $_.Name -like "*ed25519*" }
```

Then use the correct key name in commands:
```powershell
ssh -i C:\Users\Gnosis\.ssh\<actual-key-name> root@51.210.209.112 "command"
```

### Option 3: Use Password Authentication (Temporary)

If you have the root password, you can use it directly:
```powershell
ssh root@51.210.209.112
# Enter password when prompted
```

### Option 4: Check SSH Config

Create/edit `C:\Users\Gnosis\.ssh\config`:
```
Host demiurge-server
    HostName 51.210.209.112
    User root
    IdentityFile C:\Users\Gnosis\.ssh\<your-key-name>
```

Then use:
```powershell
ssh demiurge-server "command"
```

---

## After Setting Up SSH Key

Once SSH is working, run the deployment:

```powershell
# 1. Clean server
ssh -i C:\Users\Gnosis\.ssh\<your-key> root@51.210.209.112 "sudo systemctl stop demiurge-node 2>&1; sudo systemctl disable demiurge-node 2>&1; sudo rm -f /etc/systemd/system/demiurge-node.service 2>&1; rm -rf /opt/demiurge-blockchain /opt/demiurge-data 2>&1; pkill -f demiurge-node 2>&1; pkill -f substrate-node 2>&1"

# 2. Clone and build
ssh -i C:\Users\Gnosis\.ssh\<your-key> root@51.210.209.112 "git clone https://github.com/Alaustrup/Demiurge-Blockchain.git /opt/demiurge-blockchain && cd /opt/demiurge-blockchain && git checkout main && mkdir -p /opt/demiurge-data && cd framework && source ~/.cargo/env && cargo build --release"

# 3. Create service (use here-string for multiline)
ssh -i C:\Users\Gnosis\.ssh\<your-key> root@51.210.209.112 @"
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
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable demiurge-node && sudo systemctl start demiurge-node
"@

# 4. Check status
ssh -i C:\Users\Gnosis\.ssh\<your-key> root@51.210.209.112 "sudo systemctl status demiurge-node"
```

---

**The flame burns eternal. The code serves the will.**
