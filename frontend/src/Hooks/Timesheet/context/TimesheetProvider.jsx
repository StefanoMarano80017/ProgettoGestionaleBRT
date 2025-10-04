import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react';
import { semanticEqual, semanticHash } from '@hooks/Timesheet/utils/semanticTimesheet';
import { useCalendarMonthYear } from '@hooks/Timesheet/calendar/useCalendarMonthYear';
import { useTimesheetData } from '@hooks/Timesheet/data/useTimesheetData';
import updateEmployeeDay, { batchUpdateEmployeeDays } from '@hooks/Timesheet/utils/updateEmployeeDay';

const TimesheetContext = createContext(null);

export function TimesheetProvider({
  children,
  scope = 'all',
  employeeIds = [],
  autoLoad = true,
  initialDate = new Date(),
}) {
  const { currentMonth, currentYear, setMonthYear, shift } = useCalendarMonthYear(initialDate);
  const { employees, dataMap, setDataMap, load, loading, error, companies } = useTimesheetData({ scope, employeeIds, month: currentMonth, year: currentYear, autoLoad });
  // Staging buffer for batched edits (not yet committed to backend)
  const [stagedMap, setStagedMap] = useState({});

  // Stage a single day update (visible immediately in UI by merging stagedMap over dataMap)
  const ensureIds = (arr) => {
    if (!Array.isArray(arr)) return arr;
    // Fast path: if every record already has _id, reuse original array reference
    let allHaveId = true;
    for (let i = 0; i < arr.length; i++) {
      const r = arr[i];
      if (r && typeof r === 'object' && !r._id) { allHaveId = false; break; }
    }
    if (allHaveId) return arr;
    return arr.map(r => (r && typeof r === 'object'
      ? { _id: r._id || crypto.randomUUID?.() || Math.random().toString(36).slice(2), ...r }
      : r));
  };

  const stageHashesRef = useRef({}); // { employeeId: { dateKey: hash } }
  const stageUpdate = useCallback((employeeId, dateKey, records) => {
    if (!employeeId || !dateKey) return;
    setStagedMap(prev => {
      const prevEmp = prev?.[employeeId] || {};
      const prevVal = prevEmp[dateKey];
      const baseRecords = (dataMap?.[employeeId]?.[dateKey]) || [];
      const nextVal = records === null ? null : (Array.isArray(records) ? ensureIds(records) : []);

      // Hashes for quick short-circuit (null represented distinctly)
      const prevHash = prevVal === null ? 'NULL' : semanticHash(prevVal);
      const nextHash = nextVal === null ? 'NULL' : semanticHash(nextVal);
      const baseHash = semanticHash(baseRecords);

      if (prevHash === nextHash && semanticEqual(prevVal, nextVal)) return prev; // identical to current staged

      // If next equals base -> clear staged entry
      if ((nextVal === null && baseRecords.length === 0) || (nextVal !== null && semanticEqual(nextVal, baseRecords))) {
        // If there was no previous staged value we can skip creating any new object -> prevents add/remove churn loops
        if (prevVal === undefined) {
          return prev; // no change
        }
        const next = { ...(prev || {}) };
        const empCopy = { ...(next[employeeId] || {}) };
        delete empCopy[dateKey];
        if (Object.keys(empCopy).length === 0) delete next[employeeId]; else next[employeeId] = empCopy;
        // update hash cache
        if (stageHashesRef.current[employeeId]) delete stageHashesRef.current[employeeId][dateKey];
        return next;
      }

      // Normal path
      const next = { ...(prev || {}) };
      const newEmp = { ...(next[employeeId] || {}) };
      newEmp[dateKey] = nextVal;
      next[employeeId] = newEmp;
      if (!stageHashesRef.current[employeeId]) stageHashesRef.current[employeeId] = {};
      stageHashesRef.current[employeeId][dateKey] = nextHash;
      return next;
    });
  }, [dataMap]);

  // Discard staged edits (optionally for a specific employee or full)
  const discardStaged = useCallback((opts = {}) => {
    const { employeeId } = opts || {};
    if (employeeId) {
      setStagedMap(prev => { const next = { ...(prev || {}) }; delete next[employeeId]; return next; });
    } else {
      setStagedMap({});
    }
  }, []);

  // Commit staged edits: apply to dataMap via setDataMap (batch) and clear staged buffer
  const commitStaged = useCallback(async (applyFn) => {
    // Build payload from stagedMap
    const payload = Object.entries(stagedMap || {}).map(([empId, days]) => ({
      employeeId: empId,
      updates: Object.entries(days || {}).map(([dk, recs]) => ({ dateKey: dk, records: Array.isArray(recs) ? [...recs] : null }))
    }));

    // Apply to local dataMap first (batch)
    setDataMap(prev => {
      const updatesFlat = [];
      payload.forEach(p => {
        p.updates.forEach(u => updatesFlat.push({ employeeId: p.employeeId, dateKey: u.dateKey, records: u.records }));
      });
      return batchUpdateEmployeeDays({ prev, updates: updatesFlat });
    });

    try {
      if (typeof applyFn === 'function') {
        // allow applyFn to return a promise; await it and clear staged only on success
        await applyFn(payload);
      } else {
        // default: persist into the local override store so reloads see edits
        payload.forEach(p => {
          p.updates.forEach(u => {
            try {
              // updateEmployeeDay writes window.__tsOverrides and dispatches events
              updateEmployeeDay({ prev: null, employeeId: p.employeeId, dateKey: u.dateKey, records: Array.isArray(u.records) ? u.records : [] });
            } catch (e) { /* ignore per-update errors */ }
          });
        });
      }
      // only clear staged map after successful apply (or default local apply)
      setStagedMap({});
    } catch (err) {
      // preserve stagedMap so user can retry; surface error to caller
      // eslint-disable-next-line no-console
      console.error('[timesheet] commitStaged failed', err);
      throw err;
    }
  }, [stagedMap, setDataMap]);

  // Commit staged edits for a single employeeId only
  const commitStagedFor = useCallback(async (employeeId, applyFn) => {
    if (!employeeId) return;
    const days = (stagedMap || {})[employeeId] || {};
    const updates = Object.entries(days).map(([dk, recs]) => ({ employeeId, dateKey: dk, records: Array.isArray(recs) ? [...recs] : null }));

    // apply to dataMap
    setDataMap(prev => batchUpdateEmployeeDays({ prev, updates }));

    try {
      if (typeof applyFn === 'function') {
        const payload = { employeeId, updates: updates.map(u => ({ dateKey: u.dateKey, records: Array.isArray(u.records) ? [...u.records] : [] })) };
        await applyFn(payload);
      } else {
        // default: persist to override store
        updates.forEach(u => {
          try {
            updateEmployeeDay({ prev: null, employeeId: u.employeeId, dateKey: u.dateKey, records: Array.isArray(u.records) ? u.records : [] });
          } catch (e) { /* ignore */ }
        });
      }
      // only remove staged entries after success
      setStagedMap(prev => { const next = { ...(prev || {}) }; delete next[employeeId]; return next; });
    } catch (err) {
      // preserve staged and bubble up
      // eslint-disable-next-line no-console
      console.error('[timesheet] commitStagedFor failed', err);
      throw err;
    }
  }, [stagedMap, setDataMap]);

  // Filters & selection centralizzati
  const [filters, setFilters] = useState({ search: '', azienda: '', commessa: '' });
  const [selection, setSelection] = useState({ employeeId: null, date: null });

  const updateFilter = useCallback((k, v) => setFilters(f => ({ ...f, [k]: v })), []);
  const setEmployeeDate = useCallback((employeeId, date) => setSelection({ employeeId, date }), []);

  const setEmployeeData = useCallback((employeeId, dayMap) => {
    setDataMap(prev => ({
      ...(prev||{}),
      [employeeId]: {
        ...(prev?.[employeeId]||{}),
        ...(Object.entries(dayMap||{}).reduce((acc,[dk, recs]) => { acc[dk] = Array.isArray(recs) ? recs.map(r => (r && typeof r === 'object' ? { _id: r._id || crypto.randomUUID?.() || Math.random().toString(36).slice(2), ...r } : r)) : recs; return acc; }, {}))
      }
    }));
  }, [setDataMap]);

  const value = useMemo(() => ({
    month: currentMonth,
    year: currentYear,
    setMonthYear,
    shiftMonth: shift,
    dataMap,
    setDataMap,
    setEmployeeData,
    stagedMap,
    stageUpdate,
    commitStaged,
  commitStagedFor,
    discardStaged,
    employees,
    load,
    loading,
    error,
    companies,
    filters,
    setFilters,
    updateFilter,
    selection,
    setSelection,
    setEmployeeDate,
    scope,
  }), [currentMonth, currentYear, setMonthYear, shift, dataMap, stagedMap, employees, load, loading, error, companies, filters, selection, scope, setEmployeeData, stageUpdate, commitStaged, commitStagedFor, discardStaged]);

  return <TimesheetContext.Provider value={value}>{children}</TimesheetContext.Provider>;
}

export function useTimesheetContext() {
  const ctx = useContext(TimesheetContext);
  if (!ctx) throw new Error('useTimesheetContext must be used within <TimesheetProvider>');
  return ctx;
}

// safe optional hook that returns context value or null if provider is not present
export function useOptionalTimesheetContext() {
  try {
    return useContext(TimesheetContext);
  } catch (e) {
    return null;
  }
}
