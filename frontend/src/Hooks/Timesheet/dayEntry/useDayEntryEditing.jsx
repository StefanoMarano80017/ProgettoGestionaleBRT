// Deprecated stub. Original implementation removed; use useTimesheetEntryEditor instead.
export function useDayEntryEditing() {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('useDayEntryEditing is deprecated. Use useTimesheetEntryEditor.');
  }
  return { dialogOpen: false, mode: 'add', idx: null, form: {}, error: 'DEPRECATED', canAddMore: false, maxOre: 0, setForm: () => {}, openAdd: () => {}, openEdit: () => {}, close: () => {}, save: () => {} };
}
