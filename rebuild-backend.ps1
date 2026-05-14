# Rebuild and Restart Backend
Write-Host "Rebuilding Backend..." -ForegroundColor Yellow

# Navigate to backend directory
Set-Location C:\Users\Rahul\Documents\Invenzo\backend

# Kill any existing backend processes
Write-Host "Stopping existing backend processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Invenzo\backend*" } | Stop-Process -Force

# Build the backend
Write-Host "Building backend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start the backend, run:" -ForegroundColor Yellow
    Write-Host "  npm run start:dev" -ForegroundColor White
} else {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}
