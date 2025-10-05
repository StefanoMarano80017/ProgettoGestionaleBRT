import { useEffect, useRef } from 'react';
import { semanticEqual } from '@hooks/Timesheet/utils/semanticTimesheet';
import { useTimesheetContext } from '@/Hooks/Timesheet';

/**
 * Auto stages a single selected day for an employee with debounce & semantic guards.
 * Options:
 *  - toast callbacks optional (onDelete, onError)
 */
export default function useAutoStageDay({ employeeId, selectedDay, draft, onDelete, onError }) {
  const ctx = useTimesheetContext();
  const { dataMap, stagedMap, stageDeleteDay, discardDay, stageReplace } = ctx;
  const debounceRef = useRef();
  const lastHashRef = useRef({});

  useEffect(() => {
    if (!employeeId || !selectedDay) return;
  const baseArr = dataMap?.[employeeId]?.[selectedDay] || [];
  const stagedVal = stagedMap?.[employeeId]?.[selectedDay];
    const stagedArr = stagedVal === null ? null : (Array.isArray(stagedVal) ? stagedVal : undefined);
    const draftArr = Array.isArray(draft) ? draft : [];

    const schedule = (fn) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fn, 500);
    };

    const draftEmpty = draftArr.length === 0;
    const baseEmpty = baseArr.length === 0;

    if (draftEmpty) {
      if (!baseEmpty) {
        if (stagedVal === null) return; // already deletion
  schedule(() => { try { stageDeleteDay(employeeId, selectedDay); onDelete && onDelete(selectedDay); } catch { onError && onError('delete'); } });
      } else if (stagedVal !== undefined) {
  schedule(() => { try { discardDay(employeeId, selectedDay); } catch { /* ignore */ } });
      }
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }

    if (Array.isArray(stagedArr) && semanticEqual(stagedArr, draftArr)) return; // already staged version
    if (stagedArr === undefined && semanticEqual(baseArr, draftArr)) return; // unchanged vs base

    const hash = draftArr.map(r => `${r._id||''}:${r.commessa||''}:${Number(r.ore||0)}:${r.descrizione||''}`).join('|');
    if (lastHashRef.current[selectedDay] === hash) return; // already scheduled

    schedule(() => {
      try {
        stageReplace(employeeId, selectedDay, draftArr);
        lastHashRef.current[selectedDay] = hash;
  } catch { onError && onError('replace'); }
    });

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [employeeId, selectedDay, draft, dataMap, stagedMap, onDelete, onError, stageDeleteDay, discardDay, stageReplace]);
}
