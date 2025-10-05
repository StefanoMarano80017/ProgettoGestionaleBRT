import { useEffect, useRef } from 'react';
import { getTimesheetForEmployee } from '@mocks/ProjectMock';
import { useTimesheetContext } from './context/TimesheetProvider.jsx';

/**
 * Loads timesheet data for a single employee exactly once.
 * Returns nothing; caller relies on provider state.
 */
export default function useEmployeeTimesheetLoader(employeeId) {
  const ctx = useTimesheetContext();
  const { setEmployeeData } = ctx;
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!employeeId || loadedRef.current) return; // already loaded
    let cancelled = false;
    (async () => {
      try {
        const ts = await getTimesheetForEmployee(employeeId);
        if (!cancelled) { setEmployeeData(employeeId, ts); loadedRef.current = true; }
      } catch {
        // silent; could expose error state if needed
      }
    })();
    return () => { cancelled = true; };
  }, [employeeId, setEmployeeData]);
}
