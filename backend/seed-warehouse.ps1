# Seed default warehouse
Write-Host "Seeding default warehouse..." -ForegroundColor Cyan

$env:DATABASE_URL = Get-Content .env | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_ -replace "^DATABASE_URL=", "" }

if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL not found in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Database URL found" -ForegroundColor Green

# Run the SQL seed file
Write-Host "Running warehouse seed SQL..." -ForegroundColor Cyan
psql $env:DATABASE_URL -f ".\prisma\seed-warehouse.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Warehouse seeded successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to seed warehouse. Make sure PostgreSQL client (psql) is installed." -ForegroundColor Yellow
    Write-Host "You can also run the SQL manually from prisma/seed-warehouse.sql" -ForegroundColor Yellow
}
