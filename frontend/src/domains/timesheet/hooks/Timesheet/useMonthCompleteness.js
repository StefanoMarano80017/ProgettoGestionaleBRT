import { useMemo } from 'react';
import checkMonthCompletenessForId from './utils/checkMonthCompleteness';

/**
 * useMonthCompleteness
 * Reusable hook that returns the list/set of incomplete work-days for a given id and month/year.
 * Returns an object: { missingDates: Array<{date, total}>, missingSet: Set<string> }
 */
export function useMonthCompleteness({ tsMap = {}, id, year, month, isHoliday } = {}) {
  const payload = useMemo(() => {
    if (!id || !tsMap) return { missingDates: [], missingSet: new Set() };
    const missingDates = checkMonthCompletenessForId({ tsMap, id, year, month, isHoliday });
    const missingSet = new Set(missingDates.map(d => d.date));
    return { missingDates, missingSet };
  }, [tsMap, id, year, month, isHoliday]);

  return payload;
}

export default useMonthCompleteness;
