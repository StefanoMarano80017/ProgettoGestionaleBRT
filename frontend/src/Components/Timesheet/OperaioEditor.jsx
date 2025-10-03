import React from "react";
import { Box, Stack, Typography, TextField, IconButton, Button, Chip, Alert, Autocomplete } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function OperaioEditor({ opRow, dateKey, tsMap, commesse, onSaved }) {
  // Righe per commesse di gruppo (edit override ore)
  const [rows, setRows] = React.useState(() => (tsMap?.[opRow.id]?.[dateKey] || [])
    .filter((r) => !["FERIE","MALATTIA","PERMESSO"].includes(String(r.commessa)))
    .map((r) => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }))
  );
  // Righe personali (FERIE/MALATTIA/PERMESSO)
  const [personal, setPersonal] = React.useState(() => (tsMap?.[opRow.id]?.[dateKey] || [])
    .filter((r) => ["FERIE","MALATTIA","PERMESSO"].includes(String(r.commessa)))
    .map((r) => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }))
  );
  const [msg, setMsg] = React.useState("");
  const [type, setType] = React.useState("info");
  // Sync when selection changes
  React.useEffect(() => {
    const recs = tsMap?.[opRow.id]?.[dateKey] || [];
    setRows(recs.filter((r) => !["FERIE","MALATTIA","PERMESSO"].includes(String(r.commessa)))
      .map((r) => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }))
    );
    setPersonal(recs.filter((r) => ["FERIE","MALATTIA","PERMESSO"].includes(String(r.commessa)))
      .map((r) => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }))
    );
  }, [opRow?.id, dateKey, tsMap]);
  const updateRow = (i, patch) => setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i) => setRows((arr) => arr.filter((_, idx) => idx !== i));
  const addRow = () => setRows((arr) => [...arr, { commessa: commesse[0] || "", ore: 1 }]);
  const updatePersonal = (i, patch) => setPersonal((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removePersonal = (i) => setPersonal((arr) => arr.filter((_, idx) => idx !== i));
  const addPersonal = () => setPersonal((arr) => [...arr, { commessa: "FERIE", ore: 8 }]);
  const total = React.useMemo(() => rows.reduce((s, r) => s + (Number(r.ore) || 0), 0), [rows]);
  const personalTotal = React.useMemo(() => personal.reduce((s, r) => s + (Number(r.ore) || 0), 0), [personal]);
  const grandTotal = total + personalTotal;
  const handleSave = async () => {
    setMsg(""); setType("info");
    try {
      if (grandTotal > 8) throw new Error("Totale giornaliero > 8h (commesse + personali). Ridurre le ore.");
      const payload = rows.filter((r) => r.commessa && Number(r.ore) > 0).map((r) => ({ commessa: r.commessa, ore: Number(r.ore) }));
      const personalPayload = personal.filter((r) => ["FERIE","MALATTIA","PERMESSO"].includes(String(r.commessa)) && Number(r.ore) > 0)
        .map((r) => ({ commessa: r.commessa, ore: Number(r.ore) }));
      const { updateOperaioDayAssignments, updateOperaioPersonalDay } = await import("../../mocks/ProjectMock");
      // Salva prima personali (fallisce se supera 8h considerando i gruppi correnti)
      await updateOperaioPersonalDay({ opId: opRow.id, dateKey, entries: personalPayload });
      // Poi salva override per commesse di gruppo
      await updateOperaioDayAssignments({ opId: opRow.id, dateKey, entries: payload });
      setType("success"); setMsg("Salvato.");
      onSaved?.();
    } catch (e) {
      setType("error"); setMsg(e?.message || "Errore salvataggio");
    }
  };
  return (
    <Box>
      <Stack spacing={1}>
        {/* Sezione commesse (da gruppi) */}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Commesse (da gruppi)</Typography>
        {rows.length === 0 && <Typography variant="body2">Nessuna voce da gruppi. Aggiungi riga per impostare ore su commesse.</Typography>}
        {rows.map((r, i) => (
          <Stack key={i} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Autocomplete
              size="small"
              options={commesse}
              value={r.commessa || null}
              onChange={(_, v) => updateRow(i, { commessa: v || "" })}
              renderInput={(p) => <TextField {...p} label="Commessa" />}
              sx={{ minWidth: 160 }}
            />
            <TextField size="small" type="number" label="Ore" value={r.ore} onChange={(e) => updateRow(i, { ore: Math.max(0, Number(e.target.value)) })} sx={{ width: 100 }} />
            <IconButton color="error" onClick={() => removeRow(i)}><DeleteIcon /></IconButton>
          </Stack>
        ))}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
          <Button variant="outlined" size="small" onClick={addRow}>Aggiungi riga</Button>
          <Chip size="small" label={`Totale commesse: ${total}h`} />
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" size="small" onClick={handleSave}>Salva</Button>
        </Stack>
        {msg && <Alert severity={type}>{msg}</Alert>}

        {/* Sezione personali (FERIE/MALATTIA/PERMESSO) */}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Voci personali</Typography>
        {personal.map((r, i) => (
          <Stack key={`p-${i}`} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Autocomplete
              size="small"
              options={["FERIE","MALATTIA","PERMESSO"]}
              value={r.commessa || null}
              onChange={(_, v) => updatePersonal(i, { commessa: v || "FERIE" })}
              renderInput={(p) => <TextField {...p} label="Tipo" />}
              sx={{ minWidth: 160 }}
            />
            <TextField size="small" type="number" label="Ore" value={r.ore} onChange={(e) => updatePersonal(i, { ore: Math.max(0, Number(e.target.value)) })} sx={{ width: 100 }} />
            <IconButton color="error" onClick={() => removePersonal(i)}><DeleteIcon /></IconButton>
          </Stack>
        ))}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button variant="outlined" size="small" onClick={addPersonal}>Aggiungi voce personale</Button>
          <Chip size="small" label={`Totale personali: ${personalTotal}h`} />
          <Chip size="small" color={grandTotal > 8 ? "error" : "default"} label={`Totale giorno: ${grandTotal}h / 8h`} />
        </Stack>
      </Stack>
    </Box>
  );
}
