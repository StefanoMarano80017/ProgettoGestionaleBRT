import React from 'react';
import PropTypes from 'prop-types';
import {
  getCommessaDetails,
  addEmployeeCommessa,
  removeEmployeeCommessa,
} from '@mocks/CommesseMock.js';
import { listAllUsers, ROLES } from '@mocks/UsersMock';
import CommessaAssignmentsView from './CommessaAssignmentsView.jsx';

const ELIGIBLE_ROLES = new Set([ROLES.DIPENDENTE, ROLES.OPERAIO, ROLES.PM_CAMPO, ROLES.COORDINATORE]);

export default function CommessaAssignmentsContainer({ commessaId, commessaMeta, onAssignmentsChange }) {
  const [details, setDetails] = React.useState(null);
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [mutating, setMutating] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selection, setSelection] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [disciplines, setDisciplines] = React.useState([]);
  const [snack, setSnack] = React.useState({ open: false, message: '', severity: 'success' });

  const fetchDetails = React.useCallback(() => {
    if (!commessaId) return;
    setLoading(true);
    setError(null);
    getCommessaDetails(commessaId)
      .then((data) => {
        setDetails(data);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [commessaId]);

  React.useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  React.useEffect(() => {
    const users = listAllUsers();
    const candidates = (users || []).filter((user) => user.roles?.some((role) => ELIGIBLE_ROLES.has(role)));
    setEmployees(candidates);
  }, []);

  const assignedIds = details?.assignedEmployeeIds ?? [];

  const assignedEmployees = React.useMemo(() => {
    return assignedIds.map((employeeId) => {
      const meta = employees.find((e) => e.id === employeeId);
      return meta || { id: employeeId, nome: 'Sconosciuto', cognome: '', discipline: 'PM' };
    });
  }, [assignedIds, employees]);

  const availableEmployees = React.useMemo(() => {
    const searchValue = search.toLowerCase();
    return employees
      .filter((emp) => !assignedIds.includes(emp.id))
      .filter((emp) => (disciplines.length ? disciplines.includes(emp.discipline) : true))
      .filter((emp) => {
        if (!searchValue) return true;
        const fullName = `${emp.nome} ${emp.cognome}`.toLowerCase();
        return fullName.includes(searchValue) || emp.id.toLowerCase().includes(searchValue);
      });
  }, [employees, assignedIds, disciplines, search]);

  const handleSelectionChange = React.useCallback((ids) => {
    setSelection(ids);
  }, []);

  const handleDisciplineChange = React.useCallback((values) => {
    setDisciplines(values);
  }, []);

  const handleSearchChange = React.useCallback((value) => {
    setSearch(value);
  }, []);

  const showSnack = React.useCallback((message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  const handleAssign = React.useCallback(async () => {
    if (!selection.length) return;
    try {
      setMutating(true);
      await Promise.all(selection.map((employeeId) => addEmployeeCommessa(employeeId, commessaId)));
      setSelection([]);
      showSnack('Assegnazione completata');
      fetchDetails();
      onAssignmentsChange?.();
    } catch (err) {
      showSnack(err.message || 'Errore durante l\'assegnazione', 'error');
    } finally {
      setMutating(false);
    }
  }, [selection, commessaId, fetchDetails, onAssignmentsChange, showSnack]);

  const handleRemove = React.useCallback(async (employeeId) => {
    try {
      setMutating(true);
      await removeEmployeeCommessa(employeeId, commessaId);
      showSnack('Risorsa rimossa');
      fetchDetails();
      onAssignmentsChange?.();
    } catch (err) {
      showSnack(err.message || 'Errore durante la rimozione', 'error');
    } finally {
      setMutating(false);
    }
  }, [commessaId, fetchDetails, onAssignmentsChange, showSnack]);

  const handleCloseSnack = React.useCallback(() => {
    setSnack((prev) => ({ ...prev, open: false }));
  }, []);

  const handleOpenTimesheet = React.useCallback((employeeId) => {
    const url = `/dipendente?employeeId=${employeeId}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return (
    <CommessaAssignmentsView
      loading={loading}
      error={error}
      mutating={mutating}
      commessa={commessaMeta}
      details={details}
      availableEmployees={availableEmployees}
      assignedEmployees={assignedEmployees}
      selection={selection}
      onSelectionChange={handleSelectionChange}
      disciplines={disciplines}
      onDisciplineChange={handleDisciplineChange}
      search={search}
      onSearchChange={handleSearchChange}
      onAssign={handleAssign}
      onRemoveEmployee={handleRemove}
      onOpenTimesheet={handleOpenTimesheet}
      snack={snack}
      onCloseSnack={handleCloseSnack}
    />
  );
}

CommessaAssignmentsContainer.propTypes = {
  commessaId: PropTypes.string.isRequired,
  commessaMeta: PropTypes.object,
  onAssignmentsChange: PropTypes.func,
};
