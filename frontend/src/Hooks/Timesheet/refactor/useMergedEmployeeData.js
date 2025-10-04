import { useMemo } from 'react';
import { useTimesheetContext } from '@/Hooks/Timesheet';

/**
 * Returns merged day -> records map combining base committed, staged overlay and local draft edits.
 * stagedMap semantics:
 *  - value === null => delete day
 *  - value is array => replace day
 */
export default function useMergedEmployeeData(employeeId, draftsByDay) {
  const ctx = useTimesheetContext();
  return useMemo(() => {
    const out = {};
    if (!employeeId) return out;
    const base = ctx.dataMap?.[employeeId] || {};
    const staged = ctx.stagedMap?.[employeeId] || {};
    Object.entries(base).forEach(([k, v]) => { out[k] = v; });
    Object.entries(staged).forEach(([k, v]) => { if (v === null) { delete out[k]; } else { out[k] = Array.isArray(v) ? v : []; } });
    Object.entries(draftsByDay || {}).forEach(([k, v]) => { if (!staged[k]) out[k] = Array.isArray(v) ? v : []; });
    return out;
  }, [employeeId, ctx.dataMap, ctx.stagedMap, draftsByDay]);
}
