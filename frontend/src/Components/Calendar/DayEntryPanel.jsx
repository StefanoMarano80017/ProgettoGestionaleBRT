import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { DEBUG_TS } from '@config/debug';
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
import { semanticHash } from '@hooks/Timesheet/utils/semanticTimesheet';
import { useTimesheetStaging } from '@hooks/Timesheet';
// NOTE: Il pannello ora gestisce un wrapper di dialog locale invece di affidarsi
// a proprietà (dialog/startAdd/startEdit/commit) che non esistono più nell'API
// di `useTimesheetEntryEditor`. L'hook unificato gestisce validazione e salvataggio
// altrove (OperaioEditor, ecc). Qui manteniamo una semplice gestione modale inline.

/**
 * DayEntryPanel
 * --------------------------------------------------------------
 * Single–day timesheet editor now owning its own draft + staging.
 * Responsibilities:
 *  - Derive merged view (base + staged) via staging context
 *  - Maintain local draft (records state) for immediate UI reactivity
 *  - Debounce & propagate draft to global staging (stageDraft)
 *  - Provide inline add/edit/remove dialogs
 *  - Expose optional onDraftChange for outer summary recalculations
 *
 * Staging Lifecycle:
 *  User edit -> local records state -> debounce (450ms) -> staging.stageDraft
 *  External changes (confirm/rollback/other tab edits) propagate down and
 *  replace local draft only when the user has not diverged.
 *
 * Deletion Semantics:
 *  Empty records array is staged as [] meaning "clear day" (kept distinct from
 *  absence of staging entry which means "unchanged").
 *
 * NOTE: Legacy external buffers (useDayEditBuffer / useAutoStageDay) have been
 * removed; this component is now the single place where per‑day edits become
 * staged.
 */
export function DayEntryPanel({
  selectedDay,
  data = {},
  onAddRecord = () => {},
  commesse = [],
  readOnly = false,
  mode: modeProp,
  maxHoursPerDay = 8,
  // New props for integrated staging
  employeeId,
  dateKey, // optional override; defaults to selectedDay if provided
  autoStage = true,
  onDraftChange, // optional observer
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
  const { records: baseRecords, segnalazione, totalHours, itDate } = useDayEntryDerived(selectedDay, data, maxHoursPerDay);
  const staging = useTimesheetStaging();
  const effectiveDate = dateKey || selectedDay;

  // Derive merged staged view if employeeId/date provided
  const stagedEntry = useMemo(() => {
    if (!employeeId || !effectiveDate) return undefined;
    return staging.getStagedEntry(employeeId, effectiveDate);
  }, [staging, employeeId, effectiveDate]);

  const mergedRecords = useMemo(() => {
    if (!employeeId || !effectiveDate) return baseRecords;
    if (!stagedEntry) return baseRecords;
    if (stagedEntry.draft === null) return [];
    return stagedEntry.draft;
  }, [baseRecords, stagedEntry, employeeId, effectiveDate]);

  // Base committed records (without staging overlay) for comparison / guard logic
  const baseCommitted = useMemo(() => {
    if (!employeeId || !effectiveDate) return baseRecords;
    return staging.getBaseDay(employeeId, effectiveDate) || [];
  }, [staging, employeeId, effectiveDate, baseRecords]);

  // Local draft state initialized from mergedRecords; updates stage after debounce
  const [records, setRecords] = useState(mergedRecords);
  const lastMergedHashRef = useRef(semanticHash(mergedRecords));
  const lastDraftHashRef = useRef(semanticHash(mergedRecords));
  const debounceRef = useRef();
  // Tracks whether the current draft mutation originated from an explicit user action
  // (add/edit/delete/save) rather than an external sync/reset. Prevents staging of
  // transient empty states (phantom deletions) produced by race conditions after commit.
  const userEditRef = useRef(false);

  // Sync in new mergedRecords if user hasn't diverged
  useEffect(() => {
    const mergedHash = semanticHash(mergedRecords);
    const prevMergedHash = lastMergedHashRef.current;
    if (mergedHash === prevMergedHash) return; // no external change
    const draftHash = lastDraftHashRef.current;
    if (draftHash === prevMergedHash) {
      setRecords(mergedRecords);
      lastDraftHashRef.current = mergedHash;
    }
    lastMergedHashRef.current = mergedHash;
  }, [mergedRecords]);

  // Debounced auto staging effect
  useEffect(() => {
    if (!autoStage || !employeeId || !effectiveDate) return;
    const draftHash = semanticHash(records);
    const mergedHash = semanticHash(mergedRecords);
    const baseHash = semanticHash(baseCommitted);
    lastDraftHashRef.current = draftHash;

    // If nothing changed relative to merged view, skip.
    if (draftHash === mergedHash) return;

    const userEdited = userEditRef.current;
    const isDeletionAttempt = records.length === 0 && baseCommitted.length > 0 && mergedHash === baseHash;
    const isPotentialPhantomDeletion = isDeletionAttempt && !userEdited;
    if (isPotentialPhantomDeletion) {
  if (DEBUG_TS) { try { console.debug('[DayEntryPanel] Skip phantom deletion staging', { effectiveDate, employeeId }); } catch { /* ignore debug */ } }
      return;
    }

    // For non-deletion changes originating from passive sync we also skip staging.
    if (!userEdited) {
  if (DEBUG_TS) { try { console.debug('[DayEntryPanel] Draft differs but no explicit user edit yet – skip staging', { effectiveDate, employeeId }); } catch { /* ignore debug */ } }
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const payload = records.length === 0 ? [] : records;
  if (DEBUG_TS) { try { console.debug('[DayEntryPanel] Stage draft', { effectiveDate, employeeId, action: records.length === 0 ? 'delete' : 'upsert', count: records.length }); } catch { /* ignore debug */ } }
      staging.stageDraft(employeeId, effectiveDate, payload);
      userEditRef.current = false; // reset after successful staging cycle
    }, 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [records, autoStage, employeeId, effectiveDate, staging, mergedRecords, baseCommitted]);

  // Notify external observer of draft changes
  useEffect(() => { if (typeof onDraftChange === 'function') onDraftChange(records); }, [records, onDraftChange]);

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
    setRecords(prev => {
      let next;
      if (dialog.mode === 'add') next = [...prev, entry];
      else next = prev.map((r, i) => (i === dialog.index ? entry : r));
      onAddRecord(effectiveDate, next, false); // legacy callback still invoked (now informational)
      userEditRef.current = true;
      return next;
    });
    closeDialog();
  }, [dialog, onAddRecord, effectiveDate, closeDialog]);

  // use the shared computeDayUsed util (imported above)

  // Delete confirmation logic
  const deleteCtrl = useConfirmDelete(useCallback((i) => {
    setRecords(prev => {
      const next = prev.filter((_, k) => k !== i);
      onAddRecord(effectiveDate, next, false);
      userEditRef.current = true;
      return next;
    });
  }, [onAddRecord, effectiveDate]));

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

  const removeCurrent = useCallback(() => {
    if (dialog.mode !== 'edit') { closeDialog(); return; }
    setRecords(prev => {
      const next = prev.filter((_, i) => i !== dialog.index);
      onAddRecord(effectiveDate, next, false);
      userEditRef.current = true;
      return next;
    });
    closeDialog();
  }, [dialog, onAddRecord, effectiveDate, closeDialog]);

  const editing = useMemo(() => ({
    canAddMore,
    startAdd,
    startEdit,
    dialog: dialog || { open: false, mode: 'add', index: null, current: null },
    closeDialog,
    commit,
    removeCurrent,
  }), [canAddMore, startAdd, startEdit, dialog, closeDialog, commit, removeCurrent]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
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
        <Box sx={{ pb: 2 }} />
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
  employeeId: PropTypes.string,
  dateKey: PropTypes.string,
  autoStage: PropTypes.bool,
  onDraftChange: PropTypes.func,
};

// (default props converted to parameter defaults above)

export default React.memo(DayEntryPanel);
