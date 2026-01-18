# 🚀 Deploy Now - Quick Commands

**Use these commands directly in PowerShell:**

## Quick Deploy

```powershell
cd x:\Demiurge-Blockchain\scripts
.\deploy-simple.ps1
```

## Or Manual Steps

```powershell
# 1. Clean server
ssh pleroma "sudo systemctl stop demiurge-node 2>&1; sudo rm -rf /opt/demiurge-blockchain /opt/demiurge-data 2>&1; echo 'Clean'"

# 2. Clone and build
ssh pleroma "sudo git clone https://github.com/Alaustrup/Demiurge-Blockchain.git /opt/demiurge-blockchain && cd /opt/demiurge-blockchain && sudo git checkout main && sudo chown -R ubuntu:ubuntu /opt/demiurge-blockchain && sudo mkdir -p /opt/demiurge-data && sudo chown ubuntu:ubuntu /opt/demiurge-data"

# 3. Build (takes time)
ssh pleroma "cd /opt/demiurge-blockchain/framework && source ~/.cargo/env && cargo build --release"

# 4. Create service
ssh pleroma "sudo bash -c 'cat > /etc/systemd/system/demiurge-node.service << EOF
[Unit]
Description=Demiurge Blockchain Node
After=network.target
[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/demiurge-blockchain/framework
ExecStart=/opt/demiurge-blockchain/framework/target/release/demiurge-node --data-dir /opt/demiurge-data --rpc-addr 0.0.0.0:9944 --p2p-addr 0.0.0.0:30333
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
EOF
'"

# 5. Start service
ssh pleroma "sudo systemctl daemon-reload && sudo systemctl enable demiurge-node && sudo systemctl start demiurge-node"

# 6. Check status
ssh pleroma "sudo systemctl status demiurge-node"
```

## Check Logs

```powershell
ssh pleroma "sudo journalctl -u demiurge-node -f"
```

---

**The flame burns eternal. The code serves the will.**
