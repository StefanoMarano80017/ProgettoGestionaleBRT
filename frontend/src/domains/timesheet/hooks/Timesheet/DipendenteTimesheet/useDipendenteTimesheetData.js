import { useState, useMemo, useCallback } from 'react';

// Gestione locale dei record giornalieri del dipendente (solo client side mock)
export function useDipendenteTimesheetData(initialData = {}, opts = {}) {
  const { onStage } = opts || {};
  const [data, setData] = useState(initialData);

  const handleAddRecord = useCallback((day, recordOrRecords, replace = false) => {
    setData(prev => {
      const prevDayRecords = prev[day] || [];
      const toArray = (x) => Array.isArray(x) ? x : [x];
      const newRecords = replace ? toArray(recordOrRecords) : [...prevDayRecords, ...toArray(recordOrRecords)];
      const next = ( !newRecords || newRecords.length === 0 ) ? ( () => { const { [day]: _omit, ...rest } = prev; return rest; } )() : { ...prev, [day]: newRecords };
      // If caller provided staging callback, call it so global provider can show staged edits
  try { if (typeof onStage === 'function') onStage(day, Array.isArray(newRecords) ? newRecords : [newRecords]); } catch { /* ignore */ }
      return next;
    });
  }, [onStage]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0,10), []);
  const isBadgiatoToday = useMemo(() => Boolean(data?.[todayKey] && data[todayKey].length > 0), [data, todayKey]);

  return { data, setData, handleAddRecord, todayKey, isBadgiatoToday };
}
export default useDipendenteTimesheetData;
