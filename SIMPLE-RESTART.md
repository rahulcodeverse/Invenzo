# 🚀 SIMPLE BACKEND RESTART

## Just run these 2 commands:

### 1. Stop all Node processes:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 2. Start backend:
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend; npm run start:dev
```

---

## Wait for this message:
```
✓ Nest application successfully started
🚀 Invenzo API Server is running!
```

---

## Then test login:
```powershell
$body = '{"email":"owner@invenzo.com","password":"password123"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
```

**Should return**: `accessToken` and user data ✅

---

## Then login to frontend:
**http://localhost:4200**

Login: `owner@invenzo.com` / `password123`

---

**That's it!** 🎉

