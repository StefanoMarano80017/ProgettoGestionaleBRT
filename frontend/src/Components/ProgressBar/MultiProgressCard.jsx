import React from "react";
import {  Card,  CardContent,  LinearProgress,  Typography,  Box,} from "@mui/material";

const MultiProgressCard = ({ progresses }) => {
  const total = progresses.reduce((sum, p) => sum + p.value, 0);

  return (
    <Box>
      <Card sx={{ p: 2, boxShadow: "none", backgroundColor: 'customBackground.main' }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, backgroundColor: 'customBackground.main',  }}>
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
