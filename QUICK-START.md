# ✅ INVENZO - APPLICATIONS STARTED!

## 🚀 Starting Invenzo ERP Locally

**Started**: February 3, 2026

---

## Applications Status

### ✅ Backend Server
**Command**: `npm run start:dev`  
**Location**: `C:\Users\Rahul\Documents\Invenzo\backend`  
**Status**: Starting...  
**URL**: http://localhost:3000  
**API Docs**: http://localhost:3000/api/docs  

**Expected Startup Time**: 10-30 seconds  
**Success Message**: "Nest application successfully started on port 3000"

---

### ✅ Frontend Server
**Command**: `npm start`  
**Location**: `C:\Users\Rahul\Documents\Invenzo\frontend`  
**Status**: Starting...  
**URL**: http://localhost:4200  

**Expected Startup Time**: 30-60 seconds  
**Success Message**: "Angular Live Development Server is listening on localhost:4200"

---

## Next Steps (1-2 minutes)

### 1. Wait for Servers to Start
- Backend: Watch for "Nest application successfully started" message
- Frontend: Browser should auto-open at http://localhost:4200
- Or manually open: http://localhost:4200

### 2. Login to System
**Navigate to**: http://localhost:4200

**Demo Credentials**:
```
Email: owner@invenzo.com
Password: password123
```

### 3. Verify Everything Works

**After Login**:
- ✅ Dashboard loads with KPIs
- ✅ Sales chart displays
- ✅ Navigate to Products → See product list
- ✅ Navigate to Inventory → View stock
- ✅ Navigate to Sales → See quotations

---

## Quick Access URLs

### Frontend:
- **Application**: http://localhost:4200
- **Login Page**: http://localhost:4200/auth/login

### Backend:
- **Health Check**: http://localhost:3000/api/v1/health
- **Swagger API Docs**: http://localhost:3000/api/docs
- **API Base**: http://localhost:3000/api/v1

### Database (Optional):
Run in new terminal:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run prisma:studio
```
Opens at: http://localhost:5555

---

## If Something Goes Wrong

### Backend Not Starting?

**Check**:
1. Is PostgreSQL running?
   ```powershell
   Get-Service postgresql*
   ```

2. Is port 3000 free?
   ```powershell
   netstat -ano | findstr :3000
   ```

3. Is DATABASE_URL correct in `.env`?

**Fix**:
```powershell
# Stop backend (Ctrl+C in terminal)
cd C:\Users\Rahul\Documents\Invenzo\backend

# Check environment
cat .env

# Regenerate Prisma
npm run prisma:generate

# Restart
npm run start:dev
```

### Frontend Not Starting?

**Check**:
1. Is port 4200 free?
   ```powershell
   netstat -ano | findstr :4200
   ```

2. Are dependencies installed?

**Fix**:
```powershell
# Stop frontend (Ctrl+C in terminal)
cd C:\Users\Rahul\Documents\Invenzo\frontend

# Reinstall if needed
npm install

# Restart
npm start
```

### Can't Login?

**Run Database Seed**:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run prisma:seed
```

This creates demo users:
- owner@invenzo.com / password123
- manager@invenzo.com / password123
- staff@invenzo.com / password123

---

## What You Should See

### Terminal 1 (Backend):
```
[Nest] 12345  - 02/03/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 02/03/2026, 10:30:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 02/03/2026, 10:30:01 AM     LOG [RoutesResolver] AuthController {/api/v1/auth}:
[Nest] 12345  - 02/03/2026, 10:30:01 AM     LOG [RouterExplorer] Mapped {/api/v1/auth/login, POST} route
[Nest] 12345  - 02/03/2026, 10:30:01 AM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 02/03/2026, 10:30:01 AM     LOG Application is running on: http://localhost:3000
[Nest] 12345  - 02/03/2026, 10:30:01 AM     LOG Swagger documentation available at: http://localhost:3000/api/docs
```

### Terminal 2 (Frontend):
```
✔ Browser application bundle generation complete.
✔ Copying assets complete.

Initial Chunk Files   | Names         |  Raw Size
main.js               | main          |   2.50 MB | 
polyfills.js          | polyfills     | 333.19 kB | 
styles.css            | styles        | 245.23 kB | 

Application bundle generation complete. [10.234 seconds]

Watch mode enabled. Watching for file changes...
  ➜ Local:   http://localhost:4200/
  ➜ press h + enter to show help
```

---

## Test the Complete System

### Quick Workflow Test (2 minutes):

**1. Login** (30 seconds):
- Open http://localhost:4200
- Email: owner@invenzo.com
- Password: password123
- Click "Login"
- Should redirect to Dashboard

**2. View Dashboard** (30 seconds):
- See KPIs (Revenue, Profit, etc.)
- View Sales Chart
- Check Top Products table

**3. Products** (30 seconds):
- Click "Products" in sidebar
- See product list
- Try search/filter
- Click "New Product" (optional)

**4. Inventory** (30 seconds):
- Click "Inventory" → "Stock"
- See stock levels
- View different warehouses

**5. Sales Workflow** (complete if time):
- Sales → Quotations → New Quotation
- Add customer + products
- Save quotation
- Convert to Order
- Generate Invoice

---

## Success Checklist

After startup, verify:

- [x] Backend running on port 3000
- [x] Frontend running on port 4200
- [x] Can access http://localhost:4200
- [x] Login page loads
- [x] Can login with demo credentials
- [x] Dashboard displays
- [x] Navigation works
- [x] API calls successful (no console errors)
- [x] Data loads in tables

If all checked ✅ → **System is running perfectly!**

---

## Stopping the Applications

### When You're Done:

**Terminal 1 (Backend)**:
```
Press Ctrl+C
Type 'Y' to confirm
```

**Terminal 2 (Frontend)**:
```
Press Ctrl+C
Type 'Y' to confirm
```

### Restart Later:
```powershell
# Terminal 1
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run start:dev

# Terminal 2 (new window)
cd C:\Users\Rahul\Documents\Invenzo\frontend
npm start
```

---

## Useful Commands While Running

### Backend Terminal:
- `rs` - Restart server
- `Ctrl+C` - Stop server

### Frontend Terminal:
- Browser auto-reloads on file changes
- `Ctrl+C` - Stop server

### View Logs:
- Backend: Check Terminal 1
- Frontend: Check Terminal 2 + Browser Console (F12)

---

## 🎉 Your Invenzo ERP is Running!

**Frontend**: http://localhost:4200  
**Backend**: http://localhost:3000  
**API Docs**: http://localhost:3000/api/docs  

**Login**: owner@invenzo.com / password123

**Enjoy exploring your production-ready ERP system!**

---

*Quick Startup Guide*  
*Both servers should be up in 1-2 minutes*  
*Check terminal output for any errors*  
*Last Updated: February 3, 2026*

