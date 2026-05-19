# Invenzo

Invenzo is a full-stack inventory operations platform for teams that need one place to manage products, stock, purchases, sales, accounting, and reporting. It is designed for small and mid-sized businesses that want a practical operating desk instead of separate spreadsheets for every workflow.

The application includes an Angular frontend, a NestJS backend, Prisma ORM, PostgreSQL, role-based authentication, and demo seed data for a realistic business flow.

## What Invenzo Handles

- Product catalog management with categories, brands, units, pricing, tax, and reorder levels.
- Multi-warehouse stock visibility with available, reserved, and total inventory.
- Inventory movements for stock in, stock out, transfers, adjustments, and damages.
- Purchase workflow covering vendors, purchase orders, goods received notes, invoices, and payments.
- Sales workflow covering customers, quotations, sales orders, delivery notes, invoices, and payments.
- Accounting basics including chart of accounts, ledger balances, and journal entries.
- Dashboards and reports for KPIs, sales analytics, inventory analytics, and financial reports.
- User roles for owner, manager, staff, and accountant access.

## Application Flow

1. Sign in with a demo or real user account.
2. Land on the dashboard to review revenue, stock, product, and business KPIs.
3. Set up master data:
   - Warehouses
   - Product categories
   - Brands
   - Units
   - Customers
   - Vendors
4. Add products with SKU, category, brand, unit, purchase price, selling price, tax rate, and stock thresholds.
5. Receive inventory through purchases:
   - Create a purchase order.
   - Receive goods using a GRN.
   - Generate or track purchase invoices.
   - Record vendor payments.
6. Sell inventory through sales:
   - Create a quotation.
   - Convert or create a sales order.
   - Dispatch goods with a delivery note.
   - Generate sales invoices.
   - Record customer payments.
7. Track inventory changes through stock overview and movement history.
8. Review finance and operations using accounting reports, KPI dashboards, and analytics.

For the full operator workflow, setup order, daily transaction path, module dependencies, and demo script, see [Invenzo User Flow Guide](docs/USER_FLOW.md).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 17, NG Zorro, ECharts |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT, role-based access |
| Tooling | Docker Compose, npm scripts |

## Project Structure

```text
Invenzo/
  backend/              NestJS API, Prisma schema, seed data
  frontend/             Angular web application
  docker-compose.yml    Local service definitions
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL database
- Docker Desktop, optional but useful for local services

### Backend Setup

```bash
cd backend
npm install
```

Create a backend environment file from the example:

```bash
cp .env.example .env
```

Update `DATABASE_URL`, JWT secrets, and other values in `backend/.env`.

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

Seed demo data:

```bash
npm run prisma:seed
```

Start the backend:

```bash
npm run start:dev
```

The API runs at:

```text
http://localhost:3000/api/v1
```

### Frontend Setup

```bash
cd frontend
npm install
npm run start
```

The frontend runs at:

```text
http://localhost:4200
```

## Demo Accounts

After running the seed script, use these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Owner | owner@invenzo.com | password123 |
| Manager | manager@invenzo.com | password123 |
| Staff | staff@invenzo.com | password123 |
| Accountant | accounts@invenzo.com | password123 |

## Useful Commands

### Backend

```bash
npm run build
npm run start:dev
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
```

### Frontend

```bash
npm run start
npm run build
npm run test
```

## Demo Data Included

The seed script creates a realistic operations workspace with:

- Demo company and company settings
- Four users across roles
- Three warehouses
- Categories, brands, and units
- Products with stock levels and reorder thresholds
- Opening stock and stock movement records
- Vendors and purchase orders
- Goods received notes, purchase invoices, and vendor payments
- Customers, quotations, sales orders, delivery notes, sales invoices, and customer payments
- Ledger groups, ledger accounts, and journal entries
- Notifications for low stock, payments, and order updates

## Business Workflow Map

```text
Products + Warehouses
        |
        v
Opening Stock / Purchase Orders
        |
        v
Goods Received Notes -> Stock Increases -> Purchase Invoice -> Vendor Payment
        |
        v
Quotation -> Sales Order -> Delivery Note -> Stock Decreases -> Sales Invoice -> Customer Payment
        |
        v
Accounting Entries + Reports + Dashboards
```

## Notes

- The app is multi-tenant ready through the `Tenant` model.
- Demo seed data is intended for local development and product walkthroughs.
- If seeding fails with a database connection or TLS error, verify `DATABASE_URL`, database availability, SSL settings, and local credentials.
- The GitHub workflow was removed earlier, so backend CI emails should not continue unless a new workflow is added.

## License

This project is proprietary and all rights are reserved. The source code may be viewed for reference only. Copying, modifying, redistributing, deploying, or using this project without written permission is not allowed. See [LICENSE](LICENSE) for details.
