import { useEffect, useRef } from 'react';
import { semanticEqual, semanticHash, normalizeRecord } from '@hooks/Timesheet/utils/semanticTimesheet';
import { useTimesheetContext } from './context/TimesheetProvider.jsx';
import { useTimesheetStaging } from './staging/useTimesheetStaging.js';

/**
 * Auto stages a single selected day for an employee with debounce & semantic guards.
 * Options:
 *  - toast callbacks optional (onDelete, onError)
 */
export default function useAutoStageDay({ employeeId, selectedDay, draft, onDelete, onError }) {
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  const { dataMap } = ctx;
  const debounceRef = useRef();
  const lastHashRef = useRef({});

  useEffect(() => {
    if (!employeeId || !selectedDay) {
      console.debug && console.debug('[autoStage] skipped - missing employeeId or selectedDay', { employeeId, selectedDay });
      return;
    }
    console.debug && console.debug('[autoStage] run', { employeeId, selectedDay, draftSample: Array.isArray(draft) ? draft.slice(0,3) : draft });
    const baseArr = staging.getBaseDay(employeeId, selectedDay) || [];
    const stagedEntry = staging.getStagedEntry(employeeId, selectedDay);
    const stagedArr = stagedEntry ? (stagedEntry.draft === null ? null : stagedEntry.draft) : undefined;
    const draftArr = Array.isArray(draft) ? draft : [];

    // verbose debug
    try {
      const norm = (arr) => (Array.isArray(arr) ? arr.slice(0,5).map(r => normalizeRecord(r)) : arr);
      const baseSample = norm(baseArr);
      const draftSample = norm(draftArr);
      const stagedSample = stagedArr === null ? null : (Array.isArray(stagedArr) ? norm(stagedArr) : stagedArr);
      const baseHash = semanticHash(baseArr);
      const draftHash = semanticHash(draftArr);
      const stagedHash = stagedEntry ? (stagedArr === null ? 'NULL' : semanticHash(stagedArr)) : undefined;
      const eqBaseDraft = semanticEqual(baseArr, draftArr);
      const eqStagedDraft = Array.isArray(stagedArr) ? semanticEqual(stagedArr, draftArr) : false;
      console.debug && console.debug('[autoStage] debug', { employeeId, selectedDay, baseLen: baseArr.length, draftLen: draftArr.length, stagedType: stagedEntry ? (stagedEntry.draft === null ? 'null' : 'array') : 'undefined', baseSample, draftSample, stagedSample, baseHash, draftHash, stagedHash, eqBaseDraft, eqStagedDraft });
    } catch (err) { console.warn('[autoStage] debug failed', err); }

    const schedule = (fn) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(fn, 500); };

    const draftEmpty = draftArr.length === 0;
    const baseEmpty = baseArr.length === 0;

    if (draftEmpty) {
      if (!baseEmpty) {
        if (stagedEntry && stagedEntry.draft === null) return; // already deletion
        schedule(() => { try { staging.stageDraft(employeeId, selectedDay, []); staging.stageDraft(employeeId, selectedDay, null); onDelete && onDelete(selectedDay); } catch { onError && onError('delete'); } });
      } else if (stagedEntry) {
        schedule(() => { try { staging.rollbackEntry(employeeId, selectedDay); } catch {/* ignore */} });
      }
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }

    if (Array.isArray(stagedArr) && semanticEqual(stagedArr, draftArr)) return; // already staged
    if (stagedArr === undefined && semanticEqual(baseArr, draftArr)) return; // unchanged vs base

    const hash = draftArr.map(r => `${r._id||''}:${r.commessa||''}:${Number(r.ore||0)}:${r.descrizione||''}`).join('|');
    if (lastHashRef.current[selectedDay] === hash) return; // already scheduled

    schedule(() => { try { staging.stageDraft(employeeId, selectedDay, draftArr); lastHashRef.current[selectedDay] = hash; } catch (e) { console.error('[autoStage] stageDraft failed', e); onError && onError('replace'); } });
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [employeeId, selectedDay, draft, dataMap, staging, onDelete, onError]);
}
