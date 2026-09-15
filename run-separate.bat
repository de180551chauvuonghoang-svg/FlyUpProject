@echo off
title FlyUp Launcher
echo ===================================================
echo     STARTING FLYUP (SEPARATE TERMINAL WINDOWS)
echo ===================================================
echo Starting Backend in a new window...
start "FlyUp Backend (:5000)" cmd /k "npm --prefix backend run dev"

echo Starting Frontend in a new window...
start "FlyUp Frontend (:5173)" cmd /k "npm --prefix frontend run dev"

echo ===================================================
echo Both services are starting!
echo Backend:  http://localhost:5000 (Swagger: /api-docs)
echo Frontend: http://localhost:5173
echo ===================================================
timeout /t 5
