import { useMemo } from 'react';

/**
 * useStableMergedDataMap
 * For a single-employee scope returns a mergedData object (base overlaid by staged draft).
 * For multi-employee admin usage it can provide a lightweight accessor getMergedDay to avoid cloning entire map.
 */
export default function useStableMergedDataMap({ dataMap = {}, staging, employeeId, mode = 'single' }) {
  // Single employee: compute merged object once with hashing to avoid churn.
  const mergedData = useMemo(() => {
    if (mode !== 'single' || !employeeId) return null;
    if (!staging || !staging.order || !staging.order.length) return dataMap[employeeId] || {};
    const base = dataMap[employeeId] || {};
    // Build only affected days to overlay.
    const overlays = {};
    for (const key of staging.order) {
      const [emp, dateKey] = key.split('|');
      if (emp !== employeeId) continue;
      const entry = staging.getStagedEntry(emp, dateKey);
      if (!entry) continue;
      overlays[dateKey] = entry.draft === null ? [] : entry.draft;
    }
    if (!Object.keys(overlays).length) return base;
    // Merge shallow – base first then overlays.
    return { ...base, ...overlays };
  }, [dataMap, staging, employeeId, mode]);

  // For admin multi mode expose a helper to avoid large object cloning.
  const getMergedDay = (empId, dateKey) => {
    if (!staging) return (dataMap?.[empId]?.[dateKey]) || [];
    const entry = staging.getStagedEntry ? staging.getStagedEntry(empId, dateKey) : null;
    if (!entry) return (dataMap?.[empId]?.[dateKey]) || [];
    return entry.draft === null ? [] : entry.draft;
  };

  return { mergedData, getMergedDay };
}
