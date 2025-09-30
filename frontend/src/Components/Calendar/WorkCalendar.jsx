import React, { useMemo, useState } from "react";
import { Box, Typography, IconButton, Button, Chip, Stack } from "@mui/material";
import {
  ArrowBackIos,
  ArrowForwardIos,
  WarningAmber,
  BeachAccess,
  LocalHospital,
  EventAvailable,
} from "@mui/icons-material";

const shortMonth = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const fullMonth = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];
const weekDays = ["Lu","Ma","Me","Gi","Ve","Sa","Do"];

export default function WorkCalendar({ data = {}, selectedDay, onDaySelect }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const shiftMonth = (delta) => {
    const d = new Date(currentYear, currentMonth + delta, 1);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  };
  const setMonthYear = (m, y) => {
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const firstDay = useMemo(() => new Date(currentYear, currentMonth, 1), [currentMonth, currentYear]);
  const lastDay = useMemo(() => new Date(currentYear, currentMonth + 1, 0), [currentMonth, currentYear]);

  // Build calendar cells: always 6 weeks (42)
  const days = useMemo(() => {
    const arr = [];
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday=0
    for (let i = 0; i < startDayOfWeek; i++) arr.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const dayData = data[dateStr];
      const segnalazione = data[`${dateStr}_segnalazione`];
      arr.push({ day: d, dateStr, dayData, dayOfWeek, segnalazione });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    if (arr.length < 42) {
      const fill = 42 - arr.length;
      for (let i = 0; i < fill; i++) arr.push(null);
    }
    return arr;
  }, [data, currentMonth, currentYear, firstDay, lastDay]);

  // Monthly summary (Ferie, Malattia, Permesso)
  const monthlySummary = useMemo(() => {
    let ferieH = 0, malH = 0, permH = 0;
    const ferieDays = new Set(), malDays = new Set(), permDays = new Set();
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const list = data[dateStr] || [];
      list.forEach(rec => {
        const ore = Number(rec.ore || 0);
        if (rec.commessa === "FERIE") { ferieH += ore; ferieDays.add(dateStr); }
        if (rec.commessa === "MALATTIA") { malH += ore; malDays.add(dateStr); }
        if (rec.commessa === "PERMESSO") { permH += ore; permDays.add(dateStr); }
      });
    }
    return {
      ferie: { hours: ferieH, days: ferieDays.size },
      malattia: { hours: malH, days: malDays.size },
      permesso: { hours: permH, days: permDays.size },
    };
  }, [data, currentMonth, currentYear, lastDay]);

  const getDayInfo = (dayData, dayOfWeek, segnalazione, dateStr) => {
    const totalHours = dayData?.reduce((sum, rec) => sum + (Number(rec.ore) || 0), 0) || 0;
    const isWeekend = dayOfWeek >= 5;
    const isFuture = new Date(dateStr) > today;

    if (!dayData || dayData.length === 0) return { bgcolor: "transparent", icon: null, showHours: false, hasPermessoDot: false };

    if (dayData.some((rec) => rec.commessa === "FERIE"))
      return { bgcolor: "success.main", icon: <BeachAccess fontSize="small" />, showHours: false, hasPermessoDot: false };

    if (dayData.some((rec) => rec.commessa === "MALATTIA"))
      return { bgcolor: "secondary.main", icon: <LocalHospital fontSize="small" />, showHours: false, hasPermessoDot: false };

    const hasPermesso = dayData.some((rec) => rec.commessa === "PERMESSO");
    if (hasPermesso)
      return { bgcolor: "info.main", icon: null, showHours: true, hasPermessoDot: true };

    if (segnalazione) return { bgcolor: "error.main", icon: <WarningAmber fontSize="small" />, showHours: false, hasPermessoDot: false };
    if (isFuture) return { bgcolor: "transparent", icon: null, showHours: false, hasPermessoDot: false };
    if (totalHours === 8) return { bgcolor: "success.main", icon: null, showHours: true, hasPermessoDot: false };
    if (totalHours > 0 || (!isWeekend && totalHours < 8)) return { bgcolor: "warning.main", icon: null, showHours: true, hasPermessoDot: false };
    return { bgcolor: isWeekend ? "grey.400" : "transparent", icon: null, showHours: false, hasPermessoDot: false };
  };

  // Controls: small arrows + 5 month buttons (current centered)
  const prev2Date = new Date(currentYear, currentMonth - 2, 1);
  const prev1Date = new Date(currentYear, currentMonth - 1, 1);
  const currDate  = new Date(currentYear, currentMonth, 1);
  const next1Date = new Date(currentYear, currentMonth + 1, 1);
  const next2Date = new Date(currentYear, currentMonth + 2, 1);

  const mkShort = (d) =>
    `${shortMonth[d.getMonth()]}${d.getFullYear() !== currentYear ? " " + d.getFullYear() : ""}`;

  const prev2Label = mkShort(prev2Date);
  const prev1Label = mkShort(prev1Date);
  const currLabel  = `${fullMonth[currDate.getMonth()]}`;
  const next1Label = mkShort(next1Date);
  const next2Label = mkShort(next2Date);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Month controls */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
        <IconButton size="small" onClick={() => shiftMonth(-1)}>
          <ArrowBackIos fontSize="inherit" />
        </IconButton>

        <Button variant="outlined" size="small" onClick={() => setMonthYear(prev2Date.getMonth(), prev2Date.getFullYear())}>
          {prev2Label}
        </Button>
        <Button variant="outlined" size="small" onClick={() => setMonthYear(prev1Date.getMonth(), prev1Date.getFullYear())}>
          {prev1Label}
        </Button>
        <Button variant="contained" size="small" onClick={() => setMonthYear(currDate.getMonth(), currDate.getFullYear())}>
          {currLabel}
        </Button>
        <Button variant="outlined" size="small" onClick={() => setMonthYear(next1Date.getMonth(), next1Date.getFullYear())}>
          {next1Label}
        </Button>
        <Button variant="outlined" size="small" onClick={() => setMonthYear(next2Date.getMonth(), next2Date.getFullYear())}>
          {next2Label}
        </Button>

        <IconButton size="small" onClick={() => shiftMonth(1)}>
          <ArrowForwardIos fontSize="inherit" />
        </IconButton>
      </Box>

      {/* Weekday names */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
        {weekDays.map((wd) => (
          <Box key={wd} sx={{ textAlign: "center" }}>
            <Typography variant="caption">{wd}</Typography>
          </Box>
        ))}
      </Box>

      {/* Days grid (compact, stable) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridAutoRows: "44px",
          gap: 1,
          maxHeight: 320,
          overflowY: "auto",
          scrollbarGutter: "stable",
        }}
      >
        {days.map((item, index) => {
          if (!item) return <Box key={`empty-${index}`} sx={{ borderRadius: 1 }} />;

          const { day, dateStr, dayData, dayOfWeek, segnalazione } = item;
          const isSelected = selectedDay === dateStr;
          const { bgcolor, icon, showHours, hasPermessoDot } = getDayInfo(dayData, dayOfWeek, segnalazione, dateStr);
          const totalHours = dayData?.reduce((sum, rec) => sum + (Number(rec.ore) || 0), 0) || 0;

          return (
            <Box
              key={dateStr}
              onClick={() => onDaySelect?.(dateStr)}
              sx={{
                position: "relative",
                cursor: "pointer",
                borderRadius: 1,
                bgcolor: isSelected ? "primary.light" : bgcolor,
                color: bgcolor !== "transparent" ? "white" : "text.primary",
                height: "100%",
                px: 1,
              }}
            >
              <Typography variant="caption" sx={{ position: "absolute", top: 4, left: 6, lineHeight: 1 }}>
                {day}
              </Typography>

              <Typography
                variant="caption"
                sx={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", lineHeight: 1 }}
              >
                {showHours ? `${totalHours}h` : ""}
              </Typography>

              {icon && (
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", lineHeight: 0 }}>
                  {icon}
                </Box>
              )}

              {hasPermessoDot && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "white",
                    position: "absolute",
                    top: 6,
                    right: 6,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Monthly summary under the calendar */}
      <Box sx={{ mt: 1.5 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          <Chip
            size="small"
            color="success"
            icon={<BeachAccess fontSize="small" />}
            label={`Ferie: ${monthlySummary.ferie.days}g • ${monthlySummary.ferie.hours}h`}
            sx={{ borderRadius: 1 }}
          />
          <Chip
            size="small"
            color="secondary"
            icon={<LocalHospital fontSize="small" />}
            label={`Malattia: ${monthlySummary.malattia.days}g • ${monthlySummary.malattia.hours}h`}
            sx={{ borderRadius: 1 }}
          />
          <Chip
            size="small"
            color="info"
            icon={<EventAvailable fontSize="small" />}
            label={`Permesso: ${monthlySummary.permesso.days}g • ${monthlySummary.permesso.hours}h`}
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
