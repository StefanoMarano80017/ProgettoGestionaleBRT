import React from 'react';
import PropTypes from 'prop-types';
import { useTheme, useMediaQuery } from '@mui/material';
import FileExplorerView from './FileExplorerView.jsx';
import useFileExplorerData from './useFileExplorerData.js';

export default function FileExplorerContainer({
  commesse,
  selectedCommessaId,
  onSelectCommessa,
  onlyRecent,
  recentBoundary,
  periodStart,
  statusFilter,
  searchText,
}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const data = useFileExplorerData({
    commesse,
    onlyRecent,
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
    />
  );
}

FileExplorerContainer.propTypes = {
  commesse: PropTypes.array,
  selectedCommessaId: PropTypes.string,
  onSelectCommessa: PropTypes.func,
  onlyRecent: PropTypes.bool,
  recentBoundary: PropTypes.instanceOf(Date),
  periodStart: PropTypes.instanceOf(Date),
  statusFilter: PropTypes.string,
  searchText: PropTypes.string,
};
