import React, { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Tooltip,
  Alert,
  Divider,                  // <-- aggiunto
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EntryListItem from "../../components/Entries/EntryListItem";
import EditEntryDialog from "../../components/Timesheet/EditEntryDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
// Icone per color coding (come WorkCalendar)
import BeachAccessIcon from "@mui/icons-material/BeachAccess";     // FERIE
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"; // MALATTIA
import EventAvailableIcon from "@mui/icons-material/EventAvailable"; // PERMESSO
import TileLegend from './TileLegend.jsx';
import Paper from '@mui/material/Paper';

export default function DayEntryPanel({
  selectedDay,
  data = {},
  onAddRecord,
  commesse = [],
  readOnly = false,
  mode: modeProp, // optional: 'readonly' shorthand to force readOnly
  maxHoursPerDay = 8,
}) {
  if (modeProp === 'readonly') readOnly = true; // backward compatibility convenience
  const records = data[selectedDay] || [];
  const totalHours = useMemo(
    () => records.reduce((sum, r) => sum + Number(r.ore || 0), 0),
    [records]
  );
  // Format selectedDay as it-IT (dd/MM/yyyy)
  const itDate = useMemo(() => {
    if (!selectedDay) return "";
    const [y, m, d] = selectedDay.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dt);
  }, [selectedDay]);
  const canAddMore = totalHours < maxHoursPerDay;

  // Segnalazione amministrazione per il giorno selezionato
  const segnalazione = data[`${selectedDay}_segnalazione`] || null;

  // Mappa colore/icona per CHIP per commessa (coerente con WorkCalendar)
  const getChipProps = (commessa) => {
    if (commessa === "FERIE") {
      return { color: "success", icon: <BeachAccessIcon fontSize="small" /> };
    }
    if (commessa === "MALATTIA") {
      return { color: "secondary", icon: <LocalHospitalIcon fontSize="small" /> };
    }
    if (commessa === "PERMESSO") {
      return { color: "info", icon: <EventAvailableIcon fontSize="small" /> };
    }
    return { color: "default", icon: undefined };
  };

  // Stato sintetico del giorno (per CHIP nel footer)
  const getDayStatus = () => {
    const hasFerie = records.some((r) => r.commessa === "FERIE");
    const hasMalattia = records.some((r) => r.commessa === "MALATTIA");
    const hasPermesso = records.some((r) => r.commessa === "PERMESSO");

    if (segnalazione) {
      return { label: "Segnalazione", color: "error" };
    }
    if (hasFerie) {
      return { label: "Ferie", color: "success" };
    }
    if (hasMalattia) {
      return { label: "Malattia", color: "secondary" };
    }
    if (hasPermesso) {
      return { label: "Permesso parziale", color: "info" };
    }
    if (totalHours === 8) {
      return { label: "Completo", color: "success" };
    }
    if (totalHours > 0 && totalHours < 8) {
      return { label: "Parziale", color: "warning" };
    }
    return { label: "Vuoto", color: "default" };
  };

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("add"); // 'add' | 'edit'
  const [idx, setIdx] = useState(null);
  const [form, setForm] = useState({
    commessa: commesse[0] || "",
    ore: 1,
    descrizione: "",
  });
  const [error, setError] = useState("");

  // Altezza fissa per riga e finestra scrollabile su 5 righe
  const ROW_HEIGHT = 53;
  const LIST_HEIGHT = 350;

  // Calcola il massimo consentito in base alla modalità (per non superare 8h)
  const maxOre = useMemo(() => {
    if (mode === "add") {
      return Math.max(0, maxHoursPerDay - totalHours) || 0;
    }
    if (mode === "edit" && idx != null) {
      const current = records[idx];
      const others = totalHours - Number(current?.ore || 0);
      return Math.max(0, maxHoursPerDay - others);
    }
    return maxHoursPerDay;
  }, [mode, idx, records, totalHours, maxHoursPerDay]);

  const openAdd = () => {
    setMode("add");
    setIdx(null);
    setForm({
      commessa: commesse[0] || "",
  ore: Math.min(1, Math.max(1, maxHoursPerDay - totalHours)) || 1,
      descrizione: "",
    });
    setError("");
    setOpen(true);
  };

  const openEdit = (i) => {
    const r = records[i];
    setMode("edit");
    setIdx(i);
    setForm({
      commessa: r.commessa,
      ore: Number(r.ore || 1),
      descrizione: r.descrizione || "",
    });
    setError("");
    setOpen(true);
  };

  const handleDelete = (i) => {
    const next = records.filter((_, k) => k !== i);
    onAddRecord(selectedDay, next, true);
  };

  // Confirm dialog state for delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteIdx, setToDeleteIdx] = useState(null);

  const requestDelete = (i) => {
    setToDeleteIdx(i);
    setConfirmOpen(true);
  };

  const doConfirmDelete = () => {
    if (toDeleteIdx != null) {
      handleDelete(toDeleteIdx);
    }
    setConfirmOpen(false);
    setToDeleteIdx(null);
  };

  const handleSave = () => {
    const oreNum = Number(form.ore || 0);
    if (!form.commessa) return setError("Seleziona una commessa");
    if (oreNum <= 0) return setError("Le ore devono essere maggiori di 0");
    if (oreNum > maxOre) {
      return setError(
        mode === "add"
          ? `Puoi aggiungere al massimo ${maxOre}h`
          : `Puoi impostare al massimo ${maxOre}h per questa riga`
      );
    }

    if (mode === "add") {
      const newRecord = {
        dipendente: records[0]?.dipendente || "Mario Rossi",
        commessa: form.commessa,
        ore: oreNum,
        descrizione: form.descrizione,
      };
      onAddRecord(selectedDay, newRecord, false);
    } else if (mode === "edit" && idx != null) {
      const next = [...records];
      next[idx] = {
        ...next[idx],
        commessa: form.commessa,
        ore: oreNum,
        descrizione: form.descrizione,
      };
      onAddRecord(selectedDay, next, true);
    }

    setOpen(false);
  };

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
              canAddMore
                ? ""
                : "Hai già 8h inserite: puoi modificare le righe esistenti"
            }
          >
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={openAdd}
                disabled={!canAddMore}
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
                  onEdit={() => openEdit(i)}
                  onDelete={() => requestDelete(i)}
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
        open={confirmOpen}
        title="Conferma eliminazione"
        message="Sei sicuro di voler eliminare questa voce?"
        onClose={() => setConfirmOpen(false)}
        onConfirm={doConfirmDelete}
      />

      {/* Dialog add/edit (shared) */}
  {!readOnly && (
        <EditEntryDialog
          open={open}
          mode={mode}
          item={mode === "edit" && idx != null ? records[idx] : null}
          commesse={commesse}
          maxOre={maxOre}
          onClose={() => setOpen(false)}
          onSave={(entry) => {
            if (mode === "add") {
              const newRecord = {
                dipendente: records[0]?.dipendente || "Mario Rossi",
                commessa: entry.commessa,
                ore: entry.ore,
                descrizione: entry.descrizione,
              };
              onAddRecord(selectedDay, newRecord, false);
            } else if (mode === "edit" && idx != null) {
              const next = [...records];
              next[idx] = { ...next[idx], commessa: entry.commessa, ore: entry.ore, descrizione: entry.descrizione };
              onAddRecord(selectedDay, next, true);
            }
            setOpen(false);
          }}
          onDelete={(entry) => {
            if (mode === "edit" && idx != null) {
              const next = records.filter((_, k) => k !== idx);
              onAddRecord(selectedDay, next, true);
              setOpen(false);
            }
          }}
        />
      )}
    </Box>
  );
}
