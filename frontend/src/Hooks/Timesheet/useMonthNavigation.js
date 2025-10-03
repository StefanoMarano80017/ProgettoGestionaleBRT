import { useState, useCallback, useMemo } from 'react';

const MONTH_NAMES = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

export function useMonthNavigation(initialDate = new Date()) {
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth()); // 0-based

  const monthLabel = useMemo(() => MONTH_NAMES[month] + ' ' + year, [month, year]);
  const setToday = useCallback(() => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }, []);
  const nextMonth = useCallback(() => {
    setMonth(m => {
      if (m === 11) { setYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);
  const prevMonth = useCallback(() => {
    setMonth(m => {
      if (m === 0) { setYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const formatDate = useCallback((d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, []);
  const todayKey = useMemo(() => formatDate(new Date()), [formatDate]);

  return { year, month, setYear, setMonth, monthLabel, nextMonth, prevMonth, setToday, formatDate, todayKey };
}
export default useMonthNavigation;
