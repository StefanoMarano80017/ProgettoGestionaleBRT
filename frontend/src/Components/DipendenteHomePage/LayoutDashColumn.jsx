import React from "react";
import { Box, Stack } from "@mui/material";

/**
 * Layout generico a due colonne.
 *
 * Props:
 * - left: componente React (mostrato nella colonna sinistra o in alto su mobile)
 * - right: componente React (mostrato nella colonna destra o in basso su mobile)
 * - spacing: distanza tra le colonne (default: 2)
 */
const LayoutDashColumn = ({ left, right, spacing = 1 }) => {
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }} // verticale su mobile, orizzontale su desktop
        spacing={spacing}
        sx={{ width: "100%", height: "100%" }}
      >
        {/* Colonna sinistra */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {left}
        </Box>

        {/* Colonna destra */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {right}
        </Box>
      </Stack>
    </Box>
  );
};

export default LayoutDashColumn;
