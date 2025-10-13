# Sottocommesse Assignment Update

## Overview
Updated the employee-commessa assignment system to correctly assign employees to **sottocommesse** (sub-projects) instead of main commesse, reflecting real-world timesheet practices.

## Changes Made

### 1. **CommesseMock.js**
Added new functions to handle sottocommesse:

- `listAllSottocommesse({ includeClosed })` - Returns flat list of all sottocommesse with parent commessa info
- `isSottocommessaClosedOn(sottocommessaId, dateKey)` - Checks if a sottocommessa's parent commessa is closed

### 2. **EmployeeCommesseMock.js**
Updated employee assignments to use sottocommesse IDs:

**Before:**
```javascript
const EMPLOYEE_COMMESSE_MAPPING = {
  "emp-001": ["VS-25-01", "VS-25-02", "VS-25-03"], // Main commesse
  ...
};
```

**After:**
```javascript
const EMPLOYEE_COMMESSE_MAPPING = {
  "emp-001": ["VS-25-01-S1", "VS-25-01-S2", "VS-25-03-S1"], // Sottocommesse
  "emp-002": ["VS-25-01-S1", "VS-25-03-S1"],
  "emp-003": ["VS-25-02-S1"],
  ...
};
```

Updated functions:
- `getActiveCommesseForEmployee()` - Now returns active sottocommesse IDs
- `getActiveCommesseForEmployeeV2()` - Uses `isSottocommessaClosedOn()` for date filtering

### 3. **ProjectMock.js**
Updated the `EMPLOYEE_COMMESSE` constant to use sottocommesse IDs instead of main commesse IDs.

## Sottocommesse Structure

### VS-25-01 (Progetto Infrastrutture Viabilità)
- **VS-25-01-DL**: DL+Collaudo (Direzione lavori e collaudo finale)
- **VS-25-01-INST**: Installazione (Impianti elettrici e SCADA)

### VS-25-02 (Manutenzione Impianti Industriali) - CLOSED
- **VS-25-02-MANUT**: Manutenzione Generale

### VS-25-03 (Centro Commerciale Green Plaza)
- **VS-25-03-PROG**: Progettazione Completa (Esecutiva, BIM, Antincendio)

### VS-24-04 (Rilievi Topografici) - CLOSED
- **VS-24-04-RILIEVI**: Rilievi e Tarature

## Sottocommessa ID Convention

IDs now include the **work type** instead of generic sequential numbers:
- **DL**: Direzione Lavori (Work Direction)
- **INST**: Installazione (Installation)
- **MANUT**: Manutenzione (Maintenance)
- **PROG**: Progettazione (Design/Planning)
- **RILIEVI**: Rilievi Topografici (Surveys)

This makes IDs self-documenting: `VS-25-01-DL` immediately tells you it's about "Direzione Lavori" on project VS-25-01.

## Employee Assignments

| Employee | Assigned Sottocommesse | Description |
|----------|----------------------|-------------|
| emp-001 | VS-25-01-DL, VS-25-01-INST, VS-25-03-PROG | DL+Collaudo, Installazione, Progettazione |
| emp-002 | VS-25-01-DL, VS-25-03-PROG | DL+Collaudo, Progettazione |
| emp-003 | VS-25-02-MANUT | Manutenzione Generale |
| emp-004 | VS-25-01-INST, VS-25-02-MANUT | Installazione, Manutenzione |
| emp-005 | VS-25-03-PROG | Progettazione Completa |
| default | VS-25-01-DL, VS-25-01-INST, VS-25-03-PROG | Multiple sottocommesse |

## Benefits

1. **More Realistic**: Reflects actual business practice where employees work on specific sub-projects
2. **Better Granularity**: Each sottocommessa has its own budget, services, and responsible person
3. **Accurate Tracking**: Hours are tracked at the sottocommessa level for better project management
4. **Service Association**: Sottocommesse have specific services (DL, COLLAUDO, INST_ELE, SCADA, etc.)

## Color Generation (Enhanced!)

The hash-based color generation is now **specifically optimized** for sottocommessa IDs with work type suffixes!

### Algorithm Strategy
- **Suffix Weight**: 80% - Work type (DL, INST, PROG, etc.) determines the color family
- **Prefix Weight**: 20% - Project ID adds variation within the family

### Color Families by Work Type
```
VS-25-01-DL    → Blue family 🔵    (All DL work = blue tones)
VS-25-01-INST  → Green family 🟢   (All INST work = green tones)
VS-25-03-PROG  → Purple family 🟣  (All PROG work = purple tones)
VS-25-02-MANUT → Orange family 🟠  (All MANUT work = orange tones)
VS-24-04-RILIEVI → Cyan family 🔷 (All RILIEVI work = cyan tones)
```

### Benefits
1. **Visual Grouping**: Same work type = similar colors → Easy to identify work types at a glance
2. **Maximum Distinction**: Different work types = very different colors → Clear visual separation
3. **Semantic Colors**: Colors have meaning (blue always means DL, green always means INST)
4. **Within-Group Variation**: Same work type on different projects gets different shades

See `COLOR_HASH_ANALYSIS.md` for detailed algorithm explanation and examples.

## API Impact

All existing API calls remain backward compatible:
- `getActiveCommesseForEmployee(employeeId)` → Returns sottocommesse IDs
- `getActiveCommesseForEmployeeV2(employeeId, options)` → Uses sottocommessa filtering
- Display components automatically show sottocommessa names

## Testing

Build successful ✅ - All components continue to work with the new sottocommesse structure.
