#!/bin/bash
# Demiurge Docker Development Helper Script (Bash)
# Provides convenient commands for Docker development workflow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${CYAN}🎭 Demiurge Docker Development Helper${NC}"
    echo ""
    echo "Usage: ./docker-dev.sh <command> [service] [options]"
    echo ""
    echo "Commands:"
    echo "  up [service]          Start services (use --dev-tools for admin tools)"
    echo "  down                  Stop all services"
    echo "  restart [service]     Restart service(s)"
    echo "  logs [service]        Show logs (use --follow for tail -f)"
    echo "  build [service]       Rebuild service(s)"
    echo "  ps                    Show service status"
    echo "  exec [service]        Execute command in service container"
    echo "  clean                 Remove containers, volumes, and images"
    echo "  backup                Backup PostgreSQL and Redis data"
    echo "  help                  Show this help"
    echo ""
    echo "Options:"
    echo "  --dev-tools           Include development tools (Adminer, Redis Commander)"
    echo "  --force               Force rebuild without cache"
    echo "  --follow              Follow log output (for logs command)"
    echo ""
    echo "Examples:"
    echo "  ./docker-dev.sh up                    # Start all services"
    echo "  ./docker-dev.sh up --dev-tools        # Start with dev tools"
    echo "  ./docker-dev.sh logs hub --follow     # Follow hub logs"
    echo "  ./docker-dev.sh restart qor-auth      # Restart qor-auth service"
    echo "  ./docker-dev.sh build hub --force     # Rebuild hub without cache"
    echo "  ./docker-dev.sh exec postgres psql -U qor_auth -d qor_auth"
}

start_services() {
    local service=$1
    local dev_tools=$2
    
    local profile=""
    if [ "$dev_tools" = "true" ]; then
        profile="--profile dev"
    fi
    
    if [ -n "$service" ]; then
        echo -e "${YELLOW}▶ Starting service: $service${NC}"
        docker-compose up -d "$service"
    else
        echo -e "${YELLOW}▶ Starting all services...${NC}"
        docker-compose $profile up -d
    fi
    
    echo -e "${GREEN}✅ Services started${NC}"
    docker-compose ps
}

stop_services() {
    echo -e "${YELLOW}▶ Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

restart_service() {
    local service=$1
    
    if [ -n "$service" ]; then
        echo -e "${YELLOW}▶ Restarting service: $service${NC}"
        docker-compose restart "$service"
    else
        echo -e "${YELLOW}▶ Restarting all services...${NC}"
        docker-compose restart
    fi
    
    echo -e "${GREEN}✅ Service(s) restarted${NC}"
}

show_logs() {
    local service=$1
    local follow=$2
    
    if [ -n "$service" ]; then
        if [ "$follow" = "true" ]; then
            docker-compose logs -f "$service"
        else
            docker-compose logs --tail=100 "$service"
        fi
    else
        if [ "$follow" = "true" ]; then
            docker-compose logs -f
        else
            docker-compose logs --tail=100
        fi
    fi
}

build_service() {
    local service=$1
    local no_cache=$2
    
    local build_args=""
    if [ "$no_cache" = "true" ]; then
        build_args="--no-cache"
    fi
    
    if [ -n "$service" ]; then
        echo -e "${YELLOW}▶ Building service: $service${NC}"
        docker-compose build $build_args "$service"
        docker-compose up -d "$service"
    else
        echo -e "${YELLOW}▶ Building all services...${NC}"
        docker-compose build $build_args
        docker-compose up -d
    fi
    
    echo -e "${GREEN}✅ Build complete${NC}"
}

show_status() {
    echo -e "${CYAN}📊 Service Status:${NC}"
    docker-compose ps
    
    echo -e "\n${CYAN}🔍 Health Checks:${NC}"
    if curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ QOR Auth: Healthy${NC}"
    else
        echo -e "  ${RED}❌ QOR Auth: Unhealthy or not running${NC}"
    fi
}

execute_command() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo -e "${RED}❌ Service name required for exec command${NC}"
        show_help
        exit 1
    fi
    
    echo -e "${YELLOW}▶ Executing command in $service...${NC}"
    docker-compose exec "$service" sh
}

clean_all() {
    echo -e "${YELLOW}⚠️  This will remove all containers, volumes, and images!${NC}"
    read -p "Type 'yes' to confirm: " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo -e "${YELLOW}▶ Cleaning up...${NC}"
        docker-compose down -v --rmi all
        echo -e "${GREEN}✅ Cleanup complete${NC}"
    else
        echo -e "${YELLOW}❌ Cleanup cancelled${NC}"
    fi
}

backup_data() {
    local timestamp=$(date +"%Y%m%d-%H%M%S")
    local backup_dir="backups/$timestamp"
    
    mkdir -p "$backup_dir"
    
    echo -e "${YELLOW}▶ Backing up PostgreSQL...${NC}"
    docker-compose exec -T postgres pg_dump -U qor_auth qor_auth > "$backup_dir/postgres.sql"
    
    echo -e "${YELLOW}▶ Backing up Redis...${NC}"
    docker-compose exec redis redis-cli SAVE
    docker cp demiurge-redis:/data/dump.rdb "$backup_dir/redis.rdb"
    
    echo -e "${GREEN}✅ Backup complete: $backup_dir${NC}"
}

# Parse arguments
COMMAND=${1:-help}
SERVICE=""
DEV_TOOLS=false
FORCE=false
FOLLOW=false

shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev-tools)
            DEV_TOOLS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --follow)
            FOLLOW=true
            shift
            ;;
        *)
            if [ -z "$SERVICE" ]; then
                SERVICE=$1
            fi
            shift
            ;;
    esac
done

# Route commands
case $COMMAND in
    up)
        start_services "$SERVICE" "$DEV_TOOLS"
        ;;
    down)
        stop_services
        ;;
    restart)
        restart_service "$SERVICE"
        ;;
    logs)
        show_logs "$SERVICE" "$FOLLOW"
        ;;
    build)
        build_service "$SERVICE" "$FORCE"
        ;;
    ps)
        show_status
        ;;
    exec)
        execute_command "$SERVICE"
        ;;
    clean)
        clean_all
        ;;
    backup)
        backup_data
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac
