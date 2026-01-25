@echo off
REM WeVibin' Master Runner - Batch Script for Windows

echo.
echo ========================================
echo   WeVibin' Master Runner
echo   Starting all services...
echo ========================================
echo.

REM Start server
echo Starting Server on localhost:3001...
start "WeVibin Server" cmd /k "cd server && npm run dev"

REM Wait before starting client
timeout /t 2 /nobreak

REM Start client dev server
echo Starting Client Dev Server...
start "WeVibin Client Dev" cmd /k "cd client && npm run dev"

REM Wait before starting Electron
timeout /t 8 /nobreak

REM Start Electron
echo Starting Electron App...
start "WeVibin Electron" cmd /k "cd client && npm run electron"

echo.
echo ========================================
echo   All processes started!
echo   - Server: http://localhost:3001
echo   - Client: https://localhost:5176
echo   - Electron: Opening...
echo.
echo   Close any command window to stop that service
echo ========================================
echo.

pause
