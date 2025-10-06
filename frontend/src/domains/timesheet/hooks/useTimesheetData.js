import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTimesheetApi } from '@domains/timesheet/hooks';

export function useTimesheetData({ month, year, scope = 'all', employeeIds = [], autoLoad = true } = {}) {
  const { api } = useTimesheetApi();
  const [employees, setEmployees] = useState([]);
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const normalizedScope = scope;
  const keyIds = useMemo(() => (employeeIds || []).slice().sort().join(','), [employeeIds]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const emps = await api.getEmployees();
      let ts = await api.getAllEmployeeTimesheets();
      let filteredEmps = emps;
      if (normalizedScope === 'single') {
        const empIds = keyIds ? keyIds.split(',') : [];
        filteredEmps = emps.filter(e => e.id === empIds[0]);
      } else if (normalizedScope === 'list') {
        const setIds = new Set(keyIds ? keyIds.split(',') : []);
        filteredEmps = emps.filter(e => setIds.has(e.id));
      }
      if (normalizedScope !== 'all') {
        const nextTs = {};
        filteredEmps.forEach(e => { if (ts[e.id]) nextTs[e.id] = ts[e.id]; });
        ts = nextTs;
      }
      try {
        if (typeof window !== 'undefined' && window.__tsOverrides) {
          const overrides = window.__tsOverrides;
          Object.entries(overrides).forEach(([empId, days]) => {
            if (!ts[empId]) ts[empId] = {};
            Object.entries(days || {}).forEach(([dateKey, payload]) => {
              if (!payload) return;
              const recs = Array.isArray(payload) ? payload : payload.records;
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
  const loadInFlightRef = useRef(false);
  const lastLoadRef = useRef(0);
  useEffect(() => {
    if (!autoLoad) return;
    const now = Date.now();
    if (loadInFlightRef.current) return;
    if (now - lastLoadRef.current < 300) return;
    loadInFlightRef.current = true;
    (async () => {
      try { await load(); }
      finally { loadInFlightRef.current = false; lastLoadRef.current = Date.now(); }
    })();
  }, [autoLoad, keyIds, normalizedScope, load]);
  const companies = useMemo(() => Array.from(new Set((employees||[]).map(e => e.azienda).filter(Boolean))).sort(), [employees]);
  const totalEntries = useMemo(() => Object.values(dataMap).reduce((acc, days) => acc + Object.values(days).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0), 0), [dataMap]);
  return { employees, dataMap, setDataMap, load, loading, error, companies, totalEntries, meta: { scope: normalizedScope, month, year } };
}
export default useTimesheetData;
