# ⚠️ QUICK FIX - LOGIN NOT WORKING

## 🚨 ISSUE
**Login returns 404 error**  
**Cause**: Backend server is not running on port 3000

## ✅ SOLUTION (CHOOSE ONE)

### **OPTION A: Automated Script (EASIEST)**

In PowerShell (as Administrator):

```powershell
cd C:\Users\Rahul\Documents\Invenzo
.\restart-backend.ps1
```

Wait for: `✓ Nest application successfully started`

---

### **OPTION B: Manual Restart**

**Step 1: Kill all Node processes**
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Step 2: Start backend**
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run start:dev
```

**Step 3: Wait for success**
Look for these messages:
```
[Nest] Mapped {/api/v1/auth/login, POST}
[Nest] Mapped {/api/v1/auth/register, POST}
[Nest] Nest application successfully started
🚀 Invenzo API Server is running!
```

---

### **STEP 2: Try Login Again**

1. Go to: **http://localhost:4200**
2. Login:
   ```
   Email: owner@invenzo.com
   Password: password123
   ```
3. Should work! ✅

---

## 🔍 WHY THIS HAPPENED

Your backend server **stopped running** or crashed due to:
- Database connection reset
- Process killed
- Port 3000 not listening

**Restarting fixes it!**

---

## ✅ VERIFY BACKEND IS READY

After restart, check backend terminal shows:
```
[Nest] Mapped {/api/v1/auth/login, POST}
[Nest] Mapped {/api/v1/auth/register, POST}
[Nest] Nest application successfully started
🚀 Invenzo API Server is running!
```

**Test the endpoint**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing
```

Should return: **200 OK**

---

## 🆘 STILL NOT WORKING?

### Check if port 3000 is in use:
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

### If no output, backend is NOT running. Restart it!

### See **TROUBLESHOOTING-LOGIN.md** for detailed fixes.

---

## 📝 IMPORTANT NOTES

- **Both terminals must be running**: Backend (port 3000) + Frontend (port 4200)
- **Backend must start FIRST** before frontend can login
- **Wait for all routes to map** before trying login

---

**TL;DR**: 
1. Run `.\restart-backend.ps1` 
2. Wait for "Nest application started"
3. Try login again!

