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

export default function CommessaListItem({ row, selected, expanded, onSelect, onToggleExpand, assignmentsSlot, activeSort }) {
  const color = getCommessaColor(row.codice);
  const softColor = getCommessaColorLight(row.codice, 0.16);

  return (
    <Box sx={{ px: 0.5, pb: 1 }}>
      <Paper
        elevation={0}
        sx={{
          px: 2.5,
          py: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          bgcolor: selected ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
          '&:hover': {
            bgcolor: selected ? 'rgba(25, 118, 210, 0.12)' : 'action.hover',
            borderColor: 'primary.main',
            boxShadow: 1,
          },
        }}
        onClick={() => onSelect?.(row.id)}
      >
        <Stack spacing={expanded ? 1.5 : 0}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Chip 
                size="small" 
                label={row.codice} 
                sx={{ 
                  bgcolor: softColor, 
                  color, 
                  fontWeight: 700,
                  height: 26,
                  fontSize: '0.75rem',
                  borderRadius: 1.5,
                }} 
              />
              <Chip 
                size="small" 
                variant="outlined" 
                label={STATUS_LABEL[row.stato] || row.stato} 
                color={row.stato === 'chiusa' ? 'default' : 'success'}
                sx={{ height: 26, fontSize: '0.75rem', fontWeight: 600, borderRadius: 1.5 }}
              />
              {row.tags?.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
                  {row.tags.slice(0, 2).map((tag) => (
                    <Chip 
                      key={tag} 
                      size="small" 
                      label={tag} 
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75, py: 0 } }}
                    />
                  ))}
                  {row.tags.length > 2 && (
                    <Tooltip title={row.tags.slice(2).join(', ')}>
                      <Chip 
                        size="small" 
                        label={`+${row.tags.length - 2}`} 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75, py: 0 } }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              )}
            </Stack>
            <IconButton 
              onClick={(event) => { event.stopPropagation(); onToggleExpand?.(row.id); }} 
              size="small"
              sx={{ ml: 1 }}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 0.5, sm: 1.5 }}
            sx={{ mt: 0.75 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: activeSort === 'created' ? 700 : 500,
                color: activeSort === 'created' ? 'primary.main' : 'text.secondary',
              }}
            >
              {row.creationLabel ? `Creata il ${row.creationLabel}` : 'Creazione: N/D'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: activeSort === 'updated' ? 700 : 500,
                color: activeSort === 'updated' ? 'primary.main' : 'text.secondary',
              }}
            >
              {row.updatedLabel ? `Ultima modifica ${row.updatedLabel}` : 'Ultima modifica: N/D'}
            </Typography>
          </Stack>
          {expanded && (
            <Box sx={{ pt: 1 }}>
              <Divider sx={{ mb: 1.5 }} />
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
    creationLabel: PropTypes.string,
    updatedLabel: PropTypes.string,
    tags: PropTypes.array,
  }).isRequired,
  selected: PropTypes.bool,
  expanded: PropTypes.bool,
  onSelect: PropTypes.func,
  onToggleExpand: PropTypes.func,
  assignmentsSlot: PropTypes.node,
  activeSort: PropTypes.oneOf(['created', 'updated']),
};

CommessaListItem.defaultProps = {
  selected: false,
  expanded: false,
  onSelect: undefined,
  onToggleExpand: undefined,
  assignmentsSlot: null,
  activeSort: 'created',
};
