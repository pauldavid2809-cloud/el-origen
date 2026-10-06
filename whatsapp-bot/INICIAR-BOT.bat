@echo off
setlocal
title Bot de WhatsApp - El Origen
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERROR] Node.js no esta instalado. Descargue la version LTS en https://nodejs.org/
  start https://nodejs.org/
  pause
  exit /b
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo [AVISO] Se creo el archivo .env. Abralo, pegue WHATSAPP_QUEUE_SECRET y vuelva a ejecutar.
  notepad ".env"
  pause
  exit /b
)

if not exist "node_modules" (
  echo Instalando librerias por primera vez...
  call npm install
)

start "" http://localhost:3001
node index.js
pause
