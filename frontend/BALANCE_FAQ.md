# Balance System - FAQ

## Q: Why are balances showing 0 (or low values)?

**A: The balances you see are REMAINING balances after year-to-date seed generation.**

### Initial Balances (at module load)
- **PERMESSO**: 104 hours (13 days)
- **ROL**: 80 hours (10 days)

These reflect typical Italian labor contract annual allowances.

### Seed Generation Consumption

When the application loads, ProjectMock.js generates historical timesheet data from **January 1, 2025** to **today (October 10, 2025)**.

During this seed generation (~200 working days):

1. **Partial PERMESSO/ROL usage** (~20% probability):
   - ~40 days with partial usage (1-3h each)
   - Roughly split 50/50 between PERMESSO and ROL
   - Consumes: ~30-40h PERMESSO + ~30-40h ROL

2. **Full-day PERMESSO/ROL replacement** (~3% probability):
   - ~12 days with 8h each
   - Split between PERMESSO and ROL
   - Consumes: ~48h PERMESSO + ~48h ROL

3. **Total consumption**: ~78h PERMESSO + ~78h ROL

### Expected Remaining Balances

After seed generation, employees should have approximately:
- **PERMESSO**: 104 - 78 = **~26 hours remaining**
- **ROL**: 80 - 78 = **~2 hours remaining**

This is **CORRECT and EXPECTED** behavior. The balances reflect realistic usage patterns over 10 months of the year.

## Why This Design?

The mock system simulates a real-world scenario where:
- Employees use their PERMESSO and ROL throughout the year
- By October, most of the annual quota has been consumed
- The remaining balance is what's still available for the rest of the year

## How to Increase Available Balances

If you need more available balance for testing, you can:

### Option 1: Increase Initial Quotas
Edit `ProjectMock.js` line ~170:
```javascript
for (const emp of EMPLOYEES) {
  ensureEmployeeBalances(emp.id, { permesso: 200, rol: 160 }); // Double the quotas
}
```

### Option 2: Reduce Seed Usage Probability
Edit `ProjectMock.js` employee seed section (~line 200):
```javascript
// Change from 20% to 10%
if (Math.random() < 0.10) { // Was 0.20
  // Add partial PERMESSO/ROL
}
```

### Option 3: Generate Less Historical Data
Edit `ProjectMock.js` top section:
```javascript
// Instead of full year, start from recent month
const start = new Date(today.getFullYear(), today.getMonth() - 1, 1); // Only last month
```

## Verification

To check current balances for any employee:
1. Open browser console
2. In the timesheet dialog, balances are displayed as chips:
   - "Saldo PERMESSO: Xh"
   - "Saldo ROL: Xh"

## Balance Operations

### Consumption
When you add PERMESSO or ROL entries, balances decrement:
- Partial PERMESSO (2h) → Balance reduces by 2h
- Full-day PERMESSO/ROL (8h) → Balance reduces by 8h

### Refund
When you edit or delete PERMESSO/ROL entries, balances are refunded:
- Delete PERMESSO entry (3h) → Balance increases by 3h
- Edit PERMESSO from 4h to 2h → Balance increases by 2h

### Validation
System throws errors when insufficient balance:
- "Saldo PERMESSO insufficiente."
- "Saldo ROL insufficiente."

This prevents overshooting annual quotas.
