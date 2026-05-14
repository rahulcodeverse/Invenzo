@echo off
cls
echo ================================================================
echo   RESTARTING BACKEND - WAREHOUSE FIX
echo ================================================================
echo.
echo This will:
echo   1. Build the backend (compile TypeScript)
echo   2. Start the backend server
echo.
echo BEFORE RUNNING THIS:
echo   - Make sure to STOP the old backend (Ctrl+C in that terminal)
echo   - Close any browser tabs using the old backend
echo.
pause
echo.
echo ================================================================
echo   Step 1/2: Building Backend...
echo ================================================================
cd /d "%~dp0backend"
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo.
echo ================================================================
echo   Step 2/2: Starting Backend Server...
echo ================================================================
echo.
echo Backend will start now. Keep this window open!
echo Press Ctrl+C to stop the backend later.
echo.
echo ================================================================
pause
call npm run start:dev
