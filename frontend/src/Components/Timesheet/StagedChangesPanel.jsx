import React, { useMemo, useState } from 'react';
import { Box, Chip, Stack, Button, Typography, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, IconButton, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTimesheetContext } from '@hooks/Timesheet';
import applyStagedToMock from '@hooks/Timesheet/utils/applyStagedToMock';

export default function StagedChangesPanel({ compact = false, showActions = true, maxVisible = 8, showLegend = true }) {
  const ctx = (() => { try { return useTimesheetContext(); } catch (_) { return null; } })();
  const stagedMap = ctx?.stagedMap || {};
  const [anchorEl, setAnchorEl] = useState(null);
  const [undoStack, setUndoStack] = useState([]); // stack of actions to undo
  const [snack, setSnack] = useState({ open: false, msg: '', action: null });

  // Build flat list of staged items (one per changed record) for rendering
  const flat = useMemo(() => {
    const items = [];
    const employees = ctx?.employees || [];
    const nameById = {};
    employees.forEach(e => { if (e && e.id) nameById[e.id] = e.name || e.dipendente || e.id; });

    const same = (a, b) => {
      if (!a || !b) return false;
      return String(a.commessa||'') === String(b.commessa||'') && Number(a.ore||0) === Number(b.ore||0) && String(a.descrizione||'') === String(b.descrizione||'');
    };

    Object.entries(stagedMap).forEach(([empId, days]) => {
      if (!days) return;
      Object.entries(days).forEach(([dk, recs]) => {
        const label = nameById[empId] || empId;
        const origArr = (ctx?.dataMap?.[empId]?.[dk]) || [];
        if (recs === null) {
          items.push({ employeeId: empId, label, date: dk, action: 'day-delete', record: null, origRecord: null, origIndex: -1, stagedIndex: -1 });
          return;
        }
        const stagedArr = Array.isArray(recs) ? recs : [];
        // Build maps by _id or fallback key
        const keyFor = (r, i) => (r && r._id) ? r._id : `idx:${i}`;
        const origMap = new Map();
        origArr.forEach((r,i) => origMap.set(keyFor(r,i), { rec: r, index: i }));
        const stagedMapLocal = new Map();
        stagedArr.forEach((r,i) => stagedMapLocal.set(keyFor(r,i), { rec: r, index: i }));

        // Deletions & updates
        origMap.forEach((oval, id) => {
          if (!stagedMapLocal.has(id)) {
            // deleted
            items.push({ employeeId: empId, label, date: dk, action: 'delete', record: oval.rec, origRecord: oval.rec, origIndex: oval.index, stagedIndex: -1 });
          } else {
            const sval = stagedMapLocal.get(id);
            if (!same(oval.rec, sval.rec)) {
              items.push({ employeeId: empId, label, date: dk, action: 'update', record: sval.rec, origRecord: oval.rec, origIndex: oval.index, stagedIndex: sval.index });
            }
          }
        });
        // Insertions
        stagedMapLocal.forEach((sval, id) => {
          if (!origMap.has(id)) {
            items.push({ employeeId: empId, label, date: dk, action: 'insert', record: sval.rec, origRecord: null, origIndex: -1, stagedIndex: sval.index });
          }
        });
      });
    });
    // Optional: stable ordering (by date then action priority)
    const actionOrder = { 'day-delete':0, delete:1, update:2, insert:3 };
    items.sort((a,b) => a.date===b.date ? (actionOrder[a.action]-actionOrder[b.action]) : (a.date < b.date ? -1 : 1));
    return items;
  }, [stagedMap, ctx]);

  const total = flat.length;
  const totalLabel = total === 1 ? `${total} modifica` : `${total} modifiche`;

  const handleOpenOverflow = (e) => setAnchorEl(e.currentTarget);
  const handleCloseOverflow = () => setAnchorEl(null);

  const handleGlobalSave = async () => {
    if (!ctx || !ctx.commitStaged) return;
    try {
      await ctx.commitStaged(applyStagedToMock);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Global commit failed', e);
    }
  };

  const handleGlobalDiscard = () => {
    if (!ctx || !ctx.discardStaged) return;
    ctx.discardStaged();
  };

  const handleSaveFor = async (employeeId) => {
    if (!ctx || !ctx.commitStagedFor) return;
    try {
      await ctx.commitStagedFor(employeeId, applyStagedToMock);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Commit for', employeeId, 'failed', e);
    }
  };

  const handleDiscardFor = (employeeId) => {
    if (!ctx || !ctx.discardStaged) return;
    ctx.discardStaged({ employeeId });
  };

  const pushUndo = (undoAction) => setUndoStack(prev => [...prev, undoAction]);
  const popUndo = () => setUndoStack(prev => { const copy = [...prev]; return copy.pop(); });
  const openSnack = (msg) => setSnack({ open: true, msg, action: 'undo' });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  const handleRemoveEntry = (item) => {
    if (!ctx || typeof ctx.stageUpdate !== 'function') return;
    const { employeeId, date: dateKey, action, origIndex, stagedIndex } = item;
    const current = stagedMap[employeeId]?.[dateKey];
    const origArr = ctx.dataMap?.[employeeId]?.[dateKey] || [];

    // Day deletion removal => restore original array
    if (action === 'day-delete') {
      const before = current; // null
      ctx.stageUpdate(employeeId, dateKey, origArr.slice());
      pushUndo(() => ctx.stageUpdate(employeeId, dateKey, before));
      openSnack('Ripristinato giorno');
      return;
    }

    const stagedArr = Array.isArray(current) ? current.slice() : [];

    let undo;
    if (action === 'insert') {
      let removed;
      if (stagedIndex >= 0 && stagedIndex < stagedArr.length) {
        removed = stagedArr.splice(stagedIndex, 1)[0];
        undo = () => {
          const cur = stagedMap[employeeId]?.[dateKey];
          const base = Array.isArray(cur) ? cur.slice() : [];
          base.splice(stagedIndex, 0, removed);
          ctx.stageUpdate(employeeId, dateKey, base);
        };
      }
      openSnack('Rimossa nuova voce');
    } else if (action === 'update') {
      let prevVal;
      if (stagedIndex >= 0 && origIndex >= 0 && stagedIndex < stagedArr.length && origIndex < origArr.length) {
        prevVal = stagedArr[stagedIndex];
        stagedArr[stagedIndex] = { ...origArr[origIndex] };
        undo = () => {
          const cur = stagedMap[employeeId]?.[dateKey];
            const base = Array.isArray(cur) ? cur.slice() : [];
            base[stagedIndex] = prevVal;
            ctx.stageUpdate(employeeId, dateKey, base);
        };
      }
      openSnack('Modifica annullata');
    } else if (action === 'delete') {
      let restored;
      if (origIndex >= 0 && origIndex < origArr.length) {
        restored = { ...origArr[origIndex] };
        stagedArr.splice(origIndex, 0, restored);
        undo = () => {
          const cur = stagedMap[employeeId]?.[dateKey];
          const base = Array.isArray(cur) ? cur.slice() : [];
          // find by _id if possible
          const idx = base.findIndex(r => r && restored && r._id === restored._id);
          if (idx >= 0) base.splice(idx, 1);
          ctx.stageUpdate(employeeId, dateKey, base);
        };
      }
      openSnack('Voce ripristinata');
    }

    // If stagedArr equals origArr after the change, collapse by sending origArr
    const equal = stagedArr.length === origArr.length && stagedArr.every((r, i) => {
      const o = origArr[i];
      return String(r?.commessa || '') === String(o?.commessa || '') && Number(r?.ore || 0) === Number(o?.ore || 0);
    });
    ctx.stageUpdate(employeeId, dateKey, equal ? origArr.slice() : stagedArr);
    if (undo) pushUndo(undo);
  };

  const handleUndo = () => {
    const act = popUndo();
    if (typeof act === 'function') {
      act();
    }
    closeSnack();
  };

  // Always render a minimal view so developers can see stagedMap contents during debugging.
  const isEmpty = !Object.keys(stagedMap || {}).length;
  // If there are no staged changes but the caller asked to show the legend,
  // still render the legend area. Only return null when nothing to display
  // (no staged changes and legend suppressed).
  if (isEmpty && !showLegend) return null;

  const extra = Math.max(0, flat.length - maxVisible);

  const open = Boolean(anchorEl);

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
            let IconComp = EditIcon;
            let chipColor = 'default';
            if (item.action === 'day-delete' || item.action === 'delete') { IconComp = DeleteOutlineIcon; chipColor = 'error'; }
            else if (item.action === 'insert') { IconComp = AddCircleOutlineIcon; chipColor = 'success'; }
            else if (item.action === 'update') { IconComp = EditIcon; chipColor = 'warning'; }

            const entryLabel = item.action === 'day-delete'
              ? 'Cancellazione giorno'
              : item.record ? `${String(item.record.commessa || '')} ${item.record.ore || 0}h` : 'Voce';
            const diffs = [];
            if (item.action === 'update' && item.origRecord && item.record) {
              if (String(item.origRecord.commessa || '') !== String(item.record.commessa || '')) {
                diffs.push(`Commessa: ${item.origRecord.commessa || '—'} → ${item.record.commessa || '—'}`);
              }
              if (Number(item.origRecord.ore || 0) !== Number(item.record.ore || 0)) {
                diffs.push(`Ore: ${item.origRecord.ore || 0} → ${item.record.ore || 0}`);
              }
            }
            const tooltipContent = (
              <Box sx={{ p: 0.5 }}>
                <Box sx={{ fontWeight: 600, mb: 0.5 }}>{item.label}</Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ width: 120 }}>{item.date}</Typography>
                  <Typography variant="body2" color="text.secondary">{
                    item.action === 'insert' ? 'Inserimento' :
                    item.action === 'update' ? 'Modifica' :
                    (item.action === 'delete' || item.action === 'day-delete') ? 'Cancellazione' : 'Nessuna'
                  }</Typography>
                </Box>
                {item.record && item.action !== 'day-delete' && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2">{String(item.record.commessa || '')} — {item.record.ore || 0}h</Typography>
                  </Box>
                )}
                {diffs.length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                    {diffs.map((d, i) => <Typography key={i} variant="caption" sx={{ display: 'block' }}>{d}</Typography>)}
                  </Box>
                )}
              </Box>
            );

            const key = `${item.employeeId}-${item.date}-${item.action}-${item.origIndex}-${item.stagedIndex}-${idx}`;
            return (
              <Tooltip key={key} title={tooltipContent} placement="top" arrow>
                {compact ? (
                  <Chip
                    icon={<IconComp fontSize="small" />}
                    label={item.date}
                    variant="outlined"
                    size="small"
                    color={chipColor}
                    onClick={() => { /* could open detail */ }}
                    onDelete={(e) => { e.stopPropagation && e.stopPropagation(); handleRemoveEntry(item); }}
                    deleteIcon={<CloseIcon fontSize="small" />}
                    sx={{ minWidth: 64, height: 28, paddingX: 0.5, fontSize: '0.75rem' }}
                  />
                ) : (
                  <Chip
                    icon={<IconComp fontSize="small" />}
                    label={`${item.label} ${item.date}`}
                    variant="outlined"
                    size={compact ? 'small' : 'medium'}
                    color={chipColor}
                    onClick={() => { /* could open detail */ }}
                    onDelete={(e) => { e.stopPropagation && e.stopPropagation(); handleRemoveEntry(item); }}
                    deleteIcon={<CloseIcon fontSize={compact ? 'small' : 'medium'} />}
                  />
                )}
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
                let IconComp = EditIcon;
                let chipColor = 'default';
                if (item.action === 'day-delete' || item.action === 'delete') { IconComp = DeleteOutlineIcon; chipColor = 'error'; }
                else if (item.action === 'insert') { IconComp = AddCircleOutlineIcon; chipColor = 'success'; }
                else if (item.action === 'update') { IconComp = EditIcon; chipColor = 'warning'; }

                const entryLabel = item.action === 'day-delete'
                  ? 'Cancellazione giorno'
                  : item.record ? `${String(item.record.commessa || '')} ${item.record.ore || 0}h` : 'Voce';
                const labelText = compact ? item.date : `${item.label} ${item.date}`;
                const key = `overflow-${item.employeeId}-${item.date}-${item.action}-${item.origIndex}-${item.stagedIndex}-${idx}`;
                return (
                  <MenuItem key={key} onClick={() => { /* could open detail */ }}>
                    <ListItemIcon>
                      <IconComp fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={labelText} secondary={entryLabel} />
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

      {/* legend moved to Dashboard header */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        message={snack.msg}
        action={snack.action ? (
          <Button size="small" color="inherit" onClick={handleUndo}>Annulla</Button>
        ) : null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
