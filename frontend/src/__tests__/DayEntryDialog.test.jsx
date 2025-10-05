import React from 'react';
import { render, screen } from '@testing-library/react';
import DayEntryDialog from '@components/Calendar/DayEntryDialog';

// Minimal mock for DayEntryPanel dependency (if heavy). If actual component is lightweight, can remove mock.
vi.mock('@components/Calendar/DayEntryPanel', () => ({ default: () => <div data-testid="panel">panel</div> }));

describe('DayEntryDialog', () => {
  it('renders title and description with employee name', () => {
    render(
      <DayEntryDialog
        open
        onClose={() => {}}
        date="2025-10-05"
        employeeId="emp-1"
        employeeName="Mario Rossi"
        data={{}}
        commesse={[]}
      />
    );
    expect(screen.getByText(/Dettaglio giornata 2025-10-05/)).toBeInTheDocument();
    expect(screen.getByText(/Mario Rossi/)).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });
});
