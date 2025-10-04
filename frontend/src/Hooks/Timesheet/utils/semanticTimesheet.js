// semanticTimesheet.js
// Shared utilities for semantic comparison & hashing of day records to avoid duplication.
// A "record" is expected to have at least: commessa, ore, descrizione.

export function normalizeRecord(r = {}) {
  return {
    commessa: String(r.commessa || ''),
    ore: Number(r.ore || 0),
    descrizione: String(r.descrizione || ''),
  };
}

export function semanticEqualArray(a, b) {
  if (a === b) return true; // same ref or both undefined
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] || {}; const y = b[i] || {};
    if (String(x.commessa||'') !== String(y.commessa||'') || Number(x.ore||0) !== Number(y.ore||0) || String(x.descrizione||'') !== String(y.descrizione||'')) {
      return false;
    }
  }
  return true;
}

// Light hash for quick short-circuit. Not cryptographically strong; just a content signature.
// Format: `${length}|${totalHours}|${first3Commesse}|${last3Commesse}` to keep it short & resist minor permutations.
export function semanticHash(records) {
  if (!Array.isArray(records) || records.length === 0) return '0|0||';
  let total = 0;
  const commesse = [];
  for (let i = 0; i < records.length; i++) {
    const r = records[i] || {};
    total += Number(r.ore || 0);
    commesse.push(String(r.commessa || ''));
  }
  const first = commesse.slice(0, 3).join(',');
  const last = commesse.slice(-3).join(',');
  return `${records.length}|${total}|${first}|${last}`;
}

export function semanticEqual(a, b) {
  if (a === null || b === null) return a === b;
  return semanticEqualArray(a, b);
}
