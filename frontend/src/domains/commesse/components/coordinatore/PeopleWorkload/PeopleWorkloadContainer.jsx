import React from 'react';
import PropTypes from 'prop-types';
import { useTheme, useMediaQuery } from '@mui/material';
import { getAllEmployeeTimesheets } from '@mocks/ProjectMock';
import { listAllUsers, ROLES } from '@mocks/UsersMock';
import { listCommesse } from '@mocks/CommesseMock.js';
import usePeopleWorkloadData from './usePeopleWorkloadData.js';
import PeopleWorkloadView from './PeopleWorkloadView.jsx';

export default function PeopleWorkloadContainer({ onCommessaOpen }) {
  const [timesheets, setTimesheets] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [selectedCommessa, setSelectedCommessa] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [commessaMeta, setCommessaMeta] = React.useState(() => new Map());

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const employees = React.useMemo(() => (
    (listAllUsers() || []).filter((user) => user.discipline && user.roles?.includes(ROLES.DIPENDENTE))
  ), []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAllEmployeeTimesheets()
      .then((data) => {
        if (!active) return;
        setTimesheets(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    listCommesse({ includeClosed: true })
      .then((data) => {
        if (!active) return;
        const map = new Map();
        data.forEach((commessa) => {
          const label = `${commessa.codice || commessa.id} · ${commessa.nome || ''}`.trim();
          const types = Array.isArray(commessa.tipo)
            ? commessa.tipo.map((value) => String(value || '').toUpperCase()).filter(Boolean)
            : [String(commessa.tipo || 'ENGINEERING').toUpperCase()];
          const normalizedTypes = types.length ? Array.from(new Set(types)) : ['ENGINEERING'];
          map.set(commessa.id, {
            id: commessa.id,
            codice: commessa.codice || commessa.id,
            nome: commessa.nome || commessa.codice || commessa.id,
            label,
            tipo: normalizedTypes,
            types: normalizedTypes,
          });
        });
        setCommessaMeta(map);
      })
      .catch(() => {
        // silently ignore
      });
    return () => {
      active = false;
    };
  }, []);

  const workloadData = usePeopleWorkloadData({
    timesheetMap: timesheets,
    employees,
    commessaMeta,
  });

  const rows = Array.isArray(workloadData?.rows) ? workloadData.rows : [];

  const commessaOptions = React.useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      row.assigned.forEach((commessa) => {
        if (!map.has(commessa.id)) {
          map.set(commessa.id, {
            id: commessa.id,
            label: commessa.label,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'it-IT'));
  }, [rows]);

  React.useEffect(() => {
    if (!selectedCommessa) return;
    const exists = commessaOptions.some((option) => option.id === selectedCommessa.id);
    if (!exists) {
      setSelectedCommessa(null);
    }
  }, [commessaOptions, selectedCommessa]);

  const filteredRows = React.useMemo(() => {
    const searchValue = search.toLowerCase().trim();
    return rows
      .filter((row) => (selectedCommessa ? row.assigned.some((item) => item.id === selectedCommessa.id) : true))
      .filter((row) => {
        if (!searchValue) return true;
        return row.name.toLowerCase().includes(searchValue) || row.employeeId.toLowerCase().includes(searchValue);
      })
      .sort((a, b) => {
        if (a.isActive === b.isActive) {
          return b.workHours - a.workHours;
        }
        return a.isActive ? -1 : 1;
    });
  }, [rows, search, selectedCommessa]);

  const displaySummary = React.useMemo(() => ({
    total: filteredRows.length,
    withTimesheet: filteredRows.filter((row) => row.isActive).length,
  }), [filteredRows]);

  const handleSearchChange = React.useCallback((value) => setSearch(value), []);
  const handleCommessaChange = React.useCallback((value) => {
    setSelectedCommessa(value);
    if (value?.id) {
      onCommessaOpen?.(value.id);
    }
  }, [onCommessaOpen]);
  const handleToggleDrawer = React.useCallback(() => setDrawerOpen((prev) => !prev), []);
  const handleCloseDrawer = React.useCallback(() => setDrawerOpen(false), []);

  return (
    <PeopleWorkloadView
      loading={loading}
      error={error}
      rows={filteredRows}
      summary={displaySummary}
      search={search}
      onSearchChange={handleSearchChange}
      commessaOptions={commessaOptions}
      selectedCommessa={selectedCommessa}
      onCommessaChange={handleCommessaChange}
      isMobile={isMobile}
      drawerOpen={drawerOpen}
      onToggleDrawer={handleToggleDrawer}
      onCloseDrawer={handleCloseDrawer}
      onCommessaOpen={onCommessaOpen}
    />
  );
}

PeopleWorkloadContainer.propTypes = {
  onCommessaOpen: PropTypes.func,
};
