import { useState, useMemo, useCallback } from 'react';

// Gestione locale dei record giornalieri del dipendente (solo client side mock)
export function useDipendenteTimesheetData(initialData = {}) {
  const [data, setData] = useState(initialData);

  const handleAddRecord = useCallback((day, recordOrRecords, replace = false) => {
    setData(prev => {
      const prevDayRecords = prev[day] || [];
      const toArray = (x) => Array.isArray(x) ? x : [x];
      const newRecords = replace ? toArray(recordOrRecords) : [...prevDayRecords, ...toArray(recordOrRecords)];
      if (!newRecords || newRecords.length === 0) {
        const { [day]: _omit, ...rest } = prev; // remove empty day key
        return rest;
      }
      return { ...prev, [day]: newRecords };
    });
  }, []);

  const todayKey = useMemo(() => new Date().toISOString().slice(0,10), []);
  const isBadgiatoToday = useMemo(() => Boolean(data?.[todayKey] && data[todayKey].length > 0), [data, todayKey]);

  return { data, setData, handleAddRecord, todayKey, isBadgiatoToday };
}
export default useDipendenteTimesheetData;
