import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { TimesheetProvider, useTimesheetContext } from '../../hooks/index.js';

function wrapper({ children }) {
  return (
    <TimesheetProvider scope="all" autoLoad>
      {children}
    </TimesheetProvider>
  );
}

describe('PM Campo data availability', () => {
  it('loads operaio timesheet entries', async () => {
    const { result } = renderHook(() => useTimesheetContext(), { wrapper });

    await waitFor(() => {
      const dataMap = result.current.dataMap || {};
      expect(Object.keys(dataMap)).toContain('op-001');
    });

    const entries = result.current.dataMap?.['op-001'] || {};
    expect(Object.keys(entries).length).toBeGreaterThan(0);
  });
});
