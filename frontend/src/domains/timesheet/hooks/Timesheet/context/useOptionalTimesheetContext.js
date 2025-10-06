import { useContext } from 'react';
import TimesheetContext from './_TimesheetContext.js';

// Safe optional hook returning context value or null when provider absent.
export function useOptionalTimesheetContext() {
  try {
    return useContext(TimesheetContext);
  } catch {
    return null;
  }
}

export default useOptionalTimesheetContext;