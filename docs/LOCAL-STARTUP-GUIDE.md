# 🚀 INVENZO - LOCAL STARTUP GUIDE

## Quick Start (5 Minutes)

**Last Updated**: February 3, 2026

---

## Prerequisites Checklist

Make sure you have installed:
- ✅ Node.js (v18 or higher)
- ✅ PostgreSQL (v14 or higher)
- ✅ npm or yarn
- ✅ Git

---

## Step 1: Database Setup (2 minutes)

### Option A: Local PostgreSQL

**1. Start PostgreSQL Service**:
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# If not running, start it
Start-Service postgresql-x64-14  # Adjust version number
```

**2. Create Database**:
```powershell
# Open PostgreSQL command line
psql -U postgres

# In psql:
CREATE DATABASE invenzo;
\q
```

**3. Update Backend .env** (if needed):
```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/invenzo?schema=public"
```

### Option B: Use Supabase (Free Cloud Database)

1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Copy connection string
5. Update `backend/.env`:
   ```
   DATABASE_URL="your_supabase_connection_string"
   ```

---

## Step 2: Backend Setup (2 minutes)

**Open Terminal 1** (PowerShell):

```powershell
# Navigate to backend folder
cd C:\Users\Rahul\Documents\Invenzo\backend

# Install dependencies (if not already done)
npm install

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial data (creates demo user)
npm run prisma:seed

# Start backend server
npm run start:dev
```

**Backend should start at**: http://localhost:3000  
**API Docs**: http://localhost:3000/api/docs

---

## Step 3: Frontend Setup (1 minute)

**Open Terminal 2** (PowerShell - New Window):

```powershell
# Navigate to frontend folder
cd C:\Users\Rahul\Documents\Invenzo\frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm start
```

**Frontend should start at**: http://localhost:4200

---

## Step 4: Login & Test (1 minute)

**Open Browser**: http://localhost:4200

**Demo Credentials**:
```
Email: owner@invenzo.com
Password: password123
```

**Test Workflow**:
1. ✅ Login with demo credentials
2. ✅ View Dashboard (KPIs, Charts)
3. ✅ Navigate to Products
4. ✅ Navigate to Inventory → Stock
5. ✅ Navigate to Sales → Quotations
6. ✅ Success! System is running ✅

---

## Quick Commands Reference

### Backend Commands:
```powershell
# Start backend
npm run start:dev

# View database in browser
npm run prisma:studio

# Run migrations
npm run prisma:migrate

# Reset database
npm run prisma:migrate:reset

# Seed data
npm run prisma:seed
```

### Frontend Commands:
```powershell
# Start frontend
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## Common Issues & Solutions

### Issue 1: Port 3000 Already in Use

**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (use PID from above)
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=3001
```

### Issue 2: Port 4200 Already in Use

**Solution**:
```powershell
# Start on different port
ng serve --port 4201
```

### Issue 3: Database Connection Error

**Solution**:
```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Test connection
psql -U postgres -d invenzo

# Verify DATABASE_URL in backend/.env
```

### Issue 4: Prisma Migration Fails

**Solution**:
```powershell
# Reset migrations
npx prisma migrate reset

# Generate client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### Issue 5: npm install fails

**Solution**:
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

---

## Environment Configuration

### Backend (.env):
```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
DATABASE_URL="postgresql://postgres:password@localhost:5432/invenzo?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:4200
```

### Frontend (environment.ts):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  appName: 'Invenzo',
  appVersion: '1.0.0'
};
```

---

## Verify Installation

### Backend Health Check:
```powershell
# Open browser or use curl
curl http://localhost:3000/api/v1/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T..."
}
```

### Frontend Check:
- Navigate to: http://localhost:4200
- Should see login page
- Should load without errors in console

### Database Check:
```powershell
# Open Prisma Studio
npm run prisma:studio

# Should open: http://localhost:5555
# Can view all tables
```

---

## Demo Data

### After seeding, you get:

**Users**:
- Owner: owner@invenzo.com / password123
- Manager: manager@invenzo.com / password123
- Staff: staff@invenzo.com / password123

**Test Data**:
- 1 Tenant (Demo Company)
- 10 Products
- 5 Categories
- 3 Brands
- 5 Units
- 2 Warehouses
- 10 Customers
- 10 Vendors

---

## Development Workflow

### Typical Development Session:

**Terminal 1 - Backend**:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run start:dev
# Runs on http://localhost:3000
# Auto-restarts on file changes
```

**Terminal 2 - Frontend**:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\frontend
npm start
# Runs on http://localhost:4200
# Auto-reloads on file changes
```

**Terminal 3 - Database (Optional)**:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run prisma:studio
# Runs on http://localhost:5555
# Visual database browser
```

---

## Testing the System

### Test Complete Workflow:

**1. Product Management**:
```
→ Products → New Product
→ Add product details
→ Save
→ Verify in list
```

**2. Inventory**:
```
→ Inventory → Stock
→ View stock levels
→ Stock Adjustment → Record IN
→ Verify stock updated
```

**3. Sales Workflow**:
```
→ Sales → Quotations → New
→ Add customer + line items
→ Save quotation
→ Convert to Sales Order
→ Confirm order
→ Generate Invoice
→ Record Payment
→ Verify outstanding = 0
```

**4. Dashboard**:
```
→ Dashboard
→ View KPIs updated
→ Check sales chart
→ Verify top products
```

---

## Production Build

### Backend:
```powershell
# Build
npm run build

# Start production
npm run start:prod
```

### Frontend:
```powershell
# Build
npm run build

# Output in: dist/frontend
# Deploy to Vercel/Netlify
```

---

## Useful URLs

### Local Development:
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Prisma Studio**: http://localhost:5555

### API Endpoints:
- **Health**: GET /api/v1/health
- **Login**: POST /api/v1/auth/login
- **Products**: GET /api/v1/products
- **Stock**: GET /api/v1/inventory/stock
- **Sales**: GET /api/v1/sales/quotations

---

## System Requirements

### Minimum:
- **RAM**: 4GB
- **Storage**: 2GB free
- **CPU**: Dual-core
- **OS**: Windows 10+, macOS 10.14+, Linux

### Recommended:
- **RAM**: 8GB+
- **Storage**: 10GB+ free
- **CPU**: Quad-core
- **OS**: Windows 11, macOS 12+, Ubuntu 20.04+

---

## Support & Troubleshooting

### Logs Location:
- **Backend**: Console output
- **Frontend**: Browser console (F12)
- **Database**: PostgreSQL logs

### Debug Mode:
```powershell
# Backend debug mode
npm run start:debug

# Frontend verbose
ng serve --verbose
```

### Clear Everything (Nuclear Option):
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run prisma:migrate:reset

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules, dist
npm install
```

---

## Success Indicators

✅ **Backend Running**: Console shows "Nest application successfully started"  
✅ **Frontend Running**: Browser opens at localhost:4200  
✅ **Database Connected**: No connection errors in backend console  
✅ **Login Works**: Can login with demo credentials  
✅ **Data Loads**: Dashboard shows KPIs and charts  
✅ **Navigation Works**: Can access all menu items  

---

## Next Steps

After successful startup:

1. ✅ **Explore Features**: Navigate through all modules
2. ✅ **Test Workflows**: Create quotation → order → invoice → payment
3. ✅ **Customize**: Update company details, add real data
4. ✅ **Deploy**: When ready, deploy to production (see deployment guide)

---

**🎉 Your Invenzo ERP system should now be running locally!**

**Need help?** Check the troubleshooting section above or review the logs.

---

*Invenzo Local Development Guide*  
*Last Updated: February 3, 2026*  
*Status: Production-Ready*

