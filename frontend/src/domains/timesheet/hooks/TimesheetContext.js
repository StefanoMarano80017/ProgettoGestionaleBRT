import React, { createContext, useContext } from 'react';

export const TimesheetContext = createContext(null);

export function useTimesheetContext() {
  const ctx = useContext(TimesheetContext);
  if (!ctx) throw new Error('useTimesheetContext must be used within <TimesheetProvider>');
  return ctx;
}

export function useOptionalTimesheetContext() {
  try {
    return useContext(TimesheetContext);
  } catch {
    return null;
  }
}

export function useTimesheetSelector(selector) {
  const ctx = useTimesheetContext();
  return React.useMemo(() => selector(ctx), [ctx, selector]);
}
