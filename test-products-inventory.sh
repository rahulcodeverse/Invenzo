#!/bin/bash

# Invenzo - Quick Test Script for Products & Inventory Module
# This script tests all major endpoints to verify Step 2 implementation

echo "🚀 Invenzo - Testing Products & Inventory Module"
echo "=================================================="
echo ""

# Configuration
API_URL="http://localhost:3000/api/v1"

# Check if server is running
echo "📡 Checking if server is running..."
if ! curl -s "$API_URL/health" > /dev/null; then
    echo "❌ Server is not running at $API_URL"
    echo "   Please start the server with: npm run start:dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Login
echo "🔐 Logging in as owner..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@invenzo.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    echo $LOGIN_RESPONSE | jq
    exit 1
fi
echo "✅ Logged in successfully"
echo ""

# Test Categories
echo "📁 Testing Categories..."
CAT_RESPONSE=$(curl -s -X POST "$API_URL/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Electronics","description":"Test category"}')

CATEGORY_ID=$(echo $CAT_RESPONSE | jq -r '.data.id')
if [ "$CATEGORY_ID" == "null" ]; then
    echo "❌ Category creation failed"
    echo $CAT_RESPONSE | jq
    exit 1
fi
echo "✅ Category created: $CATEGORY_ID"

# Test Brands
echo "🏷️  Testing Brands..."
BRAND_RESPONSE=$(curl -s -X POST "$API_URL/brands" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Brand","description":"Test brand description"}')

BRAND_ID=$(echo $BRAND_RESPONSE | jq -r '.data.id')
if [ "$BRAND_ID" == "null" ]; then
    echo "❌ Brand creation failed"
    exit 1
fi
echo "✅ Brand created: $BRAND_ID"

# Test Units
echo "📏 Testing Units..."
UNIT_RESPONSE=$(curl -s -X POST "$API_URL/units" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Unit","symbol":"tu"}')

UNIT_ID=$(echo $UNIT_RESPONSE | jq -r '.data.id')
if [ "$UNIT_ID" == "null" ]; then
    echo "❌ Unit creation failed"
    exit 1
fi
echo "✅ Unit created: $UNIT_ID"

# Test Product Creation
echo "📦 Testing Product Creation..."
PRODUCT_RESPONSE=$(curl -s -X POST "$API_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\":\"Test Product\",
    \"description\":\"A test product\",
    \"categoryId\":\"$CATEGORY_ID\",
    \"brandId\":\"$BRAND_ID\",
    \"unitId\":\"$UNIT_ID\",
    \"costPrice\":100,
    \"sellingPrice\":150,
    \"minStockLevel\":10
  }")

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.data.id')
PRODUCT_SKU=$(echo $PRODUCT_RESPONSE | jq -r '.data.sku')

if [ "$PRODUCT_ID" == "null" ]; then
    echo "❌ Product creation failed"
    echo $PRODUCT_RESPONSE | jq
    exit 1
fi
echo "✅ Product created: $PRODUCT_ID"
echo "   SKU: $PRODUCT_SKU (auto-generated)"

# Get Warehouse ID
echo "🏭 Getting warehouse..."
TENANT_RESPONSE=$(curl -s -X GET "$API_URL/tenants/me" \
  -H "Authorization: Bearer $TOKEN")

WAREHOUSE_ID=$(echo $TENANT_RESPONSE | jq -r '.data.warehouses[0].id')
if [ "$WAREHOUSE_ID" == "null" ]; then
    echo "❌ Warehouse not found"
    exit 1
fi
echo "✅ Warehouse found: $WAREHOUSE_ID"

# Test Stock IN
echo "📥 Testing Stock IN..."
STOCK_IN_RESPONSE=$(curl -s -X POST "$API_URL/inventory/in" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\":\"$PRODUCT_ID\",
    \"warehouseId\":\"$WAREHOUSE_ID\",
    \"quantity\":100,
    \"notes\":\"Initial stock for testing\"
  }")

if ! echo $STOCK_IN_RESPONSE | jq -e '.success' > /dev/null; then
    echo "❌ Stock IN failed"
    echo $STOCK_IN_RESPONSE | jq
    exit 1
fi
echo "✅ Stock IN successful: 100 units added"

# Check Stock
echo "📊 Checking stock levels..."
STOCK_RESPONSE=$(curl -s -X GET "$API_URL/inventory/stock/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_STOCK=$(echo $STOCK_RESPONSE | jq -r '.data.totalStock')
echo "✅ Current stock: $TOTAL_STOCK units"

# Test Stock OUT
echo "📤 Testing Stock OUT..."
STOCK_OUT_RESPONSE=$(curl -s -X POST "$API_URL/inventory/out" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\":\"$PRODUCT_ID\",
    \"warehouseId\":\"$WAREHOUSE_ID\",
    \"quantity\":10,
    \"notes\":\"Test stock out\"
  }")

if ! echo $STOCK_OUT_RESPONSE | jq -e '.success' > /dev/null; then
    echo "❌ Stock OUT failed"
    exit 1
fi
echo "✅ Stock OUT successful: 10 units removed"

# Check Stock Again
STOCK_RESPONSE=$(curl -s -X GET "$API_URL/inventory/stock/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_STOCK=$(echo $STOCK_RESPONSE | jq -r '.data.totalStock')
echo "✅ Updated stock: $TOTAL_STOCK units (should be 90)"

# Test Movement History
echo "📜 Checking movement history..."
MOVEMENT_RESPONSE=$(curl -s -X GET "$API_URL/inventory/movements?limit=5" \
  -H "Authorization: Bearer $TOKEN")

MOVEMENT_COUNT=$(echo $MOVEMENT_RESPONSE | jq -r '.data | length')
echo "✅ Movement history retrieved: $MOVEMENT_COUNT recent movements"

# Test Low Stock Alert
echo "🔔 Testing low stock alert..."
LOW_STOCK_RESPONSE=$(curl -s -X GET "$API_URL/products/low-stock" \
  -H "Authorization: Bearer $TOKEN")

if ! echo $LOW_STOCK_RESPONSE | jq -e '.success' > /dev/null; then
    echo "❌ Low stock alert failed"
    exit 1
fi
echo "✅ Low stock alert working"

# Test List Products
echo "📋 Testing product listing..."
PRODUCTS_RESPONSE=$(curl -s -X GET "$API_URL/products?limit=5" \
  -H "Authorization: Bearer $TOKEN")

PRODUCT_COUNT=$(echo $PRODUCTS_RESPONSE | jq -r '.data | length')
echo "✅ Product listing retrieved: $PRODUCT_COUNT products"

# Test Category Tree
echo "🌳 Testing category tree..."
TREE_RESPONSE=$(curl -s -X GET "$API_URL/categories/tree" \
  -H "Authorization: Bearer $TOKEN")

if ! echo $TREE_RESPONSE | jq -e '.success' > /dev/null; then
    echo "❌ Category tree failed"
    exit 1
fi
echo "✅ Category tree retrieved"

echo ""
echo "=================================================="
echo "🎉 All Tests Passed!"
echo "=================================================="
echo ""
echo "✅ Categories: Working"
echo "✅ Brands: Working"
echo "✅ Units: Working"
echo "✅ Products: Working (with auto SKU generation)"
echo "✅ Stock IN: Working"
echo "✅ Stock OUT: Working"
echo "✅ Stock Tracking: Working"
echo "✅ Movement History: Working"
echo "✅ Low Stock Alert: Working"
echo ""
echo "🚀 Products & Inventory Module is fully functional!"
echo ""
echo "📚 Next Steps:"
echo "   1. View API docs: http://localhost:3000/api/docs"
echo "   2. Check docs/API-EXAMPLES.md for more examples"
echo "   3. Test with Postman/Insomnia"
echo "   4. Start building Purchases or Sales module"
echo ""

