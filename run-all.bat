@echo off
title FlyUp Launcher - Full Stack + TTS
echo ===================================================
echo     STARTING FLYUP FULL STACK (FE + BE + TTS)
echo ===================================================
echo Starting Backend in a new window...
start "FlyUp Backend (:5000)" cmd /k "npm --prefix backend run dev"

echo Starting Frontend in a new window...
start "FlyUp Frontend (:5173)" cmd /k "npm --prefix frontend run dev"

echo Starting TTS CAT Service in a new window...
start "FlyUp TTS CAT Service (:5001)" cmd /k "TTS\venv\Scripts\python.exe TTS\TTS\TTS\cat_service_api.py"

echo ===================================================
echo All 3 services are starting!
echo Backend:  http://localhost:5000 (Swagger: /api-docs)
echo Frontend: http://localhost:5173
echo TTS CAT:  http://localhost:5001
echo ===================================================
timeout /t 5
