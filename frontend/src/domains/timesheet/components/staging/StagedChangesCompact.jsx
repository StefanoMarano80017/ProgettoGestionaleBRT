// Compact variant of staging panel for use above calendar
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, IconButton, Chip, Tooltip, Snackbar, Badge } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/ModeEditOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTimesheetStaging, useOptionalTimesheetContext, useTimesheetApi } from '@domains/timesheet/hooks';
import { computeDayDiff, summarizeDayDiff } from '@domains/timesheet/hooks/utils/timesheetModel.js';

export default function StagedChangesCompact() {
  const staging = useTimesheetStaging();
  const ctx = useOptionalTimesheetContext();
  const { api } = useTimesheetApi();

  const ordered = staging?.order || [];
  const entries = staging?.entries || {};

  const flat = useMemo(() => {
    if (!ordered.length) return [];
    const nameById = {};
    (ctx?.employees || []).forEach(e => { if (e && e.id) nameById[e.id] = e.name || e.dipendente || e.id; });
    return ordered.map(key => {
      const [empId, dateKey] = key.split('|');
      const entry = entries[empId]?.[dateKey];
      return entry && entry.op !== 'noop' ? { key, employeeId: empId, employeeName: nameById[empId] || empId, dateKey, ...entry } : null;
    }).filter(Boolean);
  }, [ordered, entries, ctx]);

  const [snack, setSnack] = React.useState({ open: false, kind: 'info', msg: '' });
  const openSnack = (msg, kind = 'info') => setSnack({ open: true, kind, msg });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  const destage = (item) => {
    if (!staging || !item) return;
    try {
      if (typeof staging.rollbackEntry === 'function') staging.rollbackEntry(item.employeeId, item.dateKey);
      else if (typeof staging.discardEntry === 'function') staging.discardEntry(item.employeeId, item.dateKey);
      else if (typeof staging.resetEntry === 'function') staging.resetEntry(item.employeeId, item.dateKey);
      openSnack('Modifica rimossa', 'revert');
    } catch (e) {
      console.error('Destage failed', e);
      openSnack('Errore rimozione', 'error');
    }
  };

  const clearAll = () => {
    staging?.discardAll?.();
    openSnack('Tutte le modifiche annullate', 'rollback');
  };

  const confirmAll = async () => {
    if (!staging?.confirmAll || !flat.length) return;
    try {
      await staging.confirmAll(async (payload) => {
        if (!api?.batchSaveTimesheetEntries) {
          throw new Error('API di salvataggio non disponibile');
        }
        await api.batchSaveTimesheetEntries(payload);
      });
      openSnack('Modifiche confermate con successo', 'commit');
    } catch (e) {
      console.error('confirmAll failed', e);
      const errorMsg = e.message?.includes('API') ? 'Servizio non disponibile' : 'Errore durante il salvataggio';
      openSnack(errorMsg + '. Riprova.', 'error');
    }
  };

  const chipStyle = (theme, paletteKey) => ({
    bgcolor: alpha(theme.palette[paletteKey].main, 0.15),
    borderColor: theme.palette[paletteKey].main,
    color: theme.palette[paletteKey].dark,
    '& .MuiChip-deleteIcon': {
      color: theme.palette[paletteKey].main,
      opacity: 0.8,
      '&:hover': { color: theme.palette[paletteKey].dark }
    }
  });

  const formatDateIt = (value) => {
    if (!value) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}`;
    }
    const dt = new Date(value);
    if (!isNaN(dt)) {
      const d = String(dt.getDate()).padStart(2, '0');
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      return `${d}/${m}`;
    }
    return value;
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        p: 1, 
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        mb: 1
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        {/* Left: Count chip like extended version */}
        <Chip
          label={flat.length}
          size="small"
          color="primary"
          sx={{ 
            fontWeight: 600,
            minWidth: '32px',
            height: '24px'
          }}
        />

        {/* Center: Chips horizontal scroll */}
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            gap: 0.5, 
            overflowX: 'auto', 
            overflowY: 'hidden',
            mx: 1,
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '2px',
            }
          }}
        >
          {flat.map((item) => {
            const diff = computeDayDiff(item.base || [], item.draft);
            let paletteKey = 'default';
            let icon = null;
            if (['new-day'].includes(diff.type)) { paletteKey = 'success'; icon = <AddCircleOutlineIcon fontSize="inherit" />; }
            else if (['day-delete', 'delete-only'].includes(diff.type)) { paletteKey = 'error'; icon = <DeleteOutlineIcon fontSize="inherit" />; }
            else if (['mixed', 'update', 'update-only'].includes(diff.type)) { paletteKey = 'warning'; icon = <EditOutlinedIcon fontSize="inherit" />; }
            const summary = summarizeDayDiff(diff);
            return (
              <Tooltip
                key={item.key}
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatDateIt(item.dateKey)}</Typography>
                    <Typography variant="caption" display="block">{summary}</Typography>
                  </Box>
                }
                arrow
              >
                <Chip
                  size="small"
                  label={formatDateIt(item.dateKey)}
                  onDelete={(e) => { e.stopPropagation(); destage(item); }}
                  deleteIcon={<CloseIcon fontSize="small" />}
                  icon={icon}
                  variant="outlined"
                  sx={(theme) => (paletteKey === 'default' ? { bgcolor: theme.palette.action.hover } : chipStyle(theme, paletteKey))}
                />
              </Tooltip>
            );
          })}
        </Box>

        {/* Right: Action buttons */}
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Annulla tutte">
            <span>
              <IconButton size="small" onClick={clearAll} color="default" disabled={!flat.length}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Conferma tutte">
            <span>
              <IconButton size="small" onClick={confirmAll} color="primary" disabled={!flat.length}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 3,
            borderRadius: 1
          }
        }}
        message={
          <Stack direction="row" spacing={1} alignItems="center">
            {snack.kind === 'commit' && <CheckCircleOutlineIcon fontSize="small" color="success" />}
            {snack.kind === 'rollback' && <UndoIcon fontSize="small" color="warning" />}
            {snack.kind === 'revert' && <CloseIcon fontSize="small" color="info" />}
            {snack.kind === 'error' && <ErrorOutlineIcon fontSize="small" color="error" />}
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{snack.msg}</Typography>
          </Stack>
        }
      />
    </Box>
  );
}

StagedChangesCompact.displayName = 'StagedChangesCompact';
