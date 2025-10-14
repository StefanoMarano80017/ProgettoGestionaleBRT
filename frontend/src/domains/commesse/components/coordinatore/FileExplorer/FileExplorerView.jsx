import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
  Tooltip,
  Box,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors.js';

const STATUS_LABEL = {
  attiva: 'Attiva',
  chiusa: 'Chiusa',
};

function CommessaItem({ node, onClick, selected }) {
  const color = getCommessaColor(node.codice);
  const background = getCommessaColorLight(node.codice, 0.12);
  return (
    <ListItemButton
      key={node.id}
      onClick={() => onClick?.(node.id)}
      selected={selected}
      sx={{
        borderRadius: 1,
        mb: 0.5,
        alignItems: 'flex-start',
        '&.Mui-selected': {
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.light}`,
        },
      }}
    >
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={node.codice} sx={{ bgcolor: background, color, fontWeight: 600 }} />
            {node.withinPeriod && (
              <Tooltip title="Attività nel periodo selezionato">
                <FiberManualRecordIcon fontSize="inherit" color="success" sx={{ fontSize: 12 }} />
              </Tooltip>
            )}
            <Chip size="small" variant="outlined" label={STATUS_LABEL[node.stato] || node.stato} />
          </Stack>
        }
        secondary={
          <Typography variant="caption" color="text.secondary">
            Ultima attività: {node.lastActivityLabel}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

CommessaItem.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string.isRequired,
    codice: PropTypes.string.isRequired,
    stato: PropTypes.string,
    lastActivityLabel: PropTypes.string,
    withinPeriod: PropTypes.bool,
  }).isRequired,
  onClick: PropTypes.func,
  selected: PropTypes.bool,
};

export default function FileExplorerView({ recentNodes, yearGroups, selectedCommessaId, onSelectCommessa, isCompact }) {
  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, width: '100%' }}>
      <Stack spacing={2} sx={{ width: '100%' }}>
        <Typography variant="subtitle1">Esplora commesse</Typography>
        {recentNodes.length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary">
              Modificate di recente
            </Typography>
            <List dense disablePadding>
              {recentNodes.map((node) => (
                <CommessaItem
                  key={`recent-${node.id}`}
                  node={node}
                  onClick={onSelectCommessa}
                  selected={selectedCommessaId === node.id}
                />
              ))}
            </List>
            <Divider sx={{ my: 1 }} />
          </Box>
        )}
        <Stack spacing={1.5} sx={{ flex: 1, overflowY: isCompact ? 'visible' : 'auto', maxHeight: isCompact ? 'none' : 720 }}>
          {yearGroups.length === 0 && (
            <Typography variant="body2" color="text.secondary">Nessuna commessa disponibile</Typography>
          )}
          {yearGroups.map((yearGroup) => (
            <Box key={yearGroup.year} sx={{}}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{yearGroup.year}</Typography>
              <Stack spacing={1}>
                {yearGroup.months.map((monthGroup) => (
                  <Box key={monthGroup.id}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {monthGroup.label}
                    </Typography>
                    <List dense disablePadding>
                      {monthGroup.commesse.map((node) => (
                        <CommessaItem
                          key={node.id}
                          node={node}
                          onClick={onSelectCommessa}
                          selected={selectedCommessaId === node.id}
                        />
                      ))}
                    </List>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

FileExplorerView.propTypes = {
  recentNodes: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })),
  yearGroups: PropTypes.arrayOf(PropTypes.shape({
    year: PropTypes.number,
    months: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      commesse: PropTypes.array,
    })),
  })),
  selectedCommessaId: PropTypes.string,
  onSelectCommessa: PropTypes.func,
  isCompact: PropTypes.bool,
};
