// Minimal, clean staging panel implementation.
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Button, Chip, Snackbar } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UndoIcon from '@mui/icons-material/Undo';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTimesheetStaging, useOptionalTimesheetContext, useTimesheetApi } from '@domains/timesheet/hooks';
import { StagedChangesSummary } from './StagedChangesSummary.jsx';
import { StagedChangesLegend } from './StagedChangesLegend.jsx';

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

export default function StagedChangesPanel({ showLegend = true, validateDraft }) {
  const staging = useTimesheetStaging();
  const ctx = useOptionalTimesheetContext();
  const { api } = useTimesheetApi();

  const ordered = staging?.order ?? EMPTY_ARRAY;
  const entries = staging?.entries ?? EMPTY_OBJECT;

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
  const ConfirmButtons = (
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="outlined" size="small" onClick={clearAll} disabled={!flat.length}>Annulla</Button>
          <Button variant="contained" size="small" onClick={confirmAll} disabled={!flat.length}>Conferma</Button>
        </Stack>
  );
  // (Removed early return to keep layout consistent even with 0 changes)

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
          <StagedChangesSummary items={flat} onRemove={destage} validateDraft={validateDraft} />
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
          {showLegend ? <StagedChangesLegend sx={{ mt: 0.75 }} /> : <Box />}
          {ConfirmButtons}
        </Box>
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
  validateDraft: PropTypes.func,
};
