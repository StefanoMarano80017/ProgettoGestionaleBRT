import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTimesheetApi } from '../useTimesheetApi';

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
  const keyIds = useMemo(() => (employeeIds || []).slice().sort().join(','), [employeeIds]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // For now we piggy-back on existing mock functions (getEmployees + getAllEmployeeTimesheets)
      const emps = await api.getEmployees();
      let ts = await api.getAllEmployeeTimesheets();
      // Filter by scope
      let filteredEmps = emps;
      if (normalizedScope === 'single') {
        filteredEmps = emps.filter(e => e.id === employeeIds[0]);
      } else if (normalizedScope === 'list') {
        const setIds = new Set(employeeIds);
        filteredEmps = emps.filter(e => setIds.has(e.id));
      }
      // Reduce timesheet map to filtered employees only
      if (normalizedScope !== 'all') {
        const nextTs = {};
        filteredEmps.forEach(e => { if (ts[e.id]) nextTs[e.id] = ts[e.id]; });
        ts = nextTs;
      }
      setEmployees(filteredEmps);
      setDataMap(ts || {});
    } catch (e) {
      setError(e?.message || 'Errore caricamento timesheet');
    } finally {
      setLoading(false);
    }
  }, [api, normalizedScope, employeeIds]);

  useEffect(() => { if (autoLoad) load(); }, [autoLoad, load, keyIds, normalizedScope]);

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
