@echo off
echo Getting SSL certificate for mestigoapi.duckdns.org...
echo MAKE SURE YOUR PYTHON SERVER IS STOPPED (Port 80 must be free)!
echo.

REM Try to get cert using Certbot
certbot certonly --standalone --non-interactive --agree-tos --email nekglek@gmail.com -d mestigoapi.duckdns.org

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Certbot failed or not installed.
    echo 1. Install Certbot if you havent: https://dl.eff.org/certbot-beta-installer-win32.exe
    echo 2. Run this script as Administrator
    echo 3. Ensure no other server listens on port 80
    echo.
    pause
    exit /b
)

echo.
echo Certificate obtained! Copying to ./certs folder...

if not exist "certs" mkdir certs

copy "C:\Certbot\live\mestigoapi.duckdns.org\fullchain.pem" "certs\fullchain.pem" /Y
copy "C:\Certbot\live\mestigoapi.duckdns.org\privkey.pem" "certs\privkey.pem" /Y

echo.
echo DONE! Certificates are in server/certs/
echo You can now start python main.py
pause
