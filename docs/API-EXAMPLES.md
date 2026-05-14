# Invenzo API Examples - Products & Inventory Module

## Authentication
First, login to get access token:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@invenzo.com","password":"password123"}'
```

Save the `accessToken` from response and use it in subsequent requests.

---

## CATEGORIES

### Create Category
```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic items and gadgets"
  }'
```

### Create Sub-Category
```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptops",
    "description": "Laptop computers",
    "parentId": "PARENT_CATEGORY_ID_HERE"
  }'
```

### Get All Categories
```bash
curl -X GET "http://localhost:3000/api/v1/categories?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Category Tree
```bash
curl -X GET http://localhost:3000/api/v1/categories/tree \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Category by ID
```bash
curl -X GET http://localhost:3000/api/v1/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Category
```bash
curl -X PATCH http://localhost:3000/api/v1/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Electronics",
    "description": "Updated description"
  }'
```

### Delete Category
```bash
curl -X DELETE http://localhost:3000/api/v1/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## BRANDS

### Create Brand
```bash
curl -X POST http://localhost:3000/api/v1/brands \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dell",
    "description": "Dell Technologies"
  }'
```

### Get All Brands
```bash
curl -X GET "http://localhost:3000/api/v1/brands?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Brand by ID
```bash
curl -X GET http://localhost:3000/api/v1/brands/BRAND_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Brand
```bash
curl -X PATCH http://localhost:3000/api/v1/brands/BRAND_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dell Inc",
    "logo": "https://cloudinary.com/dell-logo.png"
  }'
```

### Delete Brand
```bash
curl -X DELETE http://localhost:3000/api/v1/brands/BRAND_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## UNITS

### Create Unit
```bash
curl -X POST http://localhost:3000/api/v1/units \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Piece",
    "symbol": "pcs"
  }'
```

### Get All Units
```bash
curl -X GET "http://localhost:3000/api/v1/units?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## PRODUCTS

### Create Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dell Latitude 5520",
    "description": "15.6 inch FHD, Intel i5, 8GB RAM, 256GB SSD",
    "categoryId": "CATEGORY_ID_HERE",
    "brandId": "BRAND_ID_HERE",
    "unitId": "UNIT_ID_HERE",
    "barcode": "8901234567890",
    "costPrice": 45000,
    "sellingPrice": 55000,
    "mrp": 60000,
    "taxRate": 18,
    "minStockLevel": 5,
    "reorderLevel": 10,
    "hasBatch": false,
    "hasSerial": false,
    "trackExpiry": false
  }'
```

### Get All Products
```bash
curl -X GET "http://localhost:3000/api/v1/products?page=1&limit=20&search=laptop" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Product by ID
```bash
curl -X GET http://localhost:3000/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Low Stock Products
```bash
curl -X GET http://localhost:3000/api/v1/products/low-stock \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Product
```bash
curl -X PATCH http://localhost:3000/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sellingPrice": 56000,
    "minStockLevel": 10
  }'
```

### Delete Product
```bash
curl -X DELETE http://localhost:3000/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Product Variant
```bash
curl -X POST http://localhost:3000/api/v1/products/PRODUCT_ID/variants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "16GB RAM Variant",
    "options": {"ram": "16GB", "storage": "512GB"},
    "costPrice": 50000,
    "sellingPrice": 60000
  }'
```

---

## INVENTORY

### Stock IN (Receive Stock)
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "warehouseId": "WAREHOUSE_ID_HERE",
    "quantity": 100,
    "reference": "PO-2024-0001",
    "notes": "Initial stock received"
  }'
```

### Stock IN with Batch Tracking
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "warehouseId": "WAREHOUSE_ID_HERE",
    "quantity": 50,
    "batchNumber": "BATCH-20240203-001",
    "manufactureDate": "2024-01-01",
    "expiryDate": "2025-01-01",
    "reference": "PO-2024-0001",
    "notes": "Batch tracked stock"
  }'
```

### Stock IN with Serial Numbers
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "warehouseId": "WAREHOUSE_ID_HERE",
    "quantity": 3,
    "serialNumbers": ["SN-001", "SN-002", "SN-003"],
    "reference": "PO-2024-0001",
    "notes": "Serial tracked laptops"
  }'
```

### Stock OUT (Issue Stock)
```bash
curl -X POST http://localhost:3000/api/v1/inventory/out \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "warehouseId": "WAREHOUSE_ID_HERE",
    "quantity": 10,
    "reference": "SO-2024-0001",
    "notes": "Sold to customer ABC"
  }'
```

### Stock TRANSFER between Warehouses
```bash
curl -X POST http://localhost:3000/api/v1/inventory/transfer \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "fromWarehouseId": "SOURCE_WAREHOUSE_ID",
    "toWarehouseId": "DESTINATION_WAREHOUSE_ID",
    "quantity": 20,
    "notes": "Stock balancing between warehouses"
  }'
```

### Stock ADJUSTMENT
```bash
curl -X POST http://localhost:3000/api/v1/inventory/adjust \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "warehouseId": "WAREHOUSE_ID_HERE",
    "type": "DAMAGE",
    "quantity": -5,
    "reason": "5 units damaged during handling"
  }'
```

### Get Product Stock Details
```bash
curl -X GET http://localhost:3000/api/v1/inventory/stock/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Stock Movements History
```bash
curl -X GET "http://localhost:3000/api/v1/inventory/movements?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Expiring Batches
```bash
curl -X GET "http://localhost:3000/api/v1/inventory/expiring?days=30" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Complete Workflow Example

### 1. Setup Master Data
```bash
# Create Category
CATEGORY_ID=$(curl -X POST http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Electronics"}' | jq -r '.data.id')

# Create Brand
BRAND_ID=$(curl -X POST http://localhost:3000/api/v1/brands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Dell"}' | jq -r '.data.id')

# Create Unit
UNIT_ID=$(curl -X POST http://localhost:3000/api/v1/units \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Piece","symbol":"pcs"}' | jq -r '.data.id')
```

### 2. Create Product
```bash
PRODUCT_ID=$(curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\":\"Dell Laptop\",
    \"categoryId\":\"$CATEGORY_ID\",
    \"brandId\":\"$BRAND_ID\",
    \"unitId\":\"$UNIT_ID\",
    \"costPrice\":45000,
    \"sellingPrice\":55000
  }" | jq -r '.data.id')
```

### 3. Add Stock
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\":\"$PRODUCT_ID\",
    \"warehouseId\":\"$WAREHOUSE_ID\",
    \"quantity\":100
  }"
```

### 4. Issue Stock
```bash
curl -X POST http://localhost:3000/api/v1/inventory/out \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\":\"$PRODUCT_ID\",
    \"warehouseId\":\"$WAREHOUSE_ID\",
    \"quantity\":10
  }"
```

### 5. Check Stock
```bash
curl -X GET "http://localhost:3000/api/v1/inventory/stock/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing with Postman

1. Import collection from Swagger: http://localhost:3000/api/docs
2. Set environment variable `accessToken`
3. Use {{accessToken}} in Authorization header
4. Test all endpoints systematically

---

## Expected Responses

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-02-03T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2024-02-03T12:00:00.000Z",
  "path": "/api/v1/products",
  "method": "POST"
}
```

---

## Notes

- All endpoints require JWT authentication (except auth endpoints)
- OWNER and MANAGER roles have full access
- STAFF has limited access (no delete operations)
- ACCOUNTANT has read-only access to products
- All data is automatically filtered by tenantId
- Pagination defaults: page=1, limit=20
- Search is case-insensitive

