import React from 'react';
import { Box, Stack, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DayStatus, getStatusIcon } from './statusIcons.jsx';

const LABELS = {
  [DayStatus.AdminWarning]: 'Segnalazione amministrativa',
  [DayStatus.Holiday]: 'Festivo',
  [DayStatus.Ferie]: 'Ferie',
  [DayStatus.Malattia]: 'Malattia',
  [DayStatus.Permesso]: 'Permesso',
  [DayStatus.Complete]: '8 ore',
  [DayStatus.Partial]: 'Ore parziali',
};

export default function TileLegend() {
  const theme = useTheme();

  const statusColor = (s) => {
    switch (s) {
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
      case DayStatus.Complete:
        return theme.palette.success.main;
      case DayStatus.Partial:
        return theme.palette.warning.main;
      case DayStatus.Future:
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
      {Object.entries(LABELS).map(([status, label]) => {
        const col = statusColor(status);
        return (
          <Chip
            key={status}
            size="small"
            icon={getStatusIcon(theme, status)}
            label={label}
            variant="outlined"
            sx={{
              borderRadius: 1,
              borderColor: 'divider',
              bgcolor: 'transparent',
              px: 0.75,
              py: 0.25,
              '& .MuiChip-icon': { mr: 0.5, color: col, fontSize: '18px' },
              color: theme.palette.text.primary,
            }}
          />
        );
      })}
    </Stack>
  );
}
