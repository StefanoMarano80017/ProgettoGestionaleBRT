import React, { useState } from 'react';
import { Box, Typography, IconButton, Popover } from '@mui/material';
import { ChevronLeft, ChevronRight, CalendarMonth } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import PropTypes from 'prop-types';
import { fullMonth } from '@domains/timesheet/components/calendar/utils/monthNames';

/**
 * CalendarHeader
 * Pure presentational component for calendar navigation and title.
 * Handles prev/next navigation and displays month/year title.
 * Includes quick month/year picker for jumping to distant dates.
 */
export function CalendarHeader({
  month,
  year,
  onPrevMonth,
  onNextMonth,
  onDateSelect
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const monthName = fullMonth[month] || 'Gennaio';

  const handleOpenPicker = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePicker = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (newDate) => {
    if (newDate && onDateSelect) {
      onDateSelect(newDate.toDate());
    }
    handleClosePicker();
  };

  const open = Boolean(anchorEl);
  const currentDate = dayjs(new Date(year, month, 1));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        background: (theme) => `linear-gradient(135deg, 
          ${theme.palette.customBlue3?.main || theme.palette.primary.main} 0%, 
          ${theme.palette.customBlue2?.main || '#006494'} 50%, 
          ${theme.palette.customBlue1?.main || '#00A6FB'} 100%)`,
        boxShadow: (theme) => `0 4px 12px ${theme.palette.customBlue2?.main || theme.palette.primary.main}25`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40%',
          height: '100%',
          background: (theme) => `linear-gradient(90deg, transparent, ${theme.palette.secondary.main}15)`,
          pointerEvents: 'none'
        }
      }}
    >
      {/* Navigation controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, zIndex: 1 }}>
        <IconButton
          onClick={onPrevMonth}
          size="small"
          aria-label="Mese precedente"
          sx={{
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateX(-2px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }
          }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
        
        <IconButton
          onClick={onNextMonth}
          size="small"
          aria-label="Mese successivo"
          sx={{
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateX(2px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>

      {/* Month/Year title - centered */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'baseline',
          gap: 1,
          zIndex: 1
        }}
      >
        <Typography 
          variant="h5" 
          component="h2"
          sx={{ 
            fontWeight: 700,
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            fontSize: { xs: '1.25rem', md: '1.5rem' }
          }}
        >
          {monthName}
        </Typography>
        <Typography 
          variant="body2"
          sx={{ 
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '0.9rem'
          }}
        >
          {year}
        </Typography>
      </Box>

      {/* Date picker button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, zIndex: 1 }}>
        <IconButton
          onClick={handleOpenPicker}
          size="small"
          aria-label="Scegli data"
          sx={{
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.05)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }
          }}
        >
          <CalendarMonth fontSize="small" />
        </IconButton>
      </Box>

      {/* Month/Year picker popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePicker}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
          <DateCalendar
            value={currentDate}
            onChange={handleDateChange}
            views={['year', 'month']}
            openTo="month"
          />
        </LocalizationProvider>
      </Popover>
    </Box>
  );
}

CalendarHeader.displayName = 'CalendarHeader';

CalendarHeader.propTypes = {
  month: PropTypes.number.isRequired,
  year: PropTypes.number.isRequired,
  onPrevMonth: PropTypes.func.isRequired,
  onNextMonth: PropTypes.func.isRequired,
  onDateSelect: PropTypes.func,
};

export default React.memo(CalendarHeader);