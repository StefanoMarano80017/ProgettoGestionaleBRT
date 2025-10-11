import React from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import DayEntryTile from '@domains/timesheet/components/calendar/DayEntryTile';
import CalendarHeader from '@domains/timesheet/components/calendar/CalendarHeader';
import TileLegend from '@shared/components/Calendar/TileLegend';
import { StagedChangesCompact } from '@domains/timesheet/components/staging';
import { computeDayStatus } from '@domains/timesheet/components/calendar/utils';
import formatDayTooltip from '@domains/timesheet/components/calendar/formatDayTooltip';

const WEEK_DAYS = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

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
  onVisibleRangeChange,
  // View-specific props
  renderDayTooltip,
  highlightedDays,
  fixedDayWidth = false,
  gap = 1,
  distributeGaps = false,
  variant = 'default'
}) {
  const today = React.useMemo(() => new Date(), []);
  const gridRef = React.useRef(null);
  
  // Stable keydown handler to avoid inline function
  const handleKeyDown = React.useCallback((e) => {
    onKeyDown?.(e, selectedDateKey);
  }, [onKeyDown, selectedDateKey]);

  return (
    <Box sx={{ width: "100%", position: 'relative', bgcolor: 'background.default', borderRadius: 1, p: 1, height: '100%' }}>
      {/* Calendar header with navigation */}
      <CalendarHeader
        month={month}
        year={year}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onDateSelect={onDateSelect}
      />

      {/* Compact staging panel */}
      <StagedChangesCompact />

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
        {WEEK_DAYS.map((wd) => (
          <Box key={wd} sx={{ textAlign: "center" }}>
            <Typography variant="caption">{wd}</Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar grid (6 weeks / 42 cells) */}
      <Box sx={{ overflowX: fixedDayWidth && !distributeGaps ? "auto" : "hidden", width: "100%" }}>
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
            const stagedStatus = stagedStatusMap[dateStr];
            let stagedOp = null;
            if (stagedStatus === 'staged-insert') stagedOp = 'create';
            else if (stagedStatus === 'staged-delete') stagedOp = 'delete';
            else if (stagedStatus === 'staged-update') stagedOp = 'update';
            // if highlightedDays includes this date, override status to a special flag
            const isHighlighted = highlightedDays && (highlightedDays.has ? highlightedDays.has(dateStr) : (Array.isArray(highlightedDays) && highlightedDays.includes(dateStr)));
            const effectiveStatus = stagedStatus || (isHighlighted ? 'prev-incomplete' : status);

            const tooltipContent = renderDayTooltip?.(dateStr, { dayData, dayOfWeek, isHoliday, segnalazione, totalHours }) || formatDayTooltip(dayData, segnalazione, totalHours);
            return (
              <DayEntryTile
                key={dateStr}
                dateStr={dateStr}
                day={day}
                isSelected={isSelected}
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

      {/* Legend icons/states */}
      <Box>
        <TileLegend />
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
  onVisibleRangeChange: PropTypes.func,
  // View-specific props
  renderDayTooltip: PropTypes.func,
  highlightedDays: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
  fixedDayWidth: PropTypes.bool,
  gap: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  distributeGaps: PropTypes.bool,
  variant: PropTypes.string,
};

export default React.memo(WorkCalendarView);