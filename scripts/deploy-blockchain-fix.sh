#!/bin/bash
# Deploy Blockchain Connection Fix
# Run this script on the server: sudo bash deploy-blockchain-fix.sh

set -e

echo "🚀 Deploying Blockchain Connection Fix..."
echo ""

# Navigate to project directory
cd /data/Demiurge-Blockchain || { echo "❌ Project directory not found"; exit 1; }

# Backup current nginx.conf
echo "📦 Backing up current nginx.conf..."
cp docker/nginx.conf docker/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Copy updated nginx.conf (assumes file is already at /tmp/nginx.conf)
if [ -f /tmp/nginx.conf ]; then
    echo "📝 Copying updated nginx.conf..."
    cp /tmp/nginx.conf docker/nginx.conf
else
    echo "⚠️  /tmp/nginx.conf not found. Please copy it manually."
    echo "   Run: cp /path/to/nginx.conf docker/nginx.conf"
fi

# Copy updated blockchain.ts (assumes file is already at /tmp/blockchain.ts)
if [ -f /tmp/blockchain.ts ]; then
    echo "📝 Copying updated blockchain.ts..."
    cp /tmp/blockchain.ts apps/hub/src/lib/blockchain.ts
else
    echo "⚠️  /tmp/blockchain.ts not found. Please copy it manually."
    echo "   Run: cp /path/to/blockchain.ts apps/hub/src/lib/blockchain.ts"
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
docker compose -f docker/docker-compose.production.yml exec nginx nginx -t || {
    echo "❌ Nginx configuration test failed!"
    echo "   Restoring backup..."
    cp docker/nginx.conf.backup.* docker/nginx.conf 2>/dev/null || true
    exit 1
}

# Restart Nginx
echo "🔄 Restarting Nginx..."
docker compose -f docker/docker-compose.production.yml restart nginx

# Check if blockchain node is running
echo "🔍 Checking blockchain node status..."
if docker ps --filter 'name=demiurge-node' --format '{{.Names}}' | grep -q demiurge-node; then
    echo "✅ Blockchain node is running"
else
    echo "⚠️  Blockchain node is not running. Starting it..."
    docker compose -f docker/docker-compose.production.yml up -d demiurge-node
    echo "⏳ Waiting for node to start..."
    sleep 5
fi

# Rebuild Hub with updated blockchain client
echo "🔨 Rebuilding Hub container..."
docker compose -f docker/docker-compose.production.yml build hub

# Restart Hub
echo "🔄 Restarting Hub..."
docker compose -f docker/docker-compose.production.yml up -d hub

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker compose -f docker/docker-compose.production.yml ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Testing:"
echo "   1. Visit https://demiurge.cloud"
echo "   2. Check browser console for [Blockchain] logs"
echo "   3. Verify blockchain status banner disappears"
echo ""
echo "📋 Logs:"
echo "   Nginx: docker logs demiurge-nginx --tail 50"
echo "   Hub: docker logs demiurge-hub --tail 50"
echo "   Node: docker logs demiurge-node --tail 50"
