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
  Paper,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import UpdateIcon from '@mui/icons-material/Update';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { PageHero } from '@shared/components/PageHeader/';

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
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', py: 4 }}>
      <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <PageHero
            title="Dashboard Coordinatore"
            subtitle="Gestisci commesse, assegna risorse e monitora il workload del team"
            icon={SupervisorAccountIcon}
            color="primary"
            useCustomBlueGradient={true}
            sx={{ 
              p: { xs: 2, md: 3 },
              mb: 0,
            }}
          />
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            mb: 3,
            border: '2px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between' }} alignItems={{ xs: 'stretch' }} flexWrap="wrap">
              <TextField
                value={filters.search}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder="Cerca commessa"
                size="small"
                sx={{ 
                  minWidth: { xs: '100%', md: 320 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
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
                sx={{ 
                  flexShrink: 0,
                  '& .MuiToggleButton-root': {
                    borderRadius: 1.5,
                    px: 1,
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
                {STATUS_OPTIONS.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>{option.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
              <ToggleButtonGroup
                value={filters.period}
                exclusive
                size="small"
                onChange={(_, value) => value && onPeriodChange?.(value)}
                sx={{ 
                  flexShrink: 0,
                  '& .MuiToggleButton-root': {
                    borderRadius: 1.5,
                    px: 2.5,
                    py: 0.75,
                    fontWeight: 500,
                    minWidth: 140,
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
                sx={{ 
                  flexShrink: 0,
                  borderRadius: 1.5,
                  px: 2,
                  fontWeight: 500,
                }}
              >
                Solo recenti
              </Button>
            </Stack>
            {isLoading && <LinearProgress />}
          </Stack>
        </Paper>

        <Stack spacing={3}>
          {/* Top row: Explorer and Commessa List */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, height: { xs: 'auto', lg: 720 } }}>
            <Box sx={{ flex: { xs: 'none', lg: '0 0 320px' }, minWidth: { lg: 300 }, display: 'flex', height: { xs: 'auto', lg: '100%' } }}>
              {explorerSlot}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', height: { xs: 'auto', lg: '100%' }, minHeight: 0 }}>
              {commessaListSlot}
            </Box>
          </Box>

          {/* Bottom row: Workload panel full width */}
          <Box sx={{ width: '100%', display: 'flex', height: { xs: 'auto', lg: 720 } }}>
            {workloadSlot}
          </Box>
        </Stack>
      </Box>
    </Box>
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
