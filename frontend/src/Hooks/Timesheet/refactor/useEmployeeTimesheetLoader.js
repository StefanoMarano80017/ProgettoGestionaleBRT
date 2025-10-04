import { useEffect, useRef } from 'react';
import { getTimesheetForEmployee } from '@mocks/ProjectMock';
import { useTimesheetContext } from '@/Hooks/Timesheet';

/**
 * Loads timesheet data for a single employee exactly once.
 * Returns nothing; caller relies on provider state.
 */
export default function useEmployeeTimesheetLoader(employeeId) {
  const ctx = useTimesheetContext();
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!employeeId || loadedRef.current) return; // already loaded
    let cancelled = false;
    (async () => {
      try {
        const ts = await getTimesheetForEmployee(employeeId);
        if (!cancelled) {
          ctx.setEmployeeData(employeeId, ts);
          loadedRef.current = true;
        }
      } catch (e) {
        // silent; could expose error state if needed
        // console.error('Failed to load timesheet', e);
      }
    })();
    return () => { cancelled = true; };
  }, [employeeId, ctx.setEmployeeData]);
}
