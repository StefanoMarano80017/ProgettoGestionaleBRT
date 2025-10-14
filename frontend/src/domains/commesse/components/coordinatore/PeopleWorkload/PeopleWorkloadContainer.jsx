import React from 'react';
import PropTypes from 'prop-types';
import { useTheme, useMediaQuery } from '@mui/material';
import { getAllEmployeeTimesheets } from '@mocks/ProjectMock';
import { listAllUsers, ROLES } from '@mocks/UsersMock';
import { listCommesse } from '@mocks/CommesseMock.js';
import usePeopleWorkloadData from './usePeopleWorkloadData.js';
import PeopleWorkloadView from './PeopleWorkloadView.jsx';

const PERIOD_PRESETS = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

const computeStartFor = (mode) => {
  const days = PERIOD_PRESETS[mode] ?? PERIOD_PRESETS.month;
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  return start;
};

export default function PeopleWorkloadContainer({ period, periodStart }) {
  const [timesheets, setTimesheets] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [selectedCommessa, setSelectedCommessa] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [commessaMeta, setCommessaMeta] = React.useState(() => new Map());
  const [periodMode, setPeriodMode] = React.useState(period || 'month');
  const [localPeriodStart, setLocalPeriodStart] = React.useState(() => (
    periodStart instanceof Date ? periodStart : computeStartFor(period || 'month')
  ));

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
  }, [period, periodStart]);

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

  const periodEnd = React.useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }, [periodMode, localPeriodStart]);

  React.useEffect(() => {
    if (!period) return;
    setPeriodMode(period);
  }, [period]);

  React.useEffect(() => {
    if (periodStart instanceof Date) {
      setLocalPeriodStart(periodStart);
    }
  }, [periodStart]);

  const handlePeriodModeChange = React.useCallback((value) => {
    if (!value) return;
    setPeriodMode(value);
    setLocalPeriodStart(computeStartFor(value));
  }, []);

  const workloadData = usePeopleWorkloadData({
    timesheetMap: timesheets,
    employees,
    periodStart: localPeriodStart,
    periodEnd,
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
  const handleCommessaChange = React.useCallback((value) => setSelectedCommessa(value), []);
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
      periodMode={periodMode}
      onPeriodModeChange={handlePeriodModeChange}
    />
  );
}

PeopleWorkloadContainer.propTypes = {
  period: PropTypes.string,
  periodStart: PropTypes.instanceOf(Date),
};
