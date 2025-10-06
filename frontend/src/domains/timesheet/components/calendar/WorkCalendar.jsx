import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PropTypes from 'prop-types';
import DayEntryTile from '@domains/timesheet/components/calendar/DayEntryTile';
import MonthSelector from '@domains/timesheet/components/calendar/MonthSelector';
import TileLegend from '@shared/components/Calendar/TileLegend';
import { useCalendarMonthYear, useItalianHolidays, useCalendarDays } from '@domains/timesheet/hooks/calendar';
import { computeDayStatus } from '@domains/timesheet/components/calendar/utils';
import formatDayTooltip from '@domains/timesheet/components/calendar/formatDayTooltip';
import { useTimesheetContext } from '@domains/timesheet/hooks';

// Safe wrapper: returns context or null when provider not mounted (avoids IIFE pattern triggering rules-of-hooks).
function useOptionalTimesheetContext() {
  try { return useTimesheetContext(); } catch { return null; }
}

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
  onDayDoubleClick,
  renderDayTooltip,
  highlightedDays,
  fixedDayWidth = false,
  gap = 1,
  distributeGaps = false,
  variant = 'default',
  selectorVariant = 'windowed',
  selectorLabels = 'short',
  stagedMeta = null // optional { dateKey: 'create'|'update'|'delete' }
}) {
  const tsCtx = useOptionalTimesheetContext();
  const stagedMap = React.useMemo(() => tsCtx?.stagedMap || {}, [tsCtx?.stagedMap]);

  // Determine active employee id: explicit selection or single staged employee.
  const activeEmployeeId = useMemo(() => {
    if (tsCtx?.selection?.employeeId) return tsCtx.selection.employeeId;
    const ids = Object.keys(stagedMap);
    if (ids.length === 1) return ids[0];
    return null; // multi-employee view or unknown
  }, [tsCtx?.selection?.employeeId, stagedMap]);

  // Precompute staged status map once per render instead of per-tile classification.
  const stagedStatusMap = useMemo(() => {
    const result = {};
    if (!tsCtx) return result;

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

    // Priority 1: if stagedMeta provided (already simplified from staging reducer), map directly.
    if (stagedMeta) {
      for (const [k, tag] of Object.entries(stagedMeta)) {
        if (tag === 'create') result[k] = 'staged-insert';
        else if (tag === 'delete') result[k] = 'staged-delete';
        else if (tag === 'update') result[k] = 'staged-update';
      }
    }

    // If we have an active employee, only compute for that scope.
    if (activeEmployeeId) {
      const days = stagedMap[activeEmployeeId] || {};
      const baseDays = tsCtx?.dataMap?.[activeEmployeeId] || {};
      for (const dateStr of Object.keys(days)) {
        if (result[dateStr]) continue; // stagedMeta overrides
        const status = classify(baseDays[dateStr] || [], days[dateStr]);
        if (status) result[dateStr] = status;
      }
      return result;
    }

    // Multi-employee aggregation: precedence delete > insert > update
    const precedence = { 'staged-delete': 3, 'staged-insert': 2, 'staged-update': 1 };
    for (const empId of Object.keys(stagedMap)) {
      const days = stagedMap[empId] || {};
      const baseDays = tsCtx?.dataMap?.[empId] || {};
      for (const dateStr of Object.keys(days)) {
        if (result[dateStr] && precedence[result[dateStr]] === 3) continue; // already highest
        const status = classify(baseDays[dateStr] || [], days[dateStr]);
        if (!status) continue;
        if (!result[dateStr] || precedence[status] > precedence[result[dateStr]]) {
          result[dateStr] = status;
        }
      }
    }
    return result;
  }, [tsCtx, stagedMap, activeEmployeeId, stagedMeta]);
  const today = useMemo(() => new Date(), []);
  const { currentMonth, currentYear, setMonthYear } = useCalendarMonthYear(today);
  const holidaySet = useItalianHolidays(currentYear);
  const { days } = useCalendarDays({ data, currentMonth, currentYear, holidaySet });

  // Controls: small arrows + 5 month buttons (current centered)
  const gridRef = React.useRef(null);

  return (
    <Box sx={{ width: "100%", position: 'relative', bgcolor: 'background.default', borderRadius: 1, p: 2, height: '100%', boxShadow: 2, transition: 'box-shadow 160ms ease, transform 160ms ease', '&:hover': { boxShadow: 6 } }}>
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
  >
  {days.map((item, index) => {
          if (!item) return <Box key={`empty-${index}`} sx={{ borderRadius: 1 }} />;
          const { day, dateStr, dayData, dayOfWeek, segnalazione, isHoliday } = item;
          const isSelected = selectedDay === dateStr;
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
              onClick={onDaySelect}
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

      

      {/* Legenda icone/stati */}
      <Box sx={{ mt: 2 }}>
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
  onDayDoubleClick: PropTypes.func,
  renderDayTooltip: PropTypes.func,
  highlightedDays: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
  stagedDays: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
  fixedDayWidth: PropTypes.bool,
  gap: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  distributeGaps: PropTypes.bool,
  variant: PropTypes.string,
  selectorVariant: PropTypes.string,
  selectorLabels: PropTypes.string,
  stagedMeta: PropTypes.object,
};

export default React.memo(WorkCalendar);
