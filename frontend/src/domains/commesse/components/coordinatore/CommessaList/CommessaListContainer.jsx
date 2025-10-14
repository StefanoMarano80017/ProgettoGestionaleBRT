import React from 'react';
import PropTypes from 'prop-types';
import useCommessaListData from './useCommessaListData.js';
import CommessaListView from './CommessaListView.jsx';
import CommessaAssignmentsContainer from './CommessaAssignmentsContainer.jsx';

export default function CommessaListContainer({
  commesse,
  filters,
  selectedCommessaId,
  onSelectCommessa,
  onRefresh,
  periodStart,
  recentBoundary,
  error,
  onSortChange,
}) {
  const data = useCommessaListData({ commesse, filters, periodStart, recentBoundary });
  const virtuosoRef = React.useRef(null);
  const [expandedIds, setExpandedIds] = React.useState(() => new Set()); // Start with all collapsed
  const sortValue = filters?.sort || 'created';
  const handleSortChange = React.useCallback((next) => {
    if (!next || next === sortValue) return;
    onSortChange?.(next);
  }, [onSortChange, sortValue]);

  React.useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set();
      data.rows.forEach((row) => {
        if (prev.has(row.id)) next.add(row.id);
      });
      if (next.size === prev.size) {
        let same = true;
        next.forEach((id) => {
          if (!prev.has(id)) same = false;
        });
        if (same) return prev;
      }
      return next;
    });
  }, [data.rows]);

  React.useEffect(() => {
    if (!selectedCommessaId) return;
    // Just scroll to selected item, don't auto-expand
    const index = data.indexById.get(selectedCommessaId);
    if (index != null && virtuosoRef.current?.scrollToIndex) {
      virtuosoRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
    }
  }, [selectedCommessaId, data.indexById]);

  React.useEffect(() => {
    if (!virtuosoRef.current?.scrollToIndex) return;
    virtuosoRef.current.scrollToIndex({ index: 0, align: 'start', behavior: 'auto' });
  }, [sortValue]);

  const handleToggleExpand = React.useCallback((commessaId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(commessaId)) {
        next.delete(commessaId);
      } else {
        next.add(commessaId);
      }
      return next;
    });
    onSelectCommessa?.(commessaId);
  }, [onSelectCommessa]);

  const handleSelect = React.useCallback((commessaId) => {
    onSelectCommessa?.(commessaId);
  }, [onSelectCommessa]);

  const renderAssignments = React.useCallback((row) => (
    <CommessaAssignmentsContainer
      key={`assign-${row.id}`}
      commessaId={row.id}
      commessaMeta={row.raw}
      onAssignmentsChange={onRefresh}
    />
  ), [onRefresh]);

  return (
    <CommessaListView
      rows={data.rows}
      summary={data.summary}
      selectedCommessaId={selectedCommessaId}
      expandedIds={expandedIds}
      onToggleExpand={handleToggleExpand}
      onSelectCommessa={handleSelect}
      renderAssignments={renderAssignments}
      virtuosoRef={virtuosoRef}
      error={error}
      sort={sortValue}
      onSortChange={handleSortChange}
    />
  );
}

CommessaListContainer.propTypes = {
  commesse: PropTypes.array,
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string,
    onlyRecent: PropTypes.bool,
    sort: PropTypes.string,
  }),
  selectedCommessaId: PropTypes.string,
  onSelectCommessa: PropTypes.func,
  onRefresh: PropTypes.func,
  periodStart: PropTypes.instanceOf(Date),
  recentBoundary: PropTypes.instanceOf(Date),
  error: PropTypes.object,
  onSortChange: PropTypes.func,
};
