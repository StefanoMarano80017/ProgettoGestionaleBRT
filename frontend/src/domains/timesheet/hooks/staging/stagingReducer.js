import { semanticEqual, semanticHash } from '@domains/timesheet/hooks/utils/semanticTimesheet.js';
import { DEBUG_TS } from '@config/debug';

export const ACTIONS = {
	UPSERT_ENTRY: 'UPSERT_ENTRY',
	DELETE_ENTRY: 'DELETE_ENTRY',
	RESET_ENTRY: 'RESET_ENTRY',
	ROLLBACK_ENTRY: 'ROLLBACK_ENTRY',
	DISCARD_ALL: 'DISCARD_ALL',
	BATCH_CONFIRM_SUCCESS: 'BATCH_CONFIRM_SUCCESS',
	BATCH_CONFIRM_ROLLBACK: 'BATCH_CONFIRM_ROLLBACK'
};

export function cloneRecords(records) {
	if (records === null) return null;
	if (!Array.isArray(records)) return [];
	return records.map(r => (r && typeof r === 'object' ? { ...r } : r));
}

function classifyOperation(baseSnapshot, draft) {
	const baseEmpty = !baseSnapshot || (Array.isArray(baseSnapshot) && baseSnapshot.length === 0);
	const draftEmpty = !draft || (Array.isArray(draft) && draft.length === 0);
	if (baseEmpty && !draftEmpty) return 'create';
	if (!baseEmpty && draftEmpty) return 'delete';
	return 'update';
}

export function stagingReducer(state, action) {
	switch (action.type) {
		case ACTIONS.UPSERT_ENTRY: {
			const { employeeId, dateKey, baseRecords, nextDraft } = action.payload;
			if (!employeeId || !dateKey) return state;
			const key = `${employeeId}|${dateKey}`;
			const entries = state.entries || {};
			const empEntries = entries[employeeId] || {};
			const existing = empEntries[dateKey];

			const baseSnapshot = existing ? existing.base : cloneRecords(baseRecords);
			const draft = cloneRecords(nextDraft);
			const op = classifyOperation(baseSnapshot, draft);

			if (semanticEqual(baseSnapshot, draft)) {
				const noopEntry = existing ? {
					...existing,
					draft: cloneRecords(draft),
					op: 'noop',
					hashes: { ...existing.hashes, draft: existing.hashes.base },
					dirty: false,
				} : null;
				if (!noopEntry) return state;
				const newEmp = { ...empEntries, [dateKey]: noopEntry };
				const newEntries = { ...entries, [employeeId]: newEmp };
				return { ...state, entries: newEntries };
			}

			const nextEntry = {
				employeeId,
				dateKey,
				base: baseSnapshot,
				draft,
				op,
				previousOp: existing ? existing.op : null,
				hashes: { base: baseSnapshot === null ? 'NULL' : semanticHash(baseSnapshot), draft: draft === null ? 'NULL' : semanticHash(draft) },
				dirty: true,
			};
			if (DEBUG_TS) { try { console.debug('[staging] upsert', { key, op, lenBase: baseSnapshot?.length || 0, lenDraft: draft?.length || 0, prevOp: existing?.op }); } catch {} }
			const newEmp = { ...empEntries, [dateKey]: nextEntry };
			const newEntries = { ...entries, [employeeId]: newEmp };
			const inOrder = state.order.includes(key) ? state.order : [...state.order, key];
			return { ...state, entries: newEntries, order: inOrder };
		}
		case ACTIONS.DELETE_ENTRY: {
			const { employeeId, dateKey } = action.payload || {};
			if (!employeeId || !dateKey) return state;
			const entries = state.entries || {};
			const empEntries = entries[employeeId];
			if (!empEntries || !empEntries[dateKey]) return state;
			const newEmp = { ...empEntries };
			delete newEmp[dateKey];
			const newEntries = { ...entries };
			if (Object.keys(newEmp).length === 0) delete newEntries[employeeId]; else newEntries[employeeId] = newEmp;
			const key = `${employeeId}|${dateKey}`;
			return { ...state, entries: newEntries, order: state.order.filter(k => k !== key) };
		}
		case ACTIONS.RESET_ENTRY: {
			const { employeeId, dateKey } = action.payload || {};
			const entries = state.entries || {};
			const empEntries = entries[employeeId];
			const existing = empEntries?.[dateKey];
			if (!existing) return state;
			if (existing.base === null || (Array.isArray(existing.base) && existing.base.length === 0)) {
				const newEmp = { ...empEntries };
				delete newEmp[dateKey];
				const newEntries = { ...entries };
				if (Object.keys(newEmp).length === 0) delete newEntries[employeeId]; else newEntries[employeeId] = newEmp;
				const key = `${employeeId}|${dateKey}`;
				return { ...state, entries: newEntries, order: state.order.filter(k => k !== key) };
			}
			const reverted = {
				...existing,
				draft: cloneRecords(existing.base),
				op: 'update',
				hashes: { ...existing.hashes, draft: existing.hashes.base },
				dirty: false,
			};
			return { ...state, entries: { ...entries, [employeeId]: { ...empEntries, [dateKey]: reverted } } };
		}
		case ACTIONS.ROLLBACK_ENTRY: {
			const { employeeId, dateKey } = action.payload || {};
			const entries = state.entries || {};
			const empEntries = entries[employeeId];
			const existing = empEntries?.[dateKey];
			if (!existing) return state;
			const base = existing.base;
			if (semanticEqual(base, existing.base)) {
				const newEmp = { ...empEntries };
				delete newEmp[dateKey];
				const newEntries = { ...entries };
				if (Object.keys(newEmp).length === 0) delete newEntries[employeeId]; else newEntries[employeeId] = newEmp;
				const key = `${employeeId}|${dateKey}`;
				return { ...state, entries: newEntries, order: state.order.filter(k => k !== key) };
			}
			return state;
		}
		case ACTIONS.DISCARD_ALL:
		case ACTIONS.BATCH_CONFIRM_SUCCESS:
			return { entries: {}, order: [] };
		case ACTIONS.BATCH_CONFIRM_ROLLBACK:
			return action.payload.previousState;
		default:
			return state;
	}
}

export default stagingReducer;
