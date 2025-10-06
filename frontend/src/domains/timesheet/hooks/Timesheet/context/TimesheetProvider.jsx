import React, { useContext, useMemo, useState, useCallback } from 'react';
import { useCalendarMonthYear } from '@domains/timesheet/hooks/calendar';
import { useTimesheetData } from '@domains/timesheet/hooks/Timesheet/data/useTimesheetData';
import TimesheetContext from './_TimesheetContext.js';
import { TimesheetStagingProvider } from '@domains/timesheet/hooks/staging';

// Context moved to separate module (_TimesheetContext.js) for cleaner fast-refresh boundaries.

export function TimesheetProvider({
  children,
  scope = 'all',
  employeeIds = [],
  autoLoad = true,
  initialDate = new Date(),
}) {
  const { currentMonth, currentYear, setMonthYear, shift } = useCalendarMonthYear(initialDate);
  const { employees, dataMap, setDataMap, load, loading, error, companies } = useTimesheetData({ scope, employeeIds, month: currentMonth, year: currentYear, autoLoad });
  // Filters & selection centralizzati
  const [filters, setFilters] = useState({ search: '', azienda: '', commessa: '' });
  const [selection, setSelection] = useState({ employeeId: null, date: null });

  const updateFilter = useCallback((k, v) => setFilters(f => ({ ...f, [k]: v })), []);
  const setEmployeeDate = useCallback((employeeId, date) => setSelection({ employeeId, date }), []);

  const setEmployeeData = useCallback((employeeId, dayMap) => {
    setDataMap(prev => ({
      ...(prev||{}),
      [employeeId]: {
        ...(prev?.[employeeId]||{}),
        ...(Object.entries(dayMap||{}).reduce((acc,[dk, recs]) => { acc[dk] = Array.isArray(recs) ? recs.map(r => (r && typeof r === 'object' ? { _id: r._id || crypto.randomUUID?.() || Math.random().toString(36).slice(2), ...r } : r)) : recs; return acc; }, {}))
      }
    }));
  }, [setDataMap]);

  const value = useMemo(() => ({
    month: currentMonth,
    year: currentYear,
    setMonthYear,
    shiftMonth: shift,
    dataMap,
    setDataMap,
    setEmployeeData,
    employees,
    load,
    loading,
    error,
    companies,
    filters,
    setFilters,
    updateFilter,
    selection,
    setSelection,
    setEmployeeDate,
    scope,
  }), [currentMonth, currentYear, setMonthYear, shift, dataMap, employees, load, loading, error, companies, filters, selection, scope, setEmployeeData, setDataMap, updateFilter, setEmployeeDate]);

  return (
    <TimesheetStagingProvider debug={false}>
      <TimesheetContext.Provider value={value}>{children}</TimesheetContext.Provider>
    </TimesheetStagingProvider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- exporting a hook intentionally
export function useTimesheetContext() {
  const ctx = useContext(TimesheetContext);
  if (!ctx) throw new Error('useTimesheetContext must be used within <TimesheetProvider>');
  return ctx;
}

// safe optional hook that returns context value or null if provider is not present
// Optional hook relocated to its own file to avoid extra exports here.
