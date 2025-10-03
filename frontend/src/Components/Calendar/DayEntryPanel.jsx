import React from "react";
import { Box, Stack, Typography, Button, Tooltip, Alert, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EntryListItem from "../../components/Entries/EntryListItem";
import EditEntryDialog from "../../components/Timesheet/EditEntryDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import TileLegend from './TileLegend.jsx';
import Paper from '@mui/material/Paper';
import { useDayEntryDerived } from "../../Hooks/Timesheet/dayEntry/useDayEntryDerived.jsx";
import { useDayEntryEditing } from "../../Hooks/Timesheet/dayEntry/useDayEntryEditing.jsx";
import { useConfirmDelete } from "../../Hooks/Timesheet/dayEntry/useConfirmDelete.jsx";

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

  // Editing dialog logic
  const editing = useDayEntryEditing({
    records,
    commesse,
    totalHours,
    maxHoursPerDay,
    selectedDay,
    onAddRecord,
  });

  // Delete confirmation logic
  const deleteCtrl = useConfirmDelete((i) => {
    const next = records.filter((_, k) => k !== i);
    onAddRecord(selectedDay, next, true);
  });

  const ROW_HEIGHT = 53;
  const LIST_HEIGHT = 350;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ py: 2 }}>
          Dettaglio {itDate} — Totale: {totalHours}h
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
                onClick={editing.openAdd}
                disabled={!editing.canAddMore}
              >
                Aggiungi voce
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>
      <Divider />
      {/* Lista record: altezza fissa (5 righe) + scroll */}
      <Box
        sx={{
          height: LIST_HEIGHT,
          overflowY: "auto",          
          scrollbarGutter: "stable",
        }}
      >
        {records.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Alert severity="info" sx={{ width: "100%", mx: 1 }}>
              Nessun record per questa giornata.
            </Alert>
          </Box>
        ) : (
          <Stack spacing={0}>
            {records.map((r, i) => (
              <Paper key={i} sx={{ p: 1, boxShadow: 1, borderRadius: 1, height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>
                <EntryListItem
                  item={r}
                  onEdit={() => editing.openEdit(i)}
                  onDelete={() => deleteCtrl.request(i)}
                />
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
      {/* Footer */}
      <Divider />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        sx={{ mt: 2 }}
      >
        <Typography variant="subtitle2">Totale giornaliero: {totalHours}h</Typography>
        <TileLegend />
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
      {!readOnly && (
        <EditEntryDialog
          open={editing.dialogOpen}
          mode={editing.mode}
          item={editing.mode === 'edit' && editing.idx != null ? records[editing.idx] : null}
          commesse={commesse}
            maxOre={editing.maxOre}
          onClose={editing.close}
          onSave={(entry) => {
            // Reuse editing logic but allow optimistic form injection
            editing.setForm(f => ({ ...f, commessa: entry.commessa, ore: entry.ore, descrizione: entry.descrizione }));
            editing.save();
          }}
          onDelete={() => {
            if (editing.mode === 'edit' && editing.idx != null) {
              const next = records.filter((_, k) => k !== editing.idx);
              onAddRecord(selectedDay, next, true);
              editing.close();
            }
          }}
        />
      )}
    </Box>
  );
}
