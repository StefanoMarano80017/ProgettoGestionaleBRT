import React, { createContext, useReducer, useRef, useCallback, useMemo } from 'react';
import { ACTIONS, stagingReducer, cloneRecords } from './stagingReducer.js';
import { useOptionalTimesheetContext } from '@domains/timesheet/hooks/TimesheetProvider.jsx';

const TimesheetStagingContext = createContext(null);

export function TimesheetStagingProvider({ children, debug = false }) {
	const [state, dispatch] = useReducer(stagingReducer, { entries: {}, order: [] });
	const debugRef = useRef(debug);
	const tsCtx = useOptionalTimesheetContext();

	const upsert = useCallback((employeeId, dateKey, baseRecords, draftRecords) => {
		dispatch({ type: ACTIONS.UPSERT_ENTRY, payload: { employeeId, dateKey, baseRecords, nextDraft: draftRecords } });
	}, []);
	const remove = useCallback((employeeId, dateKey) => dispatch({ type: ACTIONS.DELETE_ENTRY, payload: { employeeId, dateKey } }), []);
	const reset = useCallback((employeeId, dateKey) => dispatch({ type: ACTIONS.RESET_ENTRY, payload: { employeeId, dateKey } }), []);
	const rollback = useCallback((employeeId, dateKey) => dispatch({ type: ACTIONS.ROLLBACK_ENTRY, payload: { employeeId, dateKey } }), []);
	const discardAll = useCallback(() => dispatch({ type: ACTIONS.DISCARD_ALL }), []);

	const buildBatchPayload = useCallback(() => {
		const payload = [];
		Object.entries(state.entries).forEach(([empId, dates]) => {
			const updates = Object.values(dates)
				.filter(entry => entry.op && entry.op !== 'noop')
				.map(entry => ({
					dateKey: entry.dateKey,
					records: entry.draft === null ? [] : cloneRecords(entry.draft)
				}));
			if (updates.length) payload.push({ employeeId: empId, updates });
		});
		return payload;
	}, [state.entries]);

	const confirmAll = useCallback(async (applyFn) => {
		if (Object.keys(state.entries).length === 0) return;
		const previousState = state; // snapshot for rollback
		const payload = buildBatchPayload();

		try {
			// First, save to backend
			if (typeof applyFn === 'function') {
				await applyFn(payload);
			}
			
			// Then update the local data to match what was saved
			try {
				if (tsCtx && tsCtx.setEmployeeData) {
					payload.forEach(batch => {
						const dayMap = {};
						batch.updates.forEach(u => { dayMap[u.dateKey] = u.records; });
						tsCtx.setEmployeeData(batch.employeeId, dayMap);
					});
				}
			} catch (e) {
				console.warn('[staging] failed to update base data after save', e);
			}

			// Wait a moment for the dataMap update to propagate, then clear staging
			await new Promise(resolve => setTimeout(resolve, 10));
			dispatch({ type: ACTIONS.BATCH_CONFIRM_SUCCESS });
		} catch (e) {
			console.error('[staging] confirmAll failed, rolling back', e);
			dispatch({ type: ACTIONS.BATCH_CONFIRM_ROLLBACK, payload: { previousState } });
			// Rollback optimistic merge (reload per-employee snapshots)
			try {
				// simplistic rollback: re-load timesheet data if load function exists
				tsCtx?.load?.();
			} catch { /* ignore */ }
			throw e;
		}
	}, [state, buildBatchPayload, tsCtx]);

	const value = useMemo(() => ({
		state,
		entries: state.entries,
		order: state.order,
		upsert,
		remove,
		reset,
		rollback,
		discardAll,
		confirmAll,
		buildBatchPayload,
	}), [state, upsert, remove, reset, rollback, discardAll, confirmAll, buildBatchPayload]);

	if (debugRef.current) console.debug('[staging] provider render', state);

	return (
		<TimesheetStagingContext.Provider value={value}>
			{children}
		</TimesheetStagingContext.Provider>
	);
}

export default TimesheetStagingContext;
