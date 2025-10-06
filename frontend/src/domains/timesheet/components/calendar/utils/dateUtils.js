/** Calendar date utility helpers */

/** Parse an ISO-like date string safely, returning Date or null */
export function parseISO(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Return true if given Date or date string falls on weekend */
export function isWeekend(date) {
  const d = date instanceof Date ? date : parseISO(date);
  if (!d) return false;
  const wd = d.getDay();
  return wd === 0 || wd === 6;
}

/** Strip time components for reliable day comparison */
export function makeDateOnly(date) {
  const d = date instanceof Date ? new Date(date) : parseISO(date);
  if (!d) return null;
  d.setHours(0,0,0,0);
  return d;
}
