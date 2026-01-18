# Deploy Demiurge Blockchain Testnet to Server
# Server: 51.210.209.112

$SERVER = "51.210.209.112"
$SERVER_USER = "root"
$REPO_DIR = "/opt/demiurge-blockchain"
$SERVICE_NAME = "demiurge-node"

Write-Host "🔥 Deploying Demiurge Blockchain Testnet" -ForegroundColor Cyan
Write-Host "The flame burns eternal. The code serves the will." -ForegroundColor Yellow

# Step 1: Remove old repo if exists
Write-Host "📦 Removing old repository..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "rm -rf ${REPO_DIR} || true"

# Step 2: Clone fresh repo
Write-Host "📥 Cloning fresh repository..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "git clone https://github.com/Alaustrup/Demiurge-Blockchain.git ${REPO_DIR} || true"

# Step 3: Checkout main branch
Write-Host "🔀 Checking out main branch..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "cd ${REPO_DIR} && git checkout main && git pull"

# Step 4: Install Rust if needed
Write-Host "🦀 Checking Rust installation..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "command -v rustc || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"

# Step 5: Build framework
Write-Host "🔨 Building framework..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "cd ${REPO_DIR}/framework && source ~/.cargo/env && cargo build --release"

# Step 6: Create systemd service
Write-Host "⚙️  Creating systemd service..." -ForegroundColor Green
$serviceContent = @"
[Unit]
Description=Demiurge Blockchain Node
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${REPO_DIR}/framework
ExecStart=${REPO_DIR}/framework/target/release/demiurge-node --data-dir /opt/demiurge-data --rpc-addr 0.0.0.0:9944 --p2p-addr 0.0.0.0:30333
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"@

ssh "${SERVER_USER}@${SERVER}" "echo '$serviceContent' | sudo tee /etc/systemd/system/${SERVICE_NAME}.service"

# Step 7: Enable and start service
Write-Host "🚀 Starting service..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "sudo systemctl daemon-reload && sudo systemctl enable ${SERVICE_NAME} && sudo systemctl restart ${SERVICE_NAME}"

# Step 8: Check status
Write-Host "✅ Checking service status..." -ForegroundColor Green
ssh "${SERVER_USER}@${SERVER}" "sudo systemctl status ${SERVICE_NAME} --no-pager"

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Cyan
Write-Host "RPC: ws://${SERVER}:9944" -ForegroundColor Yellow
Write-Host "P2P: /ip4/${SERVER}/tcp/30333" -ForegroundColor Yellow
Write-Host ""
Write-Host "Check logs: ssh ${SERVER_USER}@${SERVER} 'journalctl -u ${SERVICE_NAME} -f'" -ForegroundColor Gray
