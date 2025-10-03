import React from "react";
import { Box, Stack, Typography } from "@mui/material";

export default function LegendItem({ icon, label, text, color }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center">
      <Box sx={{ color }}>{icon}</Box>
      <Stack>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="body2">{text}</Typography>
      </Stack>
    </Stack>
  );
}
