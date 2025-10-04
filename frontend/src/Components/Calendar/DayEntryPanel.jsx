import React, { useState, useMemo, useCallback } from "react";
import { Box, Stack, Typography, Button, Tooltip, Alert, Divider, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EntryListItem from "@components/Entries/EntryListItem";
import EditEntryDialog from "@components/Timesheet/EditEntryDialog";
import ConfirmDialog from "@components/ConfirmDialog";
// TileLegend is rendered in the calendar area; monthly summary chips are shown in this panel
import Paper from '@mui/material/Paper';
import { useDayEntryDerived, useConfirmDelete } from '@/Hooks/Timesheet/dayEntry';
// NOTE: Il pannello ora gestisce un wrapper di dialog locale invece di affidarsi
// a proprietà (dialog/startAdd/startEdit/commit) che non esistono più nell'API
// di `useTimesheetEntryEditor`. L'hook unificato gestisce validazione e salvataggio
// altrove (OperaioEditor, ecc). Qui manteniamo una semplice gestione modale inline.

export default function DayEntryPanel({
  selectedDay,
  data = {},
  onAddRecord,
  commesse = [],
  readOnly = false,
  mode: modeProp,
  maxHoursPerDay = 8,
}) {
  /**
   * DayEntryPanel
   * Props:
   * - selectedDay: ISO date or Date used to derive records
   * - data: timesheet data blob (may contain __monthlySummary)
   * - onAddRecord(day, records, persist): callback to update records
   * - commesse: array of available commesse
   * - readOnly: disables editing
   * - mode: legacy mode override
   * - maxHoursPerDay: numeric limit used for validation
   */
  if (modeProp === 'readonly') readOnly = true;

  // Derived data from hooks (already memoized in hook implementation)
  const { records, segnalazione, totalHours, itDate } = useDayEntryDerived(selectedDay, data, maxHoursPerDay);

  // Local dialog state used as editing wrapper
  const [dialog, setDialog] = useState({ open: false, mode: 'add', index: null, current: null });

  const canAddMore = totalHours < maxHoursPerDay;

  const startAdd = useCallback(() => {
    if (!canAddMore) return;
    setDialog({ open: true, mode: 'add', index: null, current: { commessa: commesse[0] || '', ore: 1, descrizione: '' } });
  }, [canAddMore, commesse]);

  const startEdit = useCallback((idx) => {
    const rec = records[idx];
    if (!rec) return;
    setDialog({ open: true, mode: 'edit', index: idx, current: { ...rec } });
  }, [records]);

  const closeDialog = useCallback(() => setDialog((d) => ({ ...d, open: false })), []);

  const commit = useCallback((entry) => {
    if (!entry) { closeDialog(); return; }
    let next;
    if (dialog.mode === 'add') {
      next = [...records, entry];
    } else {
      next = records.map((r, i) => (i === dialog.index ? entry : r));
    }
    onAddRecord(selectedDay, next, true);
    closeDialog();
  }, [dialog, records, onAddRecord, selectedDay, closeDialog]);

  const removeCurrent = useCallback(() => {
    if (dialog.mode !== 'edit') { closeDialog(); return; }
    const next = records.filter((_, i) => i !== dialog.index);
    onAddRecord(selectedDay, next, true);
    closeDialog();
  }, [dialog, records, onAddRecord, selectedDay, closeDialog]);

  // Stable editing object for consumers
  const editing = useMemo(() => ({
    canAddMore,
    startAdd,
    startEdit,
    dialog: dialog || { open: false, mode: 'add', index: null, current: null },
    closeDialog,
    commit,
    removeCurrent,
  }), [canAddMore, startAdd, startEdit, dialog, closeDialog, commit, removeCurrent]);

  // Delete confirmation logic
  const deleteCtrl = useConfirmDelete(useCallback((i) => {
    const next = records.filter((_, k) => k !== i);
    onAddRecord(selectedDay, next, true);
  }, [records, onAddRecord, selectedDay]));

  const ROW_HEIGHT = 53;
  const LIST_HEIGHT = 365;

  const monthlySummary = useMemo(() => (
    data.__monthlySummary || { ferie: { days: 0, hours: 0 }, malattia: { days: 0, hours: 0 }, permesso: { days: 0, hours: 0 } }
  ), [data]);

  const renderRecords = useMemo(() => {
    if (!records || records.length === 0) return null;
    return (
      <Stack spacing={0}>
        {records.map((r, i) => (
          <Paper key={r.id ?? i} sx={{ p: 1, boxShadow: 1, borderRadius: 1, height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>
            <EntryListItem
              item={r}
              onEdit={() => startEdit(i)}
              onDelete={() => deleteCtrl.request(i)}
            />
          </Paper>
        ))}
      </Stack>
    );
  }, [records, startEdit, deleteCtrl]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ py: 2 }}>Dettaglio {itDate}</Typography>
        {!readOnly && (
          <Tooltip title={editing.canAddMore ? '' : `Hai già ${maxHoursPerDay}h inserite: puoi modificare le righe esistenti`}>
            <span>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={editing.startAdd} disabled={!editing.canAddMore}>
                Aggiungi voce
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      <Divider />

      <Box sx={{ height: LIST_HEIGHT, overflowY: 'auto', scrollbarGutter: 'stable', bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
        {records.length === 0 ? (
          <Box sx={{ height: LIST_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Alert severity="info" sx={{ width: '100%', mx: 1 }}>Nessun record per questa giornata.</Alert>
          </Box>
        ) : renderRecords}
      </Box>

      <Divider />

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2">Riepilogo Giornaliero</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
              <Chip size="small" label={`Totale giornata: ${totalHours}h`} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ pb: 2, display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
          <Typography variant="body2">Riepilogo Mensile</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
            <Chip size="small" label={`Ferie: ${monthlySummary.ferie.days} gg (${monthlySummary.ferie.hours}h)`} sx={{ borderRadius: 1 }} />
            <Chip size="small" label={`Malattia: ${monthlySummary.malattia.days} gg (${monthlySummary.malattia.hours}h)`} sx={{ borderRadius: 1 }} />
            <Chip size="small" label={`Permessi: ${monthlySummary.permesso.days} gg (${monthlySummary.permesso.hours}h)`} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      </Stack>

      {segnalazione && (
        <Alert severity={segnalazione.livello || "warning"} sx={{ mt: 1 }}>{segnalazione.descrizione || "Segnalazione dall'amministrazione."}</Alert>
      )}

      <ConfirmDialog open={deleteCtrl.open} title="Conferma eliminazione" message="Sei sicuro di voler eliminare questa voce?" onClose={deleteCtrl.cancel} onConfirm={deleteCtrl.confirm} />

      {!readOnly && editing && editing.dialog && editing.dialog.open && (
        <EditEntryDialog
          open={editing.dialog.open}
          mode={editing.dialog.mode}
          item={editing.dialog.current}
          commesse={commesse}
          maxOre={maxHoursPerDay}
          dailyLimit={maxHoursPerDay}
          // dayUsed: sum of other records (work + personal) excluding the entry being edited
          dayUsed={(() => {
            const all = records || [];
            const current = editing.dialog.current;
            return all.reduce((acc, r, idx) => {
              // If we're editing and this is the same index, exclude it
              if (editing.dialog.mode === 'edit' && idx === editing.dialog.index) return acc;
              // If objects are the same reference, exclude
              if (current && r === current) return acc;
              if (current && r.id && current.id && r.id === current.id) return acc;
              // fallback: compare key fields
              if (current && !r.id && !current.id && r.commessa === current.commessa && Number(r.ore) === Number(current.ore) && (r.descrizione || '') === (current.descrizione || '')) return acc;
              return acc + (Number(r.ore) || 0);
            }, 0);
          })()}
          onClose={editing.closeDialog}
          onSave={(entry) => editing.commit(entry)}
        />
      )}
    </Box>
  );
}
