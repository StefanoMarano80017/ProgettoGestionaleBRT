// src/pages/Home.jsx
import { Typography, Button, Box, Card, CardContent, CardActions } from "@mui/material";

export default function Home() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Benvenuto!
      </Typography>

      <Button variant="contained" color="primary">
        Cliccami
      </Button>

    </Box>
  );
}
