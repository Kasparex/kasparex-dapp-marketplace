@echo off
setlocal EnableExtensions
REM Krex Edge: Cloudflare DNS + Tunnel setup for kasparex.com
REM Run from packages/krex-node after cloudflared is installed.

set EDGE_HOST=edge.kasparex.com
set TUNNEL_NAME=krex-edge
set CLOUDFLARED_DIR=%USERPROFILE%\.cloudflared

echo.
echo === Krex Edge: Cloudflare Tunnel setup ===
echo Hostname: %EDGE_HOST%
echo.

where cloudflared >nul 2>&1
if errorlevel 1 (
  echo cloudflared not found. Install with:
  echo   winget install --id Cloudflare.cloudflared -e
  exit /b 1
)

echo Step 1: Log in to Cloudflare (browser opens)
cloudflared tunnel login
if errorlevel 1 exit /b 1

echo.
echo Step 2: Create tunnel "%TUNNEL_NAME%"
cloudflared tunnel create %TUNNEL_NAME%
if errorlevel 1 exit /b 1

echo.
echo Step 3: Route DNS for %EDGE_HOST%
echo (Requires kasparex.com on Cloudflare with nameservers already switched.)
cloudflared tunnel route dns %TUNNEL_NAME% %EDGE_HOST%
if errorlevel 1 (
  echo DNS route failed. Add kasparex.com to Cloudflare first, then re-run this step:
  echo   cloudflared tunnel route dns %TUNNEL_NAME% %EDGE_HOST%
)

echo.
echo Step 4: Write %CLOUDFLARED_DIR%\config.yml
if not exist "%CLOUDFLARED_DIR%" mkdir "%CLOUDFLARED_DIR%"

for /f "usebackq delims=" %%T in (`cloudflared tunnel list ^| findstr /i "%TUNNEL_NAME%"`) do set TUNNEL_LINE=%%T
echo.
echo Copy your tunnel UUID from: cloudflared tunnel list
set /p TUNNEL_ID=Enter tunnel UUID for %TUNNEL_NAME%:

(
echo tunnel: %TUNNEL_ID%
echo credentials-file: %CLOUDFLARED_DIR%\%TUNNEL_ID%.json
echo.
echo ingress:
echo   - hostname: %EDGE_HOST%
echo     service: http://127.0.0.1:8788
echo   - service: http_status:404
) > "%CLOUDFLARED_DIR%\config.yml"

echo Wrote %CLOUDFLARED_DIR%\config.yml

echo.
echo Step 5: Install tunnel as Windows service
cloudflared service install
if errorlevel 1 (
  echo Service install failed. Run tunnel manually for testing:
  echo   cloudflared tunnel run %TUNNEL_NAME%
)

echo.
echo Step 6: Verify from another device
echo   https://%EDGE_HOST%/health
echo.
echo Step 7: Update config.json url to https://%EDGE_HOST%
echo Step 8: pm2 restart krex-node-edge
echo Step 9: Hub Nodes - enroll or edit URL to https://%EDGE_HOST%
echo.
endlocal
