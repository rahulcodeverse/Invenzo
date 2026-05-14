# ⚡ MANUAL DATABASE SETUP - STEP BY STEP

Since the automated script has issues, follow these manual steps:

---

## 📋 Copy and Run These Commands One by One

### Step 1: Navigate to Backend
```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
```

### Step 2: Generate Prisma Client
```powershell
npm run prisma:generate
```
**Wait for**: "✔ Generated Prisma Client"

### Step 3: Push Database Schema
```powershell
npx prisma db push
```
**Wait for**: "Your database is now in sync with your schema"
This may take 30-60 seconds.

### Step 4: Seed Demo Data
```powershell
npm run prisma:seed
```
**Wait for**: "🎉 Database seed completed!"

### Step 5: Start Backend
```powershell
npm run start:dev
```
**Wait for**: "Nest application successfully started"

### Step 6: Open NEW Terminal and Start Frontend
```powershell
cd C:\Users\Rahul\Documents\Invenzo\frontend
npm start
```
**Wait for**: Browser opens at http://localhost:4200

### Step 7: Login
- Email: `owner@invenzo.com`
- Password: `password123`

---

## ✅ Expected Success Messages

**After Prisma Generate**:
```
✔ Generated Prisma Client (v5.22.0)
```

**After DB Push**:
```
🚀  Your database is now in sync with your Prisma schema. Done in XXXms
✔ Generated Prisma Client
```

**After Seed**:
```
✅ Tenant created
✅ Users created
✅ Categories created
✅ Brands created
✅ Units created
✅ Warehouses created
✅ Products created
✅ Stock created
✅ Vendors created
✅ Customers created
🎉 Database seed completed!
```

**After Backend Start**:
```
[Nest] LOG [NestApplication] Nest application successfully started
Application is running on: http://localhost:3000
```

---

## 🔧 If Step 3 (db push) Fails

### Error: "Can't reach database server"

**Check**:
1. `.env` file has correct connection string
2. Supabase project is active (not paused)
3. Internet connection is working

**Try**:
```powershell
# Test connection
npx prisma db pull
```

If this works, your connection is good. Try `db push` again.

### Error: "Timeout" or hangs

**Solution**: Your connection string might still be wrong.

Open `.env` and verify it matches EXACTLY:
```env
DATABASE_URL="postgresql://postgres.lpjpryahujilhimdcslj:Invenzo%40123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

---

## 🎯 Quick Verification

After all steps complete, verify:

1. **Backend running**: http://localhost:3000 → should show "Cannot GET /"
2. **API Docs**: http://localhost:3000/api/docs → should show Swagger UI
3. **Frontend running**: http://localhost:4200 → should show login page
4. **Can login**: Use owner@invenzo.com / password123

---

## 📝 Summary of Commands

```powershell
# Terminal 1 - Backend
cd C:\Users\Rahul\Documents\Invenzo\backend
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm run start:dev

# Terminal 2 - Frontend (new window)
cd C:\Users\Rahul\Documents\Invenzo\frontend
npm start
```

---

**Start with Step 1 and run each command one at a time!**

