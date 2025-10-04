import React from 'react';
import {
  WarningAmber,
  Celebration,
  BeachAccess,
  LocalHospital,
  EventAvailable,
  CheckCircle,
  AccessTime,
} from '@mui/icons-material';

/**
 * Canonical day status keys used across the calendar UI.
 */
export const DayStatus = Object.freeze({
  AdminWarning: 'admin-warning',
  Holiday: 'holiday',
  Ferie: 'ferie',
  Malattia: 'malattia',
  Permesso: 'permesso',
  Complete: 'complete',
  Partial: 'partial',
  Future: 'future',
});

/**
 * Calendar status icons
 * Utility module providing a mapping of canonical day statuses and a small helper
 * to render theme-aware icon elements. Intentionally pure and side-effect free.
 */

/**
 * Return a themed icon element representing the provided day status.
 * The returned element already includes sensible `sx` color/fontSize props.
 *
 * @param {object} theme MUI theme
 * @param {string} status one of DayStatus values
 * @param {'small'|'normal'|number} [size='small'] optional size hint. 'small' uses MUI's small fontSize, 'normal' or numeric uses px value 16.
 * @returns {React.ReactElement|null}
 */
export function getStatusIcon(theme, status, size = 'small') {
  // normalize size into sx.fontSize or pass MUI's fontSize prop
  const useMuiSmall = size === 'small';
  const numericSize = typeof size === 'number' || size === 'normal' ? 16 : undefined;

  const sxFor = (override) => ({ ...(numericSize ? { fontSize: numericSize } : {}), ...override });

  switch (status) {
    case DayStatus.AdminWarning:
      return useMuiSmall ? <WarningAmber fontSize="small" sx={{ color: theme.palette.error.main }} /> : <WarningAmber sx={sxFor({ color: theme.palette.error.main })} />;
    case DayStatus.Holiday:
      return useMuiSmall ? <Celebration fontSize="small" sx={{ color: theme.palette.customRed?.main || theme.palette.error.main }} /> : <Celebration sx={sxFor({ color: theme.palette.customRed?.main || theme.palette.error.main })} />;
    case DayStatus.Ferie:
      return useMuiSmall ? <BeachAccess fontSize="small" sx={{ color: theme.palette.customPink?.main || theme.palette.secondary.main }} /> : <BeachAccess sx={sxFor({ color: theme.palette.customPink?.main || theme.palette.secondary.main })} />;
    case DayStatus.Malattia:
      return useMuiSmall ? <LocalHospital fontSize="small" sx={{ color: theme.palette.success.main }} /> : <LocalHospital sx={sxFor({ color: theme.palette.success.main })} />;
    case DayStatus.Permesso:
      return useMuiSmall ? <EventAvailable fontSize="small" sx={{ color: theme.palette.info.main }} /> : <EventAvailable sx={sxFor({ color: theme.palette.info.main })} />;
    case DayStatus.Complete:
      return useMuiSmall ? <CheckCircle fontSize="small" sx={{ color: theme.palette.success.main }} /> : <CheckCircle sx={sxFor({ color: theme.palette.success.main })} />;
    case DayStatus.Partial:
      return useMuiSmall ? <AccessTime fontSize="small" sx={{ color: theme.palette.warning.main }} /> : <AccessTime sx={sxFor({ color: theme.palette.warning.main })} />;
    case DayStatus.Future:
    default:
      return null;
  }
}

// helpful when inspecting components in React DevTools
getStatusIcon.displayName = 'getStatusIcon';

// Also export a mapping of status -> Icon component for consumers that want the raw component
export const statusIconComponents = Object.freeze({
  [DayStatus.AdminWarning]: WarningAmber,
  [DayStatus.Holiday]: Celebration,
  [DayStatus.Ferie]: BeachAccess,
  [DayStatus.Malattia]: LocalHospital,
  [DayStatus.Permesso]: EventAvailable,
  [DayStatus.Complete]: CheckCircle,
  [DayStatus.Partial]: AccessTime,
});
