import { addDays, startOfWeek as dfStartOfWeek, endOfWeek as dfEndOfWeek } from 'date-fns';

const WEEK_OPTIONS = { weekStartsOn: 1 };

export function parseDateKey(dateKey) {
  if (!dateKey) return null;
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d);
}

export function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date) {
  return dfStartOfWeek(date, WEEK_OPTIONS);
}

export function endOfWeek(date) {
  return dfEndOfWeek(date, WEEK_OPTIONS);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

export function endOfYear(date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function getRangeForPeriod(period, referenceDate) {
  if (!referenceDate) return null;
  const base = new Date(referenceDate);
  switch (period) {
    case 'week': {
      const start = startOfWeek(base);
      const end = endOfWeek(base);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'year': {
      return { start: startOfYear(base), end: endOfYear(base) };
    }
    case 'month':
    default: {
      return { start: startOfMonth(base), end: endOfMonth(base) };
    }
  }
}

export function enumerateDateKeys(range) {
  if (!range || !range.start || !range.end) return [];
  const keys = [];
  const cursor = new Date(range.start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

const dayFormatter = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' });
const weekFormatter = new Intl.DateTimeFormat('it-IT', { weekday: 'short' });

export function formatRangeLabel(range, period) {
  if (!range) return '';
  if (period === 'week') {
    return `${weekFormatter.format(range.start)} ${dayFormatter.format(range.start)} – ${weekFormatter.format(range.end)} ${dayFormatter.format(range.end)}`;
  }
  if (period === 'month') {
    return range.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }
  return range.start.getFullYear().toString();
}

export function isWithinRange(date, range) {
  if (!date || !range) return false;
  return date >= range.start && date <= range.end;
}

export function isWorkDay(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function addDaysSafe(date, amount) {
  return addDays(date, amount);
}
