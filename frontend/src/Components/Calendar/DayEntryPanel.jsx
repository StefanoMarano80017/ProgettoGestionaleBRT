import React, { useState, useMemo, useCallback } from "react";
import { Box, Stack, Typography, Button, Tooltip, Alert, Divider, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EntryListItem from "@components/Entries/EntryListItem";
import EditEntryDialog from "@components/Timesheet/EditEntryDialog";
import ConfirmDialog from "@components/ConfirmDialog";
// TileLegend is rendered in the calendar area; monthly summary chips are shown in this panel
import Paper from '@mui/material/Paper';
import { useDayEntryDerived, useConfirmDelete } from '@/Hooks/Timesheet/dayEntry';
import PropTypes from 'prop-types';
import computeDayUsed from '@hooks/Timesheet/utils/computeDayUsed';
// NOTE: Il pannello ora gestisce un wrapper di dialog locale invece di affidarsi
// a proprietà (dialog/startAdd/startEdit/commit) che non esistono più nell'API
// di `useTimesheetEntryEditor`. L'hook unificato gestisce validazione e salvataggio
// altrove (OperaioEditor, ecc). Qui manteniamo una semplice gestione modale inline.

/**
 * DayEntryPanel
 *
 * Presentational panel that shows the list of timesheet records for a single day
 * and provides a local dialog wrapper for adding/editing entries. The component
 * intentionally keeps dialog state local but uses provided callbacks to persist
 * changes (onAddRecord).
 *
 * Export pattern: named export + memoized default export.
 */
export function DayEntryPanel({
  selectedDay,
  data = {},
  onAddRecord = () => {},
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

  // use the shared computeDayUsed util (imported above)

  // Delete confirmation logic
  const deleteCtrl = useConfirmDelete(useCallback((i) => {
    const next = records.filter((_, k) => k !== i);
    onAddRecord(selectedDay, next, true);
  }, [records, onAddRecord, selectedDay]));

  const ROW_HEIGHT = 53;
  const LIST_HEIGHT = 365;

  const monthlySummary = useMemo(() => {
    const base = data.__monthlySummary || { ferie: { days: 0, hours: 0 }, malattia: { days: 0, hours: 0 }, permesso: { days: 0, hours: 0 }, commesse: [], totalHours: 0 };
    return {
      ferie: base.ferie || { days:0, hours:0 },
      malattia: base.malattia || { days:0, hours:0 },
      permesso: base.permesso || { days:0, hours:0 },
      commesse: Array.isArray(base.commesse) ? base.commesse : [],
      totalHours: Number(base.totalHours||0),
    };
  }, [data]);

  const pct = useCallback((hours) => {
    const t = Number(monthlySummary.totalHours || 0);
    if (!t) return '0%';
    return `${((hours / t) * 100).toFixed(1)}%`;
  }, [monthlySummary]);

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

        <Box sx={{ pb: 2, display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, minWidth: 360 }}>
          <Typography variant="body2">Riepilogo Mensile</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
            <Chip size="small" label={`Totale: ${monthlySummary.totalHours}h`} sx={{ borderRadius: 1 }} />
            <Chip size="small" label={`Ferie: ${monthlySummary.ferie.days}g (${monthlySummary.ferie.hours}h) ${pct(monthlySummary.ferie.hours)}`} sx={{ borderRadius: 1 }} />
            <Chip size="small" label={`Malattia: ${monthlySummary.malattia.days}g (${monthlySummary.malattia.hours}h) ${pct(monthlySummary.malattia.hours)}`} sx={{ borderRadius: 1 }} />
            <Chip size="small" label={`Permesso: ${monthlySummary.permesso.days}g (${monthlySummary.permesso.hours}h) ${pct(monthlySummary.permesso.hours)}`} sx={{ borderRadius: 1 }} />
          </Box>
          {monthlySummary.commesse.length > 0 && (
            <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', mt: 1 }}>
              {monthlySummary.commesse.slice(0,5).map(c => (
                <Chip key={c.commessa} size="small" color="info" variant="outlined" label={`${c.commessa}: ${c.ore}h (${pct(c.ore)})`} sx={{ borderRadius:1 }} />
              ))}
              {monthlySummary.commesse.length > 5 && (
                <Chip size="small" variant="outlined" label={`+${monthlySummary.commesse.length - 5} altre`} sx={{ borderRadius:1 }} />
              )}
            </Box>
          )}
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
          dayUsed={computeDayUsed(records, editing.dialog.current, editing.dialog.mode, editing.dialog.index)}
          onClose={editing.closeDialog}
          onSave={(entry) => editing.commit(entry)}
        />
      )}
    </Box>
  );
}

DayEntryPanel.displayName = 'DayEntryPanel';

DayEntryPanel.propTypes = {
  selectedDay: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  data: PropTypes.object,
  onAddRecord: PropTypes.func,
  commesse: PropTypes.array,
  readOnly: PropTypes.bool,
  mode: PropTypes.string,
  maxHoursPerDay: PropTypes.number,
};

// (default props converted to parameter defaults above)

export default React.memo(DayEntryPanel);
