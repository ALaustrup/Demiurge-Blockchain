# demiurge-deps Validation Script (Windows PowerShell)
# Purpose: Verify the monorepo is properly configured and ready to use

param(
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

function WriteSuccess { Write-Host "✓ $args" -ForegroundColor Green }
function WriteError { Write-Host "✗ $args" -ForegroundColor Red }
function WriteHeader { Write-Host $args -ForegroundColor Yellow }

Write-Header "[demiurge-deps] Validation Script"
Write-Host "======================================"
Write-Host ""

try {
    # Check 1: Workspace members exist
    Write-Header "[1/5] Checking workspace members..."
    $members = @("demiurge-substrate", "demiurge-network", "demiurge-consensus")
    foreach ($member in $members) {
        if (Test-Path $member) {
            Write-Success "Found $member/"
        } else {
            Write-Error "Missing $member/"
            exit 1
        }
    }
    Write-Host ""

    # Check 2: Cargo.toml structure
    Write-Header "[2/5] Checking Cargo.toml configuration..."
    $cargoContent = Get-Content Cargo.toml -Raw
    
    if ($cargoContent -match "^members =") {
        Write-Success "Workspace members defined"
    } else {
        Write-Error "Missing [workspace] members"
        exit 1
    }

    if ($cargoContent -match "^\[workspace.dependencies\]") {
        Write-Success "Workspace dependencies defined"
    } else {
        Write-Error "Missing [workspace.dependencies]"
        exit 1
    }
    Write-Host ""

    # Check 3: Clean if requested
    if ($Clean) {
        Write-Header "[3/5] Cleaning previous builds..."
        cargo clean
        Write-Success "Cleaned build artifacts"
        Write-Host ""
    }

    # Check 4: Build workspace
    Write-Header "[3/5] Building demiurge-deps workspace..."
    $buildOutput = cargo build --release --all 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Workspace builds successfully"
        # Show last 5 lines of build output
        $buildOutput | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
    } else {
        Write-Error "Build failed"
        $buildOutput | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" }
        exit 1
    }
    Write-Host ""

    # Check 5: Verify dependencies
    Write-Header "[4/5] Verifying pinned versions..."
    if ($cargoContent -match 'sp-api = \{ version = "39\.0\.0"') {
        Write-Success "sp-api pinned to 39.0.0"
    } else {
        Write-Error "sp-api version mismatch"
        exit 1
    }

    if ($cargoContent -match 'frame-support = \{ version = "39\.0\.0"') {
        Write-Success "frame-support pinned to 39.0.0"
    } else {
        Write-Error "frame-support version mismatch"
        exit 1
    }
    Write-Host ""

    # Check 6: Documentation
    Write-Header "[5/5] Checking documentation..."
    if (Test-Path "SETUP_GUIDE.md") {
        Write-Success "SETUP_GUIDE.md present"
    } else {
        Write-Error "Missing SETUP_GUIDE.md"
        exit 1
    }

    if (Test-Path "IMPLEMENTATION_SUMMARY.md") {
        Write-Success "IMPLEMENTATION_SUMMARY.md present"
    } else {
        Write-Error "Missing IMPLEMENTATION_SUMMARY.md"
        exit 1
    }
    Write-Host ""

    # Success
    Write-Host "======================================"
    Write-Host "✓ All validation checks passed!" -ForegroundColor Green
    Write-Host "======================================"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Review SETUP_GUIDE.md"
    Write-Host "2. Update blockchain/Cargo.toml to use demiurge-deps"
    Write-Host "3. Test blockchain build: cd ../blockchain && cargo build --release"
    Write-Host "4. Commit: git add -A && git commit -m 'feat: Add demiurge-deps monorepo'"
    Write-Host ""

} catch {
    Write-Error "Validation failed: $_"
    exit 1
}
