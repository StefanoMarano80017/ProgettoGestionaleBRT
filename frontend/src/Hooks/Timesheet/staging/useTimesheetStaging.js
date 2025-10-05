import { useCallback, useMemo } from 'react';
import { DEBUG_TS } from '@config/debug';
import { useOptionalTimesheetStaging } from './useStagingContextHooks.js';
import { useOptionalTimesheetContext } from '../context/useOptionalTimesheetContext.js';

// Hook facade combining legacy timesheet data & new staging operations.
// This allows us to keep the existing UI flow (which merges staged over base) while progressively
// migrating to the new staged entry model. For now we derive a computed mergedDay accessor.

export function useTimesheetStaging() {
  // Use optional context so the hook can be imported in modules that might render outside provider (returns empty map gracefully)
  const tsCtx = useOptionalTimesheetContext();
  const ctxOpt = useOptionalTimesheetStaging(); // may be null
  // Memoize to provide stable references for callbacks & avoid hook exhaustive-deps noise
  const entries = useMemo(() => ctxOpt?.entries || {}, [ctxOpt?.entries]);
  const upsert = ctxOpt?.upsert;
  const remove = ctxOpt?.remove;
  const reset = ctxOpt?.reset;
  const rollback = ctxOpt?.rollback;
  const discardAll = ctxOpt?.discardAll || (() => {});
  const confirmAll = ctxOpt?.confirmAll || (async () => {});
  const buildBatchPayload = ctxOpt?.buildBatchPayload || (() => []);
  const order = useMemo(() => ctxOpt?.order || [], [ctxOpt?.order]);

  const getBaseDay = useCallback((employeeId, dateKey) => {
    const dm = tsCtx?.dataMap || {};
    return (dm?.[employeeId]?.[dateKey]) || [];
  }, [tsCtx]);
  const getStagedEntry = useCallback((employeeId, dateKey) => entries?.[employeeId]?.[dateKey], [entries]);
  const getMergedDay = useCallback((employeeId, dateKey) => {
    const entry = getStagedEntry(employeeId, dateKey);
    if (!entry) return getBaseDay(employeeId, dateKey);
    return entry.draft === null ? [] : entry.draft; // In UI a delete surfaces as empty list
  }, [getBaseDay, getStagedEntry]);

  const stageDraft = useCallback((employeeId, dateKey, draftRecords, opts) => {
    if (!upsert) return; // noop if provider absent
    const base = getBaseDay(employeeId, dateKey);
  if (DEBUG_TS) { try { console.debug('[staging] stageDraft request', { employeeId, dateKey, baseLen: base?.length || 0, draftLen: draftRecords?.length || 0, origin: opts?.origin }); } catch { /* ignore debug */ } }
    upsert(employeeId, dateKey, base, draftRecords);
  }, [getBaseDay, upsert]);

  const discardEntry = useCallback((employeeId, dateKey) => { if (remove) remove(employeeId, dateKey); }, [remove]);
  const resetEntry = useCallback((employeeId, dateKey) => { if (reset) reset(employeeId, dateKey); }, [reset]);
  const rollbackEntry = useCallback((employeeId, dateKey) => { if (rollback) rollback(employeeId, dateKey); }, [rollback]);

  const stagedCount = useMemo(() => order.length, [order]);

  // Helper: produce { employeeId: { dateKey: op } }
  const buildStagedMetaMap = useCallback(() => {
    const meta = {};
    order.forEach(key => {
      const [empId, dateKey] = key.split('|');
      const entry = getStagedEntry(empId, dateKey);
      if (!entry) return;
      if (entry.op === 'noop') return; // filtered out
      if (!meta[empId]) meta[empId] = {};
      meta[empId][dateKey] = entry.op;
    });
    return meta;
  }, [order, getStagedEntry]);

  return {
    stageDraft,
    discardEntry,
  resetEntry,
  rollbackEntry,
    getMergedDay,
    getBaseDay,
    getStagedEntry,
    // Expose raw staged entries map (needed by StagedChangesPanel & admin dashboard)
    entries,
    stagedCount,
    confirmAll,
    discardAll,
    buildBatchPayload,
    order,
    buildStagedMetaMap,
  };
}

export default useTimesheetStaging;
