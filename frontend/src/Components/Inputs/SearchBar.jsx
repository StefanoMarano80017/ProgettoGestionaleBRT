import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ClickAwayListener,
  Typography,
  InputAdornment,
} from "@mui/material";
import KeyboardIcon from "@mui/icons-material/Keyboard";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const searchScopes = ["Commesse", "Progetti", "Dipendenti", "Documenti"];

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(value.length > 0 || open); // mantiene aperto se già aperto
  };

  const handleSelect = (scope) => {
    console.log(`Cerca "${query}" in ${scope}`);
    setOpen(false);
    setQuery("");
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  // ⌨️ Shortcut Ctrl/Cmd + K toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) inputRef.current?.focus();
          return !prev;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: "relative" }}>
        {/* Input */}
        <TextField
          fullWidth
          placeholder="Cerca..."
          inputRef={inputRef}
          value={query}
          onChange={handleChange}
          variant="outlined"
          onFocus={() => setOpen(true)} 
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <KeyboardIcon fontSize="small" />
                  <Typography variant="caption" color="textSecondary"> Ctrl + K </Typography>
                </Box>
              </InputAdornment>
            ),
            sx: {
              paddingY: 0, // riduce padding verticale
              fontSize: "0.875rem", // opzionale: riduce font
            },
          }}
          inputProps={{
            sx: {
              paddingY: 0.5, // riduce padding verticale dell'input
            },
          }}
        />

        {/* Dropdown */}
        <Popper
  open={open} // 🔥 rimosso query.length > 0
  anchorEl={inputRef.current}
  placement="bottom-start"
  style={{ width: inputRef.current?.offsetWidth }}
>
  <Paper elevation={3}>
    <List dense>
      {searchScopes.map((scope) => (
        <ListItem key={scope} disablePadding>
          <ListItemButton onClick={() => handleSelect(scope)}>
            <ListItemText
              primary={
                query.length > 0
                  ? `Cerca "${query}" in ${scope}`
                  : `Cerca in ${scope}` // 🔥 fallback quando query vuota
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Paper>
        </Popper>

      </Box>
    </ClickAwayListener>
  );
}
