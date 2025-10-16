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
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
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
        pl: 4,
        alignItems: 'flex-start',
        '&.Mui-selected': {
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.light}`,
        },
      }}
    >
      <DescriptionIcon sx={{ mr: 1, fontSize: 18, color: 'action.active', mt: 0.5 }} />
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
            {node.displayLabel}
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
    displayLabel: PropTypes.string,
    withinPeriod: PropTypes.bool,
  }).isRequired,
  onClick: PropTypes.func,
  selected: PropTypes.bool,
};

export default function FileExplorerView({
  recentNodes,
  yearGroups,
  selectedCommessaId,
  onSelectCommessa,
  isCompact,
  search,
  status,
  period,
  onSearchChange,
  onStatusChange,
  onPeriodChange,
  loading,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expandedYears, setExpandedYears] = React.useState(() => new Set([new Date().getFullYear()]));
  const [expandedMonths, setExpandedMonths] = React.useState(() => new Set());
  const normalizedStatus = status || 'all';
  const hasCustomStatus = normalizedStatus !== 'all';

  const toggleYear = (year) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const toggleMonth = (monthId) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthId)) {
        next.delete(monthId);
      } else {
        next.add(monthId);
      }
      return next;
    });
  };

  const handleCollapseAll = () => {
    setExpandedYears(new Set());
    setExpandedMonths(new Set());
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 3,
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={2} sx={{ width: '100%', flex: 1, minHeight: 0 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FolderIcon fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Esplora commesse
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {/* Search bar */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                value={search}
                onChange={(event) => onSearchChange?.(event.target.value)}
                size="small"
                placeholder="Cerca per codice o nome"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <Tooltip title="Chiudi tutte le cartelle">
                <IconButton
                  size="small"
                  onClick={handleCollapseAll}
                  disabled={expandedYears.size === 0 && expandedMonths.size === 0}
                  sx={{
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.4,
                    }
                  }}
                >
                  <UnfoldLessIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Status Filter - Inline Chips */}
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>
                Stato:
              </Typography>
              <Chip
                size="small"
                label="Tutte"
                icon={normalizedStatus === 'all' ? <CheckCircleIcon /> : undefined}
                onClick={() => onStatusChange?.('all')}
                variant={normalizedStatus === 'all' ? 'filled' : 'outlined'}
                color={normalizedStatus === 'all' ? 'primary' : 'default'}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: normalizedStatus === 'all' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 1,
                  }
                }}
              />
              <Chip
                size="small"
                label="Attive"
                icon={normalizedStatus === 'attiva' ? <CheckCircleIcon /> : undefined}
                onClick={() => onStatusChange?.('attiva')}
                variant={normalizedStatus === 'attiva' ? 'filled' : 'outlined'}
                color={normalizedStatus === 'attiva' ? 'success' : 'default'}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: normalizedStatus === 'attiva' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 1,
                  }
                }}
              />
              <Chip
                size="small"
                label="Chiuse"
                icon={normalizedStatus === 'chiusa' ? <CancelIcon /> : undefined}
                onClick={() => onStatusChange?.('chiusa')}
                variant={normalizedStatus === 'chiusa' ? 'filled' : 'outlined'}
                color={normalizedStatus === 'chiusa' ? 'default' : 'default'}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: normalizedStatus === 'chiusa' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: normalizedStatus === 'chiusa' ? 'action.selected' : 'transparent',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 1,
                  }
                }}
              />
            </Stack>
          </Stack>
          {loading && <LinearProgress />}
        </Stack>
        {recentNodes.length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FiberManualRecordIcon sx={{ fontSize: 10 }} color="primary" />
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
  <Stack spacing={0.5} sx={{ flex: 1, minHeight: 0, overflowY: isCompact ? 'visible' : 'auto', maxHeight: isCompact ? 'none' : '100%' }}>
          {yearGroups.length === 0 && (
            <Typography variant="body2" color="text.secondary">Nessuna commessa disponibile</Typography>
          )}
          {yearGroups.map((yearGroup) => {
            const yearExpanded = expandedYears.has(yearGroup.year);
            return (
              <Box key={yearGroup.year}>
                <ListItemButton
                  onClick={() => toggleYear(yearGroup.year)}
                  sx={{ borderRadius: 1, py: 0.5 }}
                >
                  {yearExpanded ? <FolderOpenIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} /> : <FolderIcon sx={{ mr: 1, fontSize: 20, color: 'action.active' }} />}
                  <ListItemText
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{yearGroup.year}</Typography>}
                  />
                  <IconButton size="small" edge="end">
                    {yearExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                  </IconButton>
                </ListItemButton>
                <Collapse in={yearExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 2 }}>
                    {yearGroup.months.map((monthGroup) => {
                      const monthExpanded = expandedMonths.has(monthGroup.id);
                      return (
                        <Box key={monthGroup.id}>
                          <ListItemButton
                            onClick={() => toggleMonth(monthGroup.id)}
                            sx={{ borderRadius: 1, py: 0.5 }}
                          >
                            {monthExpanded ? <FolderOpenIcon sx={{ mr: 1, fontSize: 18, color: 'secondary.main' }} /> : <FolderIcon sx={{ mr: 1, fontSize: 18, color: 'action.active' }} />}
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                  {monthGroup.label}
                                </Typography>
                              }
                            />
                            <IconButton size="small" edge="end">
                              {monthExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                            </IconButton>
                          </ListItemButton>
                          <Collapse in={monthExpanded} timeout="auto" unmountOnExit>
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
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
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
  search: PropTypes.string,
  status: PropTypes.string,
  period: PropTypes.string,
  onSearchChange: PropTypes.func,
  onStatusChange: PropTypes.func,
  onPeriodChange: PropTypes.func,
  loading: PropTypes.bool,
};
