# Purchases Module - API Testing Guide

## Complete Purchase Workflow

This guide demonstrates the complete purchase workflow from vendor creation to payment.

---

## Prerequisites

```bash
# 1. Start server
cd backend
npm run start:dev

# 2. Login to get access token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@invenzo.com","password":"password123"}'

# Save the accessToken from response
TOKEN="YOUR_ACCESS_TOKEN_HERE"
```

---

## Part 1: Vendor Management

### Create Vendor

```bash
curl -X POST http://localhost:3000/api/v1/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Suppliers Ltd",
    "email": "contact@techsuppliers.com",
    "phone": "+91 9876543210",
    "address": "123 Supplier Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "gstNumber": "27ABCDE1234F1Z5",
    "creditLimit": 500000,
    "creditDays": 30
  }'

# Response:
{
  "success": true,
  "data": {
    "id": "vendor-uuid",
    "code": "VEN-0001",
    "name": "Tech Suppliers Ltd",
    ...
  }
}

# Save vendor ID
VENDOR_ID="vendor-uuid"
```

### Get All Vendors

```bash
curl -X GET "http://localhost:3000/api/v1/vendors?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Vendor Details

```bash
curl -X GET http://localhost:3000/api/v1/vendors/$VENDOR_ID \
  -H "Authorization: Bearer $TOKEN"

# Response includes:
# - Vendor details
# - Recent purchase orders
# - Outstanding amount
```

### Get Vendor Statement

```bash
curl -X GET http://localhost:3000/api/v1/vendors/$VENDOR_ID/statement \
  -H "Authorization: Bearer $TOKEN"

# Response includes:
# - Complete vendor history
# - All purchase orders
# - All invoices
# - All payments
# - Summary totals
```

### Update Vendor

```bash
curl -X PATCH http://localhost:3000/api/v1/vendors/$VENDOR_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "creditLimit": 750000,
    "phone": "+91 9876543211"
  }'
```

---

## Part 2: Purchase Order (PO)

### Create Purchase Order

```bash
# First, get product IDs (from existing products)
PRODUCT_ID_1="product-uuid-1"
PRODUCT_ID_2="product-uuid-2"

curl -X POST http://localhost:3000/api/v1/purchases/po \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "'$VENDOR_ID'",
    "expectedDate": "2024-03-15",
    "items": [
      {
        "productId": "'$PRODUCT_ID_1'",
        "quantity": 100,
        "unitPrice": 450,
        "taxRate": 18
      },
      {
        "productId": "'$PRODUCT_ID_2'",
        "quantity": 50,
        "unitPrice": 850,
        "taxRate": 18
      }
    ],
    "discount": 2000,
    "notes": "Urgent order for Q1 stock"
  }'

# Response:
{
  "success": true,
  "data": {
    "id": "po-uuid",
    "poNumber": "PO-2024-0001",
    "status": "DRAFT",
    "subtotal": 87500,
    "taxAmount": 15750,
    "discount": 2000,
    "total": 101250,
    ...
  }
}

# Save PO ID
PO_ID="po-uuid"
```

### Get All Purchase Orders

```bash
curl -X GET "http://localhost:3000/api/v1/purchases/po?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Purchase Order Details

```bash
curl -X GET http://localhost:3000/api/v1/purchases/po/$PO_ID \
  -H "Authorization: Bearer $TOKEN"

# Response includes:
# - Complete PO details
# - All line items with product details
# - Vendor information
# - GRN history
# - Received quantities
```

### Update Purchase Order

```bash
curl -X PATCH http://localhost:3000/api/v1/purchases/po/$PO_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "discount": 2500,
    "notes": "Updated discount negotiated"
  }'
```

### Approve Purchase Order

```bash
curl -X POST http://localhost:3000/api/v1/purchases/po/$PO_ID/approve \
  -H "Authorization: Bearer $TOKEN"

# PO status changes: DRAFT → CONFIRMED
```

### Get Pending POs (Not Fully Received)

```bash
curl -X GET http://localhost:3000/api/v1/purchases/po/pending \
  -H "Authorization: Bearer $TOKEN"

# Returns POs with items pending to receive
```

### Cancel Purchase Order

```bash
curl -X POST http://localhost:3000/api/v1/purchases/po/$PO_ID/cancel \
  -H "Authorization: Bearer $TOKEN"

# Only works if no GRN exists
```

---

## Part 3: Goods Received Note (GRN)

### Create GRN (Partial Receipt)

```bash
# Get warehouse ID
WAREHOUSE_ID="warehouse-uuid"

curl -X POST http://localhost:3000/api/v1/purchases/grn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "'$PO_ID'",
    "warehouseId": "'$WAREHOUSE_ID'",
    "receivedDate": "2024-02-03",
    "items": [
      {
        "productId": "'$PRODUCT_ID_1'",
        "quantity": 60,
        "batchNumber": "BATCH-2024-001",
        "expiryDate": "2025-12-31"
      }
    ],
    "notes": "Partial delivery - first batch"
  }'

# Response:
{
  "success": true,
  "data": {
    "grn": {
      "id": "grn-uuid",
      "grnNumber": "GRN-2024-0001",
      ...
    },
    "message": "GRN GRN-2024-0001 created successfully. Stock updated for 1 products."
  }
}

# What happens:
# 1. GRN record created
# 2. Stock IN operation executed
# 3. Inventory updated (+60 units)
# 4. Stock movement logged
# 5. Batch created (if product has batch tracking)
# 6. PO item receivedQty updated
# 7. PO status updated: CONFIRMED → PROCESSING

# Save GRN ID
GRN_ID="grn-uuid"
```

### Create GRN (Complete Receipt)

```bash
curl -X POST http://localhost:3000/api/v1/purchases/grn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "'$PO_ID'",
    "warehouseId": "'$WAREHOUSE_ID'",
    "items": [
      {
        "productId": "'$PRODUCT_ID_1'",
        "quantity": 40,
        "batchNumber": "BATCH-2024-002"
      },
      {
        "productId": "'$PRODUCT_ID_2'",
        "quantity": 50
      }
    ],
    "notes": "Final delivery - all items received"
  }'

# PO status updates: PROCESSING → COMPLETED
# (All items fully received)
```

### Get All GRNs

```bash
curl -X GET "http://localhost:3000/api/v1/purchases/grn?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Get GRN Details

```bash
curl -X GET http://localhost:3000/api/v1/purchases/grn/$GRN_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Part 4: Purchase Invoice

### Create Invoice

```bash
curl -X POST http://localhost:3000/api/v1/purchases/invoice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "'$PO_ID'",
    "vendorId": "'$VENDOR_ID'",
    "grnId": "'$GRN_ID'",
    "dueDate": "2024-03-03",
    "subtotal": 87500,
    "taxAmount": 15750,
    "discount": 2000
  }'

# Response:
{
  "success": true,
  "data": {
    "id": "invoice-uuid",
    "invoiceNumber": "PINV-2024-0001",
    "total": 101250,
    "balanceAmount": 101250,
    "status": "PENDING",
    ...
  }
}

# Save Invoice ID
INVOICE_ID="invoice-uuid"
```

### Get All Invoices

```bash
curl -X GET "http://localhost:3000/api/v1/purchases/invoice?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Invoice Details

```bash
curl -X GET http://localhost:3000/api/v1/purchases/invoice/$INVOICE_ID \
  -H "Authorization: Bearer $TOKEN"

# Response includes:
# - Invoice details
# - Related GRN
# - Related PO
# - Payment history
```

### Get Outstanding Invoices

```bash
curl -X GET http://localhost:3000/api/v1/purchases/invoice/outstanding \
  -H "Authorization: Bearer $TOKEN"

# Returns all pending/partial/overdue invoices
# With days overdue calculation
```

### Get Vendor-Wise Outstanding

```bash
curl -X GET http://localhost:3000/api/v1/purchases/invoice/vendor-wise-outstanding \
  -H "Authorization: Bearer $TOKEN"

# Returns outstanding grouped by vendor
# Sorted by amount (highest first)
```

---

## Part 5: Vendor Payment

### Record Payment (Partial)

```bash
curl -X POST http://localhost:3000/api/v1/purchases/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "'$VENDOR_ID'",
    "invoiceId": "'$INVOICE_ID'",
    "amount": 50000,
    "method": "BANK_TRANSFER",
    "reference": "TXN123456789",
    "notes": "Partial payment - first installment"
  }'

# Response:
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment-uuid",
      "paymentNumber": "PAY-2024-0001",
      "amount": 50000,
      ...
    },
    "message": "Payment PAY-2024-0001 recorded successfully"
  }
}

# What happens:
# 1. Payment record created
# 2. Invoice paidAmount updated: 0 → 50000
# 3. Invoice balanceAmount updated: 101250 → 51250
# 4. Invoice status updated: PENDING → PARTIAL
# 5. PO paymentStatus updated: PENDING → PARTIAL
```

### Record Payment (Full Settlement)

```bash
curl -X POST http://localhost:3000/api/v1/purchases/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "'$VENDOR_ID'",
    "invoiceId": "'$INVOICE_ID'",
    "amount": 51250,
    "method": "BANK_TRANSFER",
    "reference": "TXN987654321",
    "notes": "Final payment - invoice settled"
  }'

# Invoice status: PARTIAL → PAID
# PO paymentStatus: PARTIAL → PAID
```

### Record Payment (Against Vendor, No Invoice)

```bash
curl -X POST http://localhost:3000/api/v1/purchases/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "'$VENDOR_ID'",
    "amount": 10000,
    "method": "CASH",
    "notes": "Advance payment"
  }'

# Payment recorded without linking to specific invoice
```

### Get All Payments

```bash
curl -X GET "http://localhost:3000/api/v1/purchases/payment?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Payment Details

```bash
curl -X GET http://localhost:3000/api/v1/purchases/payment/PAYMENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Get Vendor Payment History

```bash
curl -X GET http://localhost:3000/api/v1/purchases/payment/vendor/$VENDOR_ID \
  -H "Authorization: Bearer $TOKEN"

# Response includes:
# - All payments for vendor
# - Total paid amount
# - Payment count
```

---

## Complete Workflow Example (PowerShell)

```powershell
# Set base URL
$API_URL = "http://localhost:3000/api/v1"

# 1. Login
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body (@{
    email = "owner@invenzo.com"
    password = "password123"
} | ConvertTo-Json) -ContentType "application/json"

$TOKEN = $loginResponse.data.accessToken
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

# 2. Create Vendor
$vendorResponse = Invoke-RestMethod -Uri "$API_URL/vendors" -Method Post -Headers $headers -Body (@{
    name = "ABC Suppliers"
    email = "abc@suppliers.com"
    creditLimit = 500000
    creditDays = 30
} | ConvertTo-Json)

$VENDOR_ID = $vendorResponse.data.id

# 3. Create Purchase Order
$poResponse = Invoke-RestMethod -Uri "$API_URL/purchases/po" -Method Post -Headers $headers -Body (@{
    vendorId = $VENDOR_ID
    items = @(
        @{
            productId = "existing-product-id"
            quantity = 100
            unitPrice = 450
            taxRate = 18
        }
    )
} | ConvertTo-Json -Depth 10)

$PO_ID = $poResponse.data.id

# 4. Approve PO
Invoke-RestMethod -Uri "$API_URL/purchases/po/$PO_ID/approve" -Method Post -Headers $headers

# 5. Create GRN
$grnResponse = Invoke-RestMethod -Uri "$API_URL/purchases/grn" -Method Post -Headers $headers -Body (@{
    purchaseOrderId = $PO_ID
    warehouseId = "existing-warehouse-id"
    items = @(
        @{
            productId = "existing-product-id"
            quantity = 100
        }
    )
} | ConvertTo-Json -Depth 10)

$GRN_ID = $grnResponse.data.grn.id

# 6. Create Invoice
$invoiceResponse = Invoke-RestMethod -Uri "$API_URL/purchases/invoice" -Method Post -Headers $headers -Body (@{
    purchaseOrderId = $PO_ID
    vendorId = $VENDOR_ID
    grnId = $GRN_ID
    dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    subtotal = 45000
    taxAmount = 8100
    discount = 0
} | ConvertTo-Json)

$INVOICE_ID = $invoiceResponse.data.id

# 7. Record Payment
Invoke-RestMethod -Uri "$API_URL/purchases/payment" -Method Post -Headers $headers -Body (@{
    vendorId = $VENDOR_ID
    invoiceId = $INVOICE_ID
    amount = 53100
    method = "BANK_TRANSFER"
    reference = "TXN123"
} | ConvertTo-Json)

Write-Host "✅ Complete purchase workflow executed successfully!"
```

---

## Testing Validation Rules

### 1. GRN Quantity Validation

```bash
# Try to receive more than ordered
curl -X POST http://localhost:3000/api/v1/purchases/grn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "'$PO_ID'",
    "warehouseId": "'$WAREHOUSE_ID'",
    "items": [
      {
        "productId": "'$PRODUCT_ID_1'",
        "quantity": 150
      }
    ]
  }'

# Expected: 400 Bad Request
# "Cannot receive 150 units... Only 100 units pending"
```

### 2. Payment Amount Validation

```bash
# Try to pay more than invoice balance
curl -X POST http://localhost:3000/api/v1/purchases/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "'$VENDOR_ID'",
    "invoiceId": "'$INVOICE_ID'",
    "amount": 999999
  }'

# Expected: 400 Bad Request
# "Payment amount exceeds invoice balance"
```

### 3. PO Status Validation

```bash
# Try to update completed PO
curl -X PATCH http://localhost:3000/api/v1/purchases/po/$PO_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "discount": 5000
  }'

# Expected: 400 Bad Request
# "Cannot update COMPLETED purchase order"
```

---

## Response Examples

### Successful GRN Creation

```json
{
  "success": true,
  "data": {
    "grn": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "grnNumber": "GRN-2024-0001",
      "purchaseOrderId": "po-uuid",
      "warehouseId": "warehouse-uuid",
      "receivedDate": "2024-02-03T00:00:00.000Z",
      "receivedBy": "user-uuid",
      "notes": "All items received",
      "createdAt": "2024-02-03T10:30:00.000Z",
      "items": [
        {
          "id": "item-uuid",
          "productId": "product-uuid",
          "quantity": 100,
          "batchNumber": "BATCH-2024-001",
          "product": {
            "name": "Dell Laptop",
            "sku": "ELEC-DELL-12345"
          }
        }
      ],
      "purchaseOrder": {
        "poNumber": "PO-2024-0001",
        "vendor": {
          "name": "Tech Suppliers Ltd"
        }
      }
    },
    "message": "GRN GRN-2024-0001 created successfully. Stock updated for 1 products."
  },
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

---

## Notes

- All monetary amounts in the smallest currency unit (e.g., paise for INR, cents for USD)
- All dates in ISO 8601 format
- PO numbers auto-generated: PO-YYYY-NNNN
- GRN numbers auto-generated: GRN-YYYY-NNNN
- Invoice numbers auto-generated: PINV-YYYY-NNNN
- Payment numbers auto-generated: PAY-YYYY-NNNN
- All operations are atomic (transactions)
- Tenant isolation enforced automatically
- RBAC enforced on all endpoints

