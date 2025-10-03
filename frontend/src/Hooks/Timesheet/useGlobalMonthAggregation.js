import { useState, useEffect, useMemo } from 'react';
import { useTimesheetApi } from './useTimesheetApi';

export function useGlobalMonthAggregation({ year, month, rows, searchCommessa }) {
  const { api } = useTimesheetApi();
  const [globalMonthAgg, setGlobalMonthAgg] = useState([]);
  const [aggLoading, setAggLoading] = useState(false);

  // Deriva lista stabile di employeeIds per evitare rilanci continui se l'array rows cambia referenza.
  const employeeIdsKey = useMemo(() => (rows || []).map(r => r.id).sort().join(','), [rows]);

  useEffect(() => {
    let mounted = true;
    setAggLoading(true);
    api.getGlobalMonthByCommessa({ year, month, employeeIds: employeeIdsKey ? employeeIdsKey.split(',').filter(Boolean) : [], filterCommessa: searchCommessa })
      .then(data => { if (mounted) setGlobalMonthAgg(data); })
      .finally(() => { if (mounted) setAggLoading(false); });
    return () => { mounted = false; };
  }, [api, year, month, employeeIdsKey, searchCommessa]);

  return { globalMonthAgg, aggLoading };
}
export default useGlobalMonthAggregation;
