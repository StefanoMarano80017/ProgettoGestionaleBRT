// Canonical timesheet hooks barrel (progressively replacing legacy './Timesheet')
export * from './calendar';
export * from './dayEntry';
export * from './staging';
// Provider & context (canonical path)
export { TimesheetProvider, useTimesheetContext } from './TimesheetProvider.jsx';
export { useOptionalTimesheetContext } from './TimesheetProvider.jsx';
export { default as useDayEditor } from './useDayEditor.js';
export { default as useEmployeeTimesheetLoader } from './useEmployeeTimesheetLoader.js';
export { default as useStableMergedDataMap } from './useStableMergedDataMap.js';
export { default as useMonthCompleteness } from './useMonthCompleteness.js';
export { default as useTimesheetStaging, useTimesheetStaging as useTimesheetStagingHook } from './staging/useTimesheetStaging.js';
export { default as useTimesheetApi } from './useTimesheetApi.js';
export { default as useReferenceData } from './useReferenceData.js';
export { default as useTimesheetFilters } from './useTimesheetFilters.js';
export { default as useSegnalazione } from './useSegnalazione.js';
export { default as useDayAndMonthDetails } from './useDayAndMonthDetails.js';
export { default as useEmployeeMonthGridRows } from './useEmployeeMonthGridRows.js';
// TODO: migrate remaining legacy hooks (selection, referenceData, filters, api, etc.) then remove below re-export.
// Removed broad legacy re-export to avoid leaking deprecated modules.
// If additional legacy symbols are still required, export them explicitly above.
