import React from "react";
import { Box, Stack, Typography, Button, Tooltip, Alert, Divider, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EntryListItem from "../../components/Entries/EntryListItem";
import EditEntryDialog from "../../components/Timesheet/EditEntryDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
// TileLegend is rendered in the calendar area; monthly summary chips are shown in this panel
import Paper from '@mui/material/Paper';
import { useDayEntryDerived, useConfirmDelete } from '@/Hooks/Timesheet/dayEntry';
import { useTimesheetEntryEditor } from '@/Hooks/Timesheet';

export default function DayEntryPanel({
  selectedDay,
  data = {},
  onAddRecord,
  commesse = [],
  readOnly = false,
  mode: modeProp,
  maxHoursPerDay = 8,
}) {
  if (modeProp === 'readonly') readOnly = true;

  // Derived data
  const { records, segnalazione, totalHours, itDate } = useDayEntryDerived(selectedDay, data, maxHoursPerDay);

  // Unified editing logic (replaces legacy useDayEntryEditing)
  const editing = useTimesheetEntryEditor({
    entries: records,
    commesse,
    onSave: (nextEntries) => onAddRecord(selectedDay, nextEntries, true)
  });

  // Delete confirmation logic
  const deleteCtrl = useConfirmDelete((i) => {
    const next = records.filter((_, k) => k !== i);
    onAddRecord(selectedDay, next, true);
  });

  const ROW_HEIGHT = 53;
  // Fixed height for the tile list to match other dashboard panels
  const LIST_HEIGHT = 365;

  // Monthly summary now expected from upstream aggregation (fallback vuoto)
  const monthlySummary = data.__monthlySummary || { ferie: { days: 0, hours: 0 }, malattia: { days: 0, hours: 0 }, permesso: { days: 0, hours: 0 } };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
  {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ py: 2 }}>
          Dettaglio {itDate}
        </Typography>
        {!readOnly && (
          <Tooltip
            title={
              editing.canAddMore
                ? ""
                : "Hai già 8h inserite: puoi modificare le righe esistenti"
            }
          >
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={editing.startAdd}
                disabled={totalHours >= maxHoursPerDay}
              >
                Aggiungi voce
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>
  <Divider />
  {/* Lista record: area a altezza fissa con scroll */}
      <Box sx={{ height: LIST_HEIGHT, overflowY: 'auto', scrollbarGutter: 'stable', bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
        {records.length === 0 ? (
          <Box sx={{ height: LIST_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Alert severity="info" sx={{ width: "100%", mx: 1 }}>Nessun record per questa giornata.</Alert>
          </Box>
        ) : (
          <Stack spacing={0}>
            {records.map((r, i) => (
              <Paper key={i} sx={{ p: 1, boxShadow: 1, borderRadius: 1, height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>
                <EntryListItem
                  item={r}
                  onEdit={() => editing.startEdit(i)}
                  onDelete={() => deleteCtrl.request(i)}
                />
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
  {/* Footer: riepiloghi giornaliero / mensile */}
      <Divider />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        sx={{ mt: 2 }}
      >
        {/* Daily summary (left) */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2">Riepilogo Giornaliero</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
              <Chip size="small" label={`Totale giornata: ${totalHours}h`} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        </Box>

  {/* Riepilogo mensile (right) */}
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
        <Alert
          severity={segnalazione.livello || "warning"}
          sx={{ mt: 1 }}
        >
          {segnalazione.descrizione || "Segnalazione dall'amministrazione."}
        </Alert>
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={deleteCtrl.open}
        title="Conferma eliminazione"
        message="Sei sicuro di voler eliminare questa voce?"
        onClose={deleteCtrl.cancel}
        onConfirm={deleteCtrl.confirm}
      />

      {/* Dialog add/edit (shared) */}
      {!readOnly && editing.dialog.open && (
        <EditEntryDialog
          open={editing.dialog.open}
          mode={editing.dialog.mode}
          item={editing.dialog.current}
          commesse={commesse}
          maxOre={maxHoursPerDay}
          onClose={editing.closeDialog}
          onSave={(entry) => editing.commit(entry)}
          onDelete={editing.removeCurrent}
        />
      )}
    </Box>
  );
}
