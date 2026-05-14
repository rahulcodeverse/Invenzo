# Sales Module - API Testing Guide

Complete guide for testing the Sales Management workflow.

---

## Authentication

```bash
# Login
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@invenzo.com","password":"password123"}' \
  | jq -r '.data.accessToken')
```

---

## Part 1: Customer Management

### Create Customer
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "XYZ Corp Ltd",
    "email": "contact@xyzcorp.com",
    "phone": "+91 9876543210",
    "city": "Bangalore",
    "gstNumber": "29ABCDE1234F1Z5",
    "creditLimit": 200000,
    "creditDays": 15
  }'

# Save: CUSTOMER_ID="customer-uuid"
```

### Get Customer Statement
```bash
curl -X GET http://localhost:3000/api/v1/customers/$CUSTOMER_ID/statement \
  -H "Authorization: Bearer $TOKEN"
```

---

## Part 2: Quotations

### Create Quotation
```bash
curl -X POST http://localhost:3000/api/v1/sales/quotations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "'$CUSTOMER_ID'",
    "validUntil": "2024-03-15",
    "items": [
      {
        "productId": "'$PRODUCT_ID'",
        "quantity": 10,
        "unitPrice": 550,
        "taxRate": 18
      }
    ],
    "discount": 500,
    "notes": "Special offer for valued customer"
  }'

# Save: QUOTATION_ID="quotation-uuid"
```

### Convert to Sales Order
```bash
# First, update quotation status to CONFIRMED
curl -X PATCH http://localhost:3000/api/v1/sales/quotations/$QUOTATION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'

# Then convert
curl -X POST http://localhost:3000/api/v1/sales/quotations/$QUOTATION_ID/convert \
  -H "Authorization: Bearer $TOKEN"

# Save SO ID from response
```

---

## Part 3: Sales Orders

### Create Sales Order (Manual)
```bash
curl -X POST http://localhost:3000/api/v1/sales/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "'$CUSTOMER_ID'",
    "deliveryDate": "2024-03-01",
    "items": [
      {
        "productId": "'$PRODUCT_ID'",
        "quantity": 20,
        "unitPrice": 550,
        "taxRate": 18,
        "discount": 100
      }
    ],
    "notes": "Rush order"
  }'

# Save: SO_ID="so-uuid"
```

### Confirm Sales Order
```bash
curl -X POST http://localhost:3000/api/v1/sales/orders/$SO_ID/confirm \
  -H "Authorization: Bearer $TOKEN"

# This validates stock availability
```

### Get Pending Orders
```bash
curl -X GET http://localhost:3000/api/v1/sales/orders/pending \
  -H "Authorization: Bearer $TOKEN"
```

---

## Part 4: Delivery (Auto Inventory OUT)

### Create Delivery Note
```bash
curl -X POST http://localhost:3000/api/v1/sales/delivery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "salesOrderId": "'$SO_ID'",
    "warehouseId": "'$WAREHOUSE_ID'",
    "items": [
      {
        "productId": "'$PRODUCT_ID'",
        "quantity": 20
      }
    ],
    "notes": "Delivered successfully"
  }'

# What happens:
# 1. Validates stock availability
# 2. Deducts from warehouse (FIFO for batches)
# 3. Creates stock movement (OUT)
# 4. Updates SO delivered quantities
# 5. Auto-updates SO status to COMPLETED

# Save: DELIVERY_ID="delivery-uuid"
```

### Partial Delivery
```bash
# Deliver only 10 units first
curl -X POST http://localhost:3000/api/v1/sales/delivery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "salesOrderId": "'$SO_ID'",
    "warehouseId": "'$WAREHOUSE_ID'",
    "items": [
      {
        "productId": "'$PRODUCT_ID'",
        "quantity": 10
      }
    ]
  }'

# SO status: CONFIRMED → PROCESSING

# Deliver remaining 10 units later
curl -X POST http://localhost:3000/api/v1/sales/delivery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "salesOrderId": "'$SO_ID'",
    "warehouseId": "'$WAREHOUSE_ID'",
    "items": [
      {
        "productId": "'$PRODUCT_ID'",
        "quantity": 10
      }
    ]
  }'

# SO status: PROCESSING → COMPLETED
```

---

## Part 5: Sales Invoice

### Create Invoice
```bash
curl -X POST http://localhost:3000/api/v1/sales/invoice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "salesOrderId": "'$SO_ID'",
    "customerId": "'$CUSTOMER_ID'",
    "deliveryNoteId": "'$DELIVERY_ID'",
    "dueDate": "2024-03-15",
    "subtotal": 11000,
    "taxAmount": 1980,
    "discount": 500
  }'

# Save: INVOICE_ID="invoice-uuid"
```

### Get Outstanding Invoices
```bash
curl -X GET http://localhost:3000/api/v1/sales/invoice/outstanding \
  -H "Authorization: Bearer $TOKEN"
```

### Get Customer-Wise Outstanding
```bash
curl -X GET http://localhost:3000/api/v1/sales/invoice/customer-wise-outstanding \
  -H "Authorization: Bearer $TOKEN"
```

---

## Part 6: Customer Payments

### Record Payment (Partial)
```bash
curl -X POST http://localhost:3000/api/v1/sales/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "'$CUSTOMER_ID'",
    "invoiceId": "'$INVOICE_ID'",
    "amount": 6000,
    "method": "BANK_TRANSFER",
    "reference": "TXN123456",
    "notes": "Partial payment"
  }'

# Invoice status: PENDING → PARTIAL
```

### Record Final Payment
```bash
curl -X POST http://localhost:3000/api/v1/sales/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "'$CUSTOMER_ID'",
    "invoiceId": "'$INVOICE_ID'",
    "amount": 6480,
    "method": "BANK_TRANSFER",
    "reference": "TXN789012"
  }'

# Invoice status: PARTIAL → PAID
# SO payment status: PARTIAL → PAID
```

### Get Customer Payment History
```bash
curl -X GET http://localhost:3000/api/v1/sales/payment/customer/$CUSTOMER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Complete Workflow (PowerShell)

```powershell
$API = "http://localhost:3000/api/v1"

# 1. Login
$login = Invoke-RestMethod -Uri "$API/auth/login" -Method Post -Body (@{
    email = "owner@invenzo.com"
    password = "password123"
} | ConvertTo-Json) -ContentType "application/json"

$headers = @{
    "Authorization" = "Bearer $($login.data.accessToken)"
    "Content-Type" = "application/json"
}

# 2. Create Customer
$customer = Invoke-RestMethod -Uri "$API/customers" -Method Post -Headers $headers -Body (@{
    name = "ABC Corp"
    creditLimit = 200000
    creditDays = 15
} | ConvertTo-Json)

$CUSTOMER_ID = $customer.data.id

# 3. Create Sales Order
$so = Invoke-RestMethod -Uri "$API/sales/orders" -Method Post -Headers $headers -Body (@{
    customerId = $CUSTOMER_ID
    items = @(
        @{
            productId = $PRODUCT_ID
            quantity = 20
            unitPrice = 550
            taxRate = 18
        }
    )
} | ConvertTo-Json -Depth 10)

$SO_ID = $so.data.id

# 4. Confirm SO
Invoke-RestMethod -Uri "$API/sales/orders/$SO_ID/confirm" -Method Post -Headers $headers

# 5. Create Delivery (Auto Inventory OUT)
$delivery = Invoke-RestMethod -Uri "$API/sales/delivery" -Method Post -Headers $headers -Body (@{
    salesOrderId = $SO_ID
    warehouseId = $WAREHOUSE_ID
    items = @(
        @{
            productId = $PRODUCT_ID
            quantity = 20
        }
    )
} | ConvertTo-Json -Depth 10)

# 6. Create Invoice
$invoice = Invoke-RestMethod -Uri "$API/sales/invoice" -Method Post -Headers $headers -Body (@{
    salesOrderId = $SO_ID
    customerId = $CUSTOMER_ID
    dueDate = (Get-Date).AddDays(15).ToString("yyyy-MM-dd")
    subtotal = 11000
    taxAmount = 1980
} | ConvertTo-Json)

# 7. Record Payment
Invoke-RestMethod -Uri "$API/sales/payment" -Method Post -Headers $headers -Body (@{
    customerId = $CUSTOMER_ID
    invoiceId = $invoice.data.id
    amount = 12980
    method = "BANK_TRANSFER"
} | ConvertTo-Json)

Write-Host "✅ Complete sales workflow executed!"
```

---

## Key Features Demonstrated

✅ Customer management with credit tracking  
✅ Quotation to SO conversion  
✅ Stock validation on SO confirmation  
✅ **Automatic inventory OUT** on delivery  
✅ FIFO batch deduction  
✅ Partial delivery support  
✅ Auto SO status updates  
✅ Invoice generation  
✅ Payment tracking with auto-updates  
✅ Outstanding monitoring  

---

## Test Validations

### 1. Insufficient Stock
```bash
# Try to deliver more than available
# Expected: 400 "Insufficient stock"
```

### 2. Exceed SO Quantity
```bash
# Try to deliver more than ordered
# Expected: 400 "Cannot deliver X units. Only Y units pending"
```

### 3. Payment Exceeds Balance
```bash
# Try to pay more than invoice balance
# Expected: 400 "Payment amount exceeds invoice balance"
```

---

See **docs/STEP-4-COMPLETE.md** for full documentation.

