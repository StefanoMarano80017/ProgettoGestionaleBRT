import React from 'react';
import { Stack, Chip } from '@mui/material';
import { useTileLegendItems } from '@/Hooks/Timesheet/calendar';

export default function TileLegend() {
  const items = useTileLegendItems();
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
      {items.map(item => (
        <Chip
          key={item.status}
            size="small"
          icon={item.icon}
          label={item.label}
          variant="outlined"
          sx={{
            borderRadius: 1,
            borderColor: 'divider',
            bgcolor: 'transparent',
            px: 0.75,
            py: 0.25,
            '& .MuiChip-icon': { mr: 0.5, color: item.color, fontSize: '18px' },
          }}
        />
      ))}
    </Stack>
  );
}
