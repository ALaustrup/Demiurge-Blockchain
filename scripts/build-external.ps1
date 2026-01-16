# ================================================================================
# EXTERNAL BUILD SCRIPT - Demiurge Blockchain Node (PowerShell)
# ================================================================================
# 
# This script builds the Demiurge node EXTERNALLY to avoid Cursor crashes.
# Run this in a separate PowerShell terminal or CI/CD pipeline.
#
# Usage:
#   .\scripts\build-external.ps1 [-Clean] [-Docker] [-Check]
#
# Options:
#   -Clean      Clean build cache before building
#   -Docker     Build using Docker instead of local Rust
#   -Check      Only check compilation, don't build binary
#
# ================================================================================

param(
    [switch]$Clean,
    [switch]$Docker,
    [switch]$Check
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BlockchainDir = Join-Path $ProjectRoot "blockchain"
$BuildMode = if ($Docker) { "docker" } else { "local" }

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "    EXTERNAL BUILD - Demiurge Blockchain Node" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build mode: $BuildMode" -ForegroundColor Cyan
Write-Host "Clean build: $Clean" -ForegroundColor Cyan
Write-Host "Check only: $Check" -ForegroundColor Cyan
Write-Host ""

# ================================================================================
# DOCKER BUILD
# ================================================================================

if ($BuildMode -eq "docker") {
    Write-Host "Building with Docker..." -ForegroundColor Yellow
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "Docker not found. Install Docker or use local mode." -ForegroundColor Red
        exit 1
    }
    
    Set-Location $BlockchainDir
    
    # Build Docker image
    docker build -t demiurge-node:latest .
    
    Write-Host "Docker build complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "To run the container:" -ForegroundColor Cyan
    Write-Host "  docker run -it --rm demiurge-node:latest --dev" -ForegroundColor Gray
    exit 0
}

# ================================================================================
# LOCAL BUILD
# ================================================================================

Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Rust
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Rust not found. Install from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

$RustVersion = (rustc --version).Split(' ')[1]
Write-Host "  Rust version: $RustVersion" -ForegroundColor Cyan

# Check Cargo
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Cargo not found" -ForegroundColor Red
    exit 1
}

# Check WASM target
$wasmInstalled = cargo target list --installed | Select-String "wasm32-unknown-unknown"
if (-not $wasmInstalled) {
    Write-Host "  Adding WASM target..." -ForegroundColor Yellow
    rustup target add wasm32-unknown-unknown
}

Write-Host "Prerequisites OK" -ForegroundColor Green
Write-Host ""

# Navigate to blockchain directory
Set-Location $BlockchainDir

# Clean if requested
if ($Clean) {
    Write-Host "Cleaning build cache..." -ForegroundColor Yellow
    cargo clean
    Write-Host "Clean complete" -ForegroundColor Green
    Write-Host ""
}

# Build
$BuildStart = Get-Date

if ($Check) {
    Write-Host "Checking compilation..." -ForegroundColor Yellow
    cargo check --release
} else {
    $cpuCount = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors
    Write-Host "Building release binary..." -ForegroundColor Yellow
    Write-Host "  This may take 30-60 minutes on first build" -ForegroundColor Gray
    Write-Host "  Using $cpuCount CPU cores" -ForegroundColor Gray
    Write-Host ""
    
    cargo build --release --bin demiurge-node
}

$BuildEnd = Get-Date
$BuildDuration = $BuildEnd - $BuildStart

Write-Host ""
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "  Duration: $($BuildDuration.ToString('mm\:ss'))" -ForegroundColor Cyan

# Verify binary
$BinaryPath = Join-Path $BlockchainDir "target\release\demiurge-node.exe"
if (Test-Path $BinaryPath) {
    $BinarySize = (Get-Item $BinaryPath).Length / 1MB
    Write-Host ""
    Write-Host "Binary verified" -ForegroundColor Green
    Write-Host "  Path: $BinaryPath" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round($BinarySize, 2)) MB" -ForegroundColor Cyan
    
    # Test version
    & $BinaryPath --version 2>&1 | Out-Null
} else {
    Write-Host "Binary not found (check-only mode?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Build process complete!" -ForegroundColor Green
Write-Host ""
