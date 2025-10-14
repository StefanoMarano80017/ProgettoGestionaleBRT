import React from 'react';
import PropTypes from 'prop-types';
import { Virtuoso } from 'react-virtuoso';
import {
  Paper,
  Stack,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import CommessaListItem from './CommessaListItem.jsx';

export default function CommessaListView({
  rows,
  summary,
  selectedCommessaId,
  expandedIds,
  onToggleExpand,
  onSelectCommessa,
  renderAssignments,
  virtuosoRef,
  error,
}) {
  const itemContent = React.useCallback((index) => {
    const row = rows[index];
    if (!row) return null;
    const expanded = expandedIds.has(row.id);
    return (
      <CommessaListItem
        row={row}
        selected={selectedCommessaId === row.id}
        expanded={expanded}
        onSelect={onSelectCommessa}
        onToggleExpand={onToggleExpand}
        assignmentsSlot={expanded ? renderAssignments(row) : null}
      />
    );
  }, [rows, expandedIds, selectedCommessaId, onSelectCommessa, onToggleExpand, renderAssignments]);

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Typography variant="h6" sx={{ flex: 1 }}>Commesse</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={`Totali ${summary.total}`} size="small" />
          <Chip label={`Attive ${summary.attive}`} color="success" size="small" variant="outlined" />
          <Chip label={`Chiuse ${summary.chiuse}`} color="default" size="small" variant="outlined" />
        </Stack>
      </Stack>
      {error && (
        <Alert severity="error">{error.message || 'Errore caricamento commesse'}</Alert>
      )}
      <Divider />
      <Box sx={{ flex: 1, minHeight: 400 }}>
        <Virtuoso
          data={rows}
          ref={virtuosoRef}
          style={{ height: 850, width: '100%' }}
          itemContent={(index) => itemContent(index)}
        />
      </Box>
    </Paper>
  );
}

CommessaListView.propTypes = {
  rows: PropTypes.array.isRequired,
  summary: PropTypes.shape({
    total: PropTypes.number,
    attive: PropTypes.number,
    chiuse: PropTypes.number,
  }).isRequired,
  selectedCommessaId: PropTypes.string,
  expandedIds: PropTypes.instanceOf(Set).isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onSelectCommessa: PropTypes.func.isRequired,
  renderAssignments: PropTypes.func.isRequired,
  virtuosoRef: PropTypes.shape({ current: PropTypes.any }),
  error: PropTypes.shape({ message: PropTypes.string }),
};
