// Deprecated stub. Original implementation removed; use useTimesheetEntryEditor instead.
export function useDayEntryEditing() {
  if (import.meta?.env?.MODE !== 'production') {
    console.warn('useDayEntryEditing is deprecated. Use useTimesheetEntryEditor.');
  }
  return { dialogOpen: false, mode: 'add', idx: null, form: {}, error: 'DEPRECATED', canAddMore: false, maxOre: 0, setForm: () => {}, openAdd: () => {}, openEdit: () => {}, close: () => {}, save: () => {} };
}
