// src/shared/components/Footer/Footer.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box 
      sx={{ 
        mt: 6, 
        py: 4, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Sistema Gestionale BRT • Developed by : <strong>Andrea Manfellotti & Stefano Marano</strong>
      </Typography>
    </Box>
  );
}
