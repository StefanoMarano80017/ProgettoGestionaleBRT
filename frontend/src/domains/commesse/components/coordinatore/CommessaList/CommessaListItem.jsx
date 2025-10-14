import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors.js';

const STATUS_LABEL = {
  attiva: 'Attiva',
  chiusa: 'Chiusa',
};

export default function CommessaListItem({ row, selected, expanded, onSelect, onToggleExpand, assignmentsSlot }) {
  const color = getCommessaColor(row.codice);
  const softColor = getCommessaColorLight(row.codice, 0.16);

  return (
    <Box sx={{ px: 1, pb: 1 }}>
      <Paper
        elevation={selected ? 3 : 1}
        sx={{
          p: 2,
          borderRadius: 2,
          border: selected ? (theme) => `1px solid ${theme.palette.primary.light}` : '1px solid rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s ease',
          cursor: 'pointer',
        }}
        onClick={() => onSelect?.(row.id)}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={row.codice} sx={{ bgcolor: softColor, color, fontWeight: 600 }} />
              <Chip size="small" variant="outlined" label={STATUS_LABEL[row.stato] || row.stato} color={row.stato === 'chiusa' ? 'default' : 'success'} />
              {row.withinPeriod && (
                <Tooltip title="Attività nel periodo selezionato">
                  <Chip size="small" color="primary" variant="outlined" label="Periodo" />
                </Tooltip>
              )}
            </Stack>
            <IconButton onClick={(event) => { event.stopPropagation(); onToggleExpand?.(row.id); }} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Ultima attività: {row.lastActivityLabel}
          </Typography>
          {row.tags?.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {row.tags.map((tag) => (
                <Chip key={tag} size="small" label={tag} variant="outlined" />
              ))}
            </Stack>
          )}
          {expanded && (
            <Box>
              <Divider sx={{ my: 1.5 }} />
              {assignmentsSlot}
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

CommessaListItem.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.string.isRequired,
    codice: PropTypes.string.isRequired,
    stato: PropTypes.string,
    lastActivityLabel: PropTypes.string,
    withinPeriod: PropTypes.bool,
    tags: PropTypes.array,
  }).isRequired,
  selected: PropTypes.bool,
  expanded: PropTypes.bool,
  onSelect: PropTypes.func,
  onToggleExpand: PropTypes.func,
  assignmentsSlot: PropTypes.node,
};
