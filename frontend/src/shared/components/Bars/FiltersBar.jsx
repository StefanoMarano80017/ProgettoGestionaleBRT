import React from "react";
import { Stack, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Paper } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function FiltersBar({
  filterCompany,
  setFilterCompany,
  companies = [],
  searchEmployee,
  setSearchEmployee,
  searchCommessa,
  setSearchCommessa,
}) {
  return (
  <Paper sx={{ p: 1, borderRadius: 1, bgcolor: (theme) => theme.palette.background.paper }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems="center"
        sx={{ flexWrap: "wrap" }}
      >
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Azienda</InputLabel>
        <Select
          label="Azienda"
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          sx={{
              '& .MuiSelect-select': { bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.customGray.main, borderRadius: 1, pl: 1 },
            }}
        >
          <MenuItem value="ALL">Tutte</MenuItem>
          {companies.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        size="small"
        label="Cerca dipendente"
        value={searchEmployee}
        onChange={(e) => setSearchEmployee(e.target.value)}
        sx={{
          minWidth: 220,
          '& .MuiInputBase-input': { bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.customGray.main, borderRadius: 1 },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        size="small"
        label="Cerca commessa (mese)"
        value={searchCommessa}
        onChange={(e) => setSearchCommessa(e.target.value)}
        sx={{
          minWidth: 240,
          '& .MuiInputBase-input': { bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.customGray.main, borderRadius: 1 },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      </Stack>
    </Paper>
  );
}
