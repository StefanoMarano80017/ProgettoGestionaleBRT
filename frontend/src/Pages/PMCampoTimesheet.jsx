import React from "react";
import { Box, Typography, Alert } from "@mui/material";

export default function PMCampoTimesheet() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>PM da campo — Timesheet squadre</Typography>
      <Alert severity="info">Pagina placeholder: inserimento ore per squadre su commessa (in sviluppo).</Alert>
    </Box>
  );
}