# Backend PATCH Route 404 - Troubleshooting Guide

## Problem
Getting 404 error when trying to PATCH `/api/v1/warehouses/:id`

```
PATCH http://localhost:3000/api/v1/warehouses/5530a302-956f-48d3-85ae-3e240e543f20 404 (Not Found)
Error: "Cannot PATCH /api/v1/warehouses/5530a302-956f-48d3-85ae-3e240e543f20"
```

## Root Cause
The backend TypeScript code has been updated with the `@Patch(':id')` decorator, but the changes haven't been compiled to JavaScript in the `dist` folder yet.

## Solution - Choose ONE of the following:

### Option 1: Quick Fix (If backend is running in dev mode)
The backend should auto-rebuild if running with `npm run start:dev`. Just restart the backend:

```powershell
# In PowerShell
cd C:\Users\Rahul\Documents\Invenzo\backend

# Stop the backend (Ctrl+C in the terminal where it's running)
# Then restart:
npm run start:dev
```

### Option 2: Manual Build (Recommended)
If auto-rebuild isn't working, manually rebuild:

```powershell
cd C:\Users\Rahul\Documents\Invenzo\backend

# Build
npm run build

# Start in dev mode (with watch)
npm run start:dev
```

### Option 3: Use the Script
Run the rebuild script I created:

```powershell
cd C:\Users\Rahul\Documents\Invenzo
.\rebuild-backend.ps1
```

Then start the backend:
```powershell
cd backend
npm run start:dev
```

## Verification

After restarting, check the backend logs. You should see:

```
[Nest] ... INFO  Mapped {/warehouses/:id, PATCH} route
[Nest] ... INFO  Mapped {/warehouses/:id, PUT} route
```

## Alternative: Check Running Backend

If you're not sure what command the backend is running with:

1. Open Task Manager
2. Find `node.exe` processes
3. Check if one is from `Invenzo\backend`
4. Kill it and restart with `npm run start:dev`

## Testing After Restart

1. Try editing a warehouse in the UI
2. Check the Network tab - should see PATCH request succeed with 200
3. Verify the data is saved in the database

## Still Not Working?

If you still get 404 after rebuild and restart:

1. **Check the controller file exists:**
   ```
   C:\Users\Rahul\Documents\Invenzo\backend\src\modules\inventory\warehouses.controller.ts
   ```
   Should have `@Patch(':id')` at line ~52

2. **Check the compiled file:**
   ```
   C:\Users\Rahul\Documents\Invenzo\backend\dist\main.js
   ```
   Search for "warehouses" - should see the routes registered

3. **Check backend startup logs:**
   Should show routes being mapped:
   ```
   [Nest] Mapped {/warehouses, POST} route
   [Nest] Mapped {/warehouses, GET} route
   [Nest] Mapped {/warehouses/:id, GET} route
   [Nest] Mapped {/warehouses/:id, PATCH} route  ← Should see this
   [Nest] Mapped {/warehouses/:id, PUT} route
   [Nest] Mapped {/warehouses/:id, DELETE} route
   ```

## What Changed

The following files were modified:

1. **warehouses.controller.ts**
   - Added `Patch` to imports (line 6)
   - Added `@Patch(':id')` decorator (line 52)

2. **inventory.service.ts**
   - Fixed field mapping for `contactPhone` → `phone`
   - Fixed field mapping for `contactEmail` → `email`
   - Updated both `createWarehouse()` and `updateWarehouse()` methods

These changes allow the backend to:
- Accept both PUT and PATCH requests for updates
- Properly map DTO fields to database columns

---

**Current Status**: Code is updated ✅ | Build required ⚠️ | Testing pending ⏳
