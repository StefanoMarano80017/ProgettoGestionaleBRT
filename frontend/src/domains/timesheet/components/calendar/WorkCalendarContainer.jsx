import React, { useMemo, useState, useCallback } from 'react';
import { useCalendarMonthYear, useItalianHolidays, useCalendarDays } from '@domains/timesheet/hooks/calendar';
import { useTimesheetSelector, useDayEditor } from '@domains/timesheet/hooks';
import useCalendarController from '@domains/timesheet/hooks/calendar/useCalendarController';
import useVisibleStagedStatusMap from '@domains/timesheet/hooks/staging/useVisibleStagedStatusMap';
import WorkCalendarView from './WorkCalendarView';

/**
 * WorkCalendarContainer
 * Smart component that handles all logic, hooks, and data orchestration.
 * Passes minimal props to the presentational WorkCalendarView.
 */
export function WorkCalendarContainer({
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
  stagedMeta = null, // optional { dateKey: 'create'|'update'|'delete' }
  period = 'month',
  onPeriodChange,
  showRiepilogo = false
}) {
  // Selective context consumption to reduce re-renders
  const selectedEmployeeId = useTimesheetSelector(
    ctx => ctx?.selection?.employeeId || null,
    []
  );
  
  const stagedMap = useTimesheetSelector(
    ctx => ctx?.stagedMap || {},
    []
  );
  
  // Get current calendar month/year for selective data consumption
  const today = useMemo(() => new Date(), []);
  const { currentMonth, currentYear, setMonthYear } = useCalendarMonthYear(today);

  // Determine active employee id first (needed for selective data consumption)
  const activeEmployeeId = useMemo(() => {
    if (selectedEmployeeId) return selectedEmployeeId;
    const ids = Object.keys(stagedMap);
    if (ids.length === 1) return ids[0];
    return null; // multi-employee view or unknown
  }, [selectedEmployeeId, stagedMap]);
  
  // Select only current month's data for the active employee (reduces re-renders from other months/employees)
  const monthlyDataMap = useTimesheetSelector(
    ctx => {
      if (!ctx?.dataMap) return {};
      
      // If we have an active employee, only select their data
      if (activeEmployeeId) {
        return { [activeEmployeeId]: ctx.dataMap[activeEmployeeId] || {} };
      }
      
      // Otherwise return all employee data (multi-employee view)
      return ctx.dataMap;
    },
    [activeEmployeeId]
  );
  
  // Create minimal context object for useVisibleStagedStatusMap
  const minimalTsCtx = useMemo(() => ({ dataMap: monthlyDataMap }), [monthlyDataMap]);
  
  // Day editor hook for opening day dialogs
  const { openEditor } = useDayEditor();
  
  // Local state for selected date (can be overridden by prop)
  const [internalSelectedDay, setInternalSelectedDay] = useState(null);
  const selectedDateKey = selectedDay ?? internalSelectedDay;
  
  // Stable callback for setting selected date
  const setSelectedDateKey = useCallback((dateKey) => {
    if (onDaySelect) {
      onDaySelect(dateKey); // Use prop callback if provided
    } else {
      setInternalSelectedDay(dateKey); // Fall back to local state
    }
  }, [onDaySelect]);

  // Track visible date keys for optimized staged status computation
  const holidaySet = useItalianHolidays(currentYear);
  const { days } = useCalendarDays({ data, currentMonth, currentYear, holidaySet });

  const visibleDateKeys = useMemo(() => (
    days
      .filter((day) => day && day.dateStr)
      .map((day) => day.dateStr)
  ), [days]);

  // Compute lightweight staged status map for visible dates only
  const stagedStatusMap = useVisibleStagedStatusMap({
    stagedMeta,
    stagedMap,
    tsCtx: minimalTsCtx,
    activeEmployeeId,
    visibleDateKeys
  });

  // Month navigation handlers with stable callbacks
  const onPrevMonth = useCallback(() => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    setMonthYear(prevMonth, prevYear);
  }, [currentMonth, currentYear, setMonthYear]);

  const onNextMonth = useCallback(() => {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setMonthYear(nextMonth, nextYear);
  }, [currentMonth, currentYear, setMonthYear]);

  const onDateSelect = useCallback((date) => {
    if (date) {
      setMonthYear(date.getMonth(), date.getFullYear());
    }
  }, [setMonthYear]);

  // Calendar controller for day interactions
  const { onDayClick, onDayDoubleClick: controllerDoubleClick, onKeyDown } = useCalendarController({
    openEditor,
    setSelectedDateKey,
    activeEmployeeId
  });

  // Create stable handler factories with minimal dependencies
  const handleDayClick = useCallback((dateKey) => {
    onDayClick(dateKey);
  }, [onDayClick]);

  const handleDayDoubleClick = useCallback((dateKey) => {
    const handler = onDayDoubleClick || controllerDoubleClick;
    if (handler) handler(dateKey);
  }, [onDayDoubleClick, controllerDoubleClick]);

  // Pass minimal props to view
  return (
    <WorkCalendarView
      days={days}
      month={currentMonth}
      year={currentYear}
      selectedDateKey={selectedDateKey}
      onDayClick={handleDayClick}
      onDayDoubleClick={handleDayDoubleClick}
      onKeyDown={onKeyDown}
      stagedStatusMap={stagedStatusMap}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
      onDateSelect={onDateSelect}
      // Pass through view-specific props
      renderDayTooltip={renderDayTooltip}
      highlightedDays={highlightedDays}
      fixedDayWidth={fixedDayWidth}
      gap={gap}
      distributeGaps={distributeGaps}
      variant={variant}
      period={period}
      onPeriodChange={onPeriodChange}
      showRiepilogo={showRiepilogo}
      data={data}
    />
  );
}

WorkCalendarContainer.displayName = 'WorkCalendarContainer';

export default React.memo(WorkCalendarContainer);