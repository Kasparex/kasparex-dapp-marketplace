@echo off
setlocal
cd /d "%~dp0\.."
echo Krex Node PM2 boot setup (Windows)
echo.
where pm2 >nul 2>nul
if errorlevel 1 (
  echo PM2 is required. Run: npm install -g pm2
  exit /b 1
)
echo Step 1: build and start the mirror process under PM2
call npm run build
call pm2 delete krex-node-mirror 2>nul
call pm2 start ecosystem.config.cjs
echo.
echo Step 2: save the current PM2 process list
call pm2 save
echo.
echo Step 3: install Windows boot helper (pm2 startup does NOT work on Windows)
where pm2-startup >nul 2>nul
if errorlevel 1 (
  echo Installing pm2-windows-startup globally...
  call npm install -g pm2-windows-startup
)
call pm2-startup install
echo.
echo Done. PM2 will resurrect krex-node-mirror after you log in to Windows.
echo Verify: pm2 list   should show krex-node-mirror online
echo Logs: pm2 logs krex-node-mirror
echo.
echo Note: close the npm run mirror terminal if it is still open, then use PM2 only.
endlocal
