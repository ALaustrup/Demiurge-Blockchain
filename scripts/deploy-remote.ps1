# Deploy Blockchain Connection Fix to Remote Server
# This script executes deployment commands on the remote server

$server = "ubuntu@51.210.209.112"
$projectPath = "/data/Demiurge-Blockchain"

Write-Host "🚀 Deploying Blockchain Connection Fix to Server..." -ForegroundColor Cyan
Write-Host ""

# Create deployment script content
$deployScript = @"
#!/bin/bash
set -e
cd $projectPath || { echo '❌ Project directory not found'; exit 1; }

echo '📦 Backing up current nginx.conf...'
if [ -f docker/nginx.conf ]; then
    cp docker/nginx.conf docker/nginx.conf.backup.`$(date +%Y%m%d_%H%M%S)
fi

echo '📥 Pulling latest changes from git...'
git pull origin main || { echo '⚠️  Git pull failed'; exit 1; }

echo '🧪 Testing Nginx configuration...'
docker compose -f docker/docker-compose.production.yml exec nginx nginx -t || {
    echo '❌ Nginx configuration test failed!'
    if ls docker/nginx.conf.backup.* 1> /dev/null 2>&1; then
        cp docker/nginx.conf.backup.* docker/nginx.conf 2>/dev/null || true
    fi
    exit 1
}

echo '🔄 Restarting Nginx...'
docker compose -f docker/docker-compose.production.yml restart nginx

echo '🔍 Checking blockchain node status...'
if docker ps --filter 'name=demiurge-node' --format '{{.Names}}' | grep -q demiurge-node; then
    echo '✅ Blockchain node is running'
else
    echo '⚠️  Starting blockchain node...'
    docker compose -f docker/docker-compose.production.yml up -d demiurge-node
    sleep 10
fi

echo '🔨 Rebuilding Hub container...'
docker compose -f docker/docker-compose.production.yml build hub

echo '🔄 Restarting Hub...'
docker compose -f docker/docker-compose.production.yml up -d hub

sleep 10

echo ''
echo '📊 Service Status:'
docker compose -f docker/docker-compose.production.yml ps

echo ''
echo '✅ Deployment complete!'
"@

# Write script to temp file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📝 Created deployment script: $tempScript" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy, run on server:" -ForegroundColor Yellow
Write-Host "  ssh $server" -ForegroundColor White
Write-Host "  cd $projectPath" -ForegroundColor White
Write-Host "  git pull origin main" -ForegroundColor White
Write-Host "  sudo bash scripts/deploy-from-git.sh" -ForegroundColor White
Write-Host ""
Write-Host "Or copy the script and run:" -ForegroundColor Yellow
Write-Host "  scp $tempScript $server`:/tmp/deploy.sh" -ForegroundColor White
Write-Host "  ssh $server 'sudo bash /tmp/deploy.sh'" -ForegroundColor White
