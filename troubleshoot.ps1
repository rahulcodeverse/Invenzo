# Invenzo Troubleshooting Script
# Run this to diagnose and fix common startup issues

Write-Host "================================" -ForegroundColor Cyan
Write-Host "INVENZO TROUBLESHOOTING SCRIPT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "1. Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($nodeVersion) {
    Write-Host "   ✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Node.js not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "2. Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($npmVersion) {
    Write-Host "   ✓ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ npm not found!" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
Write-Host "3. Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "   ✓ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ PostgreSQL is installed but not running" -ForegroundColor Yellow
        Write-Host "   Starting PostgreSQL..." -ForegroundColor Yellow
        Start-Service $pgService.Name -ErrorAction SilentlyContinue
        Write-Host "   ✓ PostgreSQL started" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠ PostgreSQL service not found (you may be using Supabase or external DB)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Checking Backend..." -ForegroundColor Yellow

# Check backend directory
if (Test-Path "C:\Users\Rahul\Documents\Invenzo\backend") {
    Write-Host "   ✓ Backend directory exists" -ForegroundColor Green

    # Check node_modules
    if (Test-Path "C:\Users\Rahul\Documents\Invenzo\backend\node_modules") {
        Write-Host "   ✓ Backend node_modules exists" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Backend node_modules missing - Installing..." -ForegroundColor Yellow
        Set-Location "C:\Users\Rahul\Documents\Invenzo\backend"
        npm install
    }

    # Check .env
    if (Test-Path "C:\Users\Rahul\Documents\Invenzo\backend\.env") {
        Write-Host "   ✓ Backend .env exists" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Backend .env missing!" -ForegroundColor Red
        Write-Host "   Please create .env file in backend directory" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ Backend directory not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Checking Frontend..." -ForegroundColor Yellow

# Check frontend directory
if (Test-Path "C:\Users\Rahul\Documents\Invenzo\frontend") {
    Write-Host "   ✓ Frontend directory exists" -ForegroundColor Green

    # Check node_modules
    if (Test-Path "C:\Users\Rahul\Documents\Invenzo\frontend\node_modules") {
        Write-Host "   ✓ Frontend node_modules exists" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Frontend node_modules missing - Installing..." -ForegroundColor Yellow
        Set-Location "C:\Users\Rahul\Documents\Invenzo\frontend"
        npm install
    }
} else {
    Write-Host "   ✗ Frontend directory not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "6. Checking Ports..." -ForegroundColor Yellow

# Check port 3000
$port3000 = netstat -ano | findstr ":3000"
if ($port3000) {
    Write-Host "   ⚠ Port 3000 is in use" -ForegroundColor Yellow
    Write-Host "   $port3000" -ForegroundColor Gray
} else {
    Write-Host "   ✓ Port 3000 is available" -ForegroundColor Green
}

# Check port 4200
$port4200 = netstat -ano | findstr ":4200"
if ($port4200) {
    Write-Host "   ⚠ Port 4200 is in use" -ForegroundColor Yellow
    Write-Host "   $port4200" -ForegroundColor Gray
} else {
    Write-Host "   ✓ Port 4200 is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTICS COMPLETE" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Ask user what to do next
Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "1. Install backend dependencies" -ForegroundColor White
Write-Host "2. Install frontend dependencies" -ForegroundColor White
Write-Host "3. Setup database (generate Prisma + migrate)" -ForegroundColor White
Write-Host "4. Start backend server" -ForegroundColor White
Write-Host "5. Start frontend server" -ForegroundColor White
Write-Host "6. Do all of the above (recommended)" -ForegroundColor Green
Write-Host "7. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-7)"

switch ($choice) {
    "1" {
        Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
        Set-Location "C:\Users\Rahul\Documents\Invenzo\backend"
        npm install
        Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    }
    "2" {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        Set-Location "C:\Users\Rahul\Documents\Invenzo\frontend"
        npm install
        Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    }
    "3" {
        Write-Host "Setting up database..." -ForegroundColor Yellow
        Set-Location "C:\Users\Rahul\Documents\Invenzo\backend"
        npm run prisma:generate
        npm run prisma:migrate
        npm run prisma:seed
        Write-Host "✓ Database setup complete" -ForegroundColor Green
    }
    "4" {
        Write-Host "Starting backend server..." -ForegroundColor Yellow
        Set-Location "C:\Users\Rahul\Documents\Invenzo\backend"
        npm run start:dev
    }
    "5" {
        Write-Host "Starting frontend server..." -ForegroundColor Yellow
        Set-Location "C:\Users\Rahul\Documents\Invenzo\frontend"
        npm start
    }
    "6" {
        Write-Host "Setting up everything..." -ForegroundColor Yellow

        # Backend
        Write-Host "`nStep 1/5: Installing backend dependencies..." -ForegroundColor Cyan
        Set-Location "C:\Users\Rahul\Documents\Invenzo\backend"
        npm install

        Write-Host "`nStep 2/5: Setting up database..." -ForegroundColor Cyan
        npm run prisma:generate
        npm run prisma:migrate
        npm run prisma:seed

        # Frontend
        Write-Host "`nStep 3/5: Installing frontend dependencies..." -ForegroundColor Cyan
        Set-Location "C:\Users\Rahul\Documents\Invenzo\frontend"
        npm install

        Write-Host "`n✓ Setup complete!" -ForegroundColor Green
        Write-Host "`nNow you can start the servers:" -ForegroundColor Yellow
        Write-Host "Terminal 1: cd backend && npm run start:dev" -ForegroundColor White
        Write-Host "Terminal 2: cd frontend && npm start" -ForegroundColor White
    }
    "7" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
    }
}

