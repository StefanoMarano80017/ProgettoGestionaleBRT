import { WarningAmber, Celebration, BeachAccess, LocalHospital, CheckCircle, AccessTime, Block, Schedule } from '@mui/icons-material';
import { DayStatus } from './statusConstants';

// Utility exports (no JSX) — return Icon component and props so callers render
// the element. Kept as a pure util module to avoid mixing component exports.
export const statusIconComponents = Object.freeze({
  [DayStatus.AdminWarning]: WarningAmber,
  [DayStatus.Holiday]: Celebration,
  [DayStatus.Ferie]: BeachAccess,
  [DayStatus.Malattia]: LocalHospital,
  [DayStatus.Complete]: CheckCircle,
  [DayStatus.Partial]: AccessTime,
  [DayStatus.NonWorkFull]: Block,
  [DayStatus.NonWorkPartial]: Schedule, // Used for both PERMESSO and ROL
});

export function getStatusIconInfo(theme, status, size = 'small') {
  const useMuiSmall = size === 'small';
  // Respect numeric sizes (e.g. 10, 14). 'normal' maps to 16. If neither, undefined.
  const numericSize = typeof size === 'number' ? size : (size === 'normal' ? 16 : undefined);
  const sxFor = (override) => ({ ...(numericSize ? { fontSize: numericSize } : {}), ...override });

  switch (status) {
    case DayStatus.AdminWarning:
      return { Icon: WarningAmber, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.error.main } } : { sx: sxFor({ color: theme.palette.error.main }) } };
    case DayStatus.Holiday:
      return { Icon: Celebration, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.customRed?.main || theme.palette.error.main } } : { sx: sxFor({ color: theme.palette.customRed?.main || theme.palette.error.main }) } };
    case DayStatus.Ferie:
      return { Icon: BeachAccess, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.customPink?.main || theme.palette.secondary.main } } : { sx: sxFor({ color: theme.palette.customPink?.main || theme.palette.secondary.main }) } };
    case DayStatus.Malattia:
      return { Icon: LocalHospital, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.success.main } } : { sx: sxFor({ color: theme.palette.success.main }) } };
    case DayStatus.Permesso:
    case DayStatus.Rol:
      // Use NonWorkPartial icon for both PERMESSO and ROL
      return { Icon: Schedule, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.info.main } } : { sx: sxFor({ color: theme.palette.info.main }) } };
    case DayStatus.Complete:
      return { Icon: CheckCircle, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.success.main } } : { sx: sxFor({ color: theme.palette.success.main }) } };
    case DayStatus.Partial:
      return { Icon: AccessTime, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.warning.main } } : { sx: sxFor({ color: theme.palette.warning.main }) } };
    case DayStatus.NonWorkFull:
      // full non-work day — use a distinct neutral/dark badge (Block icon)
      return { Icon: Block, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.text.secondary } } : { sx: sxFor({ color: theme.palette.text.secondary }) } };
    case DayStatus.NonWorkPartial:
      // partial absence (PERMESSO/ROL) — use Schedule icon with info color
      return { Icon: Schedule, props: useMuiSmall ? { fontSize: 'small', sx: { color: theme.palette.info.main } } : { sx: sxFor({ color: theme.palette.info.main }) } };
    case DayStatus.Future:
    default:
      return { Icon: null, props: {} };
  }
}

export { DayStatus } from './statusConstants';

