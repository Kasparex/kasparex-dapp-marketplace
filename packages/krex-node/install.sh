#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required (20+). https://nodejs.org"
  exit 1
fi
NODE_MAJOR="$(node -p "parseInt(process.versions.node.split('.')[0],10)")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js 20+ required, found $(node -v)"
  exit 1
fi
npm ci
npm run build
echo "Krex Node built. Copy config.example.json to config.json, then: npm run heartbeat"
