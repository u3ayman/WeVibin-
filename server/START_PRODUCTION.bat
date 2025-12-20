@echo off
REM ================================================
REM WeVibin' Production Server Startup
REM Server: MYSQL-SERVER
REM IP: 41.38.46.220:3001
REM ================================================

cd /d "C:\Users\Administrator\WeVibin-\server"

echo.
echo ========================================
echo WeVibin' Server Starting...
echo ========================================
echo Server: MYSQL-SERVER
echo Public IP: 41.38.46.220
echo Port: 3001
echo ========================================
echo.

REM Load environment variables
if exist .env (
    echo Loading environment configuration...
)

REM Start the server
echo Starting server...
node dist/index.js

REM Keep window open on error
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Server failed to start
    echo ========================================
    echo.
    echo Common issues:
    echo - Port 3001 already in use
    echo - Run: netstat -ano ^| findstr :3001
    echo - Firewall blocking connections
    echo.
    pause
)
