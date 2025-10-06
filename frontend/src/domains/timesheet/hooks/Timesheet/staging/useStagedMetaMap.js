import { useMemo } from 'react';

// Build a meta map { employeeId: { dateKey: op } } skipping noop ops.
// Accepts staging facade (useTimesheetStaging()) return object.
export default function useStagedMetaMap(staging) {
  return useMemo(() => {
    if (!staging) return {};
    const meta = {};
    const order = staging.order || [];
    for (const key of order) {
      const [empId, dateKey] = key.split('|');
      const entry = staging.getStagedEntry ? staging.getStagedEntry(empId, dateKey) : null;
      if (!entry || !entry.op || entry.op === 'noop') continue;
      if (!meta[empId]) meta[empId] = {};
      meta[empId][dateKey] = entry.op; // create|update|delete
    }
    return meta;
  }, [staging]);
}
