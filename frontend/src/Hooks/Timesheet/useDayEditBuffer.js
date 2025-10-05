import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

/**
 * useDayEditBuffer
 * Maintains a draft (uncommitted) set of records for a selected employee/day.
 * It derives the base committed+staged merged view then lets the caller edit
 * without re-staging on every tiny change. Caller explicitly calls stageDraft().
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
  // Reset draft when changing selection OR when staged/committed source changes (if user hasn't diverged?)
  const lastMergedSigRef = useRef('');
  useEffect(() => {
    // Compute a lightweight signature of merged
    const sig = Array.isArray(merged)
      ? `${merged.length}|${merged.reduce((t,r)=>t+Number(r?.ore||0),0)}|${merged.slice(0,2).map(r=>r?.commessa||'').join(',')}`
      : '0|0|';
    // If draft already semantically equals merged, skip resetting to keep stable ref
    let equal = false;
    if (draft === merged) equal = true; else if (Array.isArray(draft) && Array.isArray(merged) && draft.length === merged.length) {
      equal = true;
      for (let i=0;i<draft.length;i++) {
        const a=draft[i]||{}, b=merged[i]||{};
        if ((a.commessa||'') !== (b.commessa||'') || Number(a.ore||0)!==Number(b.ore||0) || (a.descrizione||'') !== (b.descrizione||'')) { equal=false; break; }
      }
    }
    if (equal && lastMergedSigRef.current === sig) return; // nothing changed
    lastMergedSigRef.current = sig;
    if (!equal) setDraft(merged);
  }, [merged, employeeId, dayKey, draft]);

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
