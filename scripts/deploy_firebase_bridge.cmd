@echo off
REM One-time deploy: Google auth bridge on Firebase Hosting (Firebase only, not Google Cloud Console).
REM Run from repo: Frontend\firebase-redirect
cd /d "%~dp0..\firebase-redirect"
echo.
echo 1. Log in with the Firebase project owner account (mestidelivery)
firebase login
echo.
echo 2. Deploy google-bridge.html to mestidelivery.firebaseapp.com
firebase deploy --only hosting --project mestidelivery
echo.
echo Done. Test: https://mestidelivery.firebaseapp.com/google-bridge.html
pause
