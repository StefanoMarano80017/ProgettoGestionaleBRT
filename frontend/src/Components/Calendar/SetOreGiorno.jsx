import * as React from "react";
import {
  Typography,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Stack,
  Chip,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function SetOreGiornoModern({ selectedDate }) {
  const [commesse, setCommesse] = React.useState([]);
  const [selectedCommessa, setSelectedCommessa] = React.useState("");
  const [oreInput, setOreInput] = React.useState("");
  const [descrizione, setDescrizione] = React.useState("");

  const handleAddCommessa = () => {
    const oreNum = Number(oreInput);
    if (selectedCommessa && oreInput && oreNum >= 0) {
      setCommesse((prev) => [
        ...prev,
        { commessa: selectedCommessa, ore: oreNum, descrizione },
      ]);
      setSelectedCommessa("");
      setOreInput("");
      setDescrizione("");
    }
  };

  const handleRemoveCommessa = (index) => {
    setCommesse((prev) => prev.filter((_, i) => i !== index));
  };

  const totaleOreGiornata = commesse.reduce((sum, c) => sum + c.ore, 0);

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Header */}
      <Typography variant="subtitle1" align="center" gutterBottom width="100%">
        {selectedDate
          ? selectedDate.toLocaleDateString("it-IT", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Seleziona un giorno"}
      </Typography>

      {/* Controlli commessa */}
      <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" width="100%">
        <FormControl
          size="small"
          sx={{
            width: 150, // larghezza fissa
            flexShrink: 0, // impedisce che si riduca
          }}
        >
          <InputLabel id="select-commessa-label">Commessa</InputLabel>
          <Select
            labelId="select-commessa-label"
            value={selectedCommessa}
            label="Commessa"
            onChange={(e) => setSelectedCommessa(e.target.value)}
          >
            <MenuItem value="Commessa A">Commessa A</MenuItem>
            <MenuItem value="Commessa B">Commessa B</MenuItem>
            <MenuItem value="Commessa C">Commessa C</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Ore"
          type="number"
          size="small"
          value={oreInput}
          inputProps={{ min: 0 }}
          onChange={(e) => setOreInput(e.target.value)}
          sx={{ maxWidth: 80 }}
        />

        <TextField
          label="Descrizione"
          type="text"
          size="small"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 120 }}
        />

        <Button variant="contained" size="small" onClick={handleAddCommessa}>
          <AddIcon />
        </Button>
      </Stack>

      {/* Lista scrollabile */}
      <Box flex="1 1 0" minHeight={0} overflow="auto" mb={1} width="100%">
        {commesse.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <InfoOutlinedIcon color="info" />
              <Typography>Nessuna commessa aggiunta</Typography>
            </Paper>
          </Box>
        ) : (
          <List dense>
            {commesse.map((c, idx) => (
              <React.Fragment key={idx}>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleRemoveCommessa(idx)}
                    >
                      <CloseIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${c.commessa} - Ore: ${c.ore}`}
                    secondary={c.descrizione}
                    primaryTypographyProps={{
                      style: { wordBreak: "break-word", whiteSpace: "normal" },
                    }}
                    secondaryTypographyProps={{
                      style: { wordBreak: "break-word", whiteSpace: "normal" },
                    }}
                  />
                </ListItem>
                {idx < commesse.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer fisso */}
      <Stack direction="row" spacing={1} flexShrink={0} width="100%">
        <Chip
          label={`Totale ore giornata: ${totaleOreGiornata}h`}
          color="primary"
        />
        <Button
          variant="contained"
          color="success"
          startIcon={<PlayArrowIcon />}
        >
          Submit
        </Button>
      </Stack>
    </Box>
  );
}
