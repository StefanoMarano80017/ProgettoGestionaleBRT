// Canonical TimesheetProvider relocated from hooks/Timesheet/context.
// This wrapper simply re-exports the existing implementation so that
// consumers can import from '@domains/timesheet/hooks/TimesheetProvider'.
// After all legacy paths are updated we can inline / simplify further.
export { TimesheetProvider, useTimesheetContext } from './Timesheet/context/TimesheetProvider.jsx';
export { useOptionalTimesheetContext } from './Timesheet/context/useOptionalTimesheetContext.js';
