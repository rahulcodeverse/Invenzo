# Invenzo Database Setup Script
# Run this script to set up your database and start the application

Write-Host "================================" -ForegroundColor Cyan
Write-Host "INVENZO DATABASE SETUP" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend
Set-Location "C:\Users\Rahul\Documents\Invenzo\backend"

Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "Prisma Client generated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Pushing database schema to Supabase..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push database schema" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Is your Supabase project active?" -ForegroundColor White
    Write-Host "2. Is the password correct in .env file?" -ForegroundColor White
    Write-Host "3. Is your internet connection working?" -ForegroundColor White
    exit 1
}
Write-Host "Database schema pushed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Seeding demo data..." -ForegroundColor Yellow
npm run prisma:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Seeding failed, but you can continue" -ForegroundColor Yellow
    Write-Host "You can run 'npm run prisma:seed' manually later" -ForegroundColor Yellow
}
else {
    Write-Host "Demo data seeded" -ForegroundColor Green
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend:  npm run start:dev" -ForegroundColor White
Write-Host "2. Start frontend: cd ../frontend && npm start" -ForegroundColor White
Write-Host "3. Open browser:   http://localhost:4200" -ForegroundColor White
Write-Host "4. Login:          owner@invenzo.com / password123" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to start the backend server..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Yellow
npm run start:dev

