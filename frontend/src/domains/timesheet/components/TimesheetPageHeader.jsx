import React from 'react';
import { Stack, Typography, Box, Paper, Chip } from '@mui/material';
import { AccessTime, TrendingUp, CalendarMonth } from '@mui/icons-material';

/**
 * TimesheetPageHeader
 * Header component for timesheet page with title and badge indicator
 */
export function TimesheetPageHeader() {
  const today = new Date();
  const dayName = today.toLocaleDateString('it-IT', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Stack 
      direction={{ xs: 'column', md: 'row' }} 
      spacing={3} 
      alignItems={{ xs: 'stretch', md: 'center' }}
      sx={{ mb: 3 }}
    >
      {/* Title Section with Icon and Gradient */}
      <Paper
        elevation={3}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 1.5,
          flex: '1 1 600px',
          minWidth: 0,
          borderRadius: 2,
          background: (theme) => 
            `linear-gradient(135deg, ${theme.palette.customBlue3?.main || theme.palette.primary.main} 0%, ${theme.palette.customBlue2?.main || '#006494'} 50%, ${theme.palette.customBlue1?.main || '#00A6FB'} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: (theme) => `linear-gradient(90deg, transparent 0%, ${theme.palette.secondary?.main || '#FF7700'}15 100%)`,
            pointerEvents: 'none'
          }
        }}
      >
        {/* Icon with animated background */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <AccessTime sx={{ fontSize: 28, color: 'common.white' }} />
        </Box>

        {/* Title and Date Stack */}
        <Stack spacing={0.25} sx={{ flexGrow: 1, zIndex: 1 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: 'common.white',
              fontWeight: 700,
              letterSpacing: -0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Dashboard Timesheet
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonth sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'capitalize',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            >
              {dayName}, {dateStr}
            </Typography>
          </Stack>
        </Stack>

        {/* Status Chip with Orange accent */}
        <Chip
          icon={<TrendingUp sx={{ fontSize: 16 }} />}
          label="Attivo"
          size="small"
          sx={{
            bgcolor: (theme) => theme.palette.secondary?.main || '#FF7700',
            backdropFilter: 'blur(10px)',
            color: 'common.white',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 2px 8px rgba(255, 119, 0, 0.3)',
            '& .MuiChip-icon': {
              color: 'common.white'
            }
          }}
        />
      </Paper>

    </Stack>
  );
}
TimesheetPageHeader.displayName = 'TimesheetPageHeader';

export default TimesheetPageHeader;
