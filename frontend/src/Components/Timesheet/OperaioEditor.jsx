import React from "react";
import { Box, Stack, Typography, TextField, IconButton, Button, Chip, Alert, Autocomplete } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTimesheetEntryEditor } from '@/Hooks/Timesheet';

export default function OperaioEditor({ opRow, dateKey, tsMap, commesse, onSaved }) {
  const dayEntries = (tsMap?.[opRow.id]?.[dateKey] || []);
  const work = dayEntries.filter(r => !['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa)));
  const personalInitial = dayEntries.filter(r => ['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa)));
  const editor = useTimesheetEntryEditor({
    entries: work,
    personalEntries: personalInitial,
    commesse,
    onSave: async ({ workEntries, personalEntries }) => {
      // Persist back into tsMap in-place (mutating pattern depending on parent design is avoided—clone instead)
      const next = { ...tsMap };
      next[opRow.id] = { ...(next[opRow.id] || {}) };
      next[opRow.id][dateKey] = [...workEntries, ...personalEntries];
      // Naive: onSaved expected to update higher-level state externally
      onSaved?.(next);
    }
  });
  return (
    <Box>
      <Stack spacing={1}>
        {/* Sezione commesse (da gruppi) */}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Commesse (da gruppi)</Typography>
  {editor.rows.length === 0 && <Typography variant="body2">Nessuna voce da gruppi. Aggiungi riga per impostare ore su commesse.</Typography>}
  {editor.rows.map((r, i) => (
          <Stack key={i} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Autocomplete
              size="small"
              options={commesse}
              value={r.commessa || null}
              onChange={(_, v) => editor.updateRow(i, { commessa: v || "" })}
              renderInput={(p) => <TextField {...p} label="Commessa" />}
              sx={{ minWidth: 160 }}
            />
            <TextField size="small" type="number" label="Ore" value={r.ore} onChange={(e) => editor.updateRow(i, { ore: Math.max(0, Number(e.target.value)) })} sx={{ width: 100 }} />
            <IconButton color="error" onClick={() => editor.removeRow(i)}><DeleteIcon /></IconButton>
          </Stack>
        ))}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
          <Button variant="outlined" size="small" onClick={editor.addRow}>Aggiungi riga</Button>
          <Chip size="small" label={`Totale commesse: ${editor.totals.total}h`} />
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" size="small" disabled={editor.state.saving} onClick={editor.save}>Salva</Button>
        </Stack>
        {editor.state.msg && <Alert severity={editor.state.type}>{editor.state.msg}</Alert>}

        {/* Sezione personali (FERIE/MALATTIA/PERMESSO) */}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Voci personali</Typography>
  {editor.personal.map((r, i) => (
          <Stack key={`p-${i}`} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Autocomplete
              size="small"
              options={["FERIE","MALATTIA","PERMESSO"]}
              value={r.commessa || null}
              onChange={(_, v) => editor.updatePersonal(i, { commessa: v || "FERIE" })}
              renderInput={(p) => <TextField {...p} label="Tipo" />}
              sx={{ minWidth: 160 }}
            />
            <TextField size="small" type="number" label="Ore" value={r.ore} onChange={(e) => editor.updatePersonal(i, { ore: Math.max(0, Number(e.target.value)) })} sx={{ width: 100 }} />
            <IconButton color="error" onClick={() => editor.removePersonal(i)}><DeleteIcon /></IconButton>
          </Stack>
        ))}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button variant="outlined" size="small" onClick={editor.addPersonal}>Aggiungi voce personale</Button>
          <Chip size="small" label={`Totale personali: ${editor.totals.personalTotal}h`} />
          <Chip size="small" color={editor.totals.grandTotal > 8 ? "error" : "default"} label={`Totale giorno: ${editor.totals.grandTotal}h / 8h`} />
        </Stack>
      </Stack>
    </Box>
  );
}
