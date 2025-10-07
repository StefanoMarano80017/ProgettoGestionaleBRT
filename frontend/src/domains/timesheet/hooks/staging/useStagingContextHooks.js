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

// Backward compatibility alias expected by auto-generated barrel (which referenced a default)
// No default export: barrel script will only generate star export for this file.
