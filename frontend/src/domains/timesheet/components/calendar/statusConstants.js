export const STAGED_INSERT = 'STAGED_INSERT';
export const STAGED_UPDATE = 'STAGED_UPDATE';
export const STAGED_DELETE = 'STAGED_DELETE';
export const NON_WORK_FULL = 'NON_WORK_FULL';
// Extracted constants from statusIcons to satisfy react-refresh single-export-components rule.
export const DayStatus = Object.freeze({
  AdminWarning: 'admin-warning',
  Holiday: 'holiday',
  Ferie: 'ferie',
  Malattia: 'malattia',
  Permesso: 'permesso',
  Rol: 'rol',
  NonWorkFull: 'non-work-full',
  NonWorkPartial: 'non-work-partial',
  Complete: 'complete',
  Partial: 'partial',
  Future: 'future',
});

export const statusIconKeys = Object.values(DayStatus);
