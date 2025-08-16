@echo off
echo Starting GlobeTrotter Application...
echo.

echo [1/2] Starting Backend Server (Port 5001)...
start "GlobeTrotter Backend" cmd /k "cd /d \"c:\Users\BAPS\OneDrive - pdpu.ac.in\Desktop\GlobeTrotter-1\backend\" && node server.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 3000)...
start "GlobeTrotter Frontend" cmd /k "cd /d \"c:\Users\BAPS\OneDrive - pdpu.ac.in\Desktop\GlobeTrotter-1\frontend\" && npm start"

echo.
echo ✅ Both servers are starting...
echo 📡 Backend: http://localhost:5001
echo 🌐 Frontend: http://localhost:3000
echo.
echo Wait for both servers to fully load, then test your community features!
pause
