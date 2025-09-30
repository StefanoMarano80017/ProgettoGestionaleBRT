import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  List,
  ListItem,
  IconButton,
  Paper,
  Alert,
  Divider,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const DayEntryPanel = ({ selectedDay, data = {}, onAddRecord, commesse = [] }) => {
  const [selectedCommessa, setSelectedCommessa] = useState("");
  const [ore, setOre] = useState(1);
  const [descrizione, setDescrizione] = useState("");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [segnalazione, setSegnalazione] = useState(null);

  useEffect(() => {
    if (selectedDay) {
      setRecords(data[selectedDay] || []);
      setSegnalazione(data[selectedDay + "_segnalazione"] || null);
    } else {
      setRecords([]);
      setSegnalazione(null);
    }
    setError("");
    setOre(1);
    setSelectedCommessa("");
    setDescrizione("");
    setEditingIndex(null);
  }, [selectedDay, data]);

  const totalHours = records.reduce((sum, rec) => sum + rec.ore, 0);

    // Colore dinamico per il totale ore
  let color = "text.primary";
  if (totalHours === 8) color = "success.main";
  else if (totalHours > 0 && totalHours < 8) color = "warning.main";
  else if (totalHours === 0) color = "error.main";

  const handleAddOrUpdate = () => {
    if (!selectedCommessa || !ore) return;

    const adjustedTotal = editingIndex !== null
      ? totalHours - records[editingIndex].ore + Number(ore)
      : totalHours + Number(ore);

    if (adjustedTotal > 8) {
      setError(`Non puoi superare 8 ore per il giorno. Totale attuale: ${totalHours}h`);
      return;
    }

    const newRecord = {
      commessa: selectedCommessa,
      ore: Number(ore),
      descrizione,
    };

    if (editingIndex !== null) {
      const updatedRecords = [...records];
      updatedRecords[editingIndex] = newRecord;
      onAddRecord(selectedDay, updatedRecords, true);
      setRecords(updatedRecords);
    } else {
      onAddRecord(selectedDay, newRecord);
      setRecords((prev) => [...prev, newRecord]);
    }

    setSelectedCommessa("");
    setOre(1);
    setDescrizione("");
    setEditingIndex(null);
    setError("");
  };

  const handleEdit = (index) => {
    const rec = records[index];
    setSelectedCommessa(rec.commessa);
    setOre(rec.ore);
    setDescrizione(rec.descrizione);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    const updatedRecords = records.filter((_, i) => i !== index);
    onAddRecord(selectedDay, updatedRecords, true);
    setRecords(updatedRecords);
  };

  return (
    <Box sx={{
        flexGrow: 1,          // Occupare tutto lo spazio disponibile
        p: 2,                 // Padding interno, opzionale
        display: "flex",
        flexDirection: "column",
        backgroundColor: "transparent", // Nessun background
        minHeight: 0,         // Permette al flex container di restringersi correttamente
      }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {selectedDay ? `Giornata: ${selectedDay}` : "Seleziona un giorno"}
      </Typography>

      {/* Mostra segnalazione se presente */}
      {segnalazione && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {segnalazione.descrizione}
        </Alert>
      )}

      {/* Form inserimento/modifica */}
      <Box sx={{ display: "flex", gap: 2, width: "100%", mb: 2 }}>
        <TextField
          select
          label="Commessa"
          value={selectedCommessa}
          onChange={(e) => setSelectedCommessa(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          {commesse.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>

        <TextField
          label="Ore"
          type="number"
          value={ore}
          onChange={(e) => setOre(e.target.value)}
          sx={{ width: 80 }}
          inputProps={{ min: 1, max: 8 }}
        />

        <TextField
          label="Descrizione"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          sx={{ flex: 1 }}
        />

        <Button
          variant="contained"
          onClick={handleAddOrUpdate}
          disabled={!selectedCommessa || totalHours >= 8}
        >
          {editingIndex !== null ? "Aggiorna" : "Aggiungi"}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Divider />
      {/* Lista dei record */}
      <Box sx={{ flexGrow:1 , overflowY: "auto", bgcolor: "background.default", minHeight: 0, }}>
        {records.length > 0 ? (
          <List>
            {records.map((rec, idx) => (
              <ListItem
                key={idx}
                sx={{ flexDirection: "column", alignItems: "flex-start", mb: 1 }}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" onClick={() => handleEdit(idx)}><Edit /></IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(idx)}><Delete /></IconButton>
                  </Box>
                }
              >
                <Typography variant="body2">
                  {rec.commessa} - {rec.ore}h
                </Typography>
                <Typography variant="caption">{rec.descrizione}</Typography>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Nessun record presente</Alert>
        )}
      </Box>
      <Divider />
      <Typography variant="body2" sx={{ color }}>
          Totale ore inserite: {totalHours} / 8
        </Typography>
    </Box>
  );
};

export default DayEntryPanel;
