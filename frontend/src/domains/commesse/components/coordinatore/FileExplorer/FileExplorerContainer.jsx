import React from 'react';
import PropTypes from 'prop-types';
import { useTheme, useMediaQuery } from '@mui/material';
import FileExplorerView from './FileExplorerView.jsx';
import useFileExplorerData from './useFileExplorerData.js';

export default function FileExplorerContainer({
  commesse,
  selectedCommessaId,
  onSelectCommessa,
  recentBoundary,
  periodStart,
  statusFilter,
  searchText,
  period,
  onSearchChange,
  onStatusChange,
  onPeriodChange,
  loading,
}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const data = useFileExplorerData({
    commesse,
    recentBoundary,
    periodStart,
    statusFilter,
    searchText,
  });

  return (
    <FileExplorerView
      recentNodes={data.recentNodes}
      yearGroups={data.yearGroups}
      selectedCommessaId={selectedCommessaId}
      onSelectCommessa={onSelectCommessa}
      isCompact={isCompact}
      search={searchText}
      status={statusFilter}
      period={period}
      onSearchChange={onSearchChange}
      onStatusChange={onStatusChange}
      onPeriodChange={onPeriodChange}
      loading={loading}
    />
  );
}

FileExplorerContainer.propTypes = {
  commesse: PropTypes.array,
  selectedCommessaId: PropTypes.string,
  onSelectCommessa: PropTypes.func,
  recentBoundary: PropTypes.instanceOf(Date),
  periodStart: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.oneOf([null])]),
  statusFilter: PropTypes.string,
  searchText: PropTypes.string,
  period: PropTypes.string,
  onSearchChange: PropTypes.func,
  onStatusChange: PropTypes.func,
  onPeriodChange: PropTypes.func,
  loading: PropTypes.bool,
};
