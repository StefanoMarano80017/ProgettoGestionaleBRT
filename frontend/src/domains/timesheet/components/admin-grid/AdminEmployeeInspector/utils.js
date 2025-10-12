import { parseDateKey } from '../utils/periodUtils';

export const PERIOD_OPTIONS = [
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' },
  { value: 'year', label: 'Anno' }
];

export const ABSENCE_TYPES = [
  { code: 'FERIE', label: 'Ferie' },
  { code: 'MALATTIA', label: 'Malattia' },
  { code: 'PERMESSO', label: 'Permesso' },
  { code: 'ROL', label: 'ROL' }
];

export const ABSENCE_CHIP_COLOR = {
  FERIE: 'error',
  MALATTIA: 'success',
  PERMESSO: 'info',
  ROL: 'info'
};

export const NON_WORK_CODES = new Set(ABSENCE_TYPES.map((item) => item.code));
export const DEFAULT_PERIOD = 'week';
export const UNKNOWN_COMMESSA_CODE = 'SENZA_COMMESSA';
export const HOURS_PER_FULL_DAY = 7.5;
export const inspectorCardBaseSx = {
  p: { xs: 1.75, md: 2.25 },
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 1.75
};

export function ensurePeriod(value) {
  if (!value) return DEFAULT_PERIOD;
  return PERIOD_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_PERIOD;
}

export function formatHours(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num === 0) return '0h';
  const rounded = Math.round(num * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}h`;
}

export function formatDateLabel(dateKey) {
  if (!dateKey) return '—';
  const date = typeof dateKey === 'string' ? parseDateKey(dateKey) : dateKey;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'long'
  });
}

export function normalizeCommessa(code) {
  if (!code) return UNKNOWN_COMMESSA_CODE;
  const normalized = String(code).trim().toUpperCase();
  return normalized || UNKNOWN_COMMESSA_CODE;
}

export function sumWorkHours(entries = []) {
  return entries.reduce((sum, record) => {
    const commessa = normalizeCommessa(record?.commessa);
    if (NON_WORK_CODES.has(commessa)) return sum;
    return sum + (Number(record?.ore) || 0);
  }, 0);
}
