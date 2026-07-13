#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
echo "Krex Node PM2 boot setup (Linux/macOS)"
if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 is required. Run: npm install -g pm2"
  exit 1
fi
echo "Step 1: start the mirror process (if not already running)"
pm2 start ecosystem.config.cjs 2>/dev/null || true
echo ""
echo "Step 2: save the current PM2 process list"
pm2 save
echo ""
echo "Step 3: register PM2 with systemd (Linux) or launchd (macOS)"
pm2 startup
echo ""
echo "Done. Run any command pm2 printed (often with sudo), then reboot to verify."
echo "To stop auto-start later: pm2 unstartup"
