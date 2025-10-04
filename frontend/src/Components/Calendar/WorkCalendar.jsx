import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import DayEntryTile from '@components/Calendar/DayEntryTile';
import MonthSelector from '@components/Calendar/MonthSelector';
import TileLegend from '@components/Calendar/TileLegend';
import { useCalendarMonthYear, useItalianHolidays, useCalendarDays } from '@hooks/Timesheet/calendar';
import { computeDayStatus } from '@components/Calendar/utils';
import { useTimesheetContext } from '@hooks/Timesheet';

const WEEK_DAYS = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

/**
 * WorkCalendar
 * High-level month view calendar rendering 6 weeks worth of day tiles.
 *
 * Props:
 * - data: object keyed by dateStr -> array of records
 * - selectedDay: ISO date string currently selected
 * - onDaySelect: (dateStr) => void
 * - renderDayTooltip?: (dateStr, context) => ReactNode (lazy tooltip content)
 * - fixedDayWidth?: boolean force fixed px width columns
 * - gap?: grid gap
 * - distributeGaps?: spread columns across width removing internal gaps
 * - variant?: 'default' | 'wide' | 'compact'
 * - selectorVariant?: forward to MonthSelector
 * - selectorLabels?: label density for MonthSelector
 */
/**
 * WorkCalendar
 * High-level month view calendar rendering 6 weeks worth of day tiles.
 */
export function WorkCalendar({
  data = {},
  selectedDay,
  onDaySelect,
  renderDayTooltip,
  highlightedDays,
  stagedDays,
  fixedDayWidth = false,
  gap = 1,
  distributeGaps = false,
  variant = 'default',
  selectorVariant = 'windowed',
  selectorLabels = 'short'
}) {
  const tsCtx = (() => { try { return useTimesheetContext(); } catch { return null; } })();
  const stagedMap = tsCtx?.stagedMap || {};

  // Determine active employee id: explicit selection or single staged employee.
  const activeEmployeeId = useMemo(() => {
    if (tsCtx?.selection?.employeeId) return tsCtx.selection.employeeId;
    const ids = Object.keys(stagedMap);
    if (ids.length === 1) return ids[0];
    return null; // multi-employee view or unknown
  }, [tsCtx?.selection?.employeeId, stagedMap]);

  const classify = (orig, stagedVal) => {
    if (stagedVal === undefined) return null;
    if (stagedVal === null) return 'staged-delete';
    const stagedArr = Array.isArray(stagedVal) ? stagedVal : [];
    const origArr = Array.isArray(orig) ? orig : [];
    if (!origArr.length && stagedArr.length) return 'staged-insert';
    if (origArr.length && !stagedArr.length) return 'staged-delete';
    const changed = stagedArr.length !== origArr.length || stagedArr.some((r,i) => {
      const o = origArr[i];
      if (!o) return true;
      return String(r?.commessa||'') !== String(o?.commessa||'') || Number(r?.ore||0) !== Number(o?.ore||0);
    });
    return changed ? 'staged-update' : null;
  };

  const getStagedStatus = (dateStr) => {
    // Prefer active employee.
    if (activeEmployeeId) {
      const days = stagedMap[activeEmployeeId] || {};
      const stagedVal = days[dateStr];
      const orig = tsCtx?.dataMap?.[activeEmployeeId]?.[dateStr] || [];
      return classify(orig, stagedVal);
    }
    // Aggregate across all employees if no active selection.
    // Precedence: delete > insert > update.
    let found = null;
    for (const empId of Object.keys(stagedMap)) {
      const days = stagedMap[empId] || {};
      const stagedVal = days[dateStr];
      if (stagedVal === undefined) continue;
      const orig = tsCtx?.dataMap?.[empId]?.[dateStr] || [];
      const status = classify(orig, stagedVal);
      if (!status) continue;
      if (status === 'staged-delete') { return status; }
      if (status === 'staged-insert' && found !== 'staged-delete') { found = status; }
      if (status === 'staged-update' && !found) { found = status; }
    }
    return found;
  };
  const today = useMemo(() => new Date(), []);
  const { currentMonth, currentYear, setMonthYear } = useCalendarMonthYear(today);
  const holidaySet = useItalianHolidays(currentYear);
  const { days } = useCalendarDays({ data, currentMonth, currentYear, holidaySet });

  // Controls: small arrows + 5 month buttons (current centered)
  return (
    <Box sx={{ width: "100%" }}>
      {/* Selettore mese */}
      <MonthSelector
        year={currentYear}
        month={currentMonth}
        onChange={(m, y) => setMonthYear(m, y)}
        variant={selectorVariant}
        labels={selectorLabels}
      />

  {/* Intestazione giorni della settimana */}
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

  {/* Griglia giorni (6 settimane / 42 celle) */}
      <Box sx={{ overflowX: fixedDayWidth && !distributeGaps ? "auto" : "hidden", width: "100%", bgcolor: "background.default", borderRadius: 1 }}>
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
        >
        {days.map((item, index) => {
          if (!item) return <Box key={`empty-${index}`} sx={{ borderRadius: 1 }} />;
          const { day, dateStr, dayData, dayOfWeek, segnalazione, isHoliday } = item;
          const isSelected = selectedDay === dateStr;
          const totalHours = dayData?.reduce((s, r) => s + (Number(r?.ore) || 0), 0) || 0;
          const { status, showHours, iconTopRight } = computeDayStatus({
            dayData,
            dayOfWeek,
            segnalazione,
            dateStr,
            isHoliday,
            today,
          });
          const stagedStatus = getStagedStatus(dateStr);
          // if highlightedDays includes this date, override status to a special flag
          const isHighlighted = highlightedDays && (highlightedDays.has ? highlightedDays.has(dateStr) : (Array.isArray(highlightedDays) && highlightedDays.includes(dateStr)));
          const isStaged = stagedDays && (stagedDays.has ? stagedDays.has(dateStr) : (Array.isArray(stagedDays) && stagedDays.includes(dateStr)));
          const effectiveStatus = stagedStatus || (isHighlighted ? 'prev-incomplete' : status);
          const isOutOfMonth = false; // currently not rendering other-month days; keep API ready

          const tooltipContent = renderDayTooltip?.(dateStr, { dayData, dayOfWeek, isHoliday, segnalazione, totalHours });
          return (
            <DayEntryTile
              key={dateStr}
              dateStr={dateStr}
              day={day}
              isSelected={isSelected}
              status={effectiveStatus}
              showHours={showHours}
              iconTopRight={iconTopRight}
              totalHours={totalHours}
              onClick={onDaySelect}
              tooltipContent={tooltipContent}
              variant={variant}
              isHoliday={isHoliday}
              stagedStatus={stagedStatus}
            />
          );
        })}
        </Box>
      </Box>

      {/* Legenda icone/stati */}
      <Box>
        <TileLegend />
      </Box>
    </Box>
  );
}

WorkCalendar.displayName = 'WorkCalendar';

WorkCalendar.propTypes = {
  data: PropTypes.object,
  selectedDay: PropTypes.string,
  onDaySelect: PropTypes.func,
  renderDayTooltip: PropTypes.func,
  highlightedDays: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
  stagedDays: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
  fixedDayWidth: PropTypes.bool,
  gap: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  distributeGaps: PropTypes.bool,
  variant: PropTypes.string,
  selectorVariant: PropTypes.string,
  selectorLabels: PropTypes.string,
};

export default React.memo(WorkCalendar);
