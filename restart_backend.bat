@echo off
echo Stopping old Python processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *main.py*" 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend server...
cd /d "%~dp0backend"
call venv\Scripts\activate
python main.py
