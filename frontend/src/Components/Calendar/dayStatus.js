// Utility to compute calendar day status and display flags
// Inputs: dayData (array), dayOfWeek (0-6), segnalazione (truthy string), dateStr (ISO), isHoliday (bool), today (Date)
// Output: { status, showHours, iconTopRight }

export function computeDayStatus({ dayData, dayOfWeek, segnalazione, dateStr, isHoliday, today = new Date() }) {
  const totalHours = (dayData || []).reduce((sum, rec) => sum + (Number(rec?.ore) || 0), 0);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isFuture = new Date(dateStr) > today;

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
