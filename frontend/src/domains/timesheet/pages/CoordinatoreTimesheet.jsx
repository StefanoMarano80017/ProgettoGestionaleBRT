import React from "react";
import { Box, Container, Typography, Alert } from "@mui/material";

export default function Coordinatore() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ minHeight: 'calc(100vh - 300px)' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Coordinatore</Typography>
        <Alert severity="info">Funzionalità non ancora disponibili. In arrivo.</Alert>
      </Box>
    </Container>
  );
}