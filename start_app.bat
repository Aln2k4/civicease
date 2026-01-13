@echo off
echo Starting CivicEase Application...
echo.

echo Starting Backend Server...
start "CivicEase Backend" cmd /k "cd server && npm start"

echo Starting Frontend Client...
start "CivicEase Frontend" cmd /k "cd client && npm run dev"

echo.
echo Application starting.
echo Backend API: http://localhost:5000
echo Frontend: http://localhost:5174
echo.
echo If the backend fails to connect to MongoDB, ensure your IP is whitelisted in Atlas.
echo.
pause
