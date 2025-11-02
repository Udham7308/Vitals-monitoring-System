@echo off
echo ========================================
echo    IV Monitoring System Startup
echo ========================================
echo.

echo [1/3] Starting MongoDB...
start "MongoDB Server" cmd /k "mongod"
echo MongoDB starting in new window...
echo.

timeout /t 5 /nobreak >nul

echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d C:\Users\udham\Downloads\IV-monitoring-project\server && npm run dev"
echo Backend server starting in new window...
echo.

timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend Client...
start "Frontend Client" cmd /k "cd /d C:\Users\udham\Downloads\IV-monitoring-project\client && npm run dev"
echo Frontend client starting in new window...
echo.

echo ========================================
echo    All servers are starting up...
echo ========================================
echo.
echo 🌐 Open your browser and go to: http://localhost:3000
echo.
echo 📊 API Health Check: http://localhost:5000/api/health
echo.
echo ⚠️  Keep all 3 command windows open while using the app!
echo.
echo Press any key to close this startup window...
pause >nul
