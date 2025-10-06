import React, { useMemo, useState } from 'react';
import { Box, Chip, Stack, Button, Typography, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, IconButton, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { computeDayDiff, summarizeDayDiff } from '@domains/timesheet/hooks/Timesheet/utils/timesheetModel';
import { useTimesheetContext, useTimesheetStaging } from '@domains/timesheet/hooks';
// Batch commit removed from UI (admin-only control stripped)

function useOptionalTimesheetContext() {
  try { return useTimesheetContext(); } catch { return null; }
}

export default function StagedChangesPanel({ compact = false, showActions = true, maxVisible = 8, showLegend = true, fullWidth = true }) {
  const ctx = useOptionalTimesheetContext();
  const staging = useTimesheetStaging(); // facade always returns an object

  // Build a flat, ordered list of staged day diffs using ONLY the staging entries (base snapshot + draft)
  // This makes the component behavior deterministic & independent of how/when outer pages refresh dataMap.
  const flat = useMemo(() => {
    const items = [];
    const nameById = {};
    (ctx?.employees || []).forEach(e => { if (e && e.id) nameById[e.id] = e.name || e.dipendente || e.id; });

    (staging.order || []).forEach(key => {
      const [empId, dateKey] = key.split('|');
      const entry = staging.entries?.[empId]?.[dateKey];
      if (!entry) return; // safety
      if (entry.op === 'noop') return; // filtered out
      const base = entry.base || [];
      const draft = entry.draft === null ? null : (entry.draft || []);
      const diff = computeDayDiff(base, draft);
      items.push({ employeeId: empId, label: nameById[empId] || empId, date: dateKey, diff, entry });
    });
    // Keep chronological order by date inside existing staging.order grouping
    items.sort((a,b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    return items;
  }, [staging.order, staging.entries, ctx?.employees]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', action: null, kind: null });
  // NOTE: batch commit flow removed from this shared component to avoid exposing
  // admin-only global commit UI. Per-item rollback (staging.rollbackEntry) remains available.

  const total = flat.length;
  const totalLabel = total === 1 ? `${total} giorno` : `${total} giorni`;

  const handleOpenOverflow = (e) => setAnchorEl(e.currentTarget);
  const handleCloseOverflow = () => setAnchorEl(null);

  const openSnack = (msg, kind) => setSnack({ open: true, msg, action: null, kind });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  // global save/discard removed — admin-only

  const handleRemoveEntry = (item, { rollback = false } = {}) => {
    const { employeeId, date } = item;
    const stagedEntry = staging.getStagedEntry(employeeId, date);
    if (!stagedEntry) return;
    // rollback: remove the staged entry (restore committed state)
    if (rollback) {
      staging.rollbackEntry(employeeId, date);
      openSnack(`Ripristinato ${date}`, 'rollback');
      return;
    }
    // revert (single click delete icon): also rollback (semantic difference not needed now that panel is snapshot-driven)
    staging.rollbackEntry(employeeId, date);
    openSnack(`Annullata modifica ${date}`, 'revert');
  };

  const extra = Math.max(0, flat.length - maxVisible);
  const open = Boolean(anchorEl);
  const isEmpty = total === 0;
  if (isEmpty && !showLegend) return null;

  const currentEmployeeId = ctx?.selection?.employeeId || (ctx?.employees && ctx.employees[0] && ctx.employees[0].id) || null;

  const hasStagedForCurrent = Boolean(currentEmployeeId && staging.entries?.[currentEmployeeId] && Object.keys(staging.entries[currentEmployeeId]).length > 0);

  const handleConfirmAll = async () => {
    try {
      await staging.confirmAll();
      openSnack('Modifiche confermate', 'commit');
    } catch (e) {
      console.error('confirmAll failed', e);
      openSnack('Errore durante il salvataggio', 'error');
    }
  };

  const handleDiscardAll = () => {
    staging.discardAll();
    openSnack('Tutte le modifiche locali annullate', 'rollback');
  };

  return (
    <Box
      data-staged-count={total}
      sx={{
        display: 'flex',
        flexWrap: compact ? 'nowrap' : 'wrap',
        alignItems: 'center',
        gap: 2,
        width: fullWidth ? '100%' : 'auto'
      }}>
      {showLegend && (
        <Box>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Modifiche in attesa di conferma</Typography>
          <Typography variant="caption" color="text.secondary">Le modifiche locali verranno applicate solo al salvataggio.</Typography>
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip icon={<AddCircleOutlineIcon fontSize="small" />} label="Inserimento" size="small" color="success" variant="outlined" />
              <Chip icon={<EditIcon fontSize="small" />} label="Modifica" size="small" color="warning" variant="outlined" />
              <Chip icon={<DeleteOutlineIcon fontSize="small" />} label="Cancellazione" size="small" color="error" variant="outlined" />
            </Stack>
          </Box>
        </Box>
      )}
      <Box sx={{
        flex: '1 1 auto',
        minWidth: 260,
        height: 56,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        gap: 1,
        overflow: 'hidden',
        width: fullWidth ? '100%' : 'auto'
      }}>
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', overflowX: 'auto', height: '100%', flex: 1 }}>
          {flat.slice(0, maxVisible).map((item, idx) => {
            const { diff } = item;
            let IconComp = EditIcon; let chipColor = 'warning';
            if (diff.type === 'day-delete') { IconComp = DeleteOutlineIcon; chipColor = 'error'; }
            else if (diff.type === 'new-day' || diff.type === 'insert-only') { IconComp = AddCircleOutlineIcon; chipColor = 'success'; }
            else if (diff.type === 'delete-only') { IconComp = DeleteOutlineIcon; chipColor = 'error'; }
            const summary = summarizeDayDiff(diff);
            const tooltipContent = (
              <Box sx={{ p: 0.5 }}>
                <Box sx={{ fontWeight: 600, mb: 0.5 }}>{item.label}</Box>
                <Typography variant="body2" sx={{ width: 140 }}>{item.date}</Typography>
                <Typography variant="caption" color="text.secondary">{summary}</Typography>
                {diff.changes && diff.changes.length > 0 && (
                  <Box sx={{ mt: 0.5, maxHeight: 160, overflow: 'auto' }}>
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
            const key = `${item.employeeId}-${item.date}-${idx}`;
            return (
              <Tooltip key={key} title={tooltipContent} placement="top" arrow>
                <Chip
                  icon={<IconComp fontSize="small" />}
                  label={compact ? item.date : `${item.date}`}
                  variant="outlined"
                  size={compact ? 'small' : 'medium'}
                  color={chipColor}
                  onDelete={(e) => { e.stopPropagation && e.stopPropagation(); handleRemoveEntry(item); }}
                  deleteIcon={<CloseIcon fontSize={compact ? 'small' : 'medium'} />}
                  onDoubleClick={(e) => { e.preventDefault(); handleRemoveEntry(item, { rollback: true }); }}
                  sx={compact ? { minWidth: 64, height: 28, paddingX: 0.5, fontSize: '0.75rem' } : undefined}
                />
              </Tooltip>
            );
          })}
        </Box>

        {extra > 0 && (
          <>
            <Chip
              label={`+${extra}`}
              size="small"
              onClick={handleOpenOverflow}
              sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
            />

            <Menu anchorEl={anchorEl} open={open} onClose={handleCloseOverflow} onClick={(e) => e.stopPropagation()}>
              {flat.slice(maxVisible).map((item, idx) => {
                const { diff } = item;
                let IconComp = EditIcon;
                if (diff.type === 'day-delete') { IconComp = DeleteOutlineIcon; }
                else if (diff.type === 'new-day' || diff.type === 'insert-only') { IconComp = AddCircleOutlineIcon; }
                else if (diff.type === 'delete-only') { IconComp = DeleteOutlineIcon; }
                const key = `overflow-${item.employeeId}-${item.date}-${idx}`;
                return (
                  <MenuItem key={key}>
                    <ListItemIcon><IconComp fontSize="small" /></ListItemIcon>
                    <ListItemText primary={item.date} secondary={summarizeDayDiff(diff)} />
                    <IconButton size="small" edge="end" onClick={(e) => { e.stopPropagation(); handleRemoveEntry(item); }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" edge="end" onClick={(e) => { e.stopPropagation(); handleRemoveEntry(item, { rollback: true }); }}>
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </MenuItem>
                );
              })}
            </Menu>
          </>
        )}
      </Box>

      {/* Per-employee commit/discard controls */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">{totalLabel}</Typography>
        {showActions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleDiscardAll}
              disabled={!hasStagedForCurrent}
            >
              Annulla
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={handleConfirmAll}
              disabled={!hasStagedForCurrent}
            >
              Conferma
            </Button>
          </Box>
        )}
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {snack.kind === 'commit' && <CheckCircleOutlineIcon fontSize="small" color="success" />}
            {snack.kind === 'rollback' && <UndoIcon fontSize="small" color="warning" />}
            {snack.kind === 'revert' && <CloseIcon fontSize="small" color="info" />}
            {snack.kind === 'error' && <ErrorOutlineIcon fontSize="small" color="error" />}
            <Typography variant="body2" sx={{ color: snack.kind === 'commit' ? 'success.main' : snack.kind === 'rollback' ? 'warning.main' : snack.kind === 'revert' ? 'info.main' : snack.kind === 'error' ? 'error.main' : 'text.primary', fontWeight: 500 }}>{snack.msg}</Typography>
          </Box>
        }
        ContentProps={{
          sx: theme => ({
            bgcolor: theme.palette.background.paper,
            border: '1px solid',
            borderColor: snack.kind === 'commit' ? 'success.light' : snack.kind === 'rollback' ? 'warning.light' : snack.kind === 'revert' ? 'info.light' : snack.kind === 'error' ? 'error.light' : 'divider',
            boxShadow: 6,
            px: 2,
            py: 1.25
          })
        }}
      />
    </Box>
  );
}
