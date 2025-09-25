import * as React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function SetOreGiorno({ selectedDate }) {
  const [commesse, setCommesse] = React.useState([]);
  const [selectedCommessa, setSelectedCommessa] = React.useState("");
  const [oreInput, setOreInput] = React.useState("");
  const [descrizione, setDescrizione] = React.useState("");

  const totaleOreGiornata = commesse.reduce((sum, c) => sum + c.ore, 0);

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

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: 400, // Altezza fissa complessiva della card
        minHeight: 300,
        backgroundColor: 'transparent', 
        boxShadow: 'none',
      }}
    >
      {/* Header */}
      <CardHeader
        title={
          selectedDate
            ? selectedDate.toLocaleDateString("it-IT", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Seleziona un giorno"
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1, pb: 1, flex: "0 0 auto"}}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <FormControl size="small" sx={{ width: 150, flexShrink: 0 }}>
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
      </CardContent>

      {/* Lista scrollabile */}
      <CardContent
        sx={{
          flex: "1 1 auto",
          overflowY: "auto",
          pt: 0,
          pb: 0,
          minHeight: 0,
          maxHeight: "calc(100% - 120px)", // header + footer circa 120px
          border:1
        }}
      >
        {commesse.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            p={2}
          >
            <Paper
              sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}
              variant="outlined"
            >
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
      </CardContent>

      {/* Footer */}
      <CardActions sx={{ justifyContent: "space-between", pt: 1, pb: 1, px: 2, flexShrink: 0 }}>
        <Chip label={`Totale ore giornata: ${totaleOreGiornata}h`} color="primary" />
        <Button variant="contained" color="success" startIcon={<PlayArrowIcon />}>
          Submit
        </Button>
      </CardActions>
    </Card>
  );
}
