import { useCallback, useRef, useState } from 'react';
import { useTimesheetContext } from './context/TimesheetProvider.jsx';
import { useTimesheetStaging } from './staging/useTimesheetStaging.js';
import { batchUpdateEmployeeDays } from './utils/updateEmployeeDay.js';

/**
 * useBatchTimesheetCommit
 * --------------------------------------------------------------
 * High-level batch confirmation hook encapsulating the optimistic apply +
 * remote persistence + rollback cycle.
 *
 * Flow:
 *  1. Build payload from staging (grouped by employee, day).
 *  2. Optimistically patch context dataMap (so UI reflects confirmed state immediately).
 *  3. Invoke staging.confirmAll() with optional remoteApplyFn.
 *     - Provider handles clearing staging or rolling back on errors.
 *  4. If remote fails: restore previous dataMap and expose error state.
 *
 * Returned API:
 *  - commit({ flatItems }) : Promise<{ ok|empty|skipped|error, meta? }>
 *  - status: 'idle' | 'running' | 'success' | 'error'
 *  - isRunning: boolean convenience flag
 *  - lastError: captured error object (if any)
 *
 * Meta (buildSnapshotMeta) categorizes changes for toast / summary counters.
 */
export function useBatchTimesheetCommit({ remoteApplyFn, onSuccess, onError } = {}) {
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  const [status, setStatus] = useState('idle'); // idle | running | success | error
  const lastErrorRef = useRef(null);

  const buildSnapshotMeta = useCallback((flatItems) => {
    let ins=0, upd=0, del=0;
    flatItems.forEach(it => { const t = it.diff?.type; if (t==='day-delete'||t==='delete-only') del++; else if (t==='new-day'||t==='insert-only') ins++; else upd++; });
    return { total: flatItems.length, inserted: ins, updated: upd, deleted: del };
  }, []);

  const commit = useCallback(async ({ flatItems }) => {
    if (status === 'running') return { skipped: true };
    const payload = staging.buildBatchPayload();
    if (!payload.length) return { empty: true };
    const prevDataMap = ctx.dataMap;
    setStatus('running');
    try {
      // Optimistic apply to base data
      ctx.setDataMap(prev => {
        const updates = [];
        payload.forEach(p => p.updates.forEach(u => updates.push({ employeeId: p.employeeId, dateKey: u.dateKey, records: u.records })));
        return batchUpdateEmployeeDays({ prev, updates });
      });
      // Confirm staging (handles internal rollback if remote fails)
      await staging.confirmAll(async (pl) => {
        if (typeof remoteApplyFn === 'function') await remoteApplyFn(pl);
      });
      const meta = buildSnapshotMeta(flatItems||[]);
      setStatus('success');
      onSuccess && onSuccess(meta);
      return { ok: true, meta };
    } catch (e) {
      // restore base data
      ctx.setDataMap(prevDataMap);
      lastErrorRef.current = e;
      setStatus('error');
      onError && onError(e);
      return { error: e };
    } finally {
      // allow further commits (success or error both settle)
      if (status === 'running') {
        setTimeout(() => setStatus(s => (s==='running' ? 'idle' : s)), 10);
      }
    }
  }, [status, staging, ctx, remoteApplyFn, onSuccess, onError, buildSnapshotMeta]);

  return { commit, status, isRunning: status === 'running', lastError: lastErrorRef.current };
}

export default useBatchTimesheetCommit;