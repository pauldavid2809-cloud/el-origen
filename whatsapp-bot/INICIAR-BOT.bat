@echo off
setlocal EnableDelayedExpansion
title Bot de WhatsApp - El Origen
color 0b
cls
cd /d "%~dp0"

echo ===================================================================
echo     BOT DE WHATSAPP - EL ORIGEN
echo     Envia por WhatsApp las entradas con QR aprobadas en el panel
echo ===================================================================
echo.

:: 1. Los archivos deben estar extraidos: no se puede ejecutar desde dentro del .zip
if not exist "%~dp0index.js" (
    color 0c
    echo [ERROR] No se encontraron los archivos del bot en esta carpeta.
    echo.
    echo No ejecute este archivo directamente desde el archivo .ZIP:
    echo  1. Cierre esta ventana.
    echo  2. Haga clic derecho sobre el .zip y elija "Extraer todo...".
    echo  3. Abra la carpeta extraida y vuelva a ejecutar INICIAR-BOT.bat.
    goto salir
)

:: 2. Node.js: en el PATH o en las carpetas de instalacion habituales
where node >nul 2>nul
if %errorlevel% equ 0 goto node_ok
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    goto node_ok
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    goto node_ok
)
if exist "%LocalAppData%\Programs\node\node.exe" (
    set "PATH=%LocalAppData%\Programs\node;%PATH%"
    goto node_ok
)
color 0c
echo [ERROR] Node.js no esta instalado en esta computadora.
echo.
echo Se abrira la pagina oficial https://nodejs.org/
echo  1. Descargue la version LTS recomendada.
echo  2. Ejecute el instalador y presione "Next" hasta terminar.
echo  3. Vuelva a hacer doble clic en INICIAR-BOT.bat.
start https://nodejs.org/
goto salir

:node_ok
echo [1/3] Node.js detectado:
node --version
echo.

:: 3. Configuracion: el paquete del cliente ya trae el archivo .env
if not exist "%~dp0.env" (
    if exist "%~dp0.env.example" copy "%~dp0.env.example" "%~dp0.env" >nul
    color 0e
    echo [AVISO] Falta el archivo de configuracion .env
    echo Se abrira en el Bloc de notas: pegue la clave WHATSAPP_QUEUE_SECRET, la misma de Vercel,
    echo guarde el archivo y vuelva a ejecutar INICIAR-BOT.bat.
    notepad "%~dp0.env"
    goto salir
)

:: 4. Librerias: solo la primera vez
if not exist "%~dp0node_modules" (
    echo [2/3] Instalando las librerias del bot por primera vez. Espere un momento...
    echo.
    call npm install --no-fund --no-audit
    if !errorlevel! neq 0 (
        color 0c
        echo.
        echo [ERROR] No se pudieron descargar las librerias.
        echo Revise la conexion a internet e intente de nuevo.
        goto salir
    )
) else (
    echo [2/3] Librerias listas.
)

echo.
echo [3/3] Iniciando el bot. Se abrira http://localhost:3001 para vincular el WhatsApp.
echo       Deje esta ventana abierta mientras quiera que se envien las entradas.
echo.
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3001"
node index.js

:salir
echo.
echo ===================================================================
echo   El bot se detuvo. Presione cualquier tecla para cerrar esta ventana.
echo ===================================================================
pause >nul
exit /b
