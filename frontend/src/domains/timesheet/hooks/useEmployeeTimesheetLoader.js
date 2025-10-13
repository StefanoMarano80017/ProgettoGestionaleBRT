import { useEffect, useRef } from 'react';
import { getTimesheetForEmployee } from '@mocks/ProjectMock';
import { useTimesheetContext } from '@domains/timesheet/hooks/TimesheetContext';

// Loads timesheet data for one employee once.
export default function useEmployeeTimesheetLoader(employeeId) {
	const ctx = useTimesheetContext();
	const { setEmployeeData } = ctx;
	const loadedRef = useRef(false);
	useEffect(() => {
		if (!employeeId || loadedRef.current) return;
		let cancelled = false;
		(async () => {
			try {
				const ts = await getTimesheetForEmployee(employeeId);
				if (!cancelled) { setEmployeeData(employeeId, ts); loadedRef.current = true; }
			} catch { /* silent */ }
		})();
		return () => { cancelled = true; };
	}, [employeeId, setEmployeeData]);
}

