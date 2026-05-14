# 🚀 RESTART BACKEND TO ENABLE ALL FEATURES

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  RESTARTING BACKEND WITH NEW FEATURES" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location "C:\Users\Rahul\Documents\Invenzo\backend"

Write-Host "✓ Stopping existing backend..." -ForegroundColor Yellow
# Kill any running backend processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Invenzo*" } | Stop-Process -Force

Write-Host "✓ Cleaning build cache..." -ForegroundColor Yellow
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "✓ Starting backend with new endpoints..." -ForegroundColor Yellow
Write-Host ""
Write-Host "NEW FEATURES ENABLED:" -ForegroundColor Green
Write-Host "  ✅ GET /api/v1/inventory/movements/summary" -ForegroundColor Green
Write-Host "  ✅ GET /api/v1/inventory/movements (with full filters)" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host ""

# Start the backend
npm run start:dev
