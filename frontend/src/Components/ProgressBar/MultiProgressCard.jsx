import React from "react";
import {
  Card,
  CardContent,
  LinearProgress,
  Typography,
  Box,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info"; // icona di default
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const defaultColors = ["#1976d2", "#d32f2f", "#388e3c"]; // blu, rosso, verde

const MultiProgressCard = ({ progresses }) => {
  const total = progresses.reduce((sum, p) => sum + p.value, 0);

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box sx={{ mr: 1 }}>
            <AccessTimeIcon />
          </Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Totale: {total} h
          </Typography>
        </Box>

        {/* Progress Bars */}
        <CardContent sx={{ p: 0 }}>
          {progresses.map((progress, index) => {
            const color = defaultColors[index % defaultColors.length]; // assegna colore ciclicamente
            return (
              <Box
                key={index}
                sx={{ mb: index < progresses.length - 1 ? 2 : 0 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {progress.label}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {progress.value} h
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress.value}
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
          })}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MultiProgressCard;
