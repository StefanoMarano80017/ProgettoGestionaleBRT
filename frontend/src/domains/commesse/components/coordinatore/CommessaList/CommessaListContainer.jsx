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
}) {
  const data = useCommessaListData({ commesse, filters, periodStart, recentBoundary });
  const virtuosoRef = React.useRef(null);
  const [expandedIds, setExpandedIds] = React.useState(() => new Set());

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
    setExpandedIds((prev) => {
      if (prev.has(selectedCommessaId)) return prev;
      const next = new Set(prev);
      next.add(selectedCommessaId);
      return next;
    });
    const index = data.indexById.get(selectedCommessaId);
    if (index != null && virtuosoRef.current?.scrollToIndex) {
      virtuosoRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
    }
  }, [selectedCommessaId, data.indexById]);

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
    />
  );
}

CommessaListContainer.propTypes = {
  commesse: PropTypes.array,
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string,
    onlyRecent: PropTypes.bool,
  }),
  selectedCommessaId: PropTypes.string,
  onSelectCommessa: PropTypes.func,
  onRefresh: PropTypes.func,
  periodStart: PropTypes.instanceOf(Date),
  recentBoundary: PropTypes.instanceOf(Date),
  error: PropTypes.object,
};
