/**
 * Normalize various staged props into one of: 'create' | 'update' | 'delete' | null.
 * Accepts the DayEntryTile props subset to avoid spreading logic in the component.
 */
export function normalizeStagedOp({ stagedOp, stagedStatus, stagingEntry }) {
  if (stagedOp === 'create' || stagedOp === 'update' || stagedOp === 'delete') return stagedOp;

  const se = stagingEntry?.op;
  if (se === 'create' || se === 'update' || se === 'delete') return se;

  if (stagedStatus === 'staged-insert') return 'create';
  if (stagedStatus === 'staged-update') return 'update';
  if (stagedStatus === 'staged-delete') return 'delete';

  return null;
}