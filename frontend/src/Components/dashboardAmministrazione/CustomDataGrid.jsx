import React, { useState, useMemo } from "react";
import { Box, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

export default function CustomDataGrid({ rows, columns }) {
  const [searchText, setSearchText] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(columns.map((c) => c.field));
  const [ageFilter, setAgeFilter] = useState(""); // esempio filtro custom colonna "age"

  // Filtra colonne visibili
  const filteredColumns = useMemo(
    () => columns.filter((c) => visibleColumns.includes(c.field)),
    [visibleColumns, columns]
  );

  // Filtra righe in base ai filtri
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // ricerca testuale globale
      const matchesSearch = Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase());

      // filtro custom age
      let matchesAge = true;
      if (ageFilter) {
        const age = row.age || 0;
        if (ageFilter === "under30") matchesAge = age < 30;
        if (ageFilter === "30to50") matchesAge = age >= 30 && age <= 50;
        if (ageFilter === "over50") matchesAge = age > 50;
      }

      return matchesSearch && matchesAge;
    });
  }, [rows, searchText, ageFilter]);

  return (
<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
  {/* Barra filtri */}
  <Box
    sx={{
      display: "flex",
      gap: 2,
      p: 1,
      flexWrap: "wrap",
      bgcolor: "background.paper",
      borderBottom: 1,
      borderColor: "divider",
    }}
  >
    <TextField
      size="small"
      placeholder="Cerca..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
    />
    {columns.map((col) => (
      <Box key={col.field} sx={{ display: "flex", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={visibleColumns.includes(col.field)}
          onChange={() => {
            setVisibleColumns((prev) =>
              prev.includes(col.field)
                ? prev.filter((f) => f !== col.field)
                : [...prev, col.field]
            );
          }}
        />{" "}
        {col.headerName}
      </Box>
    ))}
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id="age-filter-label">Età</InputLabel>
      <Select
        labelId="age-filter-label"
        value={ageFilter}
        label="Età"
        onChange={(e) => setAgeFilter(e.target.value)}
      >
        <MenuItem value="">Tutte</MenuItem>
        <MenuItem value="under30">Sotto 30</MenuItem>
        <MenuItem value="30to50">30 - 50</MenuItem>
        <MenuItem value="over50">Oltre 50</MenuItem>
      </Select>
    </FormControl>
  </Box>

  {/* DataGrid */}
  <Box sx={{ flex: 1, minHeight: 0 }}>
    <DataGrid
      rows={filteredRows}
      columns={filteredColumns}
      pageSize={5}
      rowsPerPageOptions={[5]}
      sx={{
        height: "100%",
        "& .MuiDataGrid-virtualScroller": { overflow: "auto" },
        "& .MuiDataGrid-main": { minHeight: 0 },
        "& .MuiDataGrid-columnHeaders": { flex: "0 0 auto" },
      }}
      autoHeight={false}
      disableSelectionOnClick
    />
  </Box>
</Box>

  );
}
