#!/bin/bash
# Kasparex Rewards Database Setup Script
# This script sets up the Cloudflare D1 database for rewards

set -e

echo "🚀 Setting up Kasparex Rewards Database..."

# Step 1: Create D1 database
echo ""
echo "📦 Step 1: Creating D1 database..."
echo "Running: wrangler d1 create kasparex-rewards"
echo ""
wrangler d1 create kasparex-rewards

echo ""
echo "✅ Database created!"
echo ""
echo "⚠️  IMPORTANT: Copy the database_id from the output above"
echo "   Then update wrangler.toml with:"
echo "   database_id = \"YOUR_DATABASE_ID_HERE\""
echo ""
read -p "Press Enter after updating wrangler.toml..."

# Step 2: Initialize schema
echo ""
echo "📋 Step 2: Initializing database schema..."
wrangler d1 execute kasparex-rewards --file=./schema-rewards.sql

echo ""
echo "✅ Schema initialized!"

# Step 3: Set up secrets (optional)
echo ""
echo "🔐 Step 3: Setting up secrets (optional)..."
echo ""
read -p "Do you want to set STORACHA_API_KEY? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put STORACHA_API_KEY
fi

echo ""
read -p "Do you want to set ARCHIVE_AUTH_TOKEN? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put ARCHIVE_AUTH_TOKEN
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy workers: wrangler deploy"
echo "2. Set NEXT_PUBLIC_CLOUDFLARE_WORKER_URL in Vercel environment variables"
echo "3. Test the endpoints"
