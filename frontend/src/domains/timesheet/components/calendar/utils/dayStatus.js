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

  // Special commesse
  if (dayData.some((rec) => rec.commessa === 'FERIE')) {
    return { status: 'ferie', showHours: false, iconTopRight: false };
  }
  if (dayData.some((rec) => rec.commessa === 'MALATTIA')) {
    return { status: 'malattia', showHours: false, iconTopRight: false };
  }
  if (dayData.some((rec) => rec.commessa === 'PERMESSO')) {
    return { status: 'permesso', showHours: true, iconTopRight: true };
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
