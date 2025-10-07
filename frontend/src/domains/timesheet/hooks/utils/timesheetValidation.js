/**
 * Validation utilities for timesheet data integrity
 */

export function validateTimesheetEntry(entry) {
  if (!entry || typeof entry !== 'object') return { valid: false, error: 'Entry non valida' };
  
  const { commessa, ore, descrizione } = entry;
  
  if (!commessa || String(commessa).trim() === '') {
    return { valid: false, error: 'Commessa obbligatoria' };
  }
  
  const hours = Number(ore);
  if (isNaN(hours) || hours <= 0 || hours > 24) {
    return { valid: false, error: 'Ore devono essere tra 0.1 e 24' };
  }
  
  if (descrizione && String(descrizione).length > 500) {
    return { valid: false, error: 'Descrizione troppo lunga (max 500 caratteri)' };
  }
  
  return { valid: true };
}

export function validateDayRecords(records, maxHoursPerDay = 8) {
  if (!Array.isArray(records)) return { valid: false, error: 'Records deve essere un array' };
  
  let totalHours = 0;
  for (let i = 0; i < records.length; i++) {
    const entryValidation = validateTimesheetEntry(records[i]);
    if (!entryValidation.valid) {
      return { valid: false, error: `Entry ${i + 1}: ${entryValidation.error}` };
    }
    totalHours += Number(records[i].ore);
  }
  
  if (totalHours > maxHoursPerDay) {
    return { valid: false, error: `Totale ore (${totalHours}h) supera il limite giornaliero (${maxHoursPerDay}h)` };
  }
  
  return { valid: true, totalHours };
}

export function validateEmployeeId(employeeId) {
  return employeeId && typeof employeeId === 'string' && employeeId.trim().length > 0;
}

export function validateDateKey(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return false;
  // Check if it's a valid YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateKey)) return false;
  
  const date = new Date(dateKey);
  return date instanceof Date && !isNaN(date.getTime());
}