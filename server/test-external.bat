@echo off
echo ====================================
echo Testing External Connection
echo ====================================
echo.
echo Server: 41.38.46.220:3001
echo.
curl -i http://41.38.46.220:3001/socket.io/?EIO=4^&transport=polling
echo.
echo ====================================
echo If you see HTTP 200 or 400, server is accessible!
echo ====================================
pause
