/**
 * Purpose: Layout shell for the Coordinatore dashboard with filters and three responsive slots.
 * Inputs: props { filters, onSearchChange, onStatusChange, onPeriodChange, isLoading, explorerSlot, commessaListSlot, workloadSlot }
 * Outputs: Invokes callbacks on filter interactions.
 */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stack,
} from '@mui/material';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { PageHero } from '@shared/components/PageHeader/';

export default function CoordinatoreDashboardView({
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

        <Stack spacing={3}>
          {/* Top row: Explorer and Commessa List */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, height: { xs: 'auto', lg: 1020 } }}>
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
  explorerSlot: PropTypes.node,
  commessaListSlot: PropTypes.node,
  workloadSlot: PropTypes.node,
};
