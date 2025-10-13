import React, { useState } from 'react';
import { Box, Typography, IconButton, Popover, Button, Paper } from '@mui/material';
import { ChevronLeft, ChevronRight, CalendarMonth } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import updateLocale from 'dayjs/plugin/updateLocale';
import localeDataPlugin from 'dayjs/plugin/localeData';
import PropTypes from 'prop-types';
import { fullMonth } from '@domains/timesheet/components/calendar/utils/monthNames';

dayjs.extend(updateLocale);
dayjs.extend(localeDataPlugin);

const capitalizeWord = (value = '') =>
  value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const applyCapitalizedItalianLocale = (() => {
  let patched = false;
  return () => {
    if (patched) return;
    const locale = dayjs().locale('it').localeData?.();
    if (!locale) return;
    const months = locale.months().map(capitalizeWord);
    const monthsShort = locale.monthsShort().map(capitalizeWord);
    const weekdays = locale.weekdays().map(capitalizeWord);
    const weekdaysShort = locale.weekdaysShort().map(capitalizeWord);
    const weekdaysMin = locale.weekdaysMin().map((value) => value.toUpperCase());
    dayjs.updateLocale('it', {
      months,
      monthsShort,
      weekdays,
      weekdaysShort,
      weekdaysMin
    });
    patched = true;
  };
})();

applyCapitalizedItalianLocale();

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
  onDateSelect,
  onToday,
  todayLabel = 'Oggi',
  sx: sxProp
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

  const baseSx = {
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
  };

  const combinedSx = Array.isArray(sxProp)
    ? [baseSx, ...sxProp]
    : sxProp
      ? [baseSx, sxProp]
      : [baseSx];

  return (
    <Box sx={combinedSx}>
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
        {onToday && (
          <Button
            variant="outlined"
            size="small"
            onClick={onToday}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.35)',
              borderWidth: 1,
              textTransform: 'none',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.6)',
                bgcolor: 'rgba(255, 255, 255, 0.15)'
              }
            }}
          >
            {todayLabel}
          </Button>
        )}
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
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Paper elevation={0} sx={{ p: 1.5, minWidth: 240 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
            <DateCalendar
              value={currentDate}
              onChange={handleDateChange}
              views={['year', 'month']}
              openTo="month"
              slotProps={{
                layout: {
                  sx: {
                    '& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton': {
                      borderRadius: 1,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      },
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText'
                      }
                    }
                  }
                }
              }}
              sx={{
                '& .MuiPickersDay-root': {
                  borderRadius: 1,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                },
                '& .MuiPickersDay-root.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText'
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase'
                }
              }}
            />
          </LocalizationProvider>
        </Paper>
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
  onToday: PropTypes.func,
  todayLabel: PropTypes.string,
  sx: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
    PropTypes.func
  ])
};

export default React.memo(CalendarHeader);