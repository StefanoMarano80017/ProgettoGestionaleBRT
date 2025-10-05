// updateEmployeeDay.js
// Centralized helper to immutably update the global timesheet dataMap for a specific employee/day.
// It ensures we don't accidentally lose parallel changes and provides a single place to extend
// (e.g., trigger recomputations, optimistic API sync, or event dispatch).

/**
 * updateEmployeeDay
 * @param {object} params
 * @param {object} params.prev - previous dataMap from context
 * @param {string} params.employeeId - employee identifier
 * @param {string} params.dateKey - YYYY-MM-DD day key
 * @param {Array} params.records - new array of day records
 * @returns {object} next dataMap
 */
export function updateEmployeeDay({ prev, employeeId, dateKey, records }) {
  if (!employeeId || !dateKey) return prev || {};
  const empTsPrev = (prev && prev[employeeId]) || {};
  const next = {
    ...(prev || {}),
    [employeeId]: {
      ...empTsPrev,
      [dateKey]: Array.isArray(records) ? [...records] : [],
    },
  };
  try {
    if (typeof window !== 'undefined') {
      const detail = { employeeId, dateKey, recordsCount: Array.isArray(records) ? records.length : 0, timestamp: Date.now() };
      window.dispatchEvent(new CustomEvent('timesheet:dayUpdated', { detail }));
      // Use console.debug so it can be filtered easily
       
      console.debug('[timesheet] dayUpdated', detail);
    }
  } catch {/* ignore dispatch errors */}
  // Persist an override so that future background loads (mock refresh) don't overwrite the edit.
  try {
    if (typeof window !== 'undefined') {
      const g = window; // alias
      if (!g.__tsOverrides) g.__tsOverrides = {}; // { [empId]: { [dateKey]: { records:[], ts:number } } }
      if (!g.__tsOverrides[employeeId]) g.__tsOverrides[employeeId] = {};
      g.__tsOverrides[employeeId][dateKey] = {
        records: Array.isArray(records) ? records.map(r => ({ ...r })) : [],
        ts: Date.now(),
      };
    }
  } catch { /* ignore */ }
  
  return next;
}

/**
 * batchUpdateEmployeeDays
 * Utility for applying multiple day updates (e.g., bulk edits) in one pass.
 * @param {object} params
 * @param {object} params.prev
 * @param {Array<{ employeeId:string, dateKey:string, records:Array }>} params.updates
 */
export function batchUpdateEmployeeDays({ prev, updates = [] }) {
  let next = { ...(prev || {}) };
  for (const u of updates) {
    if (!u || !u.employeeId || !u.dateKey) continue;
    const empTs = next[u.employeeId] ? { ...next[u.employeeId] } : {};
    empTs[u.dateKey] = Array.isArray(u.records) ? [...u.records] : [];
    next[u.employeeId] = empTs;
  }
  try {
    if (typeof window !== 'undefined' && updates.length) {
      const summary = updates.map(u => ({ employeeId: u.employeeId, dateKey: u.dateKey, count: Array.isArray(u.records) ? u.records.length : 0 }));
      window.dispatchEvent(new CustomEvent('timesheet:batchDayUpdated', { detail: { updates: summary, total: updates.length, timestamp: Date.now() } }));
       
      console.debug('[timesheet] batchDayUpdated', summary);
    }
  } catch {/* ignore dispatch errors */}
  return next;
}

export default updateEmployeeDay;
