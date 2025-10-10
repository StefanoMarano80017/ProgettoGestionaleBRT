import { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { DayStatus } from '@domains/timesheet/components/calendar/statusIcons.utils';

// Ritorna una funzione che mappa uno status al colore (palette) coerente con il tema
export function useDayStatusColor() {
  const theme = useTheme();
  return useCallback((status) => {
    switch (status) {
      case DayStatus.AdminWarning:
        return theme.palette.error.main;
      case DayStatus.Holiday:
        return theme.palette.customRed?.main || theme.palette.error.main;
      case DayStatus.Ferie:
        return theme.palette.customPink?.main || theme.palette.secondary.main;
      case DayStatus.Malattia:
        return theme.palette.success.main;
      case DayStatus.Permesso:
        return theme.palette.info.main;
      case DayStatus.NonWorkPartial:
        return theme.palette.info.main;
      case DayStatus.Complete:
        return theme.palette.success.main;
      case DayStatus.Partial:
        return theme.palette.warning.main;
      case DayStatus.Future:
      default:
        return theme.palette.text.secondary;
    }
  }, [theme]);
}
export default useDayStatusColor;
