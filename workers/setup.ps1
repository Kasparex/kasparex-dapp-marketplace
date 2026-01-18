# Kasparex Rewards Database Setup Script (PowerShell)
# This script sets up the Cloudflare D1 database for rewards

Write-Host "🚀 Setting up Kasparex Rewards Database..." -ForegroundColor Cyan

# Step 1: Create D1 database
Write-Host ""
Write-Host "📦 Step 1: Creating D1 database..." -ForegroundColor Yellow
Write-Host "Running: wrangler d1 create kasparex-rewards"
Write-Host ""
wrangler d1 create kasparex-rewards

Write-Host ""
Write-Host "✅ Database created!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Copy the database_id from the output above" -ForegroundColor Yellow
Write-Host "   Then update wrangler.toml with:"
Write-Host "   database_id = `"YOUR_DATABASE_ID_HERE`""
Write-Host ""
Read-Host "Press Enter after updating wrangler.toml..."

# Step 2: Initialize schema
Write-Host ""
Write-Host "📋 Step 2: Initializing database schema..." -ForegroundColor Yellow
wrangler d1 execute kasparex-rewards --file=./schema-rewards.sql

Write-Host ""
Write-Host "✅ Schema initialized!" -ForegroundColor Green

# Step 3: Set up secrets (optional)
Write-Host ""
Write-Host "🔐 Step 3: Setting up secrets (optional)..." -ForegroundColor Yellow
Write-Host ""
$setStoracha = Read-Host "Do you want to set STORACHA_API_KEY? (y/n)"
if ($setStoracha -eq "y" -or $setStoracha -eq "Y") {
    wrangler secret put STORACHA_API_KEY
}

Write-Host ""
$setArchive = Read-Host "Do you want to set ARCHIVE_AUTH_TOKEN? (y/n)"
if ($setArchive -eq "y" -or $setArchive -eq "Y") {
    wrangler secret put ARCHIVE_AUTH_TOKEN
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Deploy workers: wrangler deploy"
Write-Host "2. Set NEXT_PUBLIC_CLOUDFLARE_WORKER_URL in Vercel environment variables"
Write-Host "3. Test the endpoints"
