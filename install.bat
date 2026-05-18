@echo off
title AXCIS AI - Installer
color 0B
echo.
echo   ================================
echo       AXCIS AI - Installer
echo   ================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [ERROR] Node.js is not installed!
    echo   Download from: https://nodejs.org/
    echo   Install the LTS version, then run this again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node -v') do set NODE_VER=%%a
echo   Node.js: %NODE_VER%

:: Install dependencies
echo.
echo   Installing dependencies...
echo   (This may take a minute)
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] npm install failed!
    pause
    exit /b 1
)

:: Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo.
    echo   Creating configuration file...
    (
        echo ANTHROPIC_API_KEY=
        echo AUTH_PIN=
        echo GMAIL_USER=
        echo GMAIL_APP_PASSWORD=
        echo TELEGRAM_BOT_TOKEN=
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    ) > .env.local
    echo   Created .env.local
)

:: Create data directory
if not exist "data" mkdir data

echo.
echo   ================================
echo       Installation Complete!
echo   ================================
echo.
echo   To configure, edit .env.local:
echo     - ANTHROPIC_API_KEY  (required - from console.anthropic.com)
echo     - AUTH_PIN            (optional - 4-6 digit PIN for security)
echo     - TELEGRAM_BOT_TOKEN (optional - for Telegram access)
echo.
echo   To start AXCIS AI:
echo     npm run dev
echo.
echo   To start with Telegram bot:
echo     npm run dev:all
echo.
echo   Then open: http://localhost:3000
echo.
pause
