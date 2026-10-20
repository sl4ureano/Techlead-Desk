@echo off
cd /d "%~dp0"
echo Abra http://localhost:8080 no Chrome ou Edge. Ctrl+C encerra o servidor.
py -3 -m http.server 8080 --bind 127.0.0.1
pause
