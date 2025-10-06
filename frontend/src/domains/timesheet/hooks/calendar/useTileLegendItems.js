import React, { useMemo } from 'react';
import { DayStatus } from '@domains/timesheet/components/calendar/statusIcons.utils';
import StatusIcon from '@domains/timesheet/components/calendar/statusIcons';
import { useTheme } from '@mui/material/styles';
import useDayStatusColor from './useDayStatusColor.js';

const LABELS = {
  [DayStatus.AdminWarning]: 'Segnalazione amministrativa',
  [DayStatus.Holiday]: 'Festivo',
  [DayStatus.Ferie]: 'Ferie',
  [DayStatus.Malattia]: 'Malattia',
  [DayStatus.Permesso]: 'Permesso',
  [DayStatus.Complete]: '8 ore',
  [DayStatus.Partial]: 'Ore parziali',
};

// Fornisce l'array degli item della legenda con icona, label e colore
export function useTileLegendItems() {
  const theme = useTheme();
  const colorFor = useDayStatusColor();
  return useMemo(() => (
    Object.entries(LABELS).map(([status, label]) => ({
      status,
      label,
      color: colorFor(status),
      icon: React.createElement(StatusIcon, { theme, status }),
    }))
  ), [theme, colorFor]);
}
export default useTileLegendItems;
