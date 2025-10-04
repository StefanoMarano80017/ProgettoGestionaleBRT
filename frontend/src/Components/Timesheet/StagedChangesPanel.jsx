import React, { useMemo } from 'react';
import { Box, Chip, Stack, Button, Typography, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTimesheetContext } from '@hooks/Timesheet';
import applyStagedToMock from '@hooks/Timesheet/utils/applyStagedToMock';

export default function StagedChangesPanel({ compact = false, showActions = true }) {
  const ctx = (() => { try { return useTimesheetContext(); } catch (_) { return null; } })();
  const stagedMap = ctx?.stagedMap || {};

  const summary = useMemo(() => {
    const list = [];
    const employees = ctx?.employees || [];
    const nameById = {};
    employees.forEach(e => { if (e && e.id) nameById[e.id] = e.name || e.dipendente || e.id; });
    Object.entries(stagedMap).forEach(([empId, days]) => {
      const keys = Object.keys(days || {});
      if (!keys.length) return;
      // compute per-date action types and aggregate flags
      let hasInsert = false, hasUpdate = false, hasDelete = false;
      const dateActions = keys.map(dk => {
        const recs = days && days[dk];
        // deletion marker
        if (recs === null) { hasDelete = true; return { date: dk, action: 'delete' }; }
        const stagedArr = Array.isArray(recs) ? recs : [];
        const origArr = (ctx && ctx.dataMap && ctx.dataMap[empId] && ctx.dataMap[empId][dk]) || [];
        if ((!origArr || origArr.length === 0) && stagedArr.length > 0) { hasInsert = true; return { date: dk, action: 'insert' }; }
        if (stagedArr.length === 0 && origArr && origArr.length > 0) { hasDelete = true; return { date: dk, action: 'delete' }; }
        // check for differences -> update
        let isUpdate = false;
        if (stagedArr.length !== origArr.length) isUpdate = true;
        else {
          for (let i = 0; i < stagedArr.length; i++) {
            const a = stagedArr[i] || {};
            const b = origArr[i] || {};
            if ((String(a.commessa || '') !== String(b.commessa || '')) || (Number(a.ore || 0) !== Number(b.ore || 0))) { isUpdate = true; break; }
          }
        }
        if (isUpdate) { hasUpdate = true; return { date: dk, action: 'update' }; }
        return { date: dk, action: 'none' };
      });
      list.push({ employeeId: empId, label: nameById[empId] || empId, count: keys.length, preview: keys.slice(0, 3), hasInsert, hasUpdate, hasDelete, dateActions });
    });
    return list.sort((a,b) => b.count - a.count);
  }, [stagedMap, ctx]);

  const total = summary.reduce((s, x) => s + x.count, 0);
  const totalLabel = total === 1 ? `${total} modifica` : `${total} modifiche`;

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

  // Always render a minimal view so developers can see stagedMap contents during debugging.
  const isEmpty = !Object.keys(stagedMap || {}).length;
  if (isEmpty) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        {summary.map(item => {
          // choose icon: prefer delete if only delete, otherwise choose add if only insert, otherwise edit for updates/mixed
          let IconComp = EditIcon;
          if (item.hasDelete && !item.hasInsert && !item.hasUpdate) IconComp = DeleteOutlineIcon;
          else if (item.hasInsert && !item.hasUpdate && !item.hasDelete) IconComp = AddCircleOutlineIcon;
          else IconComp = EditIcon;
          // determine chip color
          let chipColor = 'default';
          if (item.hasDelete && !item.hasInsert && !item.hasUpdate) chipColor = 'error';
          else if (item.hasInsert && !item.hasUpdate && !item.hasDelete) chipColor = 'success';
          else if (item.hasUpdate && !item.hasInsert && !item.hasDelete) chipColor = 'warning';
          else chipColor = 'info';

          const tooltipContent = (
            <Box sx={{ p: 0.5 }}>
              <Box sx={{ fontWeight: 600, mb: 0.5 }}>{item.label}</Box>
              {item.dateActions && item.dateActions.map(d => (
                <Box key={d.date} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ width: 120 }}>{d.date}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {d.action === 'insert' ? 'Inserimento' : d.action === 'update' ? 'Modifica' : d.action === 'delete' ? 'Cancellazione' : 'Nessuna'}
                  </Typography>
                </Box>
              ))}
            </Box>
          );

          return (
            <Tooltip key={item.employeeId} title={tooltipContent} placement="top" arrow>
              <Chip
                icon={<IconComp fontSize={compact ? 'small' : 'small'} />}
                label={`${item.label} • ${item.count}`}
                variant="outlined"
                size={compact ? 'small' : 'medium'}
                color={chipColor}
                onClick={() => { /* could open detail */ }}
                onDelete={(e) => { e.stopPropagation && e.stopPropagation(); handleDiscardFor(item.employeeId); }}
                deleteIcon={<CloseIcon fontSize={compact ? 'small' : 'medium'} />}
              />
            </Tooltip>
          );
        })}
      </Stack>

      {showActions ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{totalLabel}</Typography>
          <Button size="small" variant="contained" onClick={handleGlobalSave}>Salva</Button>
          <Button size="small" variant="outlined" onClick={handleGlobalDiscard}>Annulla</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">{totalLabel}</Typography>
        </Box>
      )}

      {/* legend moved to Dashboard header */}
    </Box>
  );
}
