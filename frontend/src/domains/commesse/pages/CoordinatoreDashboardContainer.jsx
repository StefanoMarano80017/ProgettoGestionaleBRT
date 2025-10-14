import React from 'react';
import CoordinatoreDashboardView from './CoordinatoreDashboardView.jsx';
import { listAllCommesse } from '@mocks/CommesseMock.js';
import FileExplorerContainer from '../components/coordinatore/FileExplorer/FileExplorerContainer.jsx';
import CommessaListContainer from '../components/coordinatore/CommessaList/CommessaListContainer.jsx';
import PeopleWorkloadContainer from '../components/coordinatore/PeopleWorkload/PeopleWorkloadContainer.jsx';

const PERIOD_TO_DAYS = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

const RECENT_WINDOW_DAYS = 14;

const computePeriodStart = (period) => {
  const days = PERIOD_TO_DAYS[period] ?? PERIOD_TO_DAYS.month;
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return from;
};

const computeRecentBoundary = () => {
  const now = new Date();
  const recent = new Date(now);
  recent.setDate(recent.getDate() - RECENT_WINDOW_DAYS);
  return recent;
};

export default function CoordinatoreDashboardContainer() {
  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    period: 'month',
    onlyRecent: false,
    sort: 'created',
  });
  const [commesse, setCommesse] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedCommessaId, setSelectedCommessaId] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const periodStart = React.useMemo(() => computePeriodStart(filters.period), [filters.period]);
  const recentBoundary = React.useMemo(() => computeRecentBoundary(), [filters.onlyRecent, refreshToken]);

  const refresh = React.useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listAllCommesse({ includeClosed: true })
      .then((data) => {
        if (!active) return;
        setCommesse(data);
        if (data.length === 0) {
          setSelectedCommessaId(null);
          return;
        }
        setSelectedCommessaId((prev) => {
          if (prev && data.some((item) => item.id === prev)) {
            return prev;
          }
          return data[0].id;
        });
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
  }, [refreshToken]);

  const handleSearchChange = React.useCallback((value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleStatusChange = React.useCallback((value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handlePeriodChange = React.useCallback((value) => {
    setFilters((prev) => ({ ...prev, period: value }));
  }, []);

  const handleToggleRecent = React.useCallback((next) => {
    setFilters((prev) => ({ ...prev, onlyRecent: Boolean(next) }));
  }, []);

  const handleSortChange = React.useCallback((value) => {
    setFilters((prev) => ({ ...prev, sort: value }));
  }, []);

  const handleSelectCommessa = React.useCallback((commessaId) => {
    setSelectedCommessaId(commessaId);
  }, []);

  const explorerSlot = (
    <FileExplorerContainer
      commesse={commesse}
      selectedCommessaId={selectedCommessaId}
      onSelectCommessa={handleSelectCommessa}
      onlyRecent={filters.onlyRecent}
      recentBoundary={recentBoundary}
      periodStart={periodStart}
      statusFilter={filters.status}
      searchText={filters.search}
    />
  );

  const commessaListSlot = (
    <CommessaListContainer
      commesse={commesse}
      filters={filters}
      selectedCommessaId={selectedCommessaId}
      onSelectCommessa={handleSelectCommessa}
      onRefresh={refresh}
      periodStart={periodStart}
      error={error}
      recentBoundary={recentBoundary}
      onSortChange={handleSortChange}
    />
  );

  const workloadSlot = (
    <PeopleWorkloadContainer
      period={filters.period}
      periodStart={periodStart}
    />
  );

  return (
    <CoordinatoreDashboardView
      filters={filters}
      isLoading={loading}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusChange}
      onPeriodChange={handlePeriodChange}
      onToggleRecent={handleToggleRecent}
      explorerSlot={explorerSlot}
      commessaListSlot={commessaListSlot}
      workloadSlot={workloadSlot}
    />
  );
}
