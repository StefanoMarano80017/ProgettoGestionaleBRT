import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { semanticHash } from '@hooks/Timesheet/utils/semanticTimesheet';

/**
 * useDayEditBuffer
 * Maintains a draft (uncommitted) set of records for a selected employee/day.
 * It derives the base committed+staged merged view then lets the caller edit
 * without re-staging on every tiny change. Caller explicitly calls stageDraft().
 * stagedMap param now is a lightweight overlay map (dateKey -> array|null) built from new staging
 * reducer. Eventually this hook could accept direct mergedDay + baseDay getters.
 */
export default function useDayEditBuffer({ employeeId, dayKey, dataMap, stagedMap }) {
  const stagedForEmp = stagedMap?.[employeeId] || {};
  const committedDay = useMemo(() => (dataMap?.[employeeId] && dataMap[employeeId][dayKey]) || [], [dataMap, employeeId, dayKey]);
  const stagedDay = stagedForEmp[dayKey]; // array | null (delete) | undefined
  const merged = useMemo(() => {
    if (stagedDay === null) return []; // deletion marker
    if (Array.isArray(stagedDay)) return stagedDay;
    return committedDay || [];
  }, [stagedDay, committedDay]);

  const [draft, setDraft] = useState(merged);
  // Reset draft when selection changes OR when merged source changes — but only
  // overwrite the draft if the draft still matches the *previous* merged value.
  // This avoids clobbering user edits while still picking up external updates.
  const lastMergedSigRef = useRef('');
  const lastDraftSigRef = useRef('');

  // Keep draft signature ref in sync when user edits
  useEffect(() => {
    lastDraftSigRef.current = semanticHash(Array.isArray(draft) ? draft : []);
  }, [draft]);

  useEffect(() => {
    const mergedSig = semanticHash(Array.isArray(merged) ? merged : []);
    const prevMergedSig = lastMergedSigRef.current;
    if (prevMergedSig === mergedSig) return; // no structural merged change

    const draftSig = lastDraftSigRef.current || semanticHash(Array.isArray(draft) ? draft : []);
    // If user hasn't diverged from previous merged snapshot, adopt new merged
    if (!prevMergedSig || draftSig === prevMergedSig) {
      setDraft(merged);
      // update draft signature since draft now equals merged
      lastDraftSigRef.current = mergedSig;
    }
    lastMergedSigRef.current = mergedSig;
  }, [merged, draft, employeeId, dayKey]);

  const dirty = useMemo(() => {
    if (draft === merged) return false;
    if ((draft?.length || 0) !== (merged?.length || 0)) return true;
    for (let i=0;i<draft.length;i++) {
      const a = draft[i]||{}; const b = merged[i]||{};
      if (String(a.commessa||'') !== String(b.commessa||'') || Number(a.ore||0) !== Number(b.ore||0) || String(a.descrizione||'') !== String(b.descrizione||'')) return true;
    }
    return false;
  }, [draft, merged]);

  const resetDraft = useCallback(() => setDraft(merged), [merged]);

  return { draft, setDraft, dirty, resetDraft, merged };
}
