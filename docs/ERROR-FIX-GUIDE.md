# 🔧 INVENZO - ERROR DIAGNOSIS & FIX GUIDE

## Common Startup Errors & Solutions

**Last Updated**: February 3, 2026

---

## Quick Fix (Try This First!)

**Run the automated fix script**:
```powershell
cd C:\Users\Rahul\Documents\Invenzo
.\start-invenzo.ps1
```

This will:
1. Generate Prisma Client
2. Run database migrations
3. Start both servers in separate windows
4. Open your browser automatically

---

## Error 1: Prisma Client Not Generated

### Symptoms:
```
Error: @prisma/client did not initialize yet
Cannot find module '@prisma/client'
```

### Solution:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run prisma:generate
npm run start:dev
```

---

## Error 2: Database Connection Failed

### Symptoms:
```
Error: Can't reach database server
P1001: Can't reach database server at localhost:5432
```

### Solutions:

**Option A: Start PostgreSQL**:
```powershell
# Check status
Get-Service postgresql*

# Start service
Start-Service postgresql-x64-14

# Verify
Get-Service postgresql*
```

**Option B: Use Supabase (Recommended for Quick Start)**:
1. Go to https://supabase.com
2. Sign up (free)
3. Create new project
4. Copy "Direct Connection" string
5. Update `backend/.env`:
   ```
   DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]:5432/postgres"
   ```
6. Run:
   ```powershell
   cd backend
   npm run prisma:migrate
   npm run prisma:seed
   npm run start:dev
   ```

---

## Error 3: Port Already in Use

### Symptoms:
```
Error: Port 3000 is already in use
EADDRINUSE: address already in use :::3000
```

### Solution:
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID 12345 /F

# Or use different port in backend/.env
PORT=3001
```

---

## Error 4: node_modules Missing

### Symptoms:
```
Error: Cannot find module
Module not found
```

### Solution:
```powershell
# Backend
cd C:\Users\Rahul\Documents\Invenzo\backend
npm install

# Frontend
cd C:\Users\Rahul\Documents\Invenzo\frontend
npm install
```

---

## Error 5: Migration Failed

### Symptoms:
```
Error: Migration failed
Database schema is not in sync
```

### Solution (Nuclear Option - Resets Everything):
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend

# Reset database
npm run prisma:migrate:reset

# This will:
# - Drop all tables
# - Run all migrations
# - Seed demo data

# Then start
npm run start:dev
```

---

## Error 6: Angular CLI Not Found

### Symptoms:
```
'ng' is not recognized as an internal or external command
```

### Solution:
```powershell
# Install Angular CLI globally
npm install -g @angular/cli

# Or use npx
cd frontend
npx ng serve
```

---

## Error 7: Environment Variable Missing

### Symptoms:
```
Error: JWT_SECRET is not defined
Error: DATABASE_URL is not defined
```

### Solution:
Check `backend/.env` file exists and contains:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/invenzo?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:4200
PORT=3000
```

If missing, copy from `.env.example`:
```powershell
cd backend
Copy-Item .env.example .env
# Then edit .env with your values
```

---

## Error 8: CORS Error in Browser

### Symptoms:
```
Access to XMLHttpRequest blocked by CORS policy
```

### Solution:
Make sure `FRONTEND_URL` in `backend/.env` is correct:
```env
FRONTEND_URL=http://localhost:4200
```

Restart backend:
```powershell
# Ctrl+C to stop
npm run start:dev
```

---

## Error 9: Can't Login (Demo User Not Found)

### Symptoms:
```
Invalid credentials
User not found
```

### Solution:
Seed the database:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run prisma:seed
```

This creates:
- owner@invenzo.com / password123
- manager@invenzo.com / password123
- staff@invenzo.com / password123

---

## Error 10: Frontend Shows Blank Page

### Symptoms:
- Page loads but nothing displays
- Console shows errors

### Solutions:

**Check Console (F12)**:
- Look for red errors
- Common: API connection failed

**Verify Backend Running**:
```powershell
# Test backend
curl http://localhost:3000/api/v1/health
```

**Check environment.ts**:
```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',  // Must match backend
  appName: 'Invenzo',
  appVersion: '1.0.0'
};
```

**Rebuild Frontend**:
```powershell
cd frontend
# Stop server (Ctrl+C)
# Clear cache
Remove-Item -Recurse -Force .angular
# Restart
npm start
```

---

## Complete Reset (Nuclear Option)

If nothing works, reset everything:

```powershell
cd C:\Users\Rahul\Documents\Invenzo

# Backend
cd backend
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Frontend  
cd ../frontend
Remove-Item -Recurse -Force node_modules, dist, .angular
npm install

# Start backend
cd ../backend
npm run start:dev

# In NEW terminal: Start frontend
cd C:\Users\Rahul\Documents\Invenzo\frontend
npm start
```

---

## Manual Step-by-Step Startup

If automated scripts fail, do it manually:

### Terminal 1 - Backend:
```powershell
# 1. Navigate
cd C:\Users\Rahul\Documents\Invenzo\backend

# 2. Generate Prisma (important!)
npm run prisma:generate

# 3. Run migrations
npm run prisma:migrate

# 4. Seed data (first time only)
npm run prisma:seed

# 5. Start server
npm run start:dev

# Wait for: "Nest application successfully started"
```

### Terminal 2 - Frontend:
```powershell
# 1. Navigate
cd C:\Users\Rahul\Documents\Invenzo\frontend

# 2. Start server
npm start

# Wait for: "Angular Live Development Server is listening"
# Browser should open automatically
```

---

## Verify Everything Works

### Test Backend:
```powershell
# Health check
curl http://localhost:3000/api/v1/health

# Should return: {"status":"ok"}
```

### Test Frontend:
1. Open: http://localhost:4200
2. Should see login page
3. No errors in console (F12)

### Test Login:
1. Email: owner@invenzo.com
2. Password: password123
3. Should redirect to dashboard

---

## Still Having Issues?

### Check These:

1. **Node.js Version**:
   ```powershell
   node --version
   # Should be v18 or higher
   ```

2. **npm Version**:
   ```powershell
   npm --version
   # Should be 9.0 or higher
   ```

3. **PostgreSQL**:
   ```powershell
   Get-Service postgresql*
   # Should show "Running"
   ```

4. **Ports Free**:
   ```powershell
   netstat -ano | findstr ":3000"
   netstat -ano | findstr ":4200"
   # Should be empty
   ```

5. **Files Exist**:
   ```powershell
   Test-Path C:\Users\Rahul\Documents\Invenzo\backend\.env
   Test-Path C:\Users\Rahul\Documents\Invenzo\backend\node_modules
   Test-Path C:\Users\Rahul\Documents\Invenzo\frontend\node_modules
   # All should return: True
   ```

---

## Getting Help

If errors persist:

1. **Check Terminal Output**: Look for specific error messages
2. **Check Browser Console (F12)**: Look for red errors
3. **Check Logs**: Backend terminal shows all API errors
4. **Review `.env`**: Make sure all variables are set correctly

### Common Log Locations:
- **Backend Errors**: Terminal 1 output
- **Frontend Errors**: Browser console (F12) + Terminal 2
- **Database Errors**: PostgreSQL logs

---

## Success Indicators

You'll know it's working when you see:

**Backend Terminal**:
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG Application is running on: http://localhost:3000
```

**Frontend Terminal**:
```
✔ Browser application bundle generation complete.
  ➜ Local: http://localhost:4200/
```

**Browser**:
- Login page loads
- No console errors
- Can login successfully
- Dashboard displays with data

---

## Quick Reference Commands

```powershell
# Check what's running
Get-Process node

# Kill all node processes
Get-Process node | Stop-Process -Force

# Check PostgreSQL
Get-Service postgresql*

# Start PostgreSQL
Start-Service postgresql-x64-14

# View Prisma database
cd backend
npm run prisma:studio

# Reset everything
cd backend
npm run prisma:migrate:reset

# Generate Prisma
npm run prisma:generate

# Seed demo data
npm run prisma:seed
```

---

**Most issues are fixed by generating Prisma Client!**

```powershell
cd backend
npm run prisma:generate
npm run start:dev
```

---

*Invenzo Error Diagnosis Guide*  
*Last Updated: February 3, 2026*  
*Status: Comprehensive Troubleshooting*

