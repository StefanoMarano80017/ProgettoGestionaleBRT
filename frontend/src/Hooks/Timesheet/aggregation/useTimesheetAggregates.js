import { useMemo } from 'react';
import { aggregateAbsences } from './aggregateAbsences';

/**
 * useTimesheetAggregates
 * Unifies monthly + optional per-employee/global aggregations.
 * Inputs:
 *  - dataMap: { [empId]: { 'YYYY-MM-DD': [records] } }
 *  - year, month (0-based)
 *  - options: { includePerEmployee?: bool, includeGlobalCommessa?: bool }
 */
export function useTimesheetAggregates({ dataMap = {}, year, month, options = {} }) {
  return useMemo(() => {
    if (year == null || month == null) return { monthly: null, perEmployee: null, globalByCommessa: null };

    // Merge all employees' day maps into a single flat map date -> entries[]
    const merged = {};
    Object.values(dataMap).forEach(days => {
      Object.entries(days || {}).forEach(([k, v]) => {
        if (k.endsWith('_segnalazione')) return;
        if (!Array.isArray(v)) return;
        if (!merged[k]) merged[k] = [];
        merged[k].push(...v);
      });
    });

    const monthly = aggregateAbsences(merged, year, month);

    let perEmployee = null;
    if (options.includePerEmployee) {
      perEmployee = Object.entries(dataMap).map(([empId, days]) => {
        const empFlat = {};
        Object.entries(days || {}).forEach(([k, v]) => { if (!k.endsWith('_segnalazione') && Array.isArray(v)) empFlat[k] = v; });
        return { empId, ...aggregateAbsences(empFlat, year, month) };
      });
    }

    let globalByCommessa = null;
    if (options.includeGlobalCommessa) {
      // Build aggregation by commessa across all employees for target month
      const counters = {};
      Object.values(dataMap).forEach(days => {
        Object.entries(days || {}).forEach(([k, v]) => {
          if (!Array.isArray(v)) return;
          const d = new Date(k);
          if (d.getFullYear() !== year || d.getMonth() !== month) return;
          v.forEach(r => {
            const key = r.commessa || '???';
            counters[key] = (counters[key] || 0) + (Number(r.ore) || 0);
          });
        });
      });
      globalByCommessa = Object.entries(counters).map(([commessa, ore]) => ({ commessa, ore })).sort((a,b)=>b.ore-a.ore);
    }

    return { monthly, perEmployee, globalByCommessa };
  }, [dataMap, year, month, options.includePerEmployee, options.includeGlobalCommessa]);
}
export default useTimesheetAggregates;
