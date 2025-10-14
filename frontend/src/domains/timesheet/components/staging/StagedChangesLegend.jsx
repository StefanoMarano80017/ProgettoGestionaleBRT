import React from 'react';
import PropTypes from 'prop-types';
import { Stack, Chip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/ModeEditOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { buildChipStyle } from './chipStyles.js';

export function StagedChangesLegend({ spacing = 1, sx }) {
  return (
    <Stack direction="row" spacing={spacing} flexWrap="wrap" sx={sx}>
      <Chip size="small" label="Nuovo" icon={<AddCircleOutlineIcon fontSize="inherit" />} variant="outlined" sx={(t) => buildChipStyle(t, 'success')} />
      <Chip size="small" label="Modificato" icon={<EditOutlinedIcon fontSize="inherit" />} variant="outlined" sx={(t) => buildChipStyle(t, 'warning')} />
      <Chip size="small" label="Eliminato" icon={<DeleteOutlineIcon fontSize="inherit" />} variant="outlined" sx={(t) => buildChipStyle(t, 'error')} />
    </Stack>
  );
}

StagedChangesLegend.propTypes = {
  spacing: PropTypes.number,
  sx: PropTypes.object,
};
