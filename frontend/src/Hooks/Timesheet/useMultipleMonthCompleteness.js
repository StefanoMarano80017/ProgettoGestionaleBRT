import { useMemo } from 'react';
import checkMonthCompletenessForId from './utils/checkMonthCompleteness';

/**
 * Compute missing date sets for multiple ids in one memoized call.
 * Returns: { map: { [id]: { missingDates: [...], missingSet: Set } }, idsWithMissing: Set }
 */
export function useMultipleMonthCompleteness({ tsMap = {}, ids = [], year, month, isHoliday } = {}) {
  const payload = useMemo(() => {
    const map = {};
    const idsWithMissing = new Set();
    if (!Array.isArray(ids) || !ids.length) return { map, idsWithMissing };
    for (const id of ids) {
      const missingDates = checkMonthCompletenessForId({ tsMap, id, year, month, isHoliday });
      const missingSet = new Set(missingDates.map(d => d.date));
      map[id] = { missingDates, missingSet };
      if (missingDates.length > 0) idsWithMissing.add(id);
    }
    return { map, idsWithMissing };
  }, [tsMap, ids, year, month, isHoliday]);

  return payload;
}

export default useMultipleMonthCompleteness;
