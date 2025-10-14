import React from 'react';
import PropTypes from 'prop-types';
import { useTheme, useMediaQuery } from '@mui/material';
import { getAllEmployeeTimesheets } from '@mocks/ProjectMock';
import { listAllUsers, ROLES } from '@mocks/UsersMock';
import usePeopleWorkloadData from './usePeopleWorkloadData.js';
import PeopleWorkloadView from './PeopleWorkloadView.jsx';

export default function PeopleWorkloadContainer({ period, periodStart, onlyRecent }) {
  const [timesheets, setTimesheets] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [disciplines, setDisciplines] = React.useState([]);
  const [sortBy, setSortBy] = React.useState('utilization');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const employees = React.useMemo(() => {
    const eligibleRoles = new Set([ROLES.DIPENDENTE, ROLES.OPERAIO, ROLES.PM_CAMPO, ROLES.COORDINATORE]);
    return (listAllUsers() || []).filter((user) => user.discipline && user.roles?.some((role) => eligibleRoles.has(role)));
  }, []);

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

  const periodEnd = React.useMemo(() => new Date(), [period, periodStart]);

  const { rows, summary } = usePeopleWorkloadData({
    timesheetMap: timesheets,
    employees,
    periodStart,
    periodEnd,
  });

  const filteredRows = React.useMemo(() => {
    const disciplineSet = new Set(disciplines);
    const searchValue = search.toLowerCase().trim();
    return rows
      .filter((row) => (disciplineSet.size ? disciplineSet.has(row.discipline) : true))
      .filter((row) => {
        if (!searchValue) return true;
        return row.name.toLowerCase().includes(searchValue) || row.employeeId.toLowerCase().includes(searchValue);
      })
      .filter((row) => (onlyRecent ? row.distinctDays > 0 : true))
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'nonWork') {
          return b.nonWorkHours - a.nonWorkHours;
        }
        return b.utilization - a.utilization;
      });
  }, [rows, disciplines, search, sortBy, onlyRecent]);

  const handleSearchChange = React.useCallback((value) => setSearch(value), []);
  const handleDisciplineChange = React.useCallback((value) => setDisciplines(value), []);
  const handleSortChange = React.useCallback((value) => setSortBy(value), []);
  const handleToggleDrawer = React.useCallback(() => setDrawerOpen((prev) => !prev), []);
  const handleCloseDrawer = React.useCallback(() => setDrawerOpen(false), []);

  return (
    <PeopleWorkloadView
      loading={loading}
      error={error}
      rows={filteredRows}
      summary={summary}
      disciplines={disciplines}
      onDisciplineChange={handleDisciplineChange}
      search={search}
      onSearchChange={handleSearchChange}
      sortBy={sortBy}
      onSortChange={handleSortChange}
      isMobile={isMobile}
      drawerOpen={drawerOpen}
      onToggleDrawer={handleToggleDrawer}
      onCloseDrawer={handleCloseDrawer}
    />
  );
}

PeopleWorkloadContainer.propTypes = {
  period: PropTypes.string,
  periodStart: PropTypes.instanceOf(Date),
  onlyRecent: PropTypes.bool,
};
