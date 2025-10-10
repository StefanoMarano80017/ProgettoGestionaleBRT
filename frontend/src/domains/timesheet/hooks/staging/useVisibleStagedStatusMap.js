import { useMemo } from 'react';

/**
 * useVisibleStagedStatusMap
 * Computes a lightweight staged status map limited to visible date keys only.
 * This reduces re-renders by avoiding computation for dates outside the current view.
 * 
 * @param {Object} params
 * @param {Object} params.stagedMeta - Global staged meta map { [empId]: { [dateKey]: 'create'|'update'|'delete' } }
 * @param {Object} params.stagedMap - Staged data map from context
 * @param {Object} params.tsCtx - Timesheet context
 * @param {string|null} params.activeEmployeeId - Current active employee ID
 * @param {Array<string>} params.visibleDateKeys - Array of visible date keys (YYYY-MM-DD)
 * @returns {Object} Flat map { [dateKey]: 'staged-insert'|'staged-update'|'staged-delete'|undefined }
 */
export default function useVisibleStagedStatusMap({ 
  stagedMeta, 
  stagedMap, 
  tsCtx, 
  activeEmployeeId, 
  visibleDateKeys = [] 
}) {
  return useMemo(() => {
    const result = {};
    if (!tsCtx || !visibleDateKeys.length) return result;

    // Create a set for faster lookup
    const visibleSet = new Set(visibleDateKeys);

    const classify = (orig, stagedVal) => {
      if (stagedVal === undefined) return null;
      if (stagedVal === null) return 'staged-delete';
      const stagedArr = Array.isArray(stagedVal) ? stagedVal : [];
      const origArr = Array.isArray(orig) ? orig : [];
      if (!origArr.length && stagedArr.length) return 'staged-insert';
      if (origArr.length && !stagedArr.length) return 'staged-delete';
      const changed = stagedArr.length !== origArr.length || stagedArr.some((r,i) => {
        const o = origArr[i];
        if (!o) return true;
        return String(r?.commessa||'') !== String(o?.commessa||'') || Number(r?.ore||0) !== Number(o?.ore||0);
      });
      return changed ? 'staged-update' : null;
    };

    // Priority 1: if stagedMeta provided, map directly (but only for visible dates)
    if (stagedMeta) {
      for (const [dateKey, tag] of Object.entries(stagedMeta)) {
        if (!visibleSet.has(dateKey)) continue; // Skip non-visible dates
        if (tag === 'create') result[dateKey] = 'staged-insert';
        else if (tag === 'delete') result[dateKey] = 'staged-delete';
        else if (tag === 'update') result[dateKey] = 'staged-update';
      }
    }

    // If we have an active employee, only compute for that scope (visible dates only)
    if (activeEmployeeId) {
      const days = stagedMap[activeEmployeeId] || {};
      const baseDays = tsCtx?.dataMap?.[activeEmployeeId] || {};
      for (const dateStr of Object.keys(days)) {
        if (!visibleSet.has(dateStr)) continue; // Skip non-visible dates
        if (result[dateStr]) continue; // stagedMeta overrides
        const status = classify(baseDays[dateStr] || [], days[dateStr]);
        if (status) result[dateStr] = status;
      }
      return result;
    }

    // Multi-employee aggregation: precedence delete > insert > update (visible dates only)
    const precedence = { 'staged-delete': 3, 'staged-insert': 2, 'staged-update': 1 };
    for (const empId of Object.keys(stagedMap)) {
      const days = stagedMap[empId] || {};
      const baseDays = tsCtx?.dataMap?.[empId] || {};
      for (const dateStr of Object.keys(days)) {
        if (!visibleSet.has(dateStr)) continue; // Skip non-visible dates
        if (result[dateStr] && precedence[result[dateStr]] === 3) continue; // already highest
        const status = classify(baseDays[dateStr] || [], days[dateStr]);
        if (!status) continue;
        if (!result[dateStr] || precedence[status] > precedence[result[dateStr]]) {
          result[dateStr] = status;
        }
      }
    }
    return result;
  }, [stagedMeta, stagedMap, tsCtx, activeEmployeeId, visibleDateKeys]);
}