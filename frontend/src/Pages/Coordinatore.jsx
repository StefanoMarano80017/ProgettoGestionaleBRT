import React from "react";
import { Box, Typography, Alert } from "@mui/material";

export default function Coordinatore() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Coordinatore</Typography>
      <Alert severity="info">Funzionalità non ancora disponibili. In arrivo.</Alert>
    </Box>
  );
}