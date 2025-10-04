import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useCalendarMonthYear } from '@hooks/Timesheet/calendar/useCalendarMonthYear';
import { useTimesheetData } from '@hooks/Timesheet/data/useTimesheetData';

const TimesheetContext = createContext(null);

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

  const value = useMemo(() => ({
    month: currentMonth,
    year: currentYear,
    setMonthYear,
    shiftMonth: shift,
    dataMap,
    setDataMap,
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
  }), [currentMonth, currentYear, setMonthYear, shift, dataMap, employees, load, loading, error, companies, filters, selection, scope]);

  return <TimesheetContext.Provider value={value}>{children}</TimesheetContext.Provider>;
}

export function useTimesheetContext() {
  const ctx = useContext(TimesheetContext);
  if (!ctx) throw new Error('useTimesheetContext must be used within <TimesheetProvider>');
  return ctx;
}
