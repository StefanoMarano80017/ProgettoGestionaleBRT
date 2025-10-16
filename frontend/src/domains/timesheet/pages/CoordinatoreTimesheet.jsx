import React from "react";
import { Box, Typography, Alert } from "@mui/material";

export default function Coordinatore() {
  return (
    <Box sx={{ width: '100%', py: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ minHeight: 'calc(100vh - 300px)' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Coordinatore</Typography>
        <Alert severity="info">Funzionalità non ancora disponibili. In arrivo.</Alert>
      </Box>
    </Box>
  );
}