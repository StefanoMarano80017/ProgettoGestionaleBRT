import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommessaAssignmentsContainer from '../CommessaAssignmentsContainer.jsx';

vi.mock('@mocks/CommesseMock.js', () => {
  const details = {
    id: 'VS-25-01',
    stato: 'attiva',
    assignedEmployeeIds: ['emp-2'],
    sottocommesse: ['VS-25-01-INST'],
  };
  return {
    getCommessaDetails: vi.fn(() => Promise.resolve(details)),
    addEmployeeCommessa: vi.fn(() => Promise.resolve({ ok: true, assigned: ['VS-25-01-INST'] })),
    removeEmployeeCommessa: vi.fn(() => Promise.resolve({ ok: true, assigned: [] })),
  };
});

vi.mock('@mocks/UsersMock', () => ({
  ROLES: { DIPENDENTE: 'DIPENDENTE', OPERAIO: 'OPERAIO', PM_CAMPO: 'PM_CAMPO', COORDINATORE: 'COORDINATORE' },
  listAllUsers: vi.fn(() => [
    { id: 'emp-1', nome: 'Mario', cognome: 'Rossi', discipline: 'MECH', roles: ['DIPENDENTE'] },
    { id: 'emp-2', nome: 'Luigi', cognome: 'Bianchi', discipline: 'ELEC', roles: ['DIPENDENTE'] },
  ]),
}));

const { addEmployeeCommessa, removeEmployeeCommessa, getCommessaDetails } = await import('@mocks/CommesseMock.js');

describe('CommessaAssignmentsContainer', () => {
  beforeEach(() => {
    addEmployeeCommessa.mockClear();
    removeEmployeeCommessa.mockClear();
    getCommessaDetails.mockClear();
  });

  it('assigns a candidate employee and triggers refresh', async () => {
    const onAssignmentsChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CommessaAssignmentsContainer
        commessaId="VS-25-01"
        commessaMeta={{ id: 'VS-25-01', stato: 'attiva' }}
        onAssignmentsChange={onAssignmentsChange}
      />
    );

    await screen.findByText(/Assegnati \(1\)/);

    const candidate = await screen.findByText('Mario Rossi');
    await user.click(candidate);
    const assignButton = screen.getByRole('button', { name: /assegna selezionati/i });
    await user.click(assignButton);

    await waitFor(() => expect(addEmployeeCommessa).toHaveBeenCalledWith('emp-1', 'VS-25-01'));
    expect(onAssignmentsChange).toHaveBeenCalled();
  });

  it('removes an assigned employee', async () => {
    const user = userEvent.setup();
    render(
      <CommessaAssignmentsContainer
        commessaId="VS-25-01"
        commessaMeta={{ id: 'VS-25-01', stato: 'attiva' }}
      />
    );

    const removeButton = await screen.findByLabelText('Rimuovi assegnazione');
    await user.click(removeButton);

    await waitFor(() => expect(removeEmployeeCommessa).toHaveBeenCalledWith('emp-2', 'VS-25-01'));
  });
});
