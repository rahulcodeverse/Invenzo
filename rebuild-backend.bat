@echo off
echo ========================================
echo Rebuilding Backend for Warehouse Fixes
echo ========================================
echo.

cd /d "%~dp0backend"

echo Stopping existing backend...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *backend*" 2>nul

echo.
echo Building backend...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build successful!
echo ========================================
echo.
echo To start the backend, run:
echo   npm run start:dev
echo.
echo Or press any key to start now...
pause >nul

start "Invenzo Backend" cmd /k "npm run start:dev"

echo.
echo Backend is starting in a new window...
echo.
pause
