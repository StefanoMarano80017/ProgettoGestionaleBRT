import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTimesheetApi } from './useTimesheetApi';

export function useEmployeeTimesheets({ autoLoad = true } = {}) {
  const { api } = useTimesheetApi();
  const [employees, setEmployees] = useState([]);
  const [tsMap, setTsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [emps, ts] = await Promise.all([
        api.getEmployees(),
        api.getAllEmployeeTimesheets()
      ]);
      setEmployees(emps || []);
      setTsMap(ts || {});
    } catch (e) {
      setError(e?.message || 'Errore caricamento timesheets');
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { if (autoLoad) load(); }, [autoLoad, load]);

  const companies = useMemo(() => Array.from(new Set((employees||[]).map(e => e.azienda).filter(Boolean))).sort(), [employees]);

  return { employees, tsMap, setTsMap, loading, error, load, companies };
}
export default useEmployeeTimesheets;
