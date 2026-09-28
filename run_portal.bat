@echo off
title Cloud Assignment Portal - Unified Server
echo ========================================================
echo   Starting Cloud-Based Assignment & Feedback Portal
echo ========================================================
echo.
echo [1/2] Checking Python and Database...
python -m backend.database.seed
echo.
echo [2/2] Starting Unified Server on http://localhost:8000...
echo.
echo   - Web Application: http://localhost:8000
echo   - Swagger API Docs: http://localhost:8000/docs
echo.
echo Keep this window open. Press Ctrl+C to stop.
echo ========================================================
python -m uvicorn backend.app:app --port 8000 --reload
pause
