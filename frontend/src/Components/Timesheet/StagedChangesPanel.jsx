import React, { useMemo, useState } from 'react';
import { Box, Chip, Stack, Button, Typography, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, IconButton, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { computeDayDiff, summarizeDayDiff } from '@hooks/Timesheet/utils/timesheetModel';
import { useTimesheetContext } from '@hooks/Timesheet';
import applyStagedToMock from '@hooks/Timesheet/utils/applyStagedToMock';

function useOptionalTimesheetContext() {
  try { return useTimesheetContext(); } catch { return null; }
}

export default function StagedChangesPanel({ compact = false, showActions = true, maxVisible = 8, showLegend = true }) {
  const ctx = useOptionalTimesheetContext();
  const stagedMap = useMemo(() => ctx?.stagedMap || {}, [ctx?.stagedMap]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', action: null, kind: null });

  const flat = useMemo(() => {
    const items = [];
    const employees = ctx?.employees || [];
    const nameById = {};
    employees.forEach(e => { if (e && e.id) nameById[e.id] = e.name || e.dipendente || e.id; });
    Object.entries(stagedMap).forEach(([empId, days]) => {
      Object.entries(days || {}).forEach(([dk, val]) => {
        const orig = ctx?.dataMap?.[empId]?.[dk] || [];
        const diff = computeDayDiff(orig, val);
        items.push({ employeeId: empId, label: nameById[empId] || empId, date: dk, diff });
      });
    });
    items.sort((a,b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    return items;
  }, [stagedMap, ctx]);

  const total = flat.length;
  const totalLabel = total === 1 ? `${total} giorno` : `${total} giorni`;

  const handleOpenOverflow = (e) => setAnchorEl(e.currentTarget);
  const handleCloseOverflow = () => setAnchorEl(null);

  const openSnack = (msg, kind) => setSnack({ open: true, msg, action: null, kind });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  const handleGlobalSave = async () => {
    if (!ctx || !ctx.commitStaged) return;
    try {
      const snapshot = flat.slice();
      await ctx.commitStaged(applyStagedToMock);
      if (snapshot.length) {
        let ins=0, upd=0, del=0; snapshot.forEach(it=>{const t=it.diff.type; if(t==='day-delete'||t==='delete-only') del++; else if(t==='new-day'||t==='insert-only') ins++; else upd++;});
        const parts=[]; if(ins) parts.push(`${ins} nuovi`); if(upd) parts.push(`${upd} modificati`); if(del) parts.push(`${del} eliminati`);
  const detail = parts.length?` (${parts.join(', ')})`:'';
  openSnack(`Confermati ${snapshot.length} giorni${detail}`, 'commit');
      } else {
        openSnack('Nessuna modifica da confermare', 'commit');
      }
    } catch (e) {
       
      console.error('Global commit failed', e);
    }
  };

  const handleGlobalDiscard = () => {
    if (!ctx || !ctx.discardStaged) return;
    ctx.discardStaged();
  };

  const handleRemoveEntry = (item) => {
    if (!ctx) return;
    const { employeeId, date, diff } = item;
    const origArr = ctx.dataMap?.[employeeId]?.[date] || [];
    if (diff.type === 'day-delete') {
      ctx.stageReplace(employeeId, date, origArr.slice());
      return; // NO snack
    }
    ctx.stageReplace(employeeId, date, origArr.slice());
    return; // NO snack
  };

  const extra = Math.max(0, flat.length - maxVisible);
  const open = Boolean(anchorEl);
  const isEmpty = !Object.keys(stagedMap || {}).length;
  if (isEmpty && !showLegend) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
        // central chips area: fixed height to keep layout stable and visual balance
        flex: '1 1 520px',
        minWidth: 220,
        height: 56,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        gap: 1,
        overflow: 'hidden'
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', overflowX: 'auto', height: '100%' }}>
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
                  </MenuItem>
                );
              })}
            </Menu>
          </>
        )}
      </Box>

      {showActions ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{totalLabel}</Typography>
          <Button size="small" variant="outlined" onClick={handleGlobalDiscard}>Annulla</Button>
          <Button size="small" variant="contained" onClick={handleGlobalSave}>Conferma</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{totalLabel}</Typography>
        </Box>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {snack.kind === 'commit' && <CheckCircleOutlineIcon fontSize="small" color="success" />}
            <Typography variant="body2" sx={{ color: snack.kind === 'commit' ? 'success.main' : 'text.primary', fontWeight: 500 }} >{snack.msg}</Typography>
          </Box>
        }
        ContentProps={{
          sx: theme => ({
            bgcolor: theme.palette.background.paper,
            border: '1px solid',
            borderColor: snack.kind === 'commit' ? 'success.light' : 'divider',
            boxShadow: 6,
            px: 2,
            py: 1.25
          })
        }}
      />
    </Box>
  );
}
