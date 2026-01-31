#!/usr/bin/env bash
set -euo pipefail

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "ERROR: VERCEL_TOKEN must be set in environment to deploy."
  echo "You can run: VERCEL_TOKEN=xxx bash scripts/deploy-vercel.sh"
  exit 1
fi

echo "Installing dependencies..."
npm ci

echo "Building..."
npm run build --if-present

echo "Deploying to Vercel (production)..."
npx vercel --token "$VERCEL_TOKEN" --prod --confirm

echo "Deployment command finished."
