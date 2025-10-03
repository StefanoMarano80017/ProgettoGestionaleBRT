import React from "react";
import { Box, Stack, Typography, Paper, Chip, Divider, Button, IconButton } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EntryListPanel from "../Entries/EntryListPanel";
import EditEntryDialog from "./EditEntryDialog";
import SendIcon from '@mui/icons-material/Send';

export default function DetailsPanel({
  selEmp,
  selDate,
  detailsReady,
  dayRecords,
  daySegnalazione,
  monthSummary,
  globalMonthAgg,
  aggLoading,
  onRefresh,
  onOpenSegnalazione,
  onEditEntry,
  onDeleteEntry,
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState(null);
  const [editMode, setEditMode] = React.useState("edit");

  const handleOpenEdit = (it) => {
    setEditItem(it);
    setEditMode("edit");
    setEditOpen(true);
  };

  const handleSaveEdit = (updated) => {
    onEditEntry && onEditEntry(updated);
    setEditOpen(false);
  };

  const handleDelete = (it) => {
    onDeleteEntry && onDeleteEntry(it);
    setEditOpen(false);
  };
  return (
  <Paper sx={{ mt: 2, p: 2, boxShadow: 8, borderRadius: 2, bgcolor: (theme) => theme.palette.background.paper }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="subtitle1">
          {selEmp ? (selDate ? `Dettagli ${selEmp.dipendente} — ${selDate}` : `Dettagli ${selEmp.dipendente}`) : "Seleziona una cella (giorno) per visualizzare i dettagli"}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {detailsReady && monthSummary?.total > 0 && (
            <Chip size="small" color="primary" variant="outlined" label={`Totale mese: ${monthSummary.total}h`} />
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<SendIcon />}
            disabled={!selEmp || !selDate}
            onClick={onOpenSegnalazione}
          >
            Invia segnalazione
          </Button>
        </Stack>
      </Stack>

      {detailsReady && (
        <Box sx={{ mt: 2 }}>
          {daySegnalazione && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">Segnalazione esistente: {daySegnalazione.descrizione}</Typography>
            </Box>
          )}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
            {/* Day records: inner area gets the darker background */}
            <Box sx={{ flex: 1 }}>
              <EntryListPanel
                title="Commesse del giorno"
                items={dayRecords}
                actions={(it) => (
                  <>
                    <IconButton size="small" onClick={() => handleOpenEdit(it)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => onDeleteEntry && onDeleteEntry(it)}><DeleteIcon fontSize="small" /></IconButton>
                  </>
                )}
              />
            </Box>

            <Divider flexItem orientation="vertical" />

            {/* Monthly aggregates */}
            <Box sx={{ flex: 1 }}>
              {/* Totale mese moved to header for clarity */}
              <EntryListPanel
                title="Aggregati mensili (dipendente)"
                items={monthSummary.commesse}
                renderItem={(c) => <>
                  <Chip size="small" variant="outlined" label={c.commessa} />
                </>}
              />

              {aggLoading ? (
                <Typography variant="body2">Caricamento aggregati...</Typography>
              ) : (
                <EntryListPanel
                  title="Aggregati mensili per commessa (tutti i dipendenti filtrati)"
                  items={globalMonthAgg}
                  renderItem={(c) => <Chip size="small" variant="outlined" label={c.commessa} />}
                />
              )}
            </Box>
          </Stack>
        </Box>
      )}
      <EditEntryDialog
        open={editOpen}
        mode={editMode}
        item={editItem}
        commesse={[]}
        maxOre={8}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />
    </Paper>
  );
}
