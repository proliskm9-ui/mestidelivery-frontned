@echo off
echo ============================================
echo Getting SSL certificate for No-IP domain
echo ============================================
echo.

REM ВАЖНО: Замените на ваш домен No-IP!
set DOMAIN=mestiapi.ddns.net
set EMAIL=nekglek@gmail.com

echo Domain: %DOMAIN%
echo Email: %EMAIL%
echo.
echo MAKE SURE YOUR PYTHON SERVER IS STOPPED (Port 80 must be free)!
echo.
pause

REM Try to get cert using Certbot
certbot certonly --standalone --non-interactive --agree-tos --email %EMAIL% -d %DOMAIN%

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Certbot failed or not installed.
    echo 1. Install Certbot if you haven't: https://dl.eff.org/certbot-beta-installer-win32.exe
    echo 2. Run this script as Administrator
    echo 3. Ensure no other server listens on port 80
    echo 4. Make sure your domain %DOMAIN% points to your IP
    echo.
    pause
    exit /b
)

echo.
echo Certificate obtained! Copying to ./certs folder...

if not exist "certs" mkdir certs

copy "C:\Certbot\live\%DOMAIN%\fullchain.pem" "certs\fullchain.pem" /Y
copy "C:\Certbot\live\%DOMAIN%\privkey.pem" "certs\privkey.pem" /Y

echo.
echo ============================================
echo DONE! Certificates are in server/certs/
echo You can now start python main.py
echo ============================================
pause
