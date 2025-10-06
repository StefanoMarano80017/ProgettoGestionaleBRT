import { useMemo } from 'react';

// Costruisce l'array dei giorni (42 celle) per mese/anno correnti
export function useCalendarDays({ data, currentMonth, currentYear, holidaySet }) {
  const firstDay = useMemo(() => new Date(currentYear, currentMonth, 1), [currentMonth, currentYear]);
  const lastDay = useMemo(() => new Date(currentYear, currentMonth + 1, 0), [currentMonth, currentYear]);

  const days = useMemo(() => {
    const arr = [];
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday=0
    for (let i = 0; i < startDayOfWeek; i++) arr.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const dayData = data[dateStr];
      const segnalazione = data[`${dateStr}_segnalazione`];
      const isHoliday = holidaySet.has(dateStr);
      arr.push({ day: d, dateStr, dayData, dayOfWeek, segnalazione, isHoliday });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    if (arr.length < 42) {
      const fill = 42 - arr.length;
      for (let i = 0; i < fill; i++) arr.push(null);
    }
    return arr;
  }, [data, currentMonth, currentYear, firstDay, lastDay, holidaySet]);

  return { days, firstDay, lastDay };
}
export default useCalendarDays;
