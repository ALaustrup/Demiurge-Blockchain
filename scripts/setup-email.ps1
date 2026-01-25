# =============================================================================
# Demiurge Email Setup Script (Windows PowerShell)
# =============================================================================
# This script helps configure SMTP credentials for email verification
# Run: .\scripts\setup-email.ps1
# =============================================================================

param(
    [string]$SendGridApiKey,
    [string]$FromEmail = "noreply@demiurge.cloud",
    [string]$FromName = "Demiurge Blockchain"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Demiurge Email Configuration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for API key
if (-not $SendGridApiKey) {
    Write-Host "Enter your SendGrid API Key:" -ForegroundColor Yellow
    $SendGridApiKey = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
}

if (-not $SendGridApiKey -or $SendGridApiKey.Length -lt 20) {
    Write-Host "ERROR: Invalid API key. SendGrid API keys start with 'SG.'" -ForegroundColor Red
    exit 1
}

# Create secrets content
$secretsContent = @"
# Demiurge Production Secrets
# Generated: $(Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
# SECURITY: Never commit this file to git!

# SMTP Configuration (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=$SendGridApiKey
SMTP_FROM_EMAIL=$FromEmail
SMTP_FROM_NAME=$FromName
BASE_URL=https://demiurge.cloud
"@

# Save locally
$secretsPath = "config\production\.secrets"
$secretsContent | Out-File -FilePath $secretsPath -Encoding UTF8 -NoNewline
Write-Host "Created local secrets file: $secretsPath" -ForegroundColor Green

# Instructions for server deployment
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps - Deploy to Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy secrets to server:" -ForegroundColor Yellow
Write-Host "   scp config\production\.secrets ubuntu@51.210.209.112:/data/Demiurge-Blockchain/config/production/" -ForegroundColor White
Write-Host ""
Write-Host "2. SSH to server and rebuild QOR Auth:" -ForegroundColor Yellow
Write-Host "   ssh ubuntu@51.210.209.112" -ForegroundColor White
Write-Host ""
Write-Host "3. On the server, run:" -ForegroundColor Yellow
Write-Host @"
   cd /data/Demiurge-Blockchain
   git pull origin main
   cd services/qor-auth
   cargo build --release
   sudo systemctl restart qor-auth
   sudo journalctl -u qor-auth -f
"@ -ForegroundColor White
Write-Host ""
Write-Host "The logs should show: 'Email service configured'" -ForegroundColor Green
Write-Host ""
