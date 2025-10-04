import { useState, useCallback } from 'react';

// Gestisce lo stato di mese/anno e fornisce utilità per modificarli
export function useCalendarMonthYear(initialDate = new Date()) {
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const shiftMonth = useCallback((delta) => {
    const d = new Date(currentYear, currentMonth + delta, 1);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  }, [currentMonth, currentYear]);

  const setMonthYear = useCallback((m, y) => {
    setCurrentMonth(m);
    setCurrentYear(y);
  }, []);

  return { currentMonth, currentYear, shiftMonth, setMonthYear };
}
export default useCalendarMonthYear;
