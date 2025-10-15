// src/pages/About.jsx
import { Typography, Box } from "@mui/material";

export default function About() {
  return (
    <Box sx={{ width: '100%', py: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ minHeight: 'calc(100vh - 300px)' }}>
        <Typography variant="h5" sx={{ color: "text.primary" }}> Questa è la pagina About </Typography>
      </Box>
    </Box>
  );
}
