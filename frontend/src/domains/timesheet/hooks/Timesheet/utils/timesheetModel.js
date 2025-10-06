// timesheetModel.js
// Day-level diff & summary helpers for the timesheet staging refactor.
// Provides a coarse summary (one chip per day) instead of per-record chips.
// Diff object shape:
//   { type, inserts, updates, deletes, original, staged, changes[] }
//   changes[] entries: { type: 'insert'|'update'|'delete', before, after }
// Classification:
//   day-delete  -> whole day removed (staged value null)
//   new-day     -> brand new day (only inserts)
//   insert-only / update-only / delete-only / mixed / no-op

import { semanticEqualArray } from '@domains/timesheet/hooks/utils/semanticTimesheet.js';

const recKey = (r, idx) => (r && r._id) ? r._id : `idx:${idx}`;

export function computeDayDiff(original = [], stagedVal) {
  if (stagedVal === null) {
    return {
      type: 'day-delete',
      inserts: 0,
      updates: 0,
      deletes: original.length,
      original,
      staged: null,
      changes: original.map(r => ({ type: 'delete', before: r, after: null }))
    };
  }
  const staged = Array.isArray(stagedVal) ? stagedVal : [];
  if ((!original || original.length === 0) && staged.length > 0) {
    return {
      type: 'new-day',
      inserts: staged.length,
      updates: 0,
      deletes: 0,
      original: [],
      staged,
      changes: staged.map(r => ({ type: 'insert', before: null, after: r }))
    };
  }
  const oMap = new Map();
  original.forEach((r, i) => oMap.set(recKey(r, i), { rec: r, i }));
  const sMap = new Map();
  staged.forEach((r, i) => sMap.set(recKey(r, i), { rec: r, i }));
  const changes = [];
  let inserts = 0, updates = 0, deletes = 0;
  oMap.forEach((oval, id) => {
    if (!sMap.has(id)) {
      deletes++;
      changes.push({ type: 'delete', before: oval.rec, after: null });
    } else {
      const sval = sMap.get(id);
      if (!semanticEqualArray([oval.rec], [sval.rec])) { // record-level semantic compare
        updates++;
        changes.push({ type: 'update', before: oval.rec, after: sval.rec });
      }
    }
  });
  sMap.forEach((sval, id) => {
    if (!oMap.has(id)) {
      inserts++;
      changes.push({ type: 'insert', before: null, after: sval.rec });
    }
  });
  let type;
  if (deletes && !inserts && !updates) type = 'delete-only';
  else if (inserts && !deletes && !updates) type = 'insert-only';
  else if (!inserts && !deletes && updates) type = 'update-only';
  else if (!inserts && !deletes && !updates) type = 'no-op';
  else type = 'mixed';
  return { type, inserts, updates, deletes, original, staged, changes };
}

export function summarizeDayDiff(diff) {
  if (!diff) return '';
  if (diff.type === 'day-delete') return 'Giorno eliminato';
  if (diff.type === 'new-day') return `${diff.inserts} nuove voci`;
  if (diff.type === 'no-op') return 'Nessuna modifica';
  const parts = [];
  if (diff.inserts) parts.push(`+${diff.inserts}`);
  if (diff.updates) parts.push(`✎${diff.updates}`);
  if (diff.deletes) parts.push(`−${diff.deletes}`);
  return parts.join(' ');
}
