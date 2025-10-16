import React from 'react';
import CoordinatoreDashboardView from './CoordinatoreDashboardView.jsx';
import { listAllCommesse } from '@mocks/CommesseMock.js';
import FileExplorerContainer from '../components/coordinatore/FileExplorer/FileExplorerContainer.jsx';
import CommessaListContainer from '../components/coordinatore/CommessaList/CommessaListContainer.jsx';

const PERIOD_TO_DAYS = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

const RECENT_WINDOW_DAYS = 14;

const computePeriodStart = (period) => {
  if (period === 'all') {
    return null;
  }
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

const INFO_TAB_ID = 'commessa-info';

export default function CoordinatoreDashboardContainer() {
  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    period: 'all',
  });
  const [commesse, setCommesse] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [tabs, setTabs] = React.useState(() => ([
    { id: INFO_TAB_ID, kind: 'info' },
  ]));
  const [activeTabId, setActiveTabId] = React.useState(INFO_TAB_ID);
  const [selectedCommessaId, setSelectedCommessaId] = React.useState(null);

  const periodStart = React.useMemo(() => computePeriodStart(filters.period), [filters.period]);
  const recentBoundary = React.useMemo(() => computeRecentBoundary(), [refreshToken]);

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

  const handleSelectCommessa = React.useCallback((commessaId) => {
    if (!commessaId) return;
    const tabId = `commessa-${commessaId}`;
    setTabs((prev) => {
      const exists = prev.some((tab) => tab.kind === 'commessa' && tab.commessaId === commessaId);
      if (exists) {
        return prev;
      }
      return [...prev, { id: tabId, kind: 'commessa', commessaId }];
    });
    setActiveTabId(tabId);
  }, []);

  React.useEffect(() => {
    setSelectedCommessaId((prev) => {
      const activeTab = tabs.find((tab) => tab.id === activeTabId);
      const nextId = activeTab?.kind === 'commessa' ? activeTab.commessaId : null;
      if (prev === nextId) {
        return prev;
      }
      return nextId;
    });
  }, [tabs, activeTabId]);

  const handleChangeTab = React.useCallback((tabId) => {
    setActiveTabId(tabId);
  }, []);

  const handleCloseTab = React.useCallback((tabId) => {
    if (tabId === INFO_TAB_ID) return;
    setTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== tabId);
      const finalTabs = next.length ? next : [{ id: INFO_TAB_ID, kind: 'info' }];
      setActiveTabId((current) => {
        if (current !== tabId) return current;
        const fallback = finalTabs.find((tab) => tab.kind === 'commessa')?.id || INFO_TAB_ID;
        return fallback;
      });
      return finalTabs;
    });
  }, []);

  const commessaMap = React.useMemo(() => {
    const map = new Map();
    commesse.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [commesse]);

  const explorerSlot = (
    <FileExplorerContainer
      commesse={commesse}
      selectedCommessaId={selectedCommessaId}
      onSelectCommessa={handleSelectCommessa}
      recentBoundary={recentBoundary}
      periodStart={periodStart}
      statusFilter={filters.status}
      searchText={filters.search}
      period={filters.period}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusChange}
      onPeriodChange={handlePeriodChange}
      loading={loading}
    />
  );

  const commessaListSlot = (
    <CommessaListContainer
      commesse={commessaMap}
      tabs={tabs}
      activeTabId={activeTabId}
      onChangeTab={handleChangeTab}
      onCloseTab={handleCloseTab}
      onOpenCommessa={handleSelectCommessa}
      onRefresh={refresh}
      error={error}
    />
  );

  return (
    <CoordinatoreDashboardView
      explorerSlot={explorerSlot}
      commessaListSlot={commessaListSlot}
    />
  );
}
