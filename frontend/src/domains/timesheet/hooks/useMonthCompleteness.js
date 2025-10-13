import { useMemo } from 'react';
import { useTimesheetContext } from './TimesheetContext';

// Minimal month completeness calculation (counts days with any record vs total working days)
export default function useMonthCompleteness() {
	const { dataMap, month, year, selection } = useTimesheetContext();
	const employeeId = selection.employeeId || Object.keys(dataMap||{})[0];
	return useMemo(() => {
		if (!employeeId || !dataMap[employeeId]) return { filled: 0, working: 0, ratio: 0 };
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		let working = 0; let filled = 0;
		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
			const dateObj = new Date(year, month, d);
			const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
			if (isWeekend) continue; // skip weekends for completeness baseline
			working++;
			const recs = dataMap[employeeId][dateStr];
			if (Array.isArray(recs) && recs.length > 0) filled++;
		}
		return { filled, working, ratio: working ? filled/working : 0 };
	}, [dataMap, employeeId, month, year]);
}
