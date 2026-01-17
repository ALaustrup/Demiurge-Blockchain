# Demiurge Docker Development Helper Script (PowerShell)
# Provides convenient commands for Docker development workflow

param(
    [Parameter(Position=0)]
    [ValidateSet("up", "down", "restart", "logs", "build", "ps", "exec", "clean", "backup", "help")]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service = "",
    
    [switch]$DevTools,
    [switch]$Force,
    [switch]$Follow
)

$ErrorActionPreference = "Stop"

# Colors
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Show-Help {
    Write-ColorOutput Cyan @"
🎭 Demiurge Docker Development Helper

Usage: .\docker-dev.ps1 <command> [service] [options]

Commands:
  up [service]          Start services (use -DevTools for admin tools)
  down                  Stop all services
  restart [service]     Restart service(s)
  logs [service]        Show logs (use -Follow for tail -f)
  build [service]       Rebuild service(s)
  ps                    Show service status
  exec [service]        Execute command in service container
  clean                 Remove containers, volumes, and images
  backup                Backup PostgreSQL and Redis data
  help                  Show this help

Options:
  -DevTools             Include development tools (Adminer, Redis Commander)
  -Force                Force rebuild without cache
  -Follow               Follow log output (for logs command)

Examples:
  .\docker-dev.ps1 up                    # Start all services
  .\docker-dev.ps1 up -DevTools          # Start with dev tools
  .\docker-dev.ps1 logs hub -Follow      # Follow hub logs
  .\docker-dev.ps1 restart qor-auth      # Restart qor-auth service
  .\docker-dev.ps1 build hub -Force      # Rebuild hub without cache
  .\docker-dev.ps1 exec postgres psql -U qor_auth -d qor_auth
"@
}

function Start-Services {
    param([string]$ServiceName, [bool]$IncludeDevTools)
    
    $profile = if ($IncludeDevTools) { "--profile dev" } else { "" }
    
    if ($ServiceName) {
        Write-ColorOutput Yellow "▶ Starting service: $ServiceName"
        docker-compose up -d $ServiceName
    } else {
        Write-ColorOutput Yellow "▶ Starting all services..."
        if ($IncludeDevTools) {
            docker-compose --profile dev up -d
        } else {
            docker-compose up -d
        }
    }
    
    Write-ColorOutput Green "✅ Services started"
    docker-compose ps
}

function Stop-Services {
    Write-ColorOutput Yellow "▶ Stopping all services..."
    docker-compose down
    Write-ColorOutput Green "✅ Services stopped"
}

function Restart-Service {
    param([string]$ServiceName)
    
    if ($ServiceName) {
        Write-ColorOutput Yellow "▶ Restarting service: $ServiceName"
        docker-compose restart $ServiceName
    } else {
        Write-ColorOutput Yellow "▶ Restarting all services..."
        docker-compose restart
    }
    
    Write-ColorOutput Green "✅ Service(s) restarted"
}

function Show-Logs {
    param([string]$ServiceName, [bool]$FollowLogs)
    
    if ($ServiceName) {
        if ($FollowLogs) {
            docker-compose logs -f $ServiceName
        } else {
            docker-compose logs --tail=100 $ServiceName
        }
    } else {
        if ($FollowLogs) {
            docker-compose logs -f
        } else {
            docker-compose logs --tail=100
        }
    }
}

function Build-Service {
    param([string]$ServiceName, [bool]$NoCache)
    
    $buildArgs = if ($NoCache) { "--no-cache" } else { "" }
    
    if ($ServiceName) {
        Write-ColorOutput Yellow "▶ Building service: $ServiceName"
        docker-compose build $buildArgs $ServiceName
        docker-compose up -d $ServiceName
    } else {
        Write-ColorOutput Yellow "▶ Building all services..."
        docker-compose build $buildArgs
        docker-compose up -d
    }
    
    Write-ColorOutput Green "✅ Build complete"
}

function Show-Status {
    Write-ColorOutput Cyan "📊 Service Status:"
    docker-compose ps
    
    Write-ColorOutput Cyan "`n🔍 Health Checks:"
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -UseBasicParsing
        Write-ColorOutput Green "  ✅ QOR Auth: Healthy"
    } catch {
        Write-ColorOutput Red "  ❌ QOR Auth: Unhealthy or not running"
    }
}

function Execute-Command {
    param([string]$ServiceName)
    
    if (-not $ServiceName) {
        Write-ColorOutput Red "❌ Service name required for exec command"
        Show-Help
        exit 1
    }
    
    Write-ColorOutput Yellow "▶ Executing command in $ServiceName..."
    docker-compose exec $ServiceName sh
}

function Clean-All {
    Write-ColorOutput Yellow "⚠️  This will remove all containers, volumes, and images!"
    $confirm = Read-Host "Type 'yes' to confirm"
    
    if ($confirm -eq "yes") {
        Write-ColorOutput Yellow "▶ Cleaning up..."
        docker-compose down -v --rmi all
        Write-ColorOutput Green "✅ Cleanup complete"
    } else {
        Write-ColorOutput Yellow "❌ Cleanup cancelled"
    }
}

function Backup-Data {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDir = "backups/$timestamp"
    
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    
    Write-ColorOutput Yellow "▶ Backing up PostgreSQL..."
    docker-compose exec -T postgres pg_dump -U qor_auth qor_auth > "$backupDir/postgres.sql"
    
    Write-ColorOutput Yellow "▶ Backing up Redis..."
    docker-compose exec redis redis-cli SAVE
    docker cp demiurge-redis:/data/dump.rdb "$backupDir/redis.rdb"
    
    Write-ColorOutput Green "✅ Backup complete: $backupDir"
}

# Main command routing
switch ($Command) {
    "up" { Start-Services -ServiceName $Service -IncludeDevTools $DevTools }
    "down" { Stop-Services }
    "restart" { Restart-Service -ServiceName $Service }
    "logs" { Show-Logs -ServiceName $Service -FollowLogs $Follow }
    "build" { Build-Service -ServiceName $Service -NoCache $Force }
    "ps" { Show-Status }
    "exec" { Execute-Command -ServiceName $Service }
    "clean" { Clean-All }
    "backup" { Backup-Data }
    "help" { Show-Help }
    default { Show-Help }
}
