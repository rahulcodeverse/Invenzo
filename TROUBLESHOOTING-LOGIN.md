# 🔧 TROUBLESHOOTING - LOGIN 404 ERROR

## ❌ ISSUE DETECTED

**Error**: `Cannot POST /api/v1/auth/login`  
**Status**: 404 Not Found  
**Cause**: Backend routes not properly registered OR server connection issue  

---

## 🔍 ROOT CAUSES

### 1. Database Connection Reset
From your logs:
```
Error in PostgreSQL connection: ConnectionReset
```
**Impact**: This can cause the server to crash or routes to not register

### 2. Backend Server May Need Restart
**Symptoms**:
- 404 on all endpoints
- Routes not shown in startup logs
- Connection refused

---

## 🛠️ IMMEDIATE FIX

### **STEP 1: Restart Backend Server**

**Stop the backend** (in Terminal 1):
```powershell
Ctrl + C
```

**Then restart**:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run start:dev
```

**Wait for these messages**:
```
✓ Mapped {/api/v1/auth/login, POST}
✓ Mapped {/api/v1/auth/register, POST}
✓ Nest application successfully started
✓ Server: http://localhost:3000
```

---

### **STEP 2: Verify Database Connection**

Check your `.env` file has:
```env
DATABASE_URL="postgresql://postgres.lpjpryahujilhimdcslj:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

**Important**: Use the **Session Pooler** URL (port 5432), NOT Transaction Pooler

---

### **STEP 3: Test Login Endpoint**

**PowerShell Test**:
```powershell
$body = @{
    email = "owner@invenzo.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "...",
    "user": { ... }
  }
}
```

---

## 🚨 IF RESTART DOESN'T WORK

### **Option A: Re-seed Database**

```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run prisma:migrate
npm run prisma:seed
```

### **Option B: Check Supabase Status**

1. Go to https://supabase.com
2. Login to your account
3. Check if your database is paused
4. **Resume** if needed

### **Option C: Fresh Install**

```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
npm run prisma:generate
npm run start:dev
```

---

## ✅ VERIFICATION CHECKLIST

After restart, verify:

- [ ] Backend terminal shows: "Nest application successfully started"
- [ ] You see route mappings: `/api/v1/auth/login, POST`
- [ ] No connection errors in logs
- [ ] Health check works: http://localhost:3000/health
- [ ] Swagger docs load: http://localhost:3000/api/docs

---

## 🎯 THEN TRY FRONTEND LOGIN

Once backend is confirmed working:

1. Open: http://localhost:4200
2. Login: owner@invenzo.com / password123
3. Should work! ✅

---

## 📝 BACKEND NOT STARTING?

### Check These:

**1. Port 3000 in use?**
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

**Kill process if needed**:
```powershell
Stop-Process -Id <PID> -Force
```

**2. Database URL correct?**
Check `backend/.env`:
- Must use Session Pooler URL
- Port must be 5432
- Password must be correct

**3. Prisma Client generated?**
```powershell
cd backend
npm run prisma:generate
```

---

## 🆘 STILL NOT WORKING?

### **Nuclear Option - Complete Reset**:

**1. Stop all servers** (Ctrl+C in both terminals)

**2. Reset backend**:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

**3. Reset frontend**:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\frontend  
Remove-Item -Recurse -Force node_modules, .angular
npm install
npm start
```

---

## 💡 QUICK DIAGNOSIS

**Run this to check everything**:

```powershell
# Check if backend is running
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing

# Check if frontend is running
Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing

# Test login endpoint
$body = '{"email":"owner@invenzo.com","password":"password123"}' 
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
```

---

## ✅ EXPECTED RESULT

After fixing, you should see:

**Backend Terminal**:
```
[Nest] Mapped {/api/v1/auth/login, POST}
[Nest] Mapped {/api/v1/auth/register, POST}
[Nest] Nest application successfully started
🚀 Invenzo API Server is running!
```

**Login Test**:
```json
{
  "success": true,
  "data": {
    "accessToken": "ey...",
    "user": { "id": "...", "email": "owner@invenzo.com" }
  }
}
```

**Frontend Login**:
- Works without errors
- Redirects to dashboard
- Shows KPIs and charts

---

## 📞 MOST LIKELY FIX

**99% of the time, this is fixed by**:

1. **Ctrl+C** to stop backend
2. **npm run start:dev** to restart
3. Wait for routes to map
4. Try login again

**The database connection reset caused routes to not register properly.**

---

*Created: February 4, 2026, 11:15 AM*  
*Issue: Login 404 Error*  
*Solution: Restart backend server*

