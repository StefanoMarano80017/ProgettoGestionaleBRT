import React from "react";
import { Box, Card, CardContent, Stack } from "@mui/material";
import FiltersMenu from "./FiltersMenu";

export default function FiltersBar({ filters = [], activeFilters = [] }) {
  // Separiamo il filtro di testo dagli altri
  const textFilter = filters.find((f) => f.label === "Testo");
  const otherFilters = filters.filter((f) => f.label !== "Testo");

  return (
    <Card>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Chips dei filtri attivi */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {filters
            .filter((f) => activeFilters.includes(f.label))
            .map((f) => {
              if (!f.renderChip) return null;
              return f.renderChip();
            })}
        </Stack>

        {/* Menu dei filtri */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Renderizza il filtro di testo fuori dal menu */}
          {textFilter?.render && <Box>{textFilter.render()}</Box>}

          {/* Menu per gli altri filtri */}
          <FiltersMenu filters={otherFilters} activeFilters={activeFilters} />
        </Box>
      </CardContent>
    </Card>
  );
}
