// Minimal, clean staging panel implementation.
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Button, Divider, Chip, Tooltip, Menu, MenuItem, IconButton, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTimesheetStaging, useTimesheetContext, useTimesheetApi } from '@domains/timesheet/hooks';
import { computeDayDiff, summarizeDayDiff } from '@domains/timesheet/hooks/utils/timesheetModel.js';

export default function StagedChangesPanel({
  compact = false,
  maxVisible = 10,
  showLegend = true,
  enableOverflow = true,
  showActions = true,
}) {
  const staging = useTimesheetStaging();
  const ctx = (typeof useTimesheetContext === 'function') ? (() => { try { return useTimesheetContext(); } catch { return null; } })() : null;
  const { api } = useTimesheetApi();

  const ordered = staging?.order || [];
  const entries = staging?.entries || {};

  const flat = useMemo(() => {
    const items = [];
    const nameById = {};
    (ctx?.employees || []).forEach(e => { if (e && e.id) nameById[e.id] = e.name || e.dipendente || e.id; });
    ordered.forEach(key => {
      const [empId, dateKey] = key.split('|');
      const entry = entries[empId]?.[dateKey];
      if (!entry || entry.op === 'noop') return;
      items.push({ key, employeeId: empId, employeeName: nameById[empId] || empId, dateKey, ...entry });
    });
    return items;
  }, [ordered, entries, ctx]);

  // Local UI state for overflow menu & snack feedback (declare hooks before any conditional return)
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openOverflow = Boolean(anchorEl);
  const handleOpenOverflow = (e) => setAnchorEl(e.currentTarget);
  const handleCloseOverflow = () => setAnchorEl(null);

  const [snack, setSnack] = React.useState({ open: false, kind: 'info', msg: '' });
  const openSnack = (msg, kind = 'info') => setSnack({ open: true, kind, msg });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  if (!flat.length) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant={compact ? 'caption' : 'body2'} color="text.secondary">Nessuna modifica in staging.</Typography>
      </Box>
    );
  }

  const visible = flat.slice(0, maxVisible);

  const removeEntry = (item, { rollback = false } = {}) => {
    if (!staging) return;
    if (rollback) staging.rollback(item.employeeId, item.dateKey);
    else staging.rollback(item.employeeId, item.dateKey); // minimal rollback acts as remove
    openSnack(rollback ? 'Ripristinato il giorno' : 'Modifica annullata', rollback ? 'rollback' : 'revert');
  };

  const confirmAll = async () => {
    if (!staging?.confirmAll) return;
    try {
      await staging.confirmAll(async (payload) => {
        if (api?.batchSaveTimesheetEntries) {
          await api.batchSaveTimesheetEntries(payload);
        }
      });
      openSnack('Modifiche confermate', 'commit');
    } catch (e) {
      console.error('confirmAll failed', e);
      openSnack('Errore durante il salvataggio', 'error');
    }
  };

  const clearAll = () => {
    staging?.clearAll ? staging.clearAll() : staging?.discardAll?.();
    openSnack('Tutte le modifiche locali annullate', 'rollback');
  };

  const extra = flat.length - visible.length;

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">Modifiche in sospeso ({flat.length})</Typography>
        {flat.length > maxVisible && <Chip size="small" label={`+${flat.length - maxVisible} altre`} />}
      </Stack>
      <Divider />
      <Stack spacing={0.75}>
        {visible.map((item, idx) => {
          const diff = computeDayDiff(item.base || [], item.draft);
          let chipColor = 'default';
          if (diff.type === 'day-delete') chipColor = 'error';
          else if (diff.type === 'new-day') chipColor = 'success';
          else if (diff.type === 'delete-only') chipColor = 'error';
          const tooltipContent = (
            <Box sx={{ p: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.employeeName}</Typography>
              <Typography variant="caption" color="text.secondary">{item.dateKey}</Typography>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="caption">{summarizeDayDiff(diff)}</Typography>
              {diff.changes?.length > 0 && (
                <Box sx={{ mt: 0.5, maxHeight: 140, overflow: 'auto' }}>
                  {diff.changes.slice(0, 6).map((c, i) => (
                    <Typography key={i} variant="caption" sx={{ display: 'block' }}>
                      {c.type === 'insert' && `+ ${c.after?.commessa || ''} ${c.after?.ore || 0}h`}
                      {c.type === 'delete' && `− ${c.before?.commessa || ''} ${c.before?.ore || 0}h`}
                      {c.type === 'update' && `${c.before?.commessa || ''} ${c.before?.ore || 0}h → ${c.after?.commessa || ''} ${c.after?.ore || 0}h`}
                    </Typography>
                  ))}
                  {diff.changes.length > 6 && <Typography variant="caption">…</Typography>}
                </Box>
              )}
            </Box>
          );
          return (
            <Stack key={item.key} direction="row" spacing={1} alignItems="center" sx={{ fontSize: 12 }}>
              <Tooltip title={tooltipContent} placement="top" arrow>
                <Chip size="small" label={item.dateKey} color={chipColor} variant="outlined" />
              </Tooltip>
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>{summarizeDayDiff(diff)}</Typography>
              <IconButton size="small" onClick={() => removeEntry(item)} aria-label="annulla modifica">
                <CloseIcon fontSize="inherit" />
              </IconButton>
              <IconButton size="small" onClick={() => removeEntry(item, { rollback: true })} aria-label="ripristina base">
                <UndoIcon fontSize="inherit" />
              </IconButton>
            </Stack>
          );
        })}
      </Stack>
      <Divider />
      {showActions && (
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={confirmAll} disabled={!flat.length}>Conferma tutto</Button>
          <Button variant="outlined" size="small" onClick={clearAll} disabled={!flat.length}>Scarta tutto</Button>
          {enableOverflow && extra > 0 && (
            <Button size="small" onClick={handleOpenOverflow}>{`+${extra}`}</Button>
          )}
        </Stack>
      )}
      {enableOverflow && (
        <Menu anchorEl={anchorEl} open={openOverflow} onClose={handleCloseOverflow} onClick={(e) => e.stopPropagation()}>
          {flat.slice(maxVisible).map((item, idx) => {
            const diff = computeDayDiff(item.base || [], item.draft);
            return (
              <MenuItem key={item.key + idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                  <Chip size="small" label={item.dateKey} />
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>{summarizeDayDiff(diff)}</Typography>
                  <IconButton size="small" onClick={() => { removeEntry(item); }}><CloseIcon fontSize="inherit" /></IconButton>
                  <IconButton size="small" onClick={() => { removeEntry(item, { rollback: true }); }}><UndoIcon fontSize="inherit" /></IconButton>
                </Stack>
              </MenuItem>
            );
          })}
        </Menu>
      )}
      {showLegend && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label="new-day" color="success" variant="outlined" />
          <Chip size="small" label="day-delete" color="error" variant="outlined" />
          <Chip size="small" label="mixed/update/delete-only" variant="outlined" />
        </Stack>
      )}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          <Stack direction="row" spacing={1} alignItems="center">
            {snack.kind === 'commit' && <CheckCircleOutlineIcon fontSize="small" color="success" />}
            {snack.kind === 'rollback' && <UndoIcon fontSize="small" color="warning" />}
            {snack.kind === 'revert' && <CloseIcon fontSize="small" color="info" />}
            {snack.kind === 'error' && <ErrorOutlineIcon fontSize="small" color="error" />}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{snack.msg}</Typography>
          </Stack>
        }
      />
    </Stack>
  );
}

StagedChangesPanel.propTypes = {
  compact: PropTypes.bool,
  maxVisible: PropTypes.number,
  showLegend: PropTypes.bool,
  enableOverflow: PropTypes.bool,
  showActions: PropTypes.bool,
};
