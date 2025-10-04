import { useMemo } from 'react';
import { DayStatus, getStatusIcon } from '../../../Components/Calendar/statusIcons.jsx';
import { useTheme } from '@mui/material/styles';
import useDayStatusColor from './useDayStatusColor';

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
      icon: getStatusIcon(theme, status)
    }))
  ), [theme, colorFor]);
}
export default useTileLegendItems;
