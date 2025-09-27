import React from "react";
import { Box, useTheme } from "@mui/material";

const ColorDot = ({ color = "grey", size = 10 }) => {
  const theme = useTheme();

  // Se il colore è una chiave della palette MUI, usa theme.palette[color].main
  const resolvedColor = theme.palette[color]?.main || color;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: resolvedColor,
        mr: 1,
        flexShrink: 0,
      }}
    />
  );
};

export default ColorDot;
