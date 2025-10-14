import React from 'react';
import PropTypes from 'prop-types';
import { Stack, Typography, Chip, Tooltip, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { computeDayDiff, summarizeDayDiff } from '@domains/timesheet/hooks/utils/timesheetModel.js';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/ModeEditOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { buildChipStyle } from './chipStyles.js';

const paletteByDiff = {
  success: ['new-day'],
  error: ['day-delete', 'delete-only'],
  warning: ['mixed', 'update', 'update-only']
};

const selectPaletteKey = (diffType) => {
  if (!diffType) return 'default';
  if (paletteByDiff.success.includes(diffType)) return 'success';
  if (paletteByDiff.error.includes(diffType)) return 'error';
  if (paletteByDiff.warning.includes(diffType)) return 'warning';
  return 'default';
};

const iconByPalette = {
  success: <AddCircleOutlineIcon fontSize="inherit" />,
  error: <DeleteOutlineIcon fontSize="inherit" />,
  warning: <EditOutlinedIcon fontSize="inherit" />
};

const formatDateIt = (value) => {
  if (!value) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}-${m}-${y}`;
  }
  const dt = new Date(value);
  if (!Number.isNaN(dt)) {
    const d = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const y = dt.getFullYear();
    return `${d}-${m}-${y}`;
  }
  return value;
};

export function StagedChangesSummary({ items, onRemove, validateDraft }) {
  if (!items?.length) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', opacity: 0.7 }}>
        <Typography variant="caption" color="text.secondary">Nessuna modifica</Typography>
      </Stack>
    );
  }

  return items.map((item) => {
    const diff = computeDayDiff(item.base || [], item.draft);
    const diffType = diff?.type;
    const paletteKey = selectPaletteKey(diffType);
    const icon = iconByPalette[paletteKey] || null;
    const summary = summarizeDayDiff(diff);
    const validation = typeof validateDraft === 'function' ? validateDraft(item.employeeId, item.dateKey, item.draft) : { ok: true };
    const invalid = validation && validation.ok === false;
    const tooltipContent = (
      <Stack spacing={0.5} sx={{ p: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatDateIt(item.dateKey)}</Typography>
        <Divider flexItem sx={{ my: 0.5 }} />
        <Typography variant="caption">{summary}</Typography>
        {invalid && (
          <Typography variant="caption" color="error" sx={{ display: 'block' }}>
            {validation.error || 'Bozza non valida per le regole PM Campo'}
          </Typography>
        )}
      </Stack>
    );

    const chipSx = (theme) => {
      if (invalid) {
        return {
          borderColor: alpha(theme.palette.error.main, 0.6),
          color: theme.palette.error.dark,
          bgcolor: alpha(theme.palette.error.main, 0.12),
        };
      }
      if (paletteKey === 'default') {
        return { bgcolor: theme.palette.action.hover };
      }
      return buildChipStyle(theme, paletteKey);
    };

    return (
      <Tooltip key={item.key} title={tooltipContent} arrow>
        <Chip
          size="small"
          label={formatDateIt(item.dateKey)}
          onDelete={(e) => { e.stopPropagation(); onRemove(item); }}
          deleteIcon={<CloseIcon />}
          icon={icon}
          variant="outlined"
          sx={chipSx}
        />
      </Tooltip>
    );
  });
}

StagedChangesSummary.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    employeeId: PropTypes.string,
    dateKey: PropTypes.string.isRequired,
    draft: PropTypes.any,
    base: PropTypes.any
  })),
  onRemove: PropTypes.func.isRequired,
  validateDraft: PropTypes.func,
};
