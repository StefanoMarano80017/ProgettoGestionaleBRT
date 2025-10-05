import { useContext } from 'react';
import TimesheetStagingContext from './TimesheetStagingContext.jsx';

export function useTimesheetStagingContext() {
  const ctx = useContext(TimesheetStagingContext);
  if (!ctx) throw new Error('useTimesheetStagingContext must be used within <TimesheetStagingProvider>');
  return ctx;
}

export function useOptionalTimesheetStaging() {
  return useContext(TimesheetStagingContext);
}
