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
// Icone per color coding (come WorkCalendar)
import BeachAccessIcon from "@mui/icons-material/BeachAccess";     // FERIE
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"; // MALATTIA
import EventAvailableIcon from "@mui/icons-material/EventAvailable"; // PERMESSO

export default function DayEntryPanel({
  selectedDay,
  data = {},
  onAddRecord,
  commesse = [],
}) {
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
  const canAddMore = totalHours < 8;

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
  const ROW_HEIGHT = 56;
  const LIST_HEIGHT = ROW_HEIGHT * 5;

  // Calcola il massimo consentito in base alla modalità (per non superare 8h)
  const maxOre = useMemo(() => {
    if (mode === "add") {
      return Math.max(0, 8 - totalHours) || 0;
    }
    if (mode === "edit" && idx != null) {
      const current = records[idx];
      const others = totalHours - Number(current?.ore || 0);
      return Math.max(0, 8 - others);
    }
    return 8;
  }, [mode, idx, records, totalHours]);

  const openAdd = () => {
    setMode("add");
    setIdx(null);
    setForm({
      commessa: commesse[0] || "",
      ore: Math.min(1, Math.max(1, 8 - totalHours)) || 1,
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
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ py: 2 }}>
          Dettaglio {itDate} — Totale: {totalHours}h
        </Typography>
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
      </Stack>
      <Divider />
      {/* Lista record: altezza fissa (5 righe) + scroll */}
      <Box
        sx={{
          height: LIST_HEIGHT,
          overflowY: "auto",
          pr: 1,
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
            {records.map((r, i) => {
              const chipProps = getChipProps(r.commessa);
              return (
                <Stack
                  key={i}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    p: 1,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    height: ROW_HEIGHT, // altezza riga stabile
                  }}
                >
                  {/* Commessa */}
                  <Chip
                    label={r.commessa}
                    size="small"
                    color={chipProps.color}
                    icon={chipProps.icon}
                    variant={chipProps.color === "default" ? "outlined" : "filled"}
                    sx={{ borderRadius: 1 }}
                  />
                  {/* Descrizione */}
                  <Typography
                    variant="body2"
                    sx={{ flex: 1 }}
                    noWrap
                    title={r.descrizione}
                  >
                    {r.descrizione}
                  </Typography>
                  {/* Ore */}
                  <Chip
                    label={`${r.ore}h`}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                  {/* Azioni */}
                  <IconButton size="small" onClick={() => openEdit(i)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(i)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
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
        {(() => {
          const status = getDayStatus();
          return (
            <Chip
              label={status.label}
              color={status.color}
              variant={status.color === "default" ? "outlined" : "filled"}
              size="small"
              sx={{ borderRadius: 1 }}
            />
          );
        })()}
      </Stack>

      {segnalazione && (
        <Alert
          severity={segnalazione.livello || "warning"}
          sx={{ mt: 1 }}
        >
          {segnalazione.descrizione || "Segnalazione dall'amministrazione."}
        </Alert>
      )}

      {/* Dialog add/edit */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {mode === "add" ? "Aggiungi voce" : "Modifica voce"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            select
            label="Commessa"
            value={form.commessa}
            onChange={(e) => setForm((f) => ({ ...f, commessa: e.target.value }))}
            size="small"
          >
            {commesse.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
            {/* Consenti anche voci speciali se presenti già nei dati */}
            {["FERIE", "PERMESSO", "MALATTIA"]
              .filter((c) => !commesse.includes(c))
              .map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            type="number"
            label={`Ore (max ${maxOre})`}
            value={form.ore}
            onChange={(e) =>
              setForm((f) => ({ ...f, ore: Math.max(0, Number(e.target.value)) }))
            }
            size="small"
            inputProps={{ min: 0, max: maxOre, step: 1 }}
            helperText={
              maxOre === 0
                ? "Il totale giornaliero è già 8h: riduci un'altra riga per liberare ore"
                : ""
            }
          />

          <TextField
            label="Descrizione"
            value={form.descrizione}
            onChange={(e) => setForm((f) => ({ ...f, descrizione: e.target.value }))}
            size="small"
            multiline
            minRows={2}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleSave}>
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
