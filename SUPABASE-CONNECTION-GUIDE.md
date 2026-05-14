# 🔧 SUPABASE CONNECTION STRING - QUICK FIX

## Your Supabase Project Detected!

**Project ID**: `lpjpryahujilhimdcslj`  
**Region**: `ap-south-1` (India)

---

## ✅ How to Get Your Connection String

### Step 1: Login to Supabase

Go to: https://supabase.com/dashboard

### Step 2: Open Your Project

Find project: **lpjpryahujilhimdcslj**

### Step 3: Get Connection String

1. Click **Settings** (gear icon at bottom left)
2. Click **Database**
3. Scroll down to **Connection string**
4. Select **URI** tab (not Transaction Mode or Session Mode)
5. **Copy the entire connection string**

### Step 4: Update .env File

The connection string will look like:
```
postgresql://postgres.lpjpryahujilhimdcslj:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**Replace `[YOUR-PASSWORD]` with the actual database password you set when creating the project.**

---

## Current .env File Location

```
C:\Users\Rahul\Documents\Invenzo\backend\.env
```

**Line to update** (line 7):
```env
DATABASE_URL="postgresql://postgres.lpjpryahujilhimdcslj:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## Alternative: Direct Connection (If Pooling Doesn't Work)

Try this format instead:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.lpjpryahujilhimdcslj.supabase.co:5432/postgres"
```

---

## After Updating .env:

```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data
npm run prisma:seed

# Start backend
npm run start:dev
```

---

## ⚠️ Important Notes

1. **Password Format**: 
   - If your password contains special characters like `@`, `#`, `!`, etc.
   - You need to URL-encode them
   - Or set a simpler password in Supabase

2. **Common Special Characters**:
   - `@` becomes `%40`
   - `!` becomes `%21`
   - `#` becomes `%23`
   - `$` becomes `%24`

3. **Easiest Solution**:
   - Reset your database password in Supabase
   - Use a password with only letters and numbers
   - Example: `Invenzo2024Pass`

---

## Reset Password in Supabase

1. Go to **Settings** → **Database**
2. Scroll to **Database password** section
3. Click **Reset database password**
4. Set new password (use letters + numbers only)
5. Copy new connection string
6. Update `.env` file

---

## Test Connection

After updating `.env`:

```powershell
cd backend
npx prisma db push
```

If successful, you'll see:
```
✔ Generated Prisma Client
✔ Database synchronized
```

---

**Next**: Run the migration and seed commands above!

