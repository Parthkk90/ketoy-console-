# Ketoy Console UI - Installation Script
Write-Host "Installing dependencies for Ketoy Console UI..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Remove old node_modules if exists
if (Test-Path "node_modules") {
    Write-Host "Removing old node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
}

# Remove package-lock.json for clean install
if (Test-Path "package-lock.json") {
    Write-Host "Removing old package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force package-lock.json
}

Write-Host ""
Write-Host "Installing npm packages..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run the development server with:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Installation failed. Please check the errors above." -ForegroundColor Red
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
