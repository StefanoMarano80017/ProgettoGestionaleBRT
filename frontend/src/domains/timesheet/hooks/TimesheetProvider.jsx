import React from 'react';
import { useCalendarMonthYear } from '@domains/timesheet/hooks/calendar';
import { useTimesheetData } from '@domains/timesheet/hooks/useTimesheetData.js';
import { TimesheetStagingProvider } from '@domains/timesheet/hooks/staging';
import { TimesheetContext } from './TimesheetContext';

export function TimesheetProvider({ children, scope = 'all', employeeIds = [], autoLoad = true, initialDate = new Date() }) {
	const { currentMonth, currentYear, setMonthYear, shift } = useCalendarMonthYear(initialDate);
	const { employees, dataMap, setDataMap, load, loading, error, companies } = useTimesheetData({ scope, employeeIds, month: currentMonth, year: currentYear, autoLoad });
	const [filters, setFilters] = React.useState({ search: '', azienda: '', commessa: '' });
	const [selection, setSelection] = React.useState({ employeeId: null, date: null });
	const updateFilter = React.useCallback((k, v) => setFilters(f => ({ ...f, [k]: v })), []);
	const setEmployeeDate = React.useCallback((employeeId, date) => setSelection({ employeeId, date }), []);
	const setEmployeeData = React.useCallback((employeeId, dayMap) => {
		setDataMap(prev => ({
			...(prev||{}),
			[employeeId]: {
				...(prev?.[employeeId]||{}),
				...(Object.entries(dayMap||{}).reduce((acc,[dk, recs]) => { acc[dk] = Array.isArray(recs) ? recs.map(r => (r && typeof r === 'object' ? { _id: r._id || crypto.randomUUID?.() || Math.random().toString(36).slice(2), ...r } : r)) : recs; return acc; }, {}))
			}
		}));
	}, [setDataMap]);
	const value = React.useMemo(() => ({
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
