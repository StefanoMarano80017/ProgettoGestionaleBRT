// Utility to compute calendar day status and display flags
//
// Inputs:
// - dayData: array of records for the day (may be undefined/empty)
// - dayOfWeek: integer 0..6 following JS Date.getDay() convention (0=Sun, 6=Sat)
// - segnalazione: truthy value when an admin signal exists for the day
// - dateStr: ISO date string (YYYY-MM-DD or full ISO)
// - isHoliday: boolean
// - today: Date instance (optional, defaults to now)
//
// Output: { status, showHours, iconTopRight }
import { NON_WORK_CODES } from '@domains/timesheet/hooks/utils/timesheetModel';

/**
 * Helper to sum non-work hours (FERIE, MALATTIA, PERMESSO, ROL)
 */
function sumNonWork(entries) {
  return (entries || []).reduce((s, rec) => {
    const code = String(rec?.commessa || '').toUpperCase();
    if (NON_WORK_CODES.includes(code)) return s + (Number(rec?.ore) || 0);
    return s;
  }, 0);
}

export function computeDayStatus({ dayData, dayOfWeek, segnalazione, dateStr, isHoliday, today = new Date() }) {
  // Normalize totals
  const totalHours = (dayData || []).reduce((sum, rec) => sum + (Number(rec?.ore) || 0), 0);

  // Normalize date-only values to avoid timezone/time-of-day issues when comparing days
  const makeDateOnly = (d) => {
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    return dd;
  };
  const todayDate = makeDateOnly(today);
  const targetDate = dateStr ? makeDateOnly(new Date(dateStr)) : null;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // JS Date.getDay() convention
  const isFuture = targetDate ? targetDate.getTime() > todayDate.getTime() : false;

  // Highest priority: admin warning
  if (segnalazione) {
    return { status: 'admin-warning', showHours: false, iconTopRight: false };
  }

  // Holiday
  if (isHoliday) {
    return { status: 'holiday', showHours: false, iconTopRight: false };
  }

  // Weekend
  if (isWeekend) {
    return { status: undefined, showHours: totalHours > 0, iconTopRight: false };
  }

  // No entries
  if (!dayData || dayData.length === 0) {
    return { status: undefined, showHours: false, iconTopRight: false };
  }
  // Special commesse (individual types) - check BEFORE generic non-work-full
  if (dayData.some((rec) => String(rec?.commessa || '').toUpperCase() === 'FERIE')) {
    return { status: 'ferie', showHours: false, iconTopRight: false };
  }
  if (dayData.some((rec) => String(rec?.commessa || '').toUpperCase() === 'MALATTIA')) {
    return { status: 'malattia', showHours: false, iconTopRight: false };
  }
  if (dayData.some((rec) => String(rec?.commessa || '').toUpperCase() === 'PERMESSO')) {
    return { status: 'permesso', showHours: true, iconTopRight: true };
  }
  if (dayData.some((rec) => String(rec?.commessa || '').toUpperCase() === 'ROL')) {
    return { status: 'rol', showHours: true, iconTopRight: true };
  }

  // Check for partial non-work (PERMESSO/ROL) before full non-work
  const permessoRolTotal = (dayData || []).reduce((s, rec) => {
    const code = String(rec?.commessa || '').toUpperCase();
    if (code === 'PERMESSO' || code === 'ROL') return s + (Number(rec?.ore) || 0);
    return s;
  }, 0);
  
  if (permessoRolTotal > 0 && permessoRolTotal < 8) {
    return { status: 'non-work-partial', showHours: true, iconTopRight: true };
  }

  // Check for full non-work day (sum of NON_WORK codes == 8) - fallback for other non-work codes like ROL
  const nonWorkTotal = sumNonWork(dayData);
  if (nonWorkTotal === 8) {
    return { status: 'non-work-full', showHours: false, iconTopRight: false };
  }

  // Future days without entries
  if (isFuture) {
    return { status: 'future', showHours: false, iconTopRight: false };
  }

  // Hours-based states
  if (totalHours === 8) {
    return { status: 'complete', showHours: true, iconTopRight: true };
  }
  if (totalHours > 0 && totalHours < 8) {
    return { status: 'partial', showHours: true, iconTopRight: true };
  }

  return { status: undefined, showHours: false, iconTopRight: false };
}

/**
 * Pure helper to compute committed status for a day based only on entries
 * No context access, no staging information - just committed entry data
 * 
 * @param {Array} entries - Array of timesheet entries for the day
 * @returns {string|undefined} - The committed status ('non-work-full', 'ferie', 'malattia', 'permesso', 'complete', 'partial', or undefined)
 */
export function getCommittedStatusForDay(entries) {
  if (!entries || entries.length === 0) {
    return undefined;
  }

  const totalHours = entries.reduce((sum, rec) => sum + (Number(rec?.ore) || 0), 0);

  // Special status based on business rules
  const hasMalattia = entries.some((rec) => String(rec?.commessa || '').toUpperCase() === 'MALATTIA');
  const hasFerie = entries.some((rec) => String(rec?.commessa || '').toUpperCase() === 'FERIE');
  const nonWorkTotal = sumNonWork(entries);
  const permessoRolTotal = entries.reduce((s, rec) => {
    const code = String(rec?.commessa || '').toUpperCase();
    if (code === 'PERMESSO' || code === 'ROL') return s + (Number(rec?.ore) || 0);
    return s;
  }, 0);
  
  if (hasMalattia && nonWorkTotal === 8) {
    return 'non-work-full';
  }
  else if (hasFerie && nonWorkTotal === 8) {
    return 'non-work-full';
  }
  else if (permessoRolTotal === 8 && nonWorkTotal === 8) {
    // Full-day PERMESSO/ROL replacement (no work)
    return 'non-work-full';
  }
  else if (permessoRolTotal > 0 && permessoRolTotal < 8) {
    return 'non-work-partial';
  }
  else if (hasFerie) {
    return 'ferie';
  }
  else if (hasMalattia) {
    return 'malattia';
  }
  else if (entries.some((rec) => String(rec?.commessa || '').toUpperCase() === 'PERMESSO')) {
    return 'permesso';
  }
  else if (entries.some((rec) => String(rec?.commessa || '').toUpperCase() === 'ROL')) {
    return 'rol';
  }

  // Hours-based states
  if (totalHours === 8) {
    return 'complete';
  }
  if (totalHours > 0 && totalHours < 8) {
    return 'partial';
  }

  return undefined;
}
