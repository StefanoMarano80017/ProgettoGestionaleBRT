import { useMemo } from 'react';
import { aggregateAbsences } from './aggregation/aggregateAbsences.js';

/**
 * @deprecated Usare useTimesheetAggregates con dataMap unificato oppure aggregateAbsences direttamente.
 * data: object map YYYY-MM-DD -> array of records { commessa, ore }
 * opts: { year, monthIndex } where monthIndex is 0-based. If omitted, uses current month/year.
 */
export default function useMonthlySummary(data = {}, opts = {}) {
  return useMemo(() => {
    let year = opts.year, monthIndex = opts.monthIndex;
    if (typeof year === 'undefined' || typeof monthIndex === 'undefined') {
      const now = new Date();
      year = now.getFullYear();
      monthIndex = now.getMonth();
    }

    const agg = aggregateAbsences(data, year, monthIndex);
    return { ...agg, year, monthIndex };
  }, [data, opts.year, opts.monthIndex]);
}
