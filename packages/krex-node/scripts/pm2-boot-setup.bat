@echo off
setlocal
cd /d "%~dp0.."

echo Step 1: build and start the edge process under PM2
call npm run build
call pm2 delete krex-node-edge 2>nul
call pm2 delete krex-node-mirror 2>nul
call pm2 start ecosystem.config.cjs
call pm2 save

echo.
echo Step 2: install Windows PM2 startup helper (run once)
call npm install -g pm2-windows-startup
call pm2-startup install

echo.
echo Done. PM2 will resurrect krex-node-edge after you log in to Windows.
echo Verify: pm2 list   should show krex-node-edge online
echo Logs: pm2 logs krex-node-edge
echo.
echo Note: close any manual npm run edge terminal, then use PM2 only.
