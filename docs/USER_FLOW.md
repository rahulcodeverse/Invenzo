# Invenzo User Flow Guide

This guide explains how a business user should operate Invenzo from first setup to daily transactions. Use it for client onboarding, demos, QA, and internal training.

## System Idea

Invenzo is built around one operational loop:

```text
Master Data
  -> Purchase Planning
  -> Goods Receipt
  -> Inventory Control
  -> Sales Order Fulfilment
  -> Invoicing and Payments
  -> Accounting and Reports
```

The user should not start directly with sales or manufacturing. The system needs basic company, product, warehouse, customer, and vendor data first.

## Recommended First-Time Setup

### 1. Login

Open the application and sign in.

Demo owner account:

```text
Email: owner@invenzo.com
Password: password123
```

Use the owner account for setup because it has access to all modules.

### 2. Company Settings

Go to:

```text
Settings -> Company
```

Set or verify:

- Company name
- Email and phone
- GST or tax number
- Billing address
- City, state, country, postal code

This information is used in documents, reports, and business identity.

### 3. Warehouses

Go to:

```text
Settings -> Warehouses
```

Create all physical or logical stock locations.

Examples:

- Main Warehouse
- Retail Store
- Service Center
- Damaged Goods Location

Warehouses are required before stock can be received, transferred, or adjusted.

### 4. Product Masters

Go to:

```text
Products -> Categories
Products -> Brands
Products -> Units
Products -> Products
```

Create supporting product masters first:

- Categories group products for reporting.
- Brands identify product families or vendors.
- Units define measurement such as pcs, box, kg, meter.

Then create products with:

- Name
- SKU or barcode
- Category
- Brand
- Unit
- Cost price
- Selling price
- Tax rate
- Minimum stock level
- Reorder level
- Batch or serial tracking if needed

Products are used by purchases, inventory, sales, manufacturing, and reports.

### 5. Parties

Create customers and vendors.

Go to:

```text
Customers
Vendors
```

Add:

- Name
- Code
- Email and phone
- GST or tax number
- Credit limit
- Credit days
- Opening balance if applicable

Customers are used in sales. Vendors are used in purchases.

### 6. Users and Roles

Go to:

```text
Settings -> Users
```

Create users based on responsibility.

Typical role usage:

| Role | Best For |
| --- | --- |
| Owner | Full business control and setup |
| Manager | Sales, purchase, inventory, manufacturing approvals |
| Staff | Operational entry such as orders, delivery, GRN, stock movement |
| Accountant | Accounting, invoices, payments, reports |

## Daily Business Flow

## Dashboard

After login, the dashboard is the starting point.

Use it to check:

- Today workflow actions
- Low stock or open purchase indents
- Pending receivables and payables
- Sales and inventory KPIs
- Notifications

The dashboard tells the user what needs attention before entering transactions.

## Purchase Flow

Use this when the business buys inventory or raw material.

### Purchase Flow Diagram

```text
Vendor
  -> Purchase Order
  -> Goods Received Note
  -> Stock Increase
  -> Purchase Invoice
  -> Vendor Payment
  -> Payable Reports
```

### Step 1. Create Purchase Order

Go to:

```text
Purchases -> Purchase Orders -> New Purchase Order
```

Select:

- Vendor
- Expected date
- Products
- Quantity
- Unit price
- Tax rate
- Notes if needed

Save the PO.

### Step 2. Approve Purchase Order

From the purchase order list, approve the draft PO when it is ready for procurement.

Approved purchase orders can be used for goods receipt.

### Step 3. Receive Goods

Go to:

```text
Purchases -> GRN
```

Create a goods received note against a purchase order.

Select:

- Purchase order
- Warehouse
- Received quantity
- Batch number if applicable
- Expiry date if applicable

After GRN, stock increases in the selected warehouse.

### Step 4. Create Purchase Invoice

Go to:

```text
Purchases -> Invoices
```

Record the vendor bill against received goods.

This creates the payable amount.

### Step 5. Record Vendor Payment

Go to:

```text
Purchases -> Payments
```

Record payment made to the vendor.

Use references such as:

- UPI transaction number
- Bank transfer reference
- Cheque number

Vendor payable reports update after payment.

## Sales Flow

Use this when the business sells inventory to customers.

### Sales Flow Diagram

```text
Customer
  -> Quotation
  -> Sales Order
  -> Delivery Note
  -> Stock Decrease
  -> Sales Invoice
  -> Customer Payment
  -> Receivable Reports
```

### Step 1. Create Quotation

Go to:

```text
Sales -> Quotations -> New Quotation
```

Select:

- Customer
- Quotation date
- Valid until date
- Products
- Quantity
- Unit price
- Tax rate
- Terms and conditions

Save the quotation.

### Step 2. Convert Quotation to Sales Order

From the quotation list, choose convert to sales order.

This avoids duplicate entry and keeps the customer journey traceable.

Users can also create a sales order directly when a quotation is not needed.

### Step 3. Confirm Sales Order

Go to:

```text
Sales -> Sales Orders
```

Review the order and confirm it when it is ready for fulfilment.

Confirmed sales orders become demand for inventory and manufacturing planning.

### Step 4. Dispatch Goods

Go to:

```text
Sales -> Delivery
```

Create a delivery note against the confirmed sales order.

Select:

- Sales order
- Dispatch warehouse
- Delivered quantity
- Batch or serial numbers if applicable

After delivery, stock decreases from the selected warehouse.

### Step 5. Create Sales Invoice

Go to:

```text
Sales -> Invoices
```

Create or review the invoice for delivered goods.

This creates customer receivable.

### Step 6. Record Customer Payment

Go to:

```text
Sales -> Payments
```

Record received payment and allocate it against invoices.

Customer receivable reports update after payment.

## Inventory Flow

Inventory is updated by purchases, sales, transfers, and manual adjustments.

### Stock Overview

Go to:

```text
Inventory -> Stock
```

Use this screen to check:

- Product stock by warehouse
- Available quantity
- Reserved quantity
- Low stock
- Reorder requirements

### Stock Adjustment

Go to:

```text
Inventory -> Adjustments
```

Use adjustments for:

- Opening stock correction
- Damaged stock
- Lost stock
- Manual correction after physical count

Always enter a clear reason.

### Stock Transfer

Go to:

```text
Inventory -> Transfers
```

Use transfers to move stock from one warehouse to another.

Example:

```text
Main Warehouse -> Retail Store
```

### Movement History

Go to:

```text
Inventory -> Movements
```

Use this screen for audit and traceability.

It shows:

- Stock in
- Stock out
- Transfers
- Adjustments
- Reference numbers
- User and date

## Manufacturing Flow

Use this when the business manufactures finished goods from raw materials.

### Manufacturing Flow Diagram

```text
Bill of Material
  -> Work Order
  -> Material Requirement Planning
  -> Purchase Indent
  -> Purchase Order
  -> Production Tracking
```

### Step 1. Create BOM

Go to:

```text
Manufacturing -> BOMs
```

Create a bill of material for a finished product.

Define:

- Finished product
- Output quantity
- Raw materials
- Material quantity
- Wastage percentage
- Routing steps if applicable

### Step 2. Create Work Order

Go to:

```text
Manufacturing -> Work Orders
```

Create work orders from BOMs.

Track:

- Planned quantity
- Produced quantity
- Rejected quantity
- Status
- Due date

### Step 3. Run MRP

Go to:

```text
Manufacturing -> MRP
```

MRP checks confirmed sales demand, BOM material requirements, available stock, and existing open indents.

It calculates shortages.

### Step 4. Generate Purchase Indents

From MRP, generate purchase indents for shortage materials.

Then go to:

```text
Manufacturing -> Purchase Indents
```

Managers approve open indents.

Approved indents can be converted into prefilled purchase order drafts.

## Accounting Flow

Accounting follows operational transactions.

Go to:

```text
Accounting -> Chart of Accounts
Accounting -> Journal
Accounting -> Reports
```

Use accounting for:

- Ledger setup
- Manual journal entries
- Trial balance
- Profit and loss
- Balance sheet
- Cash flow

Operational invoices and payments should be entered through sales and purchase modules first. Manual journals should be used for adjustments, opening balances, and non-inventory entries.

## Reports Flow

Go to:

```text
Reports -> KPI
Reports -> Sales
Reports -> Inventory
Reports -> GST
```

Use reports after transactions are entered.

Typical review order:

1. KPI dashboard for business health.
2. Sales analytics for revenue and customer performance.
3. Inventory analytics for stock risk and ageing.
4. GST report for tax summary.
5. Accounting reports for finance review.

## Correct Demo Script

Use this script when showing the application to a client.

1. Login as owner.
2. Open dashboard and explain today's workflow.
3. Show products, categories, brands, units, and warehouses.
4. Show vendors and customers.
5. Create or open a purchase order.
6. Receive goods through GRN and show stock increase.
7. Create a quotation for a customer.
8. Convert quotation to sales order.
9. Dispatch goods and show stock decrease.
10. Create sales invoice and record payment.
11. Open inventory movements and show transaction trace.
12. Open manufacturing MRP and purchase indents.
13. Convert an approved indent to a PO draft.
14. Open accounting and reports.
15. End on KPI dashboard.

## Module Dependency Map

| Module | Depends On | Creates Impact In |
| --- | --- | --- |
| Products | Categories, brands, units | Inventory, purchases, sales, manufacturing |
| Vendors | None | Purchase orders, invoices, payments |
| Customers | None | Quotations, sales orders, invoices, payments |
| Warehouses | None | Stock, GRN, delivery, transfers |
| Purchase Orders | Vendors, products | GRN, purchase invoices, payables |
| GRN | Purchase orders, warehouses | Stock increase, purchase invoice readiness |
| Sales Orders | Customers, products | Delivery, invoices, MRP demand |
| Delivery Notes | Sales orders, stock | Stock decrease, invoice readiness |
| BOM | Products | Work orders, MRP |
| Purchase Indents | MRP shortages | Purchase order drafting |
| Payments | Invoices | Receivables, payables, reports |
| Journals | Chart of accounts | Financial statements |

## Validation Rules Users Should Know

- Required fields must be completed before saving.
- Stock cannot be dispatched if available quantity is insufficient.
- Serial-tracked products need matching serial numbers.
- Batch-tracked products should include batch details during receipt or issue.
- Draft orders should be reviewed before approval.
- Completed or cancelled transactions may be restricted from editing.
- Payments should be allocated to the correct invoice for accurate ageing.

## Recommended User Habits

- Do not create products without category and unit.
- Keep SKU, barcode, and product names clean.
- Use notes for every stock adjustment.
- Use GRN for received goods instead of manual stock in when purchase order exists.
- Use delivery notes for dispatch instead of manual stock out when sales order exists.
- Review inventory movements when stock numbers look wrong.
- Run MRP after confirming sales orders for manufactured products.
- Check reports only after completing invoices and payments.

## Current Scope Notes

The current version supports the main operating flow. Some enterprise-level extensions can still be added later:

- Preferred vendor per product
- Vendor quotation comparison
- E-way bill and e-invoice integration
- Credit notes and debit notes
- Bank reconciliation
- Advanced approval limits
- Barcode scanning screens
- Production material issue and finished-goods receipt automation
