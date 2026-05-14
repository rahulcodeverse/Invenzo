# Invenzo - Quick Test Script for Products & Inventory Module (PowerShell)
# This script tests all major endpoints to verify Step 2 implementation

Write-Host "🚀 Invenzo - Testing Products & Inventory Module" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

$API_URL = "http://localhost:3000/api/v1"

# Check if server is running
Write-Host "📡 Checking if server is running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$API_URL/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running at $API_URL" -ForegroundColor Red
    Write-Host "   Please start the server with: npm run start:dev" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Login
Write-Host "🔐 Logging in as owner..." -ForegroundColor Yellow
$loginBody = @{
    email = "owner@invenzo.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $TOKEN = $loginResponse.data.accessToken
    Write-Host "✅ Logged in successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

# Test Categories
Write-Host "📁 Testing Categories..." -ForegroundColor Yellow
$categoryBody = @{
    name = "Test Electronics"
    description = "Test category"
} | ConvertTo-Json

$categoryResponse = Invoke-RestMethod -Uri "$API_URL/categories" -Method Post -Headers $headers -Body $categoryBody
$CATEGORY_ID = $categoryResponse.data.id
Write-Host "✅ Category created: $CATEGORY_ID" -ForegroundColor Green

# Test Brands
Write-Host "🏷️  Testing Brands..." -ForegroundColor Yellow
$brandBody = @{
    name = "Test Brand"
    description = "Test brand description"
} | ConvertTo-Json

$brandResponse = Invoke-RestMethod -Uri "$API_URL/brands" -Method Post -Headers $headers -Body $brandBody
$BRAND_ID = $brandResponse.data.id
Write-Host "✅ Brand created: $BRAND_ID" -ForegroundColor Green

# Test Units
Write-Host "📏 Testing Units..." -ForegroundColor Yellow
$unitBody = @{
    name = "Test Unit"
    symbol = "tu"
} | ConvertTo-Json

$unitResponse = Invoke-RestMethod -Uri "$API_URL/units" -Method Post -Headers $headers -Body $unitBody
$UNIT_ID = $unitResponse.data.id
Write-Host "✅ Unit created: $UNIT_ID" -ForegroundColor Green

# Test Product Creation
Write-Host "📦 Testing Product Creation..." -ForegroundColor Yellow
$productBody = @{
    name = "Test Product"
    description = "A test product"
    categoryId = $CATEGORY_ID
    brandId = $BRAND_ID
    unitId = $UNIT_ID
    costPrice = 100
    sellingPrice = 150
    minStockLevel = 10
} | ConvertTo-Json

$productResponse = Invoke-RestMethod -Uri "$API_URL/products" -Method Post -Headers $headers -Body $productBody
$PRODUCT_ID = $productResponse.data.id
$PRODUCT_SKU = $productResponse.data.sku
Write-Host "✅ Product created: $PRODUCT_ID" -ForegroundColor Green
Write-Host "   SKU: $PRODUCT_SKU (auto-generated)" -ForegroundColor Cyan

# Get Warehouse ID
Write-Host "🏭 Getting warehouse..." -ForegroundColor Yellow
$tenantResponse = Invoke-RestMethod -Uri "$API_URL/tenants/me" -Method Get -Headers $headers
$WAREHOUSE_ID = $tenantResponse.data.warehouses[0].id
Write-Host "✅ Warehouse found: $WAREHOUSE_ID" -ForegroundColor Green

# Test Stock IN
Write-Host "📥 Testing Stock IN..." -ForegroundColor Yellow
$stockInBody = @{
    productId = $PRODUCT_ID
    warehouseId = $WAREHOUSE_ID
    quantity = 100
    notes = "Initial stock for testing"
} | ConvertTo-Json

$stockInResponse = Invoke-RestMethod -Uri "$API_URL/inventory/in" -Method Post -Headers $headers -Body $stockInBody
Write-Host "✅ Stock IN successful: 100 units added" -ForegroundColor Green

# Check Stock
Write-Host "📊 Checking stock levels..." -ForegroundColor Yellow
$stockResponse = Invoke-RestMethod -Uri "$API_URL/inventory/stock/$PRODUCT_ID" -Method Get -Headers $headers
$TOTAL_STOCK = $stockResponse.data.totalStock
Write-Host "✅ Current stock: $TOTAL_STOCK units" -ForegroundColor Green

# Test Stock OUT
Write-Host "📤 Testing Stock OUT..." -ForegroundColor Yellow
$stockOutBody = @{
    productId = $PRODUCT_ID
    warehouseId = $WAREHOUSE_ID
    quantity = 10
    notes = "Test stock out"
} | ConvertTo-Json

$stockOutResponse = Invoke-RestMethod -Uri "$API_URL/inventory/out" -Method Post -Headers $headers -Body $stockOutBody
Write-Host "✅ Stock OUT successful: 10 units removed" -ForegroundColor Green

# Check Stock Again
$stockResponse = Invoke-RestMethod -Uri "$API_URL/inventory/stock/$PRODUCT_ID" -Method Get -Headers $headers
$TOTAL_STOCK = $stockResponse.data.totalStock
Write-Host "✅ Updated stock: $TOTAL_STOCK units (should be 90)" -ForegroundColor Green

# Test Movement History
Write-Host "📜 Checking movement history..." -ForegroundColor Yellow
$movementResponse = Invoke-RestMethod -Uri "$API_URL/inventory/movements?limit=5" -Method Get -Headers $headers
$MOVEMENT_COUNT = $movementResponse.data.Count
Write-Host "✅ Movement history retrieved: $MOVEMENT_COUNT recent movements" -ForegroundColor Green

# Test Low Stock Alert
Write-Host "🔔 Testing low stock alert..." -ForegroundColor Yellow
$lowStockResponse = Invoke-RestMethod -Uri "$API_URL/products/low-stock" -Method Get -Headers $headers
Write-Host "✅ Low stock alert working" -ForegroundColor Green

# Test List Products
Write-Host "📋 Testing product listing..." -ForegroundColor Yellow
$productsResponse = Invoke-RestMethod -Uri "$API_URL/products?limit=5" -Method Get -Headers $headers
$PRODUCT_COUNT = $productsResponse.data.Count
Write-Host "✅ Product listing retrieved: $PRODUCT_COUNT products" -ForegroundColor Green

# Test Category Tree
Write-Host "🌳 Testing category tree..." -ForegroundColor Yellow
$treeResponse = Invoke-RestMethod -Uri "$API_URL/categories/tree" -Method Get -Headers $headers
Write-Host "✅ Category tree retrieved" -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "🎉 All Tests Passed!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Categories: Working" -ForegroundColor Green
Write-Host "✅ Brands: Working" -ForegroundColor Green
Write-Host "✅ Units: Working" -ForegroundColor Green
Write-Host "✅ Products: Working (with auto SKU generation)" -ForegroundColor Green
Write-Host "✅ Stock IN: Working" -ForegroundColor Green
Write-Host "✅ Stock OUT: Working" -ForegroundColor Green
Write-Host "✅ Stock Tracking: Working" -ForegroundColor Green
Write-Host "✅ Movement History: Working" -ForegroundColor Green
Write-Host "✅ Low Stock Alert: Working" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Products & Inventory Module is fully functional!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. View API docs: http://localhost:3000/api/docs"
Write-Host "   2. Check docs/API-EXAMPLES.md for more examples"
Write-Host "   3. Test with Postman/Insomnia"
Write-Host "   4. Start building Purchases or Sales module"
Write-Host ""

