import React from 'react';
import { Chip, CircularProgress, Box } from '@mui/material';

const getColor = (progress) => {
  if (progress < 50) return '#f44336'; // rosso
  if (progress < 80) return '#ff9800'; // arancione
  return '#4caf50'; // verde
};

const ProgressChip = ({progress, status = 'loading' }) => {
  const color = getColor(progress);

  return (
    <Chip
      icon={
        <Box position="relative" display="inline-flex">
          <CircularProgress
            variant="determinate"
            value={progress}
            size={24}
            thickness={5}
            sx={{ color }}
          />
          <Box
            top={0}
            left={0}
            bottom={0}
            right={0}
            position="absolute"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <span style={{ fontSize: '0.4rem', fontWeight: 'bold' }}>
              {`${progress}%`}
            </span>
          </Box>
        </Box>
      }
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      variant="outlined"
    />
  );
};

export default ProgressChip;
