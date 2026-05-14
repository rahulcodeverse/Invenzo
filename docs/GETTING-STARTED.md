# Getting Started with Invenzo Backend

## Quick Start Guide

This guide will help you get the Invenzo backend running locally in **under 10 minutes**.

## Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL 14+** ([Download](https://www.postgresql.org/download/)) or use Docker
- **Git** ([Download](https://git-scm.com/))

## Step 1: Clone & Install (2 minutes)

```powershell
# Clone the repository
cd C:\Users\Rahul\Documents\Invenzo

# Navigate to backend
cd backend

# Install dependencies
npm install
```

## Step 2: Database Setup (3 minutes)

### Option A: Use Docker (Easiest)

```powershell
# From the root directory (C:\Users\Rahul\Documents\Invenzo)
cd ..
docker-compose up -d postgres

# Database will be available at:
# postgresql://postgres:postgres@localhost:5432/invenzo
```

### Option B: Use Local PostgreSQL

1. Create database:
```sql
CREATE DATABASE invenzo;
```

2. Update connection string in `.env`

## Step 3: Environment Configuration (1 minute)

```powershell
# Copy example environment file
cd backend
copy .env.example .env

# Edit .env file with your settings
notepad .env
```

**Minimum required changes**:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/invenzo?schema=public"
JWT_SECRET=replace-with-random-32-char-string
JWT_REFRESH_SECRET=replace-with-another-random-32-char-string
```

**Generate secrets**:
```powershell
# Run this in Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Database Migration & Seed (2 minutes)

```powershell
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with demo data
npm run prisma:seed
```

## Step 5: Start Server (1 minute)

```powershell
# Development mode (with hot reload)
npm run start:dev
```

**Server will start at**: `http://localhost:3000`

## Step 6: Test the API

### Using Browser

1. **Health Check**: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

2. **API Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Using curl or Postman

**1. Login with demo credentials**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"owner@invenzo.com\",\"password\":\"password123\"}"
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "owner@invenzo.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "OWNER"
    },
    "tenant": {
      "id": "...",
      "name": "Demo Company Pvt Ltd"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**2. Get current user profile**:
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**3. Get all users**:
```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Demo Accounts

After running seed:

| Email                 | Password     | Role       |
|-----------------------|--------------|------------|
| owner@invenzo.com     | password123  | OWNER      |
| manager@invenzo.com   | password123  | MANAGER    |
| staff@invenzo.com     | password123  | STAFF      |

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── common/                 # Shared utilities
│   │   ├── decorators/         # Custom decorators
│   │   ├── guards/             # Auth & RBAC guards
│   │   ├── filters/            # Exception filters
│   │   ├── interceptors/       # Response transformers
│   │   └── utils/              # Helper functions
│   ├── config/                 # Configuration
│   ├── prisma/                 # Database client
│   └── modules/                # Feature modules
│       ├── auth/               # Authentication
│       ├── users/              # User management
│       ├── tenants/            # Tenant management
│       ├── products/           # Product catalog
│       ├── inventory/          # Stock management
│       ├── purchases/          # Purchase orders
│       ├── sales/              # Sales orders
│       ├── accounting/         # Ledgers & transactions
│       ├── reports/            # Analytics
│       └── notifications/      # Alerts & emails
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
├── test/                       # Tests
├── .env                        # Environment variables
└── package.json
```

## Common Commands

### Development
```powershell
npm run start:dev      # Start dev server with hot reload
npm run start:debug    # Start with debugger
npm run build          # Build for production
npm run start:prod     # Start production server
```

### Database
```powershell
npx prisma studio           # Open database GUI
npx prisma migrate dev      # Create & apply migration
npx prisma migrate reset    # Reset database
npx prisma generate         # Generate Prisma Client
npm run prisma:seed         # Seed database
```

### Testing
```powershell
npm test               # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Generate coverage report
npm run test:e2e       # Run e2e tests
```

### Code Quality
```powershell
npm run lint           # Check code style
npm run format         # Format code
```

## Next Steps

### 1. Explore API Documentation

Visit [http://localhost:3000/api/docs](http://localhost:3000/api/docs) to see all available endpoints with Swagger UI.

### 2. Create Your Own Account

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"you@company.com\",
    \"password\":\"YourSecure123\",
    \"firstName\":\"Your\",
    \"lastName\":\"Name\",
    \"companyName\":\"Your Company\",
    \"phone\":\"+1234567890\"
  }"
```

### 3. Build Frontend (Coming Next)

The Angular frontend will be created in the next phase. For now, you can:
- Test APIs using Postman/Insomnia
- Use Swagger UI for testing
- Build a custom frontend

### 4. Customize

- Modify Prisma schema for your needs
- Add custom business logic
- Extend API endpoints
- Customize validation rules

## Troubleshooting

### Port 3000 Already in Use

```powershell
# Change port in .env
PORT=3001
```

### Database Connection Error

```
Error: Can't reach database server
```

**Solutions**:
1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Check PostgreSQL credentials
4. Ensure database `invenzo` exists

### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution**:
```powershell
npx prisma generate
```

### Migration Fails

```
Error: Migration failed
```

**Solution**:
```powershell
# Reset and re-run migrations
npx prisma migrate reset
npx prisma migrate dev
```

## Development Tips

### 1. Use Prisma Studio

Prisma Studio is a GUI for your database:
```powershell
npx prisma studio
```
Opens at [http://localhost:5555](http://localhost:5555)

### 2. Watch Database Queries

Set in `.env`:
```env
DATABASE_URL="postgresql://...?schema=public&connection_limit=5&pool_timeout=10"
```

Then check logs in terminal - all queries will be logged.

### 3. Test with Different Roles

Use the seeded accounts to test RBAC:
- Login as OWNER → Full access
- Login as MANAGER → Limited access
- Login as STAFF → Restricted access

### 4. Hot Reload

Any changes to `.ts` files will automatically restart the server.

### 5. Debug Mode

```powershell
npm run start:debug
```

Then attach debugger from VS Code/WebStorm.

## VS Code Extensions (Recommended)

- **Prisma** - Syntax highlighting for schema
- **REST Client** - Test APIs from `.http` files
- **ESLint** - Code linting
- **Prettier** - Code formatting

## What's Implemented

✅ Multi-tenant architecture  
✅ JWT authentication with refresh tokens  
✅ Role-based access control (RBAC)  
✅ User management  
✅ Tenant management  
✅ Database schema (30+ tables)  
✅ Prisma ORM with migrations  
✅ API documentation (Swagger)  
✅ Error handling  
✅ Request validation  
✅ Security (Helmet, CORS, Rate limiting)  
✅ Pagination  
✅ Audit logging  
✅ Docker support  

## What's Coming Next

🔲 Product management module  
🔲 Inventory tracking module  
🔲 Purchase management module  
🔲 Sales management module  
🔲 Accounting module  
🔲 Reports & analytics  
🔲 Notification system  
🔲 Email integration  
🔲 File upload (Cloudinary)  
🔲 PDF generation  
🔲 Excel export  
🔲 Angular frontend  

## Get Help

- Check Swagger docs: http://localhost:3000/api/docs
- View logs in terminal
- Check Prisma schema: `backend/prisma/schema.prisma`
- Review existing modules for patterns

## Ready for Production?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deploying to:
- Railway (Backend)
- Supabase (Database)
- Vercel (Frontend - when ready)

---

**You're all set! Start building amazing inventory management features! 🚀**

