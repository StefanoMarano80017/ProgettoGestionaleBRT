// Minimal, clean staging panel implementation.
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Button, Chip, Tooltip, Snackbar, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/ModeEditOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTimesheetStaging, useOptionalTimesheetContext, useTimesheetApi } from '@domains/timesheet/hooks';
import { computeDayDiff, summarizeDayDiff } from '@domains/timesheet/hooks/utils/timesheetModel.js';

export default function StagedChangesPanel({ showLegend = true }) {
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

  // Legend helper
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

  const Legend = showLegend ? (
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.75 }}>
      <Chip size="small" label="Nuovo" icon={<AddCircleOutlineIcon fontSize="inherit" />} variant="outlined" sx={(t) => chipStyle(t, 'success')} />
      <Chip size="small" label="Modificato" icon={<EditOutlinedIcon fontSize="inherit" />} variant="outlined" sx={(t) => chipStyle(t, 'warning')} />
      <Chip size="small" label="Eliminato" icon={<DeleteOutlineIcon fontSize="inherit" />} variant="outlined" sx={(t) => chipStyle(t, 'error')} />
    </Stack>
  ) : null;

  const ConfirmButtons = (
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="outlined" size="small" onClick={clearAll} disabled={!flat.length}>Annulla</Button>
          <Button variant="contained" size="small" onClick={confirmAll} disabled={!flat.length}>Conferma</Button>
        </Stack>
  );
  // (Removed early return to keep layout consistent even with 0 changes)

  // Utility: format dates as gg-MM-yyyy (Italian)
  const formatDateIt = (value) => {
    if (!value) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { // yyyy-MM-dd
      const [y, m, d] = value.split('-');
      return `${d}-${m}-${y}`;
    }
    // Try Date fallback
    const dt = new Date(value);
    if (!isNaN(dt)) {
      const d = String(dt.getDate()).padStart(2, '0');
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const y = dt.getFullYear();
      return `${d}-${m}-${y}`;
    }
    return value;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, width: '100%' }}>
      {/* Left description + legend */}
      <Box sx={{ flex: '0 0 250px', maxWidth: 280 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="subtitle2">Staging Timesheet</Typography>
          <Chip size="small" label={flat.length} sx={(t) => ({ height: 20, fontSize: 11, bgcolor: alpha(t.palette.info.main, 0.15), border: '1px solid '+t.palette.info.light })} />
        </Stack>
        <Typography variant="caption" color="text.secondary" component="p">
          Le modifiche vengono accumulate prima del salvataggio definitivo.
        </Typography>
        {/* Legend moved under changes box */}
      </Box>

      {/* Right chips area with fixed size and horizontal buttons */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <Box
          sx={{
            position: 'relative',
            p: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            overflowY: 'auto',
            maxHeight: 35,
            minHeight: 35,
            alignItems: 'center',
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
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="caption">{summary}</Typography>
                  </Box>
                }
                arrow
              >
                <Chip
                  size="small"
                  label={formatDateIt(item.dateKey)}
                  onDelete={(e) => { e.stopPropagation(); destage(item); }}
                  deleteIcon={<CloseIcon />}
                  icon={icon}
                  variant="outlined"
                  sx={(theme) => (paletteKey === 'default' ? { bgcolor: theme.palette.action.hover } : chipStyle(theme, paletteKey))}
                />
              </Tooltip>
            );
          })}
          {!flat.length && (
            <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', opacity: 0.7 }}>
              <Typography variant="caption" color="text.secondary">Nessuna modifica</Typography>
            </Stack>
          )}
        </Box>
        <Box display="flex" justifyContent="space-between" sx={{ pt: 1 }}>{Legend} {ConfirmButtons} </Box>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
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

StagedChangesPanel.propTypes = {
  showLegend: PropTypes.bool,
};
