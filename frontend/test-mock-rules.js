// Quick verification of mock business rules
import { employeeTimesheetMock, operaioPersonalMock, NON_WORK } from './src/mocks/ProjectMock.js';
import { getEmployeeBalances } from './src/mocks/TimesheetBalancesMock.js';

console.log('=== VERIFICATION OF MOCK BUSINESS RULES ===\n');

// Helper to check if entry is non-work
const isNonWork = (commessa) => NON_WORK.has(String(commessa).toUpperCase());

// RULE 1: No partial FERIE (FERIE must be 8h only)
console.log('RULE 1: Checking for partial FERIE...');
let partialFerieFound = false;
Object.entries(employeeTimesheetMock).forEach(([empId, ts]) => {
  Object.entries(ts).forEach(([dateKey, records]) => {
    if (dateKey.includes('_segnalazione')) return;
    records.forEach(r => {
      if (String(r.commessa).toUpperCase() === 'FERIE' && r.ore !== 8) {
        console.log(`  ❌ VIOLATION: ${empId} ${dateKey} has FERIE with ${r.ore}h (must be 8h)`);
        partialFerieFound = true;
      }
    });
  });
});
if (!partialFerieFound) console.log('  ✅ PASS: No partial FERIE found\n');

// RULE 2: MALATTIA must be 8h and exclusive
console.log('RULE 2: Checking MALATTIA exclusivity...');
let malattiaViolation = false;
Object.entries(employeeTimesheetMock).forEach(([empId, ts]) => {
  Object.entries(ts).forEach(([dateKey, records]) => {
    if (dateKey.includes('_segnalazione')) return;
    const malattiaRecords = records.filter(r => String(r.commessa).toUpperCase() === 'MALATTIA');
    if (malattiaRecords.length > 0) {
      const totalMalattia = malattiaRecords.reduce((s, r) => s + r.ore, 0);
      if (totalMalattia !== 8) {
        console.log(`  ❌ VIOLATION: ${empId} ${dateKey} has MALATTIA with total ${totalMalattia}h (must be 8h)`);
        malattiaViolation = true;
      }
      if (records.length > 1) {
        console.log(`  ❌ VIOLATION: ${empId} ${dateKey} has MALATTIA with other entries (must be exclusive)`);
        malattiaViolation = true;
      }
    }
  });
});
if (!malattiaViolation) console.log('  ✅ PASS: MALATTIA is always 8h and exclusive\n');

// RULE 3: FERIE must be 8h and exclusive (no PERMESSO/ROL mix)
console.log('RULE 3: Checking FERIE exclusivity...');
let ferieViolation = false;
Object.entries(employeeTimesheetMock).forEach(([empId, ts]) => {
  Object.entries(ts).forEach(([dateKey, records]) => {
    if (dateKey.includes('_segnalazione')) return;
    const ferieRecords = records.filter(r => String(r.commessa).toUpperCase() === 'FERIE');
    if (ferieRecords.length > 0) {
      const totalFerie = ferieRecords.reduce((s, r) => s + r.ore, 0);
      if (totalFerie !== 8) {
        console.log(`  ❌ VIOLATION: ${empId} ${dateKey} has FERIE with total ${totalFerie}h (must be 8h)`);
        ferieViolation = true;
      }
      const hasPermessoRol = records.some(r => ['PERMESSO','ROL'].includes(String(r.commessa).toUpperCase()));
      if (hasPermessoRol) {
        console.log(`  ❌ VIOLATION: ${empId} ${dateKey} has FERIE mixed with PERMESSO/ROL (must be exclusive)`);
        ferieViolation = true;
      }
    }
  });
});
if (!ferieViolation) console.log('  ✅ PASS: FERIE is always 8h and exclusive\n');

// RULE 4: No duplicate non-work codes per day
console.log('RULE 4: Checking for duplicate non-work codes per day...');
let duplicatesFound = false;
Object.entries(employeeTimesheetMock).forEach(([empId, ts]) => {
  Object.entries(ts).forEach(([dateKey, records]) => {
    if (dateKey.includes('_segnalazione')) return;
    const nonWorkCodes = records.filter(r => isNonWork(r.commessa)).map(r => String(r.commessa).toUpperCase());
    const uniqueCodes = new Set(nonWorkCodes);
    if (nonWorkCodes.length !== uniqueCodes.size) {
      console.log(`  ❌ VIOLATION: ${empId} ${dateKey} has duplicate non-work codes: ${nonWorkCodes.join(', ')}`);
      duplicatesFound = true;
    }
  });
});
if (!duplicatesFound) console.log('  ✅ PASS: No duplicate non-work codes per day\n');

// RULE 5: Daily total ≤ 8h
console.log('RULE 5: Checking daily total ≤ 8h...');
let totalViolation = false;
Object.entries(employeeTimesheetMock).forEach(([empId, ts]) => {
  Object.entries(ts).forEach(([dateKey, records]) => {
    if (dateKey.includes('_segnalazione')) return;
    const total = records.reduce((s, r) => s + (r.ore || 0), 0);
    if (total > 8) {
      console.log(`  ❌ VIOLATION: ${empId} ${dateKey} has total ${total}h (must be ≤ 8h)`);
      totalViolation = true;
    }
  });
});
if (!totalViolation) console.log('  ✅ PASS: All days have total ≤ 8h\n');

// RULE 6: ROL is present in dataset
console.log('RULE 6: Checking for ROL presence...');
let rolFound = false;
Object.entries(employeeTimesheetMock).forEach(([empId, ts]) => {
  Object.entries(ts).forEach(([dateKey, records]) => {
    if (dateKey.includes('_segnalazione')) return;
    if (records.some(r => String(r.commessa).toUpperCase() === 'ROL')) {
      rolFound = true;
    }
  });
});
if (rolFound) console.log('  ✅ PASS: ROL entries found in dataset\n');
else console.log('  ⚠️ WARNING: No ROL entries found (expected some in seed)\n');

console.log('=== VERIFICATION COMPLETE ===');
