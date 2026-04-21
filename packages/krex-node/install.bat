@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required ^(20+^). https://nodejs.org
  exit /b 1
)
call npm ci
call npm run build
echo Krex Node built. Copy config.example.json to config.json, then: npm run heartbeat
