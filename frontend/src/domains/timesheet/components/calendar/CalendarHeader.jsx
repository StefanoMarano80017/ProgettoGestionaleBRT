import React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { fullMonth } from '@domains/timesheet/components/calendar/utils/monthNames';

/**
 * CalendarHeader
 * Pure presentational component for calendar navigation and title.
 * Handles prev/next/today navigation and displays month/year title.
 */
export function CalendarHeader({
  month,
  year,
  onPrevMonth,
  onNextMonth,
  onToday
}) {
  const monthName = fullMonth[month] || 'Gennaio';
  const title = `${monthName} ${year}`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        px: 1
      }}
    >
      {/* Navigation controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={onPrevMonth}
          size="small"
          aria-label="Mese precedente"
        >
          <ChevronLeft />
        </IconButton>
        
        <IconButton
          onClick={onNextMonth}
          size="small"
          aria-label="Mese successivo"
        >
          <ChevronRight />
        </IconButton>

        <Button
          onClick={onToday}
          size="small"
          variant="outlined"
          sx={{ ml: 1 }}
        >
          Oggi
        </Button>
      </Box>

      {/* Month/Year title */}
      <Typography variant="h6" component="h2">
        {title}
      </Typography>

      {/* Empty space for balance */}
      <Box sx={{ width: 120 }} />
    </Box>
  );
}

CalendarHeader.displayName = 'CalendarHeader';

CalendarHeader.propTypes = {
  month: PropTypes.number.isRequired,
  year: PropTypes.number.isRequired,
  onPrevMonth: PropTypes.func.isRequired,
  onNextMonth: PropTypes.func.isRequired,
  onToday: PropTypes.func.isRequired,
};

export default React.memo(CalendarHeader);