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
import CelebrationIcon from '@mui/icons-material/Celebration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const shortMonth = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const fullMonth = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];
const weekDays = ["Lu","Ma","Me","Gi","Ve","Sa","Do"];

// Calcolo Pasqua (algoritmo di Butcher) e Lunedì di Pasqua
function computeEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function WorkCalendar({ data = {}, selectedDay, onDaySelect }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Set di festività italiane per l'anno corrente
  const holidaySet = useMemo(() => {
    const set = new Set();
    const y = currentYear;
    // Festività fisse
    [
      `${y}-01-01`, // Capodanno
      `${y}-01-06`, // Epifania
      `${y}-04-25`, // Liberazione
      `${y}-05-01`, // Lavoro
      `${y}-06-02`, // Repubblica
      `${y}-08-15`, // Ferragosto
      `${y}-11-01`, // Ognissanti
      `${y}-12-08`, // Immacolata
      `${y}-12-25`, // Natale
      `${y}-12-26`, // Santo Stefano
    ].forEach((d) => set.add(d));
    // Pasqua (domenica) e Lunedì dell'Angelo (festivo)
    const easter = computeEasterDate(y);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    set.add(formatDate(easterMonday));
    return set;
  }, [currentYear]);

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
      const isHoliday = holidaySet.has(dateStr);
      arr.push({ day: d, dateStr, dayData, dayOfWeek, segnalazione, isHoliday });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    if (arr.length < 42) {
      const fill = 42 - arr.length;
      for (let i = 0; i < fill; i++) arr.push(null);
    }
    return arr;
  }, [data, currentMonth, currentYear, firstDay, lastDay, holidaySet]);

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

  const getDayInfo = (dayData, dayOfWeek, segnalazione, dateStr, isHoliday) => {
    const totalHours = dayData?.reduce((sum, rec) => sum + (Number(rec.ore) || 0), 0) || 0;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFuture = new Date(dateStr) > today;

    // Priorità massima: segnalazione amministrativa
    if (segnalazione) return { bgcolor: "error.main", icon: <WarningAmber fontSize="small" />, showHours: false, hasPermessoDot: false, iconTopRight: false };

    // Festività nazionali: colore dedicato e icona
    if (isHoliday) return { bgcolor: "grey.400", icon: <CelebrationIcon fontSize="small" />, showHours: false, hasPermessoDot: false, iconTopRight: false };

    // Weekend: evidenzia sempre con colore dedicato; mostra ore se presenti
    if (isWeekend) return { bgcolor: "grey.400", icon: null, showHours: totalHours > 0, hasPermessoDot: false, iconTopRight: false };

    if (!dayData || dayData.length === 0) return { bgcolor: "transparent", icon: null, showHours: false, hasPermessoDot: false, iconTopRight: false };

    if (dayData.some((rec) => rec.commessa === "FERIE"))
      return { bgcolor: "orange", icon: <BeachAccess fontSize="small" />, showHours: false, hasPermessoDot: false, iconTopRight: false };

    if (dayData.some((rec) => rec.commessa === "MALATTIA"))
      return { bgcolor: "secondary.main", icon: <LocalHospital fontSize="small" />, showHours: false, hasPermessoDot: false, iconTopRight: false };

    const hasPermesso = dayData.some((rec) => rec.commessa === "PERMESSO");
    if (hasPermesso)
      return { bgcolor: "transparent", icon: <EventAvailable sx={{ fontSize: 16, color: 'info.main' }} />, showHours: true, hasPermessoDot: false, iconTopRight: true };

    if (isFuture) return { bgcolor: "transparent", icon: null, showHours: false, hasPermessoDot: false, iconTopRight: false };

    if (totalHours === 8)
      return { bgcolor: "transparent", icon: <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />, showHours: true, hasPermessoDot: false, iconTopRight: true };

    if (totalHours > 0 && totalHours < 8)
      return { bgcolor: "transparent", icon: <AccessTimeIcon sx={{ fontSize: 16, color: 'warning.main' }} />, showHours: true, hasPermessoDot: false, iconTopRight: true };

    return { bgcolor: "transparent", icon: null, showHours: false, hasPermessoDot: false, iconTopRight: false };
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
  const currLabel  = mkShort(currDate);
  const next1Label = mkShort(next1Date);
  const next2Label = mkShort(next2Date);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Month controls */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
        <IconButton size="small" onClick={() => shiftMonth(-1)}>
          <ArrowBackIos fontSize="inherit" />
        </IconButton>

        <Button variant="outlined" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => setMonthYear(prev2Date.getMonth(), prev2Date.getFullYear())}>
          {prev2Label}
        </Button>
        <Button variant="outlined" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => setMonthYear(prev1Date.getMonth(), prev1Date.getFullYear())}>
          {prev1Label}
        </Button>
        <Button variant="contained" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => setMonthYear(currDate.getMonth(), currDate.getFullYear())}>
          {currLabel}
        </Button>
        <Button variant="outlined" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => setMonthYear(next1Date.getMonth(), next1Date.getFullYear())}>
          {next1Label}
        </Button>
        <Button variant="outlined" size="small" sx={{ fontSize: "0.75rem" }} onClick={() => setMonthYear(next2Date.getMonth(), next2Date.getFullYear())}>
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

          const { day, dateStr, dayData, dayOfWeek, segnalazione, isHoliday } = item;
          const isSelected = selectedDay === dateStr;
          const { bgcolor, icon, showHours, hasPermessoDot, iconTopRight } = getDayInfo(dayData, dayOfWeek, segnalazione, dateStr, isHoliday);
          const totalHours = dayData?.reduce((sum, rec) => sum + (Number(rec.ore) || 0), 0) || 0;

          const dateChipBg = (isSelected || bgcolor !== "transparent")
            ? "rgba(255,255,255,0.25)"
            : "rgba(0,0,0,0.06)";

          return (
            <Box
              key={dateStr}
              onClick={() => onDaySelect?.(dateStr)}
              sx={{
                position: "relative",
                cursor: "pointer",
                borderRadius: 1,
                background: isSelected
                    ? (theme) => theme.palette.primary.light
                    : bgcolor,
                bgcolor: isSelected ? "primary.light" : bgcolor,
                color: bgcolor !== "transparent" ? "white" : "text.primary",
                height: "100%",
                px: 1,
                boxShadow: isSelected
                  ? "inset 0 0 0 2px #fff"
                  : "inset 0 0 0 1px rgba(0,0,0,0.12)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  top: 4,
                  left: 6,
                  lineHeight: 1,
                  px: 0.5,
                  borderRadius: 1,
                  backgroundColor: dateChipBg,
                }}
              >
                {day}
              </Typography>

              <Typography
                variant="caption"
                sx={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", lineHeight: 1 }}
              >
                {showHours ? `${totalHours}h` : ""}
              </Typography>

              {icon && (
                <Box
                  sx={{
                    position: "absolute",
                    top: iconTopRight ? 4 : "50%",
                    right: iconTopRight ? 6 : undefined,
                    left: iconTopRight ? undefined : "50%",
                    transform: iconTopRight ? "none" : "translate(-50%, -50%)",
                    lineHeight: 0,
                  }}
                >
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
            color="transparent"
            icon={<BeachAccess fontSize="small"/>}
            label={`Ferie: ${monthlySummary.ferie.days}g • ${monthlySummary.ferie.hours}h`}
            sx={{ borderRadius: 1, "& .MuiChip-icon": { color: "customPink.main" } }}
          />
          <Chip
            size="small"
            color="transparent"
            icon={<LocalHospital fontSize="small" />}
            label={`Malattia: ${monthlySummary.malattia.days}g • ${monthlySummary.malattia.hours}h`}
            sx={{ borderRadius: 1, "& .MuiChip-icon": { color: "customPink.main" } }}
          />
          <Chip
            size="small"
            color="transparent"
            icon={<EventAvailable fontSize="small" />}
            label={`Permesso: ${monthlySummary.permesso.days}g • ${monthlySummary.permesso.hours}h`}
            sx={{ borderRadius: 1, "& .MuiChip-icon": { color: "customBlue1.main" } }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
