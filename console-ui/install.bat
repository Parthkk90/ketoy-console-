@echo off
echo Installing dependencies for Ketoy Console UI...
echo.

cd /d "%~dp0"

echo Removing old node_modules if exists...
if exist node_modules (
    rmdir /s /q node_modules
)

echo.
echo Installing npm packages...
call npm install

echo.
echo Installation complete!
echo.
echo You can now run: npm run dev
echo.
pause
