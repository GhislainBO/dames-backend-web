@echo off
echo ========================================
echo DAMESELITE - Generation APK Test Ferme
echo ========================================
echo.

set PATH=C:\Program Files\nodejs;%PATH%
cd /d C:\TCC\frontend

echo [1/4] Build du frontend React...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Build frontend echoue!
    pause
    exit /b 1
)

echo.
echo [2/4] Synchronisation Capacitor Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Sync Capacitor echoue!
    pause
    exit /b 1
)

echo.
echo [3/4] Generation de l'APK debug...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Build APK echoue!
    pause
    exit /b 1
)

echo.
echo ========================================
echo APK genere avec succes!
echo.
echo Emplacement: C:\TCC\frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================
echo.

cd /d C:\TCC\frontend
pause
