import React from "react";
import { Box, TextField, Button } from "@mui/material";
import { GridToolbarContainer } from "@mui/x-data-grid";

function CustomToolbar({ searchText, setSearchText, visibleColumns, toggleColumn }) {
  return (
    <GridToolbarContainer>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", p: 1 }}>
        {/* Ricerca testuale */}
        <TextField
          size="small"
          placeholder="Cerca..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {/* Selettore colonne (esempio semplice) */}
        {visibleColumns.map((col) => (
          <Button
            key={col.field}
            variant="outlined"
            onClick={() => toggleColumn(col.field)}
          >
            {col.headerName}
          </Button>
        ))}
      </Box>
    </GridToolbarContainer>
  );
}
