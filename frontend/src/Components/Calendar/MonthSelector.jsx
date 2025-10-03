import React from "react";
import { Box, Stack, Button, IconButton, Typography } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";

const shortMonth = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const fullMonth = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

export default function MonthSelector({
  year,
  month, // 0-based
  onChange, // (m, y)
  variant = "windowed", // 'windowed' | 'full'
  labels = "short", // 'short' | 'full'
  sx = {},
}) {
  const labelArr = labels === "full" ? fullMonth : shortMonth;

  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    onChange?.(d.getMonth(), d.getFullYear());
  };

  if (variant === "full") {
    return (
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1, ...sx }}>
        <IconButton size="small" onClick={() => onChange?.(month, year - 1)}>
          <ArrowBackIos fontSize="inherit" />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 80, textAlign: "center" }}>{year}</Typography>
        <IconButton size="small" onClick={() => onChange?.(month, year + 1)}>
          <ArrowForwardIos fontSize="inherit" />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" flexWrap="wrap" useFlexGap gap={1} justifyContent="center">
          {Array.from({ length: 12 }).map((_, m) => (
            <Button
              key={m}
              size="small"
              variant={m === month ? "contained" : "outlined"}
              sx={{ fontSize: "0.75rem" }}
              onClick={() => onChange?.(m, year)}
            >
              {labelArr[m]}
            </Button>
          ))}
        </Stack>
      </Stack>
    );
  }

  // windowed: show prev/next arrows with 5 month buttons around current
  const prev2Date = new Date(year, month - 2, 1);
  const prev1Date = new Date(year, month - 1, 1);
  const currDate  = new Date(year, month, 1);
  const next1Date = new Date(year, month + 1, 1);
  const next2Date = new Date(year, month + 2, 1);

  const mkShort = (d) => {
    const base = labelArr[d.getMonth()];
    return `${base}${d.getFullYear() !== year ? " " + d.getFullYear() : ""}`;
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1, ...sx }}>
      <IconButton size="small" onClick={() => shiftMonth(-1)}>
        <ArrowBackIos fontSize="inherit" />
      </IconButton>

      <Button variant="outlined" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => onChange?.(prev2Date.getMonth(), prev2Date.getFullYear())}>
        {mkShort(prev2Date)}
      </Button>
      <Button variant="outlined" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => onChange?.(prev1Date.getMonth(), prev1Date.getFullYear())}>
        {mkShort(prev1Date)}
      </Button>
      <Button variant="contained" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => onChange?.(currDate.getMonth(), currDate.getFullYear())}>
        {mkShort(currDate)}
      </Button>
      <Button variant="outlined" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => onChange?.(next1Date.getMonth(), next1Date.getFullYear())}>
        {mkShort(next1Date)}
      </Button>
      <Button variant="outlined" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => onChange?.(next2Date.getMonth(), next2Date.getFullYear())}>
        {mkShort(next2Date)}
      </Button>

      <IconButton size="small" onClick={() => shiftMonth(1)}>
        <ArrowForwardIos fontSize="inherit" />
      </IconButton>
    </Box>
  );
}
