#!/bin/bash
# Start QOR Auth Service on Production Server
# Run this script on the server (51.210.209.112)

set -e

SERVICE_NAME="qor-auth"
SERVICE_DIR="/opt/demiurge/qor-auth"
ENV_FILE="$SERVICE_DIR/.env"

echo "🚀 Starting QOR Auth Service..."

# Check if service is installed
if [ ! -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
    echo "❌ Service not installed. Run deploy-qor-auth.sh first."
    exit 1
fi

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Warning: $ENV_FILE not found!"
    echo "📝 Creating from template..."
    if [ -f "$SERVICE_DIR/.env.production" ]; then
        cp "$SERVICE_DIR/.env.production" "$ENV_FILE"
        echo "✅ Created $ENV_FILE"
        echo "⚠️  Please edit $ENV_FILE and update all CHANGE_ME values!"
        exit 1
    else
        echo "❌ No .env template found. Please create $ENV_FILE manually."
        exit 1
    fi
fi

# Check if database is accessible
echo "🔍 Checking database connection..."
DB_URL=$(grep QOR_AUTH__DATABASE__URL "$ENV_FILE" | cut -d'=' -f2)
if [ -z "$DB_URL" ]; then
    echo "❌ Database URL not found in $ENV_FILE"
    exit 1
fi

# Check if Redis is accessible
echo "🔍 Checking Redis connection..."
REDIS_URL=$(grep QOR_AUTH__REDIS__URL "$ENV_FILE" | cut -d'=' -f2)
if [ -z "$REDIS_URL" ]; then
    echo "❌ Redis URL not found in $ENV_FILE"
    exit 1
fi

# Start the service
echo "▶️  Starting $SERVICE_NAME..."
sudo systemctl start $SERVICE_NAME

# Wait a moment
sleep 2

# Check status
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ $SERVICE_NAME is running!"
    echo ""
    echo "📊 Service Status:"
    sudo systemctl status $SERVICE_NAME --no-pager -l
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs: sudo journalctl -u $SERVICE_NAME -f"
    echo "   Stop: sudo systemctl stop $SERVICE_NAME"
    echo "   Restart: sudo systemctl restart $SERVICE_NAME"
    echo "   Status: sudo systemctl status $SERVICE_NAME"
else
    echo "❌ Failed to start $SERVICE_NAME"
    echo "📋 Recent logs:"
    sudo journalctl -u $SERVICE_NAME -n 50 --no-pager
    exit 1
fi
