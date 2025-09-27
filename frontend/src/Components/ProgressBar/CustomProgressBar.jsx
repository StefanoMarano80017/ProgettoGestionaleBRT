import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

const getColor = (progress) => {
  if (progress < 50) return "#f44336"; // rosso
  if (progress < 80) return "#ff9800"; // arancione
  return "#4caf50"; // verde
};

const CustomProgressBar = ({ progress }) => {
  const color = getColor(progress);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",  
        justifyContent: "center", 
        width: "100%",        // importante
        my:2,
      }}
    >
      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 40 }}>
        {progress} h
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          flexGrow: 1,        // occupa tutto lo spazio rimanente
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
