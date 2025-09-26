import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

const getColor = (progress) => {
  if (progress < 50) return "#f44336"; // rosso
  if (progress < 80) return "#ff9800"; // arancione
  return "#4caf50"; // verde
};

const CustomProgressBar = ({ progress = 80 }) => {
  const color = getColor(progress);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        mx: 0.5,
      }}
    >
      <Typography variant="body2" fontWeight="bold">
        {progress} h
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 10,
          borderRadius: 5,
          [`& .MuiLinearProgress-bar`]: {
            backgroundColor: color,
          },
        }}
      />
    </Box>
  );
};

export default CustomProgressBar;
