@echo off
title FlyUp - TTS CAT Service (:5001)
echo ===================================================
echo           STARTING TTS CAT SERVICE
echo ===================================================
echo Service URL: http://127.0.0.1:5001
echo ===================================================
echo.
TTS\venv\Scripts\python.exe TTS\TTS\TTS\cat_service_api.py
pause
