// src/pages/About.jsx
import { Typography, Container, Box } from "@mui/material";

export default function About() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ minHeight: 'calc(100vh - 300px)' }}>
        <Typography variant="h5" sx={{ color: "text.primary" }}> Questa è la pagina About </Typography>
      </Box>
    </Container>
  );
}
