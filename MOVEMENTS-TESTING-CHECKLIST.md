# ✅ INVENTORY MOVEMENTS - TESTING CHECKLIST

**Use this checklist to verify everything works correctly**

---

## 🚀 PRE-TESTING SETUP

- [ ] Backend is running on `http://localhost:3000`
- [ ] Frontend is running on `http://localhost:4200`
- [ ] You're logged in to the application
- [ ] Browser console is open (F12)

---

## 📍 NAVIGATION TESTS

- [ ] Click "Inventory" in sidebar
- [ ] See "Movements" menu item
- [ ] Click "Movements"
- [ ] URL changes to `/inventory/movements`
- [ ] Page loads without errors
- [ ] No console errors visible

---

## 🎨 UI RENDERING TESTS

### Page Header
- [ ] Title shows: "Inventory Movements"
- [ ] Subtitle shows: "Complete stock in/out history..."
- [ ] "Show Filters" button visible
- [ ] "Export" dropdown visible

### Summary Cards (Top Section)
- [ ] 4 cards displayed in a row
- [ ] Card 1: "Total Stock IN" (green)
- [ ] Card 2: "Total Stock OUT" (red)
- [ ] Card 3: "Adjustments" (orange)
- [ ] Card 4: "Total Movements" (blue)
- [ ] Numbers display correctly (or 0 if no data)

### Search Bar
- [ ] Search input field visible
- [ ] Search icon on left side
- [ ] Placeholder text: "Search by product..."
- [ ] Clear icon (X) appears when typing

### Data Table
- [ ] Table renders
- [ ] Column headers visible
- [ ] Columns: Date, Product, Warehouse, Type, Quantity, Balance, Reference, User, Actions
- [ ] Pagination controls at bottom
- [ ] Page size selector (10, 20, 50, 100)

---

## 🔍 FILTER PANEL TESTS

- [ ] Click "Show Filters" button
- [ ] Filter panel expands
- [ ] See date range picker
- [ ] See product dropdown
- [ ] See warehouse dropdown
- [ ] See movement type dropdown
- [ ] See reference search field
- [ ] See min/max quantity inputs
- [ ] "Apply" button visible
- [ ] "Reset" button visible

### Date Range Filter
- [ ] Click date range picker
- [ ] Calendar opens
- [ ] Select start date
- [ ] Select end date
- [ ] Dates display in field

### Product Filter
- [ ] Click product dropdown
- [ ] Products load (or shows "No data" if empty)
- [ ] Search works in dropdown
- [ ] Can select a product
- [ ] Selected product shows

### Warehouse Filter
- [ ] Click warehouse dropdown
- [ ] Warehouses load
- [ ] Can select warehouse
- [ ] Selected warehouse shows

### Movement Type Filter
- [ ] Click type dropdown
- [ ] See 5 options: IN, OUT, TRANSFER, ADJUSTMENT, DAMAGE
- [ ] Can select type
- [ ] Selected type shows

### Apply/Reset Filters
- [ ] Select some filters
- [ ] Click "Apply"
- [ ] Table refreshes
- [ ] Data matches filters
- [ ] Click "Reset"
- [ ] All filters clear
- [ ] Table shows all data

---

## 🔎 SEARCH TESTS

- [ ] Type "test" in search bar
- [ ] Wait 500ms
- [ ] Table filters automatically
- [ ] Type more characters
- [ ] Results update after 500ms
- [ ] Click X icon to clear
- [ ] Search text clears
- [ ] Table shows all data again

---

## 📊 TABLE TESTS

### Data Display
- [ ] Rows display movement data
- [ ] Date column shows formatted date/time
- [ ] Product column shows name + SKU
- [ ] Warehouse column shows name
- [ ] Type column shows color badge
- [ ] Quantity shows +/- sign
- [ ] Balance shows number
- [ ] Reference shows code (or dash if empty)
- [ ] User column shows name
- [ ] Actions column shows eye icon

### Movement Type Colors
- [ ] IN movements have GREEN badge
- [ ] OUT movements have RED badge
- [ ] TRANSFER movements have BLUE badge
- [ ] ADJUSTMENT movements have ORANGE badge
- [ ] DAMAGE movements have GREY badge

### Quantity Colors
- [ ] Positive quantities are GREEN (+50)
- [ ] Negative quantities are RED (-20)
- [ ] Font is bold

### Row Interaction
- [ ] Click eye icon on a row
- [ ] See placeholder message (or modal if Phase 3 done)
- [ ] No errors in console

---

## 📄 PAGINATION TESTS

- [ ] See current page number
- [ ] See total pages
- [ ] Click "Next" button
- [ ] Page number increments
- [ ] URL updates with ?page=2
- [ ] Data changes
- [ ] Click "Previous" button
- [ ] Page decrements
- [ ] URL updates
- [ ] Data changes

### Page Size Change
- [ ] Click page size dropdown
- [ ] Select 50
- [ ] Table reloads with 50 items
- [ ] URL updates with ?limit=50
- [ ] Pagination adjusts

---

## 📤 EXPORT TESTS (Manager/Owner Only)

### CSV Export
- [ ] Click "Export" dropdown
- [ ] See "Export as CSV" option
- [ ] Click "Export as CSV"
- [ ] File downloads
- [ ] Open CSV file
- [ ] Data is correct
- [ ] Headers present
- [ ] Values formatted properly

### Excel Export (If Backend Ready)
- [ ] Click "Export" dropdown
- [ ] See "Export as Excel" option
- [ ] Click it
- [ ] Excel file downloads
- [ ] Open file
- [ ] Data matches table

### Print
- [ ] Click "Export" dropdown
- [ ] See "Print" option
- [ ] Click it
- [ ] Print preview opens
- [ ] Layout looks good
- [ ] Can print or cancel

### RBAC Check
- [ ] Login as STAFF user
- [ ] Export dropdown is DISABLED
- [ ] Login as MANAGER
- [ ] Export dropdown is ENABLED

---

## 🔗 URL SYNC TESTS

- [ ] Apply some filters
- [ ] Check URL has query params
- [ ] Copy URL
- [ ] Open in new tab
- [ ] Filters are preserved
- [ ] Same data shows

---

## 📱 MOBILE RESPONSIVE TESTS

### Desktop View (>1200px)
- [ ] All columns visible
- [ ] Summary cards in 4 columns
- [ ] Filters in grid layout
- [ ] No horizontal scroll on page

### Tablet View (768-1200px)
- [ ] Table has horizontal scroll
- [ ] Summary cards in 2 columns
- [ ] Filters adjust layout
- [ ] Readable

### Mobile View (<768px)
- [ ] Summary cards stack (1 column)
- [ ] Filters stack vertically
- [ ] Table scrolls horizontally
- [ ] Buttons full-width
- [ ] Text readable
- [ ] Touch targets large enough

**Test on:**
- [ ] Chrome DevTools mobile emulation
- [ ] Actual mobile device (if available)
- [ ] Portrait orientation
- [ ] Landscape orientation

---

## ⚡ PERFORMANCE TESTS

- [ ] Initial page load < 2 seconds
- [ ] Filter apply < 1 second
- [ ] Search responds in ~500ms
- [ ] Page change < 500ms
- [ ] Export < 3 seconds for 1000 rows
- [ ] No UI freezing
- [ ] No lag when typing

---

## 🐛 ERROR HANDLING TESTS

### Backend Down
- [ ] Stop backend server
- [ ] Refresh page
- [ ] See error message (or empty state)
- [ ] No application crash
- [ ] Can still navigate away

### No Data
- [ ] Ensure database is empty (or filter returns nothing)
- [ ] See "No movements found" message
- [ ] See "Reset Filters" button
- [ ] Click it
- [ ] Filters clear

### Network Slow
- [ ] Throttle network in DevTools (Slow 3G)
- [ ] Apply filters
- [ ] See loading spinner
- [ ] Data eventually loads
- [ ] No timeout errors

---

## 🔐 SECURITY TESTS

### RBAC Enforcement
- [ ] Login as STAFF
- [ ] Can view movements
- [ ] Cannot export
- [ ] No cost fields visible (if implemented)

- [ ] Login as MANAGER
- [ ] Can view movements
- [ ] Can export
- [ ] Cost fields visible

- [ ] Login as OWNER
- [ ] Full access
- [ ] All features work

### XSS Protection
- [ ] Try entering `<script>alert('xss')</script>` in search
- [ ] No script execution
- [ ] Text is escaped/sanitized

---

## 🎯 WORKFLOW TESTS

### Scenario 1: Daily Stock Check
- [ ] Open movements page
- [ ] Click "Show Filters"
- [ ] Select today's date range
- [ ] Click "Apply"
- [ ] See today's movements only
- [ ] Verify data makes sense

### Scenario 2: Product Audit
- [ ] Show filters
- [ ] Select a product
- [ ] Select last 30 days
- [ ] Apply
- [ ] Export to CSV
- [ ] Review exported data

### Scenario 3: Warehouse Activity
- [ ] Filter by specific warehouse
- [ ] Check summary totals
- [ ] Match with table data
- [ ] Export report

### Scenario 4: Damage Tracking
- [ ] Filter by type: DAMAGE
- [ ] Review all damage entries
- [ ] Note quantities
- [ ] Export for review

---

## ✅ FINAL CHECKS

### Console Logs
- [ ] No errors in browser console
- [ ] No warnings (except expected TypeScript ones)
- [ ] No 404s in network tab
- [ ] No CORS errors

### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test in Safari (if Mac available)

### Accessibility
- [ ] Can navigate with Tab key
- [ ] Focus indicators visible
- [ ] Screen reader compatible (basic check)
- [ ] Color contrast good

---

## 📊 RESULTS SUMMARY

**Total Tests:** ~150+

**Passed:** _____ / _____  
**Failed:** _____ / _____  
**Blocked:** _____ / _____  

---

## 🐛 ISSUES FOUND

| # | Issue | Severity | Steps to Reproduce | Status |
|---|-------|----------|-------------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 📝 NOTES

```
Add any observations, suggestions, or comments here:







```

---

## ✅ SIGN-OFF

- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Ready for Phase 3
- [ ] Ready for production (if applicable)

**Tested by:** _________________  
**Date:** _________________  
**Signature:** _________________

---

**Next Steps:**
1. If all tests pass → Proceed to Phase 3 (Details Modal)
2. If issues found → Report to development team
3. If backend needed → Coordinate with backend team

**Status:** 🟢 READY / 🟡 MINOR ISSUES / 🔴 BLOCKED
