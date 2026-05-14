# 🔧 DATABASE CONNECTION TROUBLESHOOTING

## Current Issue

Connection to Supabase is timing out or failing with "Tenant or user not found" error.

---

## ✅ SOLUTION 1: Use Transaction Mode Connection (Recommended)

Supabase has two connection modes:
1. **Session Mode** (Port 5432) - Direct connection (what we tried)
2. **Transaction Mode** (Port 6543) - Pooled connection

For **Prisma migrations**, you need **Session Mode**.

### Get the Correct Connection String:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `lpjpryahujilhimdcslj`
3. Click **Settings** → **Database**
4. Scroll to **Connection string**
5. Select **Session mode** (NOT Transaction mode or URI)
6. Copy the connection string

It should look like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.lpjpryahujilhimdcslj.supabase.co:5432/postgres
```

### Update .env:

Replace `[YOUR-PASSWORD]` with `Invenzo%40123` (URL-encoded version of `Invenzo@123`):

```env
DATABASE_URL="postgresql://postgres:Invenzo%40123@db.lpjpryahujilhimdcslj.supabase.co:5432/postgres"
```

---

## ✅ SOLUTION 2: Check Supabase Project Status

1. Go to https://supabase.com/dashboard
2. Make sure your project is **Active** (not paused)
3. Check if database is **healthy**
4. If paused, click "Resume project"

---

## ✅ SOLUTION 3: Allow IPv4 Connection

Supabase might be using IPv6. To force IPv4:

```env
DATABASE_URL="postgresql://postgres:Invenzo%40123@db.lpjpryahujilhimdcslj.supabase.co:5432/postgres?connect_timeout=10"
```

---

## ✅ SOLUTION 4: Network/Firewall Issue

Check if your network blocks Supabase:

```powershell
# Test connection to Supabase
Test-NetConnection -ComputerName db.lpjpryahujilhimdcslj.supabase.co -Port 5432
```

If this fails, try:
- Disable VPN if using one
- Try different network (mobile hotspot)
- Check corporate firewall settings

---

## ✅ SOLUTION 5: Use Neon Instead (Alternative)

If Supabase keeps failing, use Neon.tech (another free PostgreSQL):

1. Go to: https://neon.tech
2. Sign up (free)
3. Create project: "Invenzo"
4. Copy connection string (it will be provided immediately)
5. Update `.env`:
   ```env
   DATABASE_URL="your_neon_connection_string"
   ```
6. Run migrations

---

## ✅ SOLUTION 6: Reset Supabase Database Password

The password might have special characters causing issues:

1. Go to Supabase Dashboard
2. **Settings** → **Database**
3. Scroll to **Database password**
4. Click **Reset database password**
5. Set a **simple password** (only letters and numbers): `Invenzo2024`
6. Copy the new connection string
7. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:Invenzo2024@db.lpjpryahujilhimdcslj.supabase.co:5432/postgres"
   ```

---

## ✅ SOLUTION 7: Use Prisma Studio Connection Test

```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
npx prisma studio
```

If Prisma Studio opens successfully at http://localhost:5555, the connection works!

---

## ✅ SOLUTION 8: Manual Migration via Supabase SQL Editor

If Prisma migrations keep failing, run them manually:

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Copy the migration SQL from: `backend/prisma/migrations/[latest-migration]/migration.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Then just run seed:
   ```powershell
   npm run prisma:seed
   npm run start:dev
   ```

---

## 🔍 Debug Steps

### Check Current Connection String:

```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend
Get-Content .env | Select-String DATABASE_URL
```

### Test Prisma Connection:

```powershell
npx prisma db pull
```

This should show if connection works.

---

## 📋 Working Connection String Format

```env
# Basic format
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Your format should be:
DATABASE_URL="postgresql://postgres:Invenzo%40123@db.lpjpryahujilhimdcslj.supabase.co:5432/postgres"

# Or with simple password:
DATABASE_URL="postgresql://postgres:Invenzo2024@db.lpjpryahujilhimdcslj.supabase.co:5432/postgres"
```

---

## ⚠️ Common Mistakes

1. ❌ Using Transaction mode (port 6543) for migrations
2. ❌ Wrong password format (not URL-encoded)
3. ❌ Project is paused in Supabase
4. ❌ Firewall blocking connection
5. ❌ Using pooler URL instead of direct URL

---

## 🎯 Recommended Action

**Try these in order:**

1. **Reset password** to simple one (Invenzo2024)
2. **Update .env** with new connection string
3. **Test connection**:
   ```powershell
   npx prisma db pull
   ```
4. **If successful**, run:
   ```powershell
   npm run prisma:migrate
   npm run prisma:seed
   npm run start:dev
   ```

---

## 🆘 Last Resort: Use Local PostgreSQL

If Supabase continues to fail:

```powershell
# Install PostgreSQL locally
# Download from: https://www.postgresql.org/download/windows/

# After installation:
# Start PostgreSQL service
Start-Service postgresql-x64-16

# Create database
psql -U postgres
CREATE DATABASE invenzo;
\q

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/invenzo"

# Run migrations
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

---

**Most Likely Fix**: Reset your Supabase password to a simple one (no special characters) and update the connection string.

