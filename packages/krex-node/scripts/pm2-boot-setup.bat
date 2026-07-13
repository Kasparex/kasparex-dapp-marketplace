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
echo Step 1: start the mirror process (if not already running)
call pm2 start ecosystem.config.cjs 2>nul
echo.
echo Step 2: save the current PM2 process list
call pm2 save
echo.
echo Step 3: register PM2 to start on Windows login/boot
echo PM2 will print a command. Copy it, open an elevated CMD/PowerShell, and run it once.
call pm2 startup
echo.
echo Done. After running the elevated command once, your node restarts automatically on reboot.
echo To stop auto-start later: pm2 unstartup
endlocal
