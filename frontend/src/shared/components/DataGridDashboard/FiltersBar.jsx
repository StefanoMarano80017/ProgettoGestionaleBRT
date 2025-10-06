import React from "react";
import { Box, Card, CardContent, Stack } from "@mui/material";
import FiltersMenu from "./FiltersMenu";

export default function FiltersBar({ filters = [], activeFilters = [] }) {
  const textFilter = filters.find((f) => f.label === "Testo");
  const otherFilters = filters.filter((f) => f.label !== "Testo");
  return (
    <Card>
      <CardContent sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {filters.filter((f) => activeFilters.includes(f.label)).map((f) => f.renderChip ? f.renderChip() : null)}
        </Stack>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {textFilter?.render && <Box>{textFilter.render()}</Box>}
          <FiltersMenu filters={otherFilters} activeFilters={activeFilters} />
        </Box>
      </CardContent>
    </Card>
  );
}
