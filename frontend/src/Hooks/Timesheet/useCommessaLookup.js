import { useState, useEffect, useCallback } from 'react';
import { useTimesheetApi } from './useTimesheetApi';

export function useCommessaLookup(employeeId, { auto = true } = {}) {
  const { api } = useTimesheetApi();
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true); setError('');
    try {
      const list = await api.getActiveCommesseForEmployee(employeeId);
      setCommesse(list || []);
    } catch (e) { setError(e?.message || 'Errore caricamento commesse'); }
    finally { setLoading(false); }
  }, [api, employeeId]);

  useEffect(() => { if (auto) load(); }, [auto, load]);

  return { commesse, loading, error, reload: load };
}
export default useCommessaLookup;
