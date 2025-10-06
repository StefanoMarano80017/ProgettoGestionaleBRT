import React from 'react';
import { Box, Stack } from '@mui/material';

// Migrated from Components/DipendenteHomePage/LayoutDashColumn.jsx
export default function LayoutDashColumn({ left, right, spacing = 1 }) {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing} sx={{ width: '100%', height: '100%' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{left}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>{right}</Box>
      </Stack>
    </Box>
  );
}
