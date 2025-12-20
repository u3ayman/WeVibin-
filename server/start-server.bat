@echo off
REM WeVibin' Server Startup Batch Script
REM This script starts the WeVibin' server as a production service

cd /d "C:\Users\Administrator\WeVibin-\server"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start the server
echo Starting WeVibin' server on port 3001...
node dist/index.js

REM Keep the window open if there's an error
if errorlevel 1 (
    echo.
    echo Server failed to start. Press any key to exit...
    pause
)
