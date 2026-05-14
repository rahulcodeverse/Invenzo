# 🔧 DATABASE CONNECTION ERROR - QUICK FIX

## Error: Can't reach database server at `localhost:5432`

### Solution Options:

## Option A: Start PostgreSQL (If Installed)

```powershell
# Check if PostgreSQL service exists
Get-Service postgresql*

# Start PostgreSQL
Start-Service postgresql-x64-14  # Adjust version number if different

# Verify it's running
Get-Service postgresql*
```

## Option B: Use Supabase (Recommended - Free Cloud Database)

**This is the fastest way to get started!**

### Steps:

1. **Go to Supabase**:
   - Visit: https://supabase.com
   - Sign up (free)

2. **Create New Project**:
   - Click "New Project"
   - Name: Invenzo
   - Database Password: (create strong password)
   - Region: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

3. **Get Connection String**:
   - Click "Settings" → "Database"
   - Scroll to "Connection string"
   - Select "URI" tab
   - Copy the connection string
   - It looks like: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[HOST]:5432/postgres`

4. **Update Backend .env**:
   ```powershell
   cd C:\Users\Rahul\Documents\Invenzo\backend
   notepad .env
   ```

   Replace the DATABASE_URL line with your Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres.xxxxx:your-password@xxxxx.supabase.co:5432/postgres"
   ```

5. **Run Migrations**:
   ```powershell
   cd C:\Users\Rahul\Documents\Invenzo\backend
   npm run prisma:migrate
   npm run prisma:seed
   npm run start:dev
   ```

## Option C: Use Neon (Alternative Free Database)

1. Go to https://neon.tech
2. Sign up (free)
3. Create new project
4. Copy connection string
5. Update .env file
6. Run migrations

---

## After Database is Connected:

The backend will start successfully at:
- **http://localhost:3000**
- **API Docs**: http://localhost:3000/api/docs

---

**Recommended**: Use Supabase - it's free, fast, and requires zero local setup!

