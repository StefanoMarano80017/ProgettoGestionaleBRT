// Canonical location: domains/timesheet/hooks/utils/computeDayUsed.js
export function computeDayUsed(all = [], current = null, mode = 'add', editIndex = null) {
  return (all || []).reduce((acc, r, idx) => {
    if (mode === 'edit' && idx === editIndex) return acc;
    if (current && r === current) return acc;
    if (current && r.id && current.id && r.id === current.id) return acc;
    if (current && !r.id && !current.id && r.commessa === current.commessa && Number(r.ore) === Number(current.ore) && (r.descrizione || '') === (current.descrizione || '')) return acc;
    return acc + (Number(r.ore) || 0);
  }, 0);
}
export default computeDayUsed;
