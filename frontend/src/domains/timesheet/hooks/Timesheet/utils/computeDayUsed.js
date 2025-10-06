/**
 * computeDayUsed (moved)
 *
 * Shared helper: Returns the sum of hours for all records except the one currently being edited.
 * This was moved from Components/Calendar into Hooks/Timesheet/utils to make it available to
 * hooks and components under the Timesheet domain via a canonical import path.
 *
 * @param {Array} all - array of record objects
 * @param {Object|null} current - the record currently being edited (may be null)
 * @param {string} mode - 'add' or 'edit'
 * @param {number|null} editIndex - when editing, the index of the record being edited
 * @returns {number} total hours excluding the current entry
 */
export function computeDayUsed(all = [], current = null, mode = 'add', editIndex = null) {
  return (all || []).reduce((acc, r, idx) => {
    // If we're editing and this is the same index, exclude it
    if (mode === 'edit' && idx === editIndex) return acc;
    // If objects are the same reference, exclude
    if (current && r === current) return acc;
    if (current && r.id && current.id && r.id === current.id) return acc;
    // fallback: compare key fields
    if (current && !r.id && !current.id && r.commessa === current.commessa && Number(r.ore) === Number(current.ore) && (r.descrizione || '') === (current.descrizione || '')) return acc;
    return acc + (Number(r.ore) || 0);
  }, 0);
}

export default computeDayUsed;
