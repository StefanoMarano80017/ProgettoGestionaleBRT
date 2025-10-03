import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
} from "@mui/material";

export default function EditEntryDialog({
  open,
  mode = "add",
  item = null,
  commesse = [],
  maxOre = 8,
  onClose,
  onSave,
  onDelete,
}) {
  const [form, setForm] = React.useState({ commessa: "", ore: 1, descrizione: "" });
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setForm({
        commessa: item?.commessa || commesse[0] || "",
        ore: item?.ore != null ? Number(item.ore) : 1,
        descrizione: item?.descrizione || "",
      });
      setError("");
    }
  }, [open, item, commesse]);

  const handleSave = () => {
    setError("");
    const oreNum = Number(form.ore || 0);
    if (!form.commessa) return setError("Seleziona una commessa");
    if (oreNum <= 0) return setError("Le ore devono essere maggiori di 0");
    if (oreNum > maxOre) return setError(`Max consentito: ${maxOre}h`);
    onSave && onSave({ ...item, commessa: form.commessa, ore: oreNum, descrizione: form.descrizione });
  };

  const handleDelete = () => {
    onDelete && onDelete(item);
  };

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === "add" ? "Aggiungi voce" : "Modifica voce"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2}}>
        <TextField
          select
          label="Commessa"
          value={form.commessa}
          onChange={(e) => setForm((f) => ({ ...f, commessa: e.target.value }))}
          size="small"
          sx={{ marginTop: 2 }}
        >
          {commesse.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
          {["FERIE", "PERMESSO", "MALATTIA"].filter((c) => !commesse.includes(c)).map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>

        <TextField
          type="number"
          label={`Ore (max ${maxOre})`}
          value={form.ore}
          onChange={(e) => setForm((f) => ({ ...f, ore: Math.max(0, Number(e.target.value)) }))}
          size="small"
          inputProps={{ min: 0, max: maxOre, step: 1 }}
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
        <Stack direction="row" spacing={1} sx={{ width: "100%", px: 1 }}>
          <Button onClick={onClose}>Annulla</Button>
          <Stack direction="row" sx={{ ml: 'auto' }} spacing={1}>
            <Button variant="contained" onClick={handleSave}>Salva</Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
