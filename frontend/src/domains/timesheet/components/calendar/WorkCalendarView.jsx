import React from 'react';
import { Box, Typography, Divider, ToggleButtonGroup, ToggleButton, Stack } from '@mui/material';
import PropTypes from 'prop-types';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DayEntryTile from '@domains/timesheet/components/calendar/DayEntryTile';
import CalendarHeader from '@domains/timesheet/components/calendar/CalendarHeader';
import TileLegend from '@shared/components/Calendar/TileLegend';
import { StagedChangesCompact } from '@domains/timesheet/components/staging';
import { computeDayStatus } from '@domains/timesheet/components/calendar/utils';
import formatDayTooltip from '@domains/timesheet/components/calendar/formatDayTooltip';
import { parseKeyToDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, inRange } from '@/shared/utils/dateRangeUtils';

const WEEK_DAYS = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];
const NON_WORK_COMMESSE = new Set(['FERIE', 'MALATTIA', 'PERMESSO', 'ROL', 'ROL_P', 'ROL_C', 'ROL_F']);

/**
 * WorkCalendarView
 * Pure presentational component for calendar rendering.
 * Receives all data and handlers as props, no hooks or context usage.
 */
export function WorkCalendarView({
  days,
  month,
  year,
  selectedDateKey,
  onDayClick,
  onDayDoubleClick,
  onKeyDown,
  stagedStatusMap,
  onPrevMonth,
  onNextMonth,
  onDateSelect,
  // View-specific props
  renderDayTooltip,
  highlightedDays,
  fixedDayWidth = false,
  gap = 1,
  distributeGaps = false,
  variant = 'default',
  period = 'month',
  onPeriodChange,
  showRiepilogo = false,
  data = {}
}) {
  const today = React.useMemo(() => new Date(), []);
  const gridRef = React.useRef(null);
  
  // Stable keydown handler to avoid inline function
  const handleKeyDown = React.useCallback((e) => {
    onKeyDown?.(e, selectedDateKey);
  }, [onKeyDown, selectedDateKey]);

  // Compute riepilogo data based on period
  const riepilogo = React.useMemo(() => {
    if (!showRiepilogo) return null;

    const refDate = new Date(year, month, 1);
    let range;
    
    if (period === 'week') {
      range = { start: startOfWeek(refDate), end: endOfWeek(refDate) };
    } else if (period === 'year') {
      range = { start: startOfYear(refDate), end: endOfYear(refDate) };
    } else if (period === 'none') {
      const singleDay = selectedDateKey ? parseKeyToDate(selectedDateKey) : refDate;
      const start = new Date(singleDay);
      start.setHours(0, 0, 0, 0);
      const end = new Date(singleDay);
      end.setHours(23, 59, 59, 999);
      range = { start, end };
    } else {
      range = { start: startOfMonth(refDate), end: endOfMonth(refDate) };
    }

    const acc = {
      ferie: { days: 0, hours: 0 },
      malattia: { days: 0, hours: 0 },
      permesso: { days: 0, hours: 0 },
      rol: { days: 0, hours: 0 },
    };

    Object.entries(data || {}).forEach(([key, records]) => {
      if (key.endsWith('_segnalazione')) return;
      const d = parseKeyToDate(key);
      if (!inRange(d, range.start, range.end)) return;
      
      const seen = { ferie: false, malattia: false, permesso: false, rol: false };
      (records || []).forEach((r) => {
        const ore = Number(r.ore || 0);
        const c = String(r.commessa || '').toUpperCase();
        
        if (c === 'FERIE') {
          acc.ferie.hours += ore;
          if (!seen.ferie) {
            acc.ferie.days += 1;
            seen.ferie = true;
          }
        } else if (c === 'MALATTIA') {
          acc.malattia.hours += ore;
          if (!seen.malattia) {
            acc.malattia.days += 1;
            seen.malattia = true;
          }
        } else if (c === 'PERMESSO') {
          acc.permesso.hours += ore;
          if (!seen.permesso) {
            acc.permesso.days += 1;
            seen.permesso = true;
          }
        } else if (c === 'ROL' || c === 'ROL_P' || c === 'ROL_C' || c === 'ROL_F') {
          acc.rol.hours += ore;
          if (!seen.rol) {
            acc.rol.days += 1;
            seen.rol = true;
          }
        }
      });
    });

    return acc;
  }, [showRiepilogo, data, period, year, month, selectedDateKey]);

  const handlePeriodToggle = React.useCallback((event, nextValue) => {
    if (!onPeriodChange) return;
    if (nextValue === null) {
      onPeriodChange('none');
      return;
    }
    onPeriodChange(nextValue);
  }, [onPeriodChange]);

  const periodDisplay = React.useMemo(() => {
    const refDate = new Date(year, month, 1);
    
    if (period === 'week') {
      const start = startOfWeek(refDate);
      const end = endOfWeek(refDate);
      const startStr = start.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
      const endStr = end.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    if (period === 'month') {
      return refDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    }
    if (period === 'year') {
      return refDate.getFullYear().toString();
    }
    if (period === 'none') {
      const selectedDate = selectedDateKey ? parseKeyToDate(selectedDateKey) : refDate;
      return selectedDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    return '';
  }, [period, year, month, selectedDateKey]);

  return (
    <Box sx={{ 
      width: '100%',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Calendar header with navigation */}
      <CalendarHeader
        month={month}
        year={year}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onDateSelect={onDateSelect}
      />

      <Divider />

      {/* Calendar content container */}
      <Box sx={{ px: 2, py: 1.5, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Compact staging panel */}
        <StagedChangesCompact />

        {/* Riepilogo box - Compact inline version */}
        {showRiepilogo && riepilogo && (
          <Box sx={{ 
            mb: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Stack spacing={1.5}>
              {/* Period selector */}
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Stack spacing={0.5}>
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary', 
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}>
                    Periodo di Riferimento
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: 'text.primary'
                  }}>
                    {periodDisplay}
                  </Typography>
                </Stack>
                <ToggleButtonGroup
                  value={period === 'none' ? null : period}
                  exclusive
                  size="small"
                  onChange={handlePeriodToggle}
                  sx={{
                    height: 32,
                    '& .MuiToggleButton-root': {
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.5,
                      minWidth: 60,
                      fontWeight: 600,
                      borderRadius: 1,
                      color: 'text.secondary',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        color: 'primary.contrastText',
                        bgcolor: 'primary.main',
                        borderColor: 'primary.main',
                        fontWeight: 700,
                        transform: 'scale(1.05)',
                        boxShadow: 1,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          borderColor: 'primary.dark'
                        }
                      },
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 166, 251, 0.1)' : 'rgba(0, 166, 251, 0.05)',
                        transform: 'scale(1.02)'
                      }
                    }
                  }}
                >
                  <ToggleButton value="week">Settimana</ToggleButton>
                  <ToggleButton value="month">Mese</ToggleButton>
                  <ToggleButton value="year">Anno</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              
            </Stack>
          </Box>
        )}

        {/* Week days header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: fixedDayWidth ? `repeat(7, ${variant === 'wide' ? 52 : 44}px)` : "repeat(7, 1fr)",
            gap: distributeGaps ? 0 : gap,
            justifyContent: distributeGaps ? "space-between" : "normal",
            width: "100%",
            mb: 1,
          }}
        >
          {WEEK_DAYS.map((wd, index) => {
            // index: 0=Lu, 5=Sa, 6=Do
            const isWeekendHeader = index === 5 || index === 6;
            return (
              <Box key={wd} sx={{ 
                textAlign: "center",
                bgcolor: isWeekendHeader ? 'rgba(0,0,0,0.1)' : 'transparent',
                py: 0.5,
                borderRadius: 0.5,
              }}>
                <Typography variant="caption">{wd}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* Calendar grid (6 weeks / 42 cells) */}
        <Box sx={{ overflowX: fixedDayWidth && !distributeGaps ? "auto" : "hidden", width: "100%", flex: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: fixedDayWidth ? `repeat(7, ${variant === 'wide' ? 52 : 44}px)` : "repeat(7, 1fr)",
            // slightly larger rows for the 'wide' variant to accommodate more info
            gridAutoRows: variant === 'wide' ? "56px" : "44px",
            gap: distributeGaps ? 0 : gap,
            overflowY: "auto",
            scrollbarGutter: "stable",
            width: distributeGaps ? "100%" : fixedDayWidth ? "max-content" : "100%",
            justifyContent: distributeGaps ? "space-between" : "normal",
          }}
          ref={gridRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {days.map((item, index) => {
            if (!item) return <Box key={`empty-${index}`} sx={{ borderRadius: 1 }} />;
            const { day, dateStr, dayData, dayOfWeek, segnalazione, isHoliday } = item;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0=Sunday, 6=Saturday
            const isSelected = selectedDateKey === dateStr;
            const totalHours = dayData?.reduce((s, r) => s + (Number(r?.ore) || 0), 0) || 0;
            const { status, showHours } = computeDayStatus({
              dayData,
              dayOfWeek,
              segnalazione,
              dateStr,
              isHoliday,
              today,
            });
            
            // Debug: log Monday and weekend days
            if (dayOfWeek === 1 || isWeekend) {
              console.log(`${dateStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}): totalHours=${totalHours}, showHours=${showHours}, status=${status}, isWeekend=${isWeekend}, hasData=${!!dayData}, dataLength=${dayData?.length || 0}`);
            }
            
            const stagedStatus = stagedStatusMap[dateStr];
            let stagedOp = null;
            if (stagedStatus === 'staged-insert') stagedOp = 'create';
            else if (stagedStatus === 'staged-delete') stagedOp = 'delete';
            else if (stagedStatus === 'staged-update') stagedOp = 'update';
            // if highlightedDays includes this date, override status to a special flag
            const isHighlighted = highlightedDays && (highlightedDays.has ? highlightedDays.has(dateStr) : (Array.isArray(highlightedDays) && highlightedDays.includes(dateStr)));
            const effectiveStatus = stagedStatus || (isHighlighted ? 'range-highlight' : status);

            const tooltipContent = renderDayTooltip?.(dateStr, { dayData, dayOfWeek, isHoliday, segnalazione, totalHours }) || formatDayTooltip(dayData, segnalazione, totalHours);
            return (
              <DayEntryTile
                key={dateStr}
                dateStr={dateStr}
                day={day}
                isSelected={isSelected}
                isWeekend={isWeekend}
                status={effectiveStatus}
                showHours={showHours}
                totalHours={totalHours}
                onClick={onDayClick}
                tooltipContent={tooltipContent}
                variant={variant}
                isHoliday={isHoliday}
                stagedStatus={stagedStatus}
                stagedOp={stagedOp}
                onDoubleClick={onDayDoubleClick}
                iconSize={variant === 'compact' ? 10 : 14}
              />
            );
          })}
        </Box>
        </Box>

        <Divider sx={{ mt: 1.5, mb: 1 }} />

        {/* Legend icons/states */}
        <Box>
          <TileLegend />
        </Box>
      </Box>
    </Box>
  );
}

WorkCalendarView.displayName = 'WorkCalendarView';

WorkCalendarView.propTypes = {
  days: PropTypes.array.isRequired,
  month: PropTypes.number.isRequired,
  year: PropTypes.number.isRequired,
  selectedDateKey: PropTypes.string,
  onDayClick: PropTypes.func,
  onDayDoubleClick: PropTypes.func,
  onKeyDown: PropTypes.func,
  stagedStatusMap: PropTypes.object.isRequired,
  onPrevMonth: PropTypes.func.isRequired,
  onNextMonth: PropTypes.func.isRequired,
  onDateSelect: PropTypes.func,
  // View-specific props
  renderDayTooltip: PropTypes.func,
  highlightedDays: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
  fixedDayWidth: PropTypes.bool,
  gap: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  distributeGaps: PropTypes.bool,
  variant: PropTypes.string,
  period: PropTypes.oneOf(['week', 'month', 'year', 'none']),
  onPeriodChange: PropTypes.func,
  showRiepilogo: PropTypes.bool,
  data: PropTypes.object,
};

export default React.memo(WorkCalendarView);