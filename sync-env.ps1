#!/usr/bin/env pwsh
# 🔄 Smart ENV Sync Script
# Sync API keys dari .env ke .env.production
# Tetapi JAGA setting production-specific lainnya

Write-Host "🔄 Syncing API Keys from .env to .env.production..." -ForegroundColor Cyan
Write-Host ""

# Check if files exist
if (-Not (Test-Path "backend\.env")) {
    Write-Host "❌ ERROR: backend\.env not found!" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path "backend\.env.production")) {
    Write-Host "❌ ERROR: backend\.env.production not found!" -ForegroundColor Red
    exit 1
}

# Variables yang akan di-sync (API keys dan credentials)
$syncVars = @(
    "GROQ_API_KEY",
    "GOOGLE_CLIENT_ID", 
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI"
)

Write-Host "📋 Variables yang akan di-sync:" -ForegroundColor Yellow
foreach ($var in $syncVars) {
    Write-Host "   - $var" -ForegroundColor Gray
}
Write-Host ""

# Read .env
$envContent = Get-Content "backend\.env" -Raw
$envLines = Get-Content "backend\.env"

# Read .env.production
$prodContent = Get-Content "backend\.env.production" -Raw
$prodLines = Get-Content "backend\.env.production"

# Extract values from .env
$envValues = @{}
foreach ($line in $envLines) {
    if ($line -match "^\s*([A-Z_]+)\s*=\s*(.*)$") {
        $key = $matches[1]
        $value = $matches[2]
        if ($syncVars -contains $key) {
            $envValues[$key] = $value
            Write-Host "✅ Found $key in .env" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "🔧 Updating .env.production..." -ForegroundColor Yellow

# Update .env.production
$updatedLines = @()
$updated = @{}

foreach ($line in $prodLines) {
    if ($line -match "^\s*([A-Z_]+)\s*=") {
        $key = $matches[1]
        if ($syncVars -contains $key -and $envValues.ContainsKey($key)) {
            # Replace with value from .env
            $updatedLines += "$key=$($envValues[$key])"
            $updated[$key] = $true
            Write-Host "   ✏️  Updated: $key" -ForegroundColor Cyan
        } else {
            # Keep original line (production-specific settings)
            $updatedLines += $line
        }
    } else {
        # Keep comments and empty lines
        $updatedLines += $line
    }
}

# Add any missing variables from .env
foreach ($key in $envValues.Keys) {
    if (-not $updated.ContainsKey($key)) {
        $updatedLines += "$key=$($envValues[$key])"
        Write-Host "   ➕ Added: $key" -ForegroundColor Green
    }
}

# Write back to .env.production
$updatedLines | Out-File -FilePath "backend\.env.production" -Encoding UTF8

Write-Host ""
Write-Host "✅ Sync complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Yellow
Write-Host "   - API keys synced from .env to .env.production" -ForegroundColor Gray
Write-Host "   - Production-specific settings preserved" -ForegroundColor Gray
Write-Host ""
