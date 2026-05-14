#!/usr/bin/env pwsh
# 🚀 Quick Fix - Restart Backend After Route Fix

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎯 PRODUCTS ROUTES FIX - BACKEND RESTART" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Controller order fixed in products.module.ts" -ForegroundColor Green
Write-Host "   - CategoriesController (first)" -ForegroundColor Gray
Write-Host "   - BrandsController (first)" -ForegroundColor Gray
Write-Host "   - UnitsController (first)" -ForegroundColor Gray
Write-Host "   - ProductsController (last - has :id wildcard)" -ForegroundColor Gray
Write-Host ""

Write-Host "🔄 Restarting backend server..." -ForegroundColor Yellow
Write-Host ""

Set-Location -Path "$PSScriptRoot\backend"

# Kill any existing NestJS processes
$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*nest*" -or $_.CommandLine -like "*nest start*"
}

if ($processes) {
    Write-Host "⏹️  Stopping existing backend processes..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "▶️  Starting backend in dev mode..." -ForegroundColor Green
Write-Host ""
Write-Host "───────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Start the backend
npm run start:dev

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ BACKEND STARTED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Wait for 'Nest application successfully started'" -ForegroundColor White
Write-Host "2. Refresh frontend (Ctrl + Shift + R)" -ForegroundColor White
Write-Host "3. Navigate to Products page" -ForegroundColor White
Write-Host "4. Check browser console - no more 404 errors!" -ForegroundColor White
Write-Host ""
Write-Host "✨ Products routes are now fixed!" -ForegroundColor Green
Write-Host ""

