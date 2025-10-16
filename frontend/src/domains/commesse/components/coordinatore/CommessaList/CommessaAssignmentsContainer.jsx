import React from 'react';
import PropTypes from 'prop-types';
import {
  getCommessaDetails,
  addEmployeeCommessa,
  removeEmployeeCommessa,
} from '@mocks/CommesseMock.js';
import { listAllUsers, ROLES } from '@mocks/UsersMock';
import { EMPLOYEE_COMMESSE } from '@mocks/ProjectMock';
import { DISCIPLINES, DISCIPLINE_LABEL } from '@shared/utils/discipline.js';
import CommessaAssignmentsView from './CommessaAssignmentsView.jsx';

const ELIGIBLE_ROLES = new Set([ROLES.DIPENDENTE]);

const buildFullName = (employee) => `${employee?.nome ?? ''} ${employee?.cognome ?? ''}`.trim() || employee?.id;

const getEmployeeAssignments = (employeeId) => {
  const rawList = Array.isArray(EMPLOYEE_COMMESSE[employeeId]) ? EMPLOYEE_COMMESSE[employeeId] : [];
  return rawList
    .map((code) => (typeof code === 'string' ? code.trim() : ''))
    .filter((code) => code.length > 0);
};

const mapAssignments = (codes) => {
  if (!Array.isArray(codes)) return [];
  const seen = new Set();
  return codes.reduce((acc, code) => {
    if (!code || seen.has(code)) {
      return acc;
    }
    seen.add(code);
    acc.push({ code });
    return acc;
  }, []);
};

const resolveDisciplineLabel = (disciplineCode) => DISCIPLINE_LABEL[disciplineCode] || disciplineCode || 'N/D';

export default function CommessaAssignmentsContainer({ commessaId, commessaMeta, onAssignmentsChange }) {
  const [details, setDetails] = React.useState(null);
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [mutating, setMutating] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selection, setSelection] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [disciplineFilter, setDisciplineFilter] = React.useState('');
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
    setEmployees(users || []);
  }, []);

  const disciplineOptions = React.useMemo(() => {
    return Array.isArray(DISCIPLINES) ? [...DISCIPLINES] : [];
  }, []);

  const assignedIds = details?.assignedEmployeeIds ?? [];

  const assignedEmployees = React.useMemo(() => (
    assignedIds.map((employeeId) => {
      const meta = employees.find((e) => e.id === employeeId) || { id: employeeId };
      const assignments = mapAssignments(getEmployeeAssignments(employeeId));
      return {
        ...meta,
        id: employeeId,
        assignments,
        disciplineLabel: resolveDisciplineLabel(meta.discipline),
      };
    })
  ), [assignedIds, employees]);

  const availableEmployees = React.useMemo(() => {
    const searchValue = search.toLowerCase();
    const filterValue = (disciplineFilter || '').trim().toLowerCase();
    return employees
      .filter((emp) => emp.roles?.some((role) => ELIGIBLE_ROLES.has(role)))
      .filter((emp) => !assignedIds.includes(emp.id))
      .filter((emp) => {
        if (!filterValue) return true;
        const empDiscipline = (emp.discipline || '').toLowerCase();
        return empDiscipline.includes(filterValue) || filterValue.includes(empDiscipline);
      })
      .filter((emp) => {
        if (!searchValue) return true;
        const fullName = buildFullName(emp).toLowerCase();
        return fullName.includes(searchValue) || emp.id.toLowerCase().includes(searchValue);
      })
      .map((emp) => ({
        ...emp,
        assignments: null,
      }));
  }, [employees, assignedIds, disciplineFilter, search]);

  const handleSelectionChange = React.useCallback((ids) => {
    setSelection(ids);
  }, []);

  const handleDisciplineFilterChange = React.useCallback((value) => {
    setDisciplineFilter(value || '');
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
      disciplineFilter={disciplineFilter}
      onDisciplineFilterChange={handleDisciplineFilterChange}
      disciplineOptions={disciplineOptions}
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
