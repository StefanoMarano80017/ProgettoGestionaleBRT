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
    <Box >
        <Stack direction="row" spacing={1} >
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

          <TextField  label="Ore"  type="number"  size="small"  value={oreInput}  inputProps={{ min: 0 }}  onChange={(e) => setOreInput(e.target.value)}  sx={{ maxWidth: 80 }}/>

          <TextField  label="Descrizione"  type="text"  size="small"  value={descrizione}  onChange={(e) => setDescrizione(e.target.value)}  sx={{ flexGrow: 1, minWidth: 120 }}/>

          <Button variant="contained" size="small" onClick={handleAddCommessa}>
            <AddIcon />
          </Button>
        </Stack>

      {/* Lista scrollabile */}
        {commesse.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            p={2}
          >
              <InfoOutlinedIcon color="info" />
              <Typography>Nessuna commessa aggiunta</Typography>
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
                  />
                </ListItem>
                {idx < commesse.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
  </Box>
  );
}
