import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Box,
  IconButton,
  Popover,
  Tooltip
} from '@mui/material';
import { alpha, useTheme, styled } from '@mui/material/styles';
import InsightsIcon from '@mui/icons-material/Insights';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { inspectorCardBaseSx, PERIOD_OPTIONS } from '../utils';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { MonthCalendar } from '@mui/x-date-pickers/MonthCalendar';
import { YearCalendar } from '@mui/x-date-pickers/YearCalendar';
import {
  getRangeForPeriod,
  formatRangeLabel,
  startOfWeek,
  startOfMonth,
  startOfYear,
  parseDateKey
} from '../../utils/periodUtils';

dayjs.locale('it');

const periodSummaryPropTypes = {
  referenceLoading: PropTypes.bool,
  effectivePeriod: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  periodOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  summaryCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  periodReferenceDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  onPeriodReferenceChange: PropTypes.func.isRequired
};

const periodSummaryDefaultProps = {
  referenceLoading: false,
  periodOptions: PERIOD_OPTIONS,
  periodReferenceDate: null
};

const StyledWeekDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    prop !== 'isHighlighted' && prop !== 'isStartOfHighlight' && prop !== 'isEndOfHighlight'
})(({ theme, isHighlighted, isStartOfHighlight, isEndOfHighlight }) => ({
  borderRadius: 0,
  ...(isHighlighted && {
    background: alpha(theme.palette.primary.main, 0.18),
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    '&:hover': {
      background: alpha(theme.palette.primary.main, 0.24)
    }
  }),
  ...(isStartOfHighlight && {
    borderTopLeftRadius: theme.shape.borderRadius,
    borderBottomLeftRadius: theme.shape.borderRadius
  }),
  ...(isEndOfHighlight && {
    borderTopRightRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius
  })
}));

function WeekPickerDayComponent(props) {
  const { day, outsideCurrentMonth, selectedWeekRange, ...other } = props;
  const start = selectedWeekRange?.start?.getTime?.() ?? null;
  const end = selectedWeekRange?.end?.getTime?.() ?? null;
  const current = day.startOf('day').toDate().getTime();
  const isHighlighted = start !== null && end !== null && current >= start && current <= end;
  const isStart = isHighlighted && current === start;
  const isEnd = isHighlighted && current === end;

  return (
    <StyledWeekDay
      {...other}
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      disableMargin
      selected={isHighlighted}
      isHighlighted={isHighlighted}
      isStartOfHighlight={isStart}
      isEndOfHighlight={isEnd}
    />
  );
}

WeekPickerDayComponent.propTypes = {
  day: PropTypes.object.isRequired,
  outsideCurrentMonth: PropTypes.bool,
  selectedWeekRange: PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date)
  })
};

const PERIOD_PLACEHOLDER = {
  week: 'Seleziona settimana',
  month: 'Seleziona mese',
  year: 'Seleziona anno'
};

const alignDateToPeriod = (date, period) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  switch (period) {
    case 'week':
      return startOfWeek(normalized);
    case 'year':
      return startOfYear(normalized);
    case 'month':
    default:
      return startOfMonth(normalized);
  }
};

function PeriodRangePickerButton({ period, value, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const normalizedValue = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return alignDateToPeriod(value, period);
    if (typeof value === 'string') {
      const parsed = parseDateKey(value);
      return parsed ? alignDateToPeriod(parsed, period) : null;
    }
    return null;
  }, [value, period]);

  const rangeLabel = useMemo(() => {
    if (!normalizedValue) return PERIOD_PLACEHOLDER[period] || 'Seleziona periodo';
    const range = getRangeForPeriod(period, normalizedValue);
    return range ? formatRangeLabel(range, period) : PERIOD_PLACEHOLDER[period] || 'Seleziona periodo';
  }, [normalizedValue, period]);

  const handleOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelect = useCallback(
    (nextValue) => {
      if (!nextValue || typeof nextValue !== 'object' || typeof nextValue.toDate !== 'function') {
        handleClose();
        return;
      }
      const asDate = alignDateToPeriod(nextValue.toDate(), period);
      if (asDate) {
        onChange?.(asDate);
      }
      handleClose();
    },
    [handleClose, onChange, period]
  );

  const selectedWeekRange = useMemo(() => {
    if (!normalizedValue || period !== 'week') return null;
    const start = startOfWeek(normalizedValue);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  }, [normalizedValue, period]);

  const calendarValue = normalizedValue ? dayjs(normalizedValue) : null;

  return (
    <>
      <Tooltip title={rangeLabel} arrow>
        <IconButton
          onClick={handleOpen}
          color="primary"
          sx={{
            border: '1.5px solid',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
            ml: { xs: 0, md: 1 },
            '&:hover': {
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          <CalendarMonthIcon />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          elevation: 6,
          sx: {
            mt: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            p: 1.5
          }
        }}
      >
        {period === 'week' ? (
          <DateCalendar
            value={calendarValue}
            onChange={handleSelect}
            views={['day']}
            displayWeekNumber
            slots={{ day: WeekPickerDayComponent }}
            slotProps={{
              day: {
                selectedWeekRange
              }
            }}
          />
        ) : period === 'year' ? (
          <YearCalendar value={calendarValue} onChange={handleSelect} />
        ) : (
          <MonthCalendar value={calendarValue} onChange={handleSelect} />
        )}
      </Popover>
    </>
  );
}

PeriodRangePickerButton.propTypes = {
  period: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  onChange: PropTypes.func
};

export function PeriodSummaryContent({
  referenceLoading,
  effectivePeriod,
  onPeriodChange,
  periodOptions,
  summaryCards,
  periodReferenceDate,
  onPeriodReferenceChange
}) {
  const theme = useTheme();

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <InsightsIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Analisi periodo selezionato
        </Typography>
        {referenceLoading && <CircularProgress size={18} thickness={4} />}
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent={'space-between'}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={effectivePeriod}
          onChange={onPeriodChange}
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 500,
              px: 2.5,
              py: 0.75,
              border: '1.5px solid',
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
                transform: 'translateY(-1px)'
              },
              '&.Mui-selected': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
                color: 'primary.dark',
                fontWeight: 700,
                borderColor: 'primary.main',
                boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.25),
                  transform: 'translateY(-1px)'
                }
              }
            }
          }}
        >
          {(periodOptions || PERIOD_OPTIONS).map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
          <PeriodRangePickerButton
            period={effectivePeriod}
            value={periodReferenceDate}
            onChange={onPeriodReferenceChange}
          />
        </LocalizationProvider>
      </Stack>

      <Box
        flexDirection={'row'}
        sx={{
          display: 'flex',
          gap: 1.2,
          justifyContent: 'space-between',          
        }}
      >
        {summaryCards.map((card) => (
          <Box
            key={card.id}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.12),
              bgcolor: 'customBackground.main',
              minHeight: 92,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontWeight: 600
              }}
            >
              {card.title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {card.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {card.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

PeriodSummaryContent.propTypes = periodSummaryPropTypes;
PeriodSummaryContent.defaultProps = periodSummaryDefaultProps;

function PeriodSummaryCard(props) {
  return (
    <Paper elevation={0} sx={{ ...inspectorCardBaseSx }}>
      <PeriodSummaryContent {...props} />
    </Paper>
  );
}

PeriodSummaryCard.propTypes = periodSummaryPropTypes;
PeriodSummaryCard.defaultProps = periodSummaryDefaultProps;

export default PeriodSummaryCard;
