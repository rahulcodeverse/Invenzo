# Invenzo - Architecture Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Design](#api-design)
6. [Security Considerations](#security-considerations)
7. [Performance Optimization](#performance-optimization)

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │   POS App    │      │
│  │  (Angular)   │  │  (Future)    │  │  (Future)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NestJS API Server (Node.js)                         │   │
│  │  • Rate Limiting • CORS • Helmet • Compression       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  MIDDLEWARE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth Guard  │  │  RBAC Guard  │  │ Tenant Guard │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   Auth   │ │  Users   │ │ Products │ │Inventory │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Purchase │ │  Sales   │ │Accounting│ │ Reports  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Prisma ORM                                          │   │
│  │  • Type Safety • Migrations • Query Builder          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Supabase/Neon)                          │   │
│  │  • Row-Level Security • Indexes • Constraints        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
Backend (NestJS)
├── Core Modules
│   ├── Config Module (Environment variables)
│   ├── Prisma Module (Database connection)
│   ├── Throttler Module (Rate limiting)
│   └── EventEmitter Module (Events)
│
├── Common
│   ├── Decorators (@GetUser, @Roles, @Public)
│   ├── Guards (JWT, RBAC, Tenant)
│   ├── Interceptors (Transform, Logging)
│   ├── Filters (Exception handling)
│   ├── Pipes (Validation)
│   └── Utils (Helpers, Generators)
│
├── Feature Modules
│   ├── Auth (Login, Register, JWT)
│   ├── Users (User management)
│   ├── Tenants (Company settings)
│   ├── Products (Catalog management)
│   ├── Inventory (Stock tracking)
│   ├── Purchases (Vendor, PO, GRN)
│   ├── Sales (Customer, SO, Invoice)
│   ├── Accounting (Ledgers, Transactions)
│   ├── Reports (Analytics, Dashboards)
│   └── Notifications (Alerts, Emails)
│
└── External Services
    ├── Email Service (Nodemailer)
    ├── File Upload (Cloudinary)
    ├── PDF Generation (PDFKit)
    └── Excel Export (ExcelJS)
```

## Database Design

### Entity Relationship Diagram (ERD)

```
┌──────────────┐
│   Tenant     │◄──────────┐
└──────────────┘           │
       │                   │
       │ 1                 │
       │                   │
       │ N                 │
       ▼                   │
┌──────────────┐           │
│     User     │           │
└──────────────┘           │
       │                   │
       │                   │
       │                   │
       ▼                   │
┌──────────────┐    N:1    │
│  AuditLog    ├───────────┘
└──────────────┘

┌──────────────┐
│   Product    │
└──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│ProductVariant│
└──────────────┘

┌──────────────┐    N:M    ┌──────────────┐
│   Product    ├───────────┤  Warehouse   │
└──────────────┘           └──────────────┘
       │                          │
       │                          │
       │ 1:N                      │ 1:N
       ▼                          ▼
┌──────────────┐           ┌──────────────┐
│    Stock     │◄──────────┤StockMovement │
└──────────────┘           └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐    ┌──────────────┐
│    Batch     │    │    Serial    │
└──────────────┘    └──────────────┘

┌──────────────┐    1:N    ┌──────────────┐
│    Vendor    ├───────────┤PurchaseOrder │
└──────────────┘           └──────────────┘
                                  │
                                  │ 1:N
                                  ▼
                           ┌──────────────┐
                           │  PO Items    │
                           └──────────────┘

┌──────────────┐    1:N    ┌──────────────┐
│   Customer   ├───────────┤  SalesOrder  │
└──────────────┘           └──────────────┘
                                  │
                                  │ 1:N
                                  ▼
                           ┌──────────────┐
                           │   SO Items   │
                           └──────────────┘

┌──────────────┐
│    Ledger    │
└──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│ Transaction  │
└──────────────┘
```

### Key Tables

#### Core Tables
- **tenants**: Company/Organization data
- **users**: User accounts with roles
- **warehouses**: Storage locations

#### Product Tables
- **categories**: Product categorization (hierarchical)
- **brands**: Product brands
- **units**: Measurement units (kg, pcs, etc.)
- **products**: Product catalog
- **product_variants**: Product variations

#### Inventory Tables
- **stocks**: Product quantity per warehouse
- **batches**: Batch tracking with expiry
- **serials**: Serial number tracking
- **stock_movements**: All inventory transactions

#### Purchase Tables
- **vendors**: Supplier information
- **purchase_orders**: Purchase orders
- **purchase_order_items**: PO line items
- **goods_received_notes**: GRN records

#### Sales Tables
- **customers**: Customer information
- **sales_orders**: Sales orders
- **sales_order_items**: SO line items

#### Accounting Tables
- **ledgers**: Chart of accounts
- **transactions**: Financial transactions

#### System Tables
- **notifications**: User notifications
- **audit_logs**: Activity tracking

### Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_tenant ON users(tenantId);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_tenant_sku ON products(tenantId, sku);
CREATE INDEX idx_stocks_product_warehouse ON stocks(productId, warehouseId);
CREATE INDEX idx_batches_expiry ON batches(expiryDate);
CREATE INDEX idx_movements_date ON stock_movements(createdAt);
CREATE INDEX idx_po_number ON purchase_orders(poNumber);
CREATE INDEX idx_so_number ON sales_orders(soNumber);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_audit_date ON audit_logs(createdAt);
```

## Multi-Tenancy Strategy

### Row-Level Security (RLS) Approach

**Implementation**:
- Every table (except `tenants`, `users`, `audit_logs`) has a `tenantId` column
- Prisma middleware automatically filters queries by `tenantId`
- JWT token contains `tenantId` from authenticated user
- All queries are automatically scoped to the tenant

**Benefits**:
- Simple to implement
- Cost-effective (single database)
- Easy to manage
- Works well with free-tier databases

**Security**:
- Tenant isolation enforced at ORM level
- No cross-tenant data access possible
- Audit logs track all tenant activities

### Data Isolation Flow

```
1. User logs in
   ↓
2. JWT issued with tenantId
   ↓
3. Request received with JWT
   ↓
4. JWT validated, tenantId extracted
   ↓
5. Prisma middleware intercepts query
   ↓
6. WHERE tenantId = ? added automatically
   ↓
7. Query executed with tenant filter
   ↓
8. Results returned (tenant-scoped only)
```

## Authentication & Authorization

### JWT Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└──────────┘                                    └──────────┘
     │                                                 │
     │  1. POST /auth/login                          │
     │    { email, password }                        │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                         2. Validate credentials│
     │                         3. Generate JWT tokens│
     │                                                │
     │  4. { accessToken, refreshToken, user }       │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  5. Store tokens                              │
     │     - accessToken (memory)                    │
     │     - refreshToken (httpOnly cookie)          │
     │                                                │
     │  6. GET /api/resource                         │
     │     Authorization: Bearer {accessToken}       │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                              7. Validate token│
     │                              8. Check RBAC    │
     │                                                │
     │  9. { data }                                  │
     │◄──────────────────────────────────────────────┤
     │                                                │
```

### Role-Based Access Control (RBAC)

**Roles**:
- **OWNER**: Full system access, can manage everything
- **MANAGER**: All operations except tenant settings
- **STAFF**: Limited to daily operations (products, inventory, orders)
- **ACCOUNTANT**: Read-only + accounting module access

**Permission Matrix**:

| Module      | Owner | Manager | Staff | Accountant |
|-------------|-------|---------|-------|------------|
| Tenants     | CRUD  | R       | -     | -          |
| Users       | CRUD  | CRUD    | R     | R          |
| Products    | CRUD  | CRUD    | CRUD  | R          |
| Inventory   | CRUD  | CRUD    | CRUD  | R          |
| Purchases   | CRUD  | CRUD    | CR    | R          |
| Sales       | CRUD  | CRUD    | CR    | R          |
| Accounting  | CRUD  | CRUD    | -     | CRUD       |
| Reports     | R     | R       | R     | R          |

### Token Management

**Access Token**:
- Short-lived (15 minutes)
- Contains: userId, email, tenantId, role
- Stored in memory
- Used for API requests

**Refresh Token**:
- Long-lived (7 days)
- Stored in database
- Used to get new access token
- Invalidated on logout

## API Design

### REST API Standards

**Base URL**: `/api/v1`

**Endpoints Pattern**:
```
GET    /api/v1/resource         - List all (paginated)
GET    /api/v1/resource/:id     - Get one
POST   /api/v1/resource         - Create
PATCH  /api/v1/resource/:id     - Update
DELETE /api/v1/resource/:id     - Delete
```

**Response Format**:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-02-03T12:00:00.000Z"
}
```

**Error Format**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2024-02-03T12:00:00.000Z",
  "path": "/api/v1/resource",
  "method": "POST"
}
```

**Pagination**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Security Considerations

### Security Measures

1. **Authentication**
   - JWT tokens with short expiry
   - Refresh token rotation
   - Password hashing with bcrypt (10 rounds)
   - Password complexity requirements

2. **Authorization**
   - Role-based access control
   - Tenant isolation
   - Resource ownership validation

3. **HTTP Security**
   - Helmet.js for security headers
   - CORS configuration
   - HTTPS only in production
   - Rate limiting (100 req/min)

4. **Input Validation**
   - class-validator for DTO validation
   - Type checking with TypeScript
   - SQL injection prevention (Prisma ORM)
   - XSS protection

5. **Audit Trail**
   - All critical actions logged
   - User activity tracking
   - IP address recording
   - Change history

### Environment Variables Security

- Never commit `.env` files
- Use `.env.example` as template
- Different secrets per environment
- Rotate secrets regularly

## Performance Optimization

### Database Optimization

1. **Indexes**
   - Composite indexes on frequently queried columns
   - Index on foreign keys
   - Partial indexes where applicable

2. **Query Optimization**
   - Select only required fields
   - Use pagination for large datasets
   - Avoid N+1 queries (use Prisma include)
   - Connection pooling

3. **Caching Strategy** (Optional with Redis)
   - Cache static data (categories, brands)
   - Cache frequently accessed data
   - TTL-based invalidation
   - Cache warming on startup

### API Optimization

1. **Response Optimization**
   - Gzip compression
   - Field filtering
   - Lazy loading relationships
   - Pagination

2. **Request Optimization**
   - Rate limiting
   - Request validation
   - Batch operations
   - Async processing

### Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API design
   - Database connection pooling
   - Load balancer ready

2. **Vertical Scaling**
   - Efficient queries
   - Minimal memory footprint
   - Resource cleanup

---

**Next Steps**: See DEPLOYMENT.md for deployment instructions

