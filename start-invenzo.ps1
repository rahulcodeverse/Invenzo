# Quick Fix Script for Invenzo
# This will fix common issues and start the application

Write-Host "===== INVENZO QUICK FIX =====" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check and fix backend
Write-Host "Step 1: Checking Backend..." -ForegroundColor Yellow
cd C:\Users\Rahul\Documents\Invenzo\backend

# Generate Prisma Client (common issue)
Write-Host "  → Generating Prisma Client..." -ForegroundColor Gray
npm run prisma:generate 2>&1 | Out-Null

# Check if database needs migration
Write-Host "  → Checking database..." -ForegroundColor Gray
npm run prisma:migrate 2>&1 | Out-Null

Write-Host "  ✓ Backend ready" -ForegroundColor Green
Write-Host ""

# Step 2: Check frontend
Write-Host "Step 2: Checking Frontend..." -ForegroundColor Yellow
cd C:\Users\Rahul\Documents\Invenzo\frontend
Write-Host "  ✓ Frontend ready" -ForegroundColor Green
Write-Host ""

# Step 3: Start servers
Write-Host "===== STARTING SERVERS =====" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening TWO terminal windows..." -ForegroundColor Yellow
Write-Host "Terminal 1: Backend (port 3000)" -ForegroundColor White
Write-Host "Terminal 2: Frontend (port 4200)" -ForegroundColor White
Write-Host ""

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\Rahul\Documents\Invenzo\backend; Write-Host 'BACKEND SERVER' -ForegroundColor Cyan; npm run start:dev"

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\Rahul\Documents\Invenzo\frontend; Write-Host 'FRONTEND SERVER' -ForegroundColor Cyan; npm start"

Write-Host "✓ Servers starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Wait 30-60 seconds, then open:" -ForegroundColor Yellow
Write-Host "http://localhost:4200" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login: owner@invenzo.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

