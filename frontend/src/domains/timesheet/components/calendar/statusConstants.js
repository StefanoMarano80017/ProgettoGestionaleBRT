// Extracted constants from statusIcons to satisfy react-refresh single-export-components rule.
export const DayStatus = Object.freeze({
  AdminWarning: 'admin-warning',
  Holiday: 'holiday',
  Ferie: 'ferie',
  Malattia: 'malattia',
  Permesso: 'permesso',
  NonWorkFull: 'non-work-full',
  Complete: 'complete',
  Partial: 'partial',
  Future: 'future',
});

export const statusIconKeys = Object.values(DayStatus);
