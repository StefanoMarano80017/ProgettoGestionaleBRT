import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTimesheetApi } from '@hooks/Timesheet/useTimesheetApi';

/**
 * Unified data fetch + normalization for timesheets.
 * Modes:
 *  - single: one employee (employeeIds[0])
 *  - list: explicit set of employeeIds
 *  - all: all employees
 * Options:
 *  { month, year, scope, employeeIds?, includeSegnalazioni? (future), autoLoad }
 */
export function useTimesheetData({ month, year, scope = 'all', employeeIds = [], autoLoad = true } = {}) {
  const { api } = useTimesheetApi();
  const [employees, setEmployees] = useState([]);
  const [dataMap, setDataMap] = useState({}); // { [empId]: { 'YYYY-MM-DD': [records], 'YYYY-MM-DD_segnalazione': {...} } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedScope = scope;
  // Create a stable string key from employeeIds so identity changes of the array
  // (e.g. default [] re-created each render) don't retrigger callbacks.
  const keyIdsDep = (employeeIds || []).join(',');
  const keyIds = useMemo(() => (employeeIds || []).slice().sort().join(','), [keyIdsDep]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // For now we piggy-back on existing mock functions (getEmployees + getAllEmployeeTimesheets)
      const emps = await api.getEmployees();
      let ts = await api.getAllEmployeeTimesheets();
      // Filter by scope
      let filteredEmps = emps;
      if (normalizedScope === 'single') {
        const empIds = keyIds ? keyIds.split(',') : [];
        filteredEmps = emps.filter(e => e.id === empIds[0]);
      } else if (normalizedScope === 'list') {
        const setIds = new Set(keyIds ? keyIds.split(',') : []);
        filteredEmps = emps.filter(e => setIds.has(e.id));
      }
      // Reduce timesheet map to filtered employees only
      if (normalizedScope !== 'all') {
        const nextTs = {};
        filteredEmps.forEach(e => { if (ts[e.id]) nextTs[e.id] = ts[e.id]; });
        ts = nextTs;
      }
      // Reapply any local overrides (in-memory) to avoid reverting user edits when mock reloads.
      try {
        if (typeof window !== 'undefined' && window.__tsOverrides) {
          const overrides = window.__tsOverrides;
          Object.entries(overrides).forEach(([empId, days]) => {
            if (!ts[empId]) ts[empId] = {};
            Object.entries(days || {}).forEach(([dateKey, payload]) => {
              if (!payload) return;
              const recs = Array.isArray(payload) ? payload : payload.records; // backward compatibility
              ts[empId][dateKey] = (recs || []).map(r => ({ ...r }));
            });
          });
        }
      } catch {/* ignore */}
      setEmployees(filteredEmps);
      setDataMap(ts || {});
    } catch (e) {
      setError(e?.message || 'Errore caricamento timesheet');
    } finally {
      setLoading(false);
    }
  }, [api, normalizedScope, keyIds]);

  // Guard against re-entrant/rapid auto-load triggers which can cause render loops
  const loadInFlightRef = { current: false };
  const lastLoadRef = { current: 0 };
  useEffect(() => {
    if (!autoLoad) return;
    // prevent repeated calls within 300ms and while a load is in flight
    const now = Date.now();
    if (loadInFlightRef.current) return;
    if (now - lastLoadRef.current < 300) return;
    loadInFlightRef.current = true;
    // call and reset flags
    (async () => {
      try {
        await load();
      } finally {
        loadInFlightRef.current = false;
        lastLoadRef.current = Date.now();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, keyIds, normalizedScope]);

  // Derived convenience: companies & flat records count
  const companies = useMemo(() => Array.from(new Set((employees||[]).map(e => e.azienda).filter(Boolean))).sort(), [employees]);
  const totalEntries = useMemo(() => {
    return Object.values(dataMap).reduce((acc, days) => acc + Object.values(days).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0), 0);
  }, [dataMap]);

  return {
    employees,
    dataMap,
    setDataMap,
    load,
    loading,
    error,
    companies,
    totalEntries,
    meta: { scope: normalizedScope, month, year }
  };
}
export default useTimesheetData;
