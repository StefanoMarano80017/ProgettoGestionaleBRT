/**
 * Purpose: Layout shell for the Coordinatore dashboard with filters and three responsive slots.
 * Inputs: props { filters, onSearchChange, onStatusChange, onPeriodChange, onToggleRecent, isLoading, explorerSlot, commessaListSlot, workloadSlot }
 * Outputs: Invokes callbacks on filter interactions.
 */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Typography,
  Paper,
  Divider,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import UpdateIcon from '@mui/icons-material/Update';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tutte' },
  { value: 'attiva', label: 'Attive' },
  { value: 'chiusa', label: 'Chiuse' },
];

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Ultima settimana' },
  { value: 'month', label: 'Ultimo mese' },
  { value: 'quarter', label: 'Ultimo trimestre' },
  { value: 'year', label: 'Ultimo anno' },
];

export default function CoordinatoreDashboardView({
  filters,
  onSearchChange,
  onStatusChange,
  onPeriodChange,
  onToggleRecent,
  isLoading,
  explorerSlot,
  commessaListSlot,
  workloadSlot,
}) {
  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, height: '100%', boxSizing: 'border-box' }}>
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={2} divider={<Divider flexItem />}>
          <Typography variant="h6">Coordinatore Dashboard</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              fullWidth
              value={filters.search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Cerca commessa"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <ToggleButtonGroup
              value={filters.status}
              exclusive
              size="small"
              onChange={(_, value) => value && onStatusChange?.(value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>{option.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={filters.period}
              exclusive
              size="small"
              onChange={(_, value) => value && onPeriodChange?.(value)}
            >
              {PERIOD_OPTIONS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>{option.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Button
              variant={filters.onlyRecent ? 'contained' : 'outlined'}
              color={filters.onlyRecent ? 'primary' : 'inherit'}
              onClick={() => onToggleRecent?.(!filters.onlyRecent)}
              size="small"
              startIcon={filters.onlyRecent ? <UpdateIcon fontSize="small" /> : <HistoryToggleOffIcon fontSize="small" />}
            >
              Solo modifiche recenti
            </Button>
          </Stack>
          {isLoading && <LinearProgress />}
        </Stack>
      </Paper>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: { xs: 'none', lg: '0 0 280px' }, minWidth: { lg: 260 }, display: 'flex' }}>
          {explorerSlot}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
          {commessaListSlot}
        </Box>
        <Box sx={{ flex: { xs: 'none', lg: '0 0 380px' }, minWidth: { lg: 360 }, display: 'flex' }}>
          {workloadSlot}
        </Box>
      </Box>
    </Stack>
  );
}

CoordinatoreDashboardView.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string,
    period: PropTypes.string,
    onlyRecent: PropTypes.bool,
  }).isRequired,
  onSearchChange: PropTypes.func,
  onStatusChange: PropTypes.func,
  onPeriodChange: PropTypes.func,
  onToggleRecent: PropTypes.func,
  isLoading: PropTypes.bool,
  explorerSlot: PropTypes.node,
  commessaListSlot: PropTypes.node,
  workloadSlot: PropTypes.node,
};
