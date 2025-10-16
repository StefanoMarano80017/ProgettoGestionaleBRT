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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CommessaListItem from './CommessaListItem.jsx';

const SORT_OPTIONS = [
  { value: 'created', label: 'Creazione' },
  { value: 'updated', label: 'Ultima modifica' },
];

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
  sort,
  onSortChange,
}) {
  const currentSort = sort || 'created';
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
        activeSort={currentSort}
      />
    );
  }, [rows, expandedIds, selectedCommessaId, onSelectCommessa, onToggleExpand, renderAssignments, currentSort]);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 3, 
        width: '100%', 
        height: '100%',
        minHeight: 0,
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2.5, 
        border: '2px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, color: 'common.white' }}>Commesse</Typography>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 1.5, md: 2 }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            sx={{ flex: { xs: 'none', md: 1 }, justifyContent: { md: 'flex-end' }, width: '100%' }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Chip 
                label={`${summary.total} totali`} 
                size="small" 
                sx={{ fontWeight: 600, height: 26 }}
              />
              <Chip 
                label={`${summary.attive} attive`} 
                color="success" 
                size="small" 
                variant="outlined"
                sx={{ fontWeight: 600, height: 26 }}
              />
              <Chip 
                label={`${summary.chiuse} chiuse`} 
                color="default" 
                size="small" 
                variant="outlined"
                sx={{ fontWeight: 600, height: 26 }}
              />
            </Stack>
            <ToggleButtonGroup
              value={currentSort}
              exclusive
              size="small"
              onChange={(_, value) => value && onSortChange?.(value)}
              sx={{
                flexShrink: 0,
                alignSelf: { xs: 'stretch', md: 'auto' },
                '& .MuiToggleButton-root': {
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.75,
                  fontWeight: 500,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    color: 'primary.main',
                    borderColor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.12)',
                    }
                  }
                }
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Stack>
        {error && (
          <Alert severity="error">{error.message || 'Errore caricamento commesse'}</Alert>
        )}
      </Stack>
      <Divider />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100]),
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Virtuoso
          data={rows}
          ref={virtuosoRef}
          style={{ width: '100%', flex: 1, height: '100%' }}
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
  sort: PropTypes.oneOf(['created', 'updated']),
  onSortChange: PropTypes.func,
};
