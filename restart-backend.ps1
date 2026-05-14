# Backend Restart Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INVENZO BACKEND - RESTART SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all node processes
Write-Host "Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✓ All Node.js processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Navigate to backend directory
Write-Host "Step 2: Navigating to backend directory..." -ForegroundColor Yellow
Set-Location -Path "C:\Users\Rahul\Documents\Invenzo\backend"
Write-Host "✓ In backend directory" -ForegroundColor Green
Write-Host ""

# Step 3: Generate Prisma Client
Write-Host "Step 3: Generating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate 2>&1 | Out-Null
Write-Host "✓ Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Step 4: Start the server
Write-Host "Step 4: Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKEND SERVER STARTING..." -ForegroundColor Cyan
Write-Host "  Wait for: 'Nest application started'" -ForegroundColor Cyan
Write-Host ""
Write-Host "  After startup, test login with:" -ForegroundColor Yellow
Write-Host "  POST http://localhost:3000/api/v1/auth/login" -ForegroundColor White
Write-Host ""
Write-Host "  If routes do not work, press Ctrl+C" -ForegroundColor Yellow
Write-Host "  and run this script again." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the development server
npm run start:dev

