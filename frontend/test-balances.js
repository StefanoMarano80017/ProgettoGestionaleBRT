// Test to verify balances are properly initialized and consumed
import { getEmployeeBalances } from './src/mocks/TimesheetBalancesMock.js';
import { EMPLOYEES, OPERAI } from './src/mocks/ProjectMock.js';

console.log('=== BALANCE VERIFICATION TEST ===\n');

// Check a few employees
console.log('Employee Balances:');
EMPLOYEES.slice(0, 3).forEach(emp => {
  const balances = getEmployeeBalances(emp.id);
  console.log(`  ${emp.id} (${emp.name}): PERMESSO=${balances.permesso}h, ROL=${balances.rol}h`);
});

console.log('\nOperai Balances:');
OPERAI.slice(0, 3).forEach(op => {
  const balances = getEmployeeBalances(op.id);
  console.log(`  ${op.id} (${op.name}): PERMESSO=${balances.permesso}h, ROL=${balances.rol}h`);
});

// Calculate what should remain after seed generation
console.log('\n=== Expected Consumption Pattern ===');
console.log('Initial balances: PERMESSO=104h, ROL=80h');
console.log('Year-to-date: ~200 working days (Jan 1 - Oct 10, 2025)');
console.log('Partial usage probability: 20% of days');
console.log('Expected consumption: ~40 days × avg 2h = ~80h mixed PERMESSO/ROL');
console.log('Full-day usage: ~6 days × 8h = ~48h mixed PERMESSO/ROL');
console.log('Total expected: ~128h consumed (split between PERMESSO and ROL)');
console.log('\nRemaining balances should be roughly:');
console.log('  PERMESSO: 40-80h remaining (depending on split)');
console.log('  ROL: 20-60h remaining (depending on split)');
