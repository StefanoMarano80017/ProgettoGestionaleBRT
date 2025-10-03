import { useState, useEffect, useCallback } from 'react';
import { useTimesheetApi } from './useTimesheetApi';

export function useOpPersonal({ auto = true } = {}) {
  const { api } = useTimesheetApi();
  const [opPersonal, setOpPersonal] = useState({});
  const [loading, setLoading] = useState(false);

  const refreshPersonal = useCallback(async () => {
    setLoading(true);
    try {
      const map = await api.getOperaioPersonalMap();
      setOpPersonal(map || {});
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { if (auto) refreshPersonal(); }, [auto, refreshPersonal]);

  return { opPersonal, refreshPersonal, loading };
}
export default useOpPersonal;
