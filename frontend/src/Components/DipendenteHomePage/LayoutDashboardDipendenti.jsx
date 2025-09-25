import React from "react";
import { Box, Paper, Stack } from "@mui/material";

// Componente generico per una colonna
const Column = ({ children, flex = 1, borderRight = false, ...props }) => (
  <Paper
    sx={{
      flex,
      p: 2,
      display: "flex",
      flexDirection: "column",
      borderRadius: 0,
      backgroundColor: "transparent", // elimina colore di sfondo
      borderRight: borderRight ? "1px solid #ddd" : "none",
      boxSizing: "border-box",
    }}
    elevation={0}
    {...props}
  >
    <Stack spacing={2} justifyContent="flex-start">
      {children.map((Component, index) => (
        <div key={index}>{Component}</div>
      ))}
    </Stack>
  </Paper>
);

const LayoutDashboardDipendenti = ({ leftComponents, rightComponents }) => {
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        gap: 2,
      }}
    >
      {/* Colonna sinistra (1/3) */}
      <Column flex={1} borderRight>
        {leftComponents}
      </Column>

      {/* Colonna destra (2/3) */}
      <Column flex={2}>
        {rightComponents}
      </Column>
    </Box>
  );
};

export default LayoutDashboardDipendenti;
