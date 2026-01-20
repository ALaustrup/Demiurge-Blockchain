#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build script for all Demiurge blockchain pallets.
    Compiles each pallet individually to avoid Substrate dependency conflicts.

.DESCRIPTION
    This script iterates through all pallets and runs cargo check on each one.
    It provides a summary of successes and failures at the end.

.EXAMPLE
    .\build-pallets.ps1
    
    # Run only specific pallets
    .\build-pallets.ps1 -Pallets @("pallet-drc369", "pallet-session-keys")
#>

param(
    [string[]]$Pallets = @(
        "pallet-cgt",
        "pallet-qor-identity", 
        "pallet-drc369",
        "pallet-game-assets",
        "pallet-energy",
        "pallet-composable-nfts",
        "pallet-dex",
        "pallet-fractional-assets",
        "pallet-drc369-ocw",
        "pallet-governance",
        "pallet-session-keys",
        "pallet-yield-nfts"
    ),
    [switch]$Clean,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$script:RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:PalletsDir = Join-Path $script:RootDir "pallets"

$results = @{
    Success = @()
    Failed = @()
    Total = 0
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Demiurge Blockchain - Pallet Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Clean) {
    Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
    cargo clean
    Write-Host "Clean complete.`n" -ForegroundColor Green
}

Write-Host "Building $($Pallets.Count) pallets...`n" -ForegroundColor Cyan

foreach ($pallet in $Pallets) {
    $palletPath = Join-Path $script:PalletsDir $pallet
    $results.Total++
    
    if (-not (Test-Path $palletPath)) {
        Write-Host "[$results.Total/$($Pallets.Count)] $pallet - SKIPPED (not found)" -ForegroundColor Yellow
        $results.Failed += $pallet
        continue
    }
    
    Write-Host "[$results.Total/$($Pallets.Count)] Building $pallet..." -NoNewline -ForegroundColor Cyan
    
    Push-Location $palletPath
    
    # Special handling for pallet-session-keys: build without runtime feature to avoid circular deps
    if ($pallet -eq "pallet-session-keys") {
        $output = cargo check --no-default-features --features std 2>&1
    } else {
        $output = cargo check 2>&1
    }
    $exitCode = $LASTEXITCODE
    
    Pop-Location
    
    if ($exitCode -eq 0) {
        Write-Host " ✓ SUCCESS" -ForegroundColor Green
        $results.Success += $pallet
        if ($Verbose) {
            Write-Host "   Output: $output" -ForegroundColor DarkGray
        }
    } else {
        Write-Host " ✗ FAILED" -ForegroundColor Red
        $results.Failed += $pallet
        Write-Host "   Error: " -ForegroundColor Red
        $output | ForEach-Object { Write-Host "     $_" -ForegroundColor Red }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Pallets:    $($results.Total)" -ForegroundColor Cyan
Write-Host "Succeeded:        $($results.Success.Count)" -ForegroundColor Green
Write-Host "Failed:           $($results.Failed.Count)" -ForegroundColor $(if ($results.Failed.Count -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($results.Success.Count -gt 0) {
    Write-Host "✓ Successfully Built:" -ForegroundColor Green
    $results.Success | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
    Write-Host ""
}

if ($results.Failed.Count -gt 0) {
    Write-Host "✗ Failed to Build:" -ForegroundColor Red
    $results.Failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    exit 1
} else {
    Write-Host "🎉 All pallets compiled successfully!" -ForegroundColor Green
    exit 0
}
