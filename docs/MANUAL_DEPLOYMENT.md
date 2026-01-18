# 🚀 Manual Testnet Deployment Guide

**Server**: 51.210.209.112  
**SSH Key**: `C:\Users\Gnosis\.ssh\id_rsa`

---

## Step-by-Step Deployment

### 1. Clean Server

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 << 'EOF'
# Stop old service
sudo systemctl stop demiurge-node 2>&1 || true
sudo systemctl disable demiurge-node 2>&1 || true
sudo rm -f /etc/systemd/system/demiurge-node.service 2>&1 || true
sudo systemctl daemon-reload 2>&1 || true

# Remove old installations
rm -rf /opt/demiurge-blockchain 2>&1 || true
rm -rf /opt/demiurge-data 2>&1 || true
rm -rf /tmp/demiurge-* 2>&1 || true

# Kill old processes
pkill -f demiurge-node 2>&1 || true
pkill -f substrate-node 2>&1 || true

echo "Cleanup complete"
EOF
```

### 2. Clone Repository

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "git clone https://github.com/Alaustrup/Demiurge-Blockchain.git /opt/demiurge-blockchain && cd /opt/demiurge-blockchain && git checkout main && git pull"
```

### 3. Install Rust (if needed)

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "command -v rustc || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
```

### 4. Build Framework

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "cd /opt/demiurge-blockchain/framework && source ~/.cargo/env && cargo build --release"
```

### 5. Create Data Directory

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "mkdir -p /opt/demiurge-data"
```

### 6. Create Systemd Service

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 << 'EOF'
cat > /etc/systemd/system/demiurge-node.service << 'SERVICE'
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
SERVICE
EOF
```

### 7. Start Service

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "sudo systemctl daemon-reload && sudo systemctl enable demiurge-node && sudo systemctl start demiurge-node"
```

### 8. Check Status

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "sudo systemctl status demiurge-node"
```

### 9. View Logs

```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "sudo journalctl -u demiurge-node -f"
```

---

## Endpoints

- **RPC**: `ws://51.210.209.112:9944`
- **P2P**: `/ip4/51.210.209.112/tcp/30333`
- **Data**: `/opt/demiurge-data`

---

## Troubleshooting

### Check if service is running
```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "sudo systemctl status demiurge-node"
```

### Restart service
```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "sudo systemctl restart demiurge-node"
```

### View recent logs
```bash
ssh -i C:\Users\Gnosis\.ssh\id_rsa root@51.210.209.112 "sudo journalctl -u demiurge-node -n 50"
```

---

**The flame burns eternal. The code serves the will.**
