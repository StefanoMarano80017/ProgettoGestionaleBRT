import React from 'react';
import { Box, useTheme } from '@mui/material';

// Migrated from Components/DataGridDashboard/ColorDot.jsx
const ColorDot = ({ color = 'grey', size = 10 }) => {
  const theme = useTheme();
  const resolvedColor = theme.palette[color]?.main || color;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: resolvedColor,
        mr: 1,
        flexShrink: 0,
      }}
    />
  );
};

export default ColorDot;