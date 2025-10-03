import React, { useMemo, useState } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DayEntryTile from "./DayEntryTile";
import { computeDayStatus } from "./dayStatus";
import MonthSelector from "./MonthSelector";
import TileLegend from "./TileLegend";
import { DayStatus, getStatusIcon } from "./statusIcons.jsx";

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

export default function WorkCalendar({ data = {}, selectedDay, onDaySelect, renderDayTooltip, fixedDayWidth = false, gap = 1, distributeGaps = false, variant = "default", selectorVariant = "windowed", selectorLabels = "short", showMonthlySummary = false }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const theme = useTheme();

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
    const { status, showHours, iconTopRight } = computeDayStatus({ dayData, dayOfWeek, segnalazione, dateStr, isHoliday, today });
    // Let DayEntryTile infer icon and background from status to avoid parent-side overrides.
    return { status, showHours, iconTopRight };
  };

  // Controls: small arrows + 5 month buttons (current centered)
  return (
    <Box sx={{ width: "100%" }}>
      {/* Month controls */}
      <MonthSelector
        year={currentYear}
        month={currentMonth}
        onChange={(m, y) => setMonthYear(m, y)}
        variant={selectorVariant}
        labels={selectorLabels}
      />

      {/* Weekday names */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: fixedDayWidth ? `repeat(7, ${variant === 'wide' ? 52 : 44}px)` : "repeat(7, 1fr)",
          gap: distributeGaps ? 0 : gap,
          justifyContent: distributeGaps ? "space-between" : "normal",
          width: "100%",
          mb: 1,
        }}
      >
        {weekDays.map((wd) => (
          <Box key={wd} sx={{ textAlign: "center" }}>
            <Typography variant="caption">{wd}</Typography>
          </Box>
        ))}
      </Box>

      {/* Days grid (compact, stable) */}
      <Box sx={{ overflowX: fixedDayWidth && !distributeGaps ? "auto" : "hidden", width: "100%" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: fixedDayWidth ? `repeat(7, ${variant === 'wide' ? 52 : 44}px)` : "repeat(7, 1fr)",
            gridAutoRows: "44px",
            gap: distributeGaps ? 0 : gap,
            maxHeight: 320,
            overflowY: "auto",
            scrollbarGutter: "stable",
            width: distributeGaps ? "100%" : fixedDayWidth ? "max-content" : "100%",
            justifyContent: distributeGaps ? "space-between" : "normal",
          }}
        >
        {days.map((item, index) => {
          if (!item) return <Box key={`empty-${index}`} sx={{ borderRadius: 1 }} />;

          const { day, dateStr, dayData, dayOfWeek, segnalazione, isHoliday } = item;
          const isSelected = selectedDay === dateStr;
          const { showHours, iconTopRight, status } = getDayInfo(dayData, dayOfWeek, segnalazione, dateStr, isHoliday);
          const totalHours = dayData?.reduce((sum, rec) => sum + (Number(rec.ore) || 0), 0) || 0;
          const isOutOfMonth = false; // currently not rendering other-month days; keep API ready

          const tooltipContent = renderDayTooltip?.(dateStr, { dayData, dayOfWeek, isHoliday, segnalazione, totalHours });

          return (
            <DayEntryTile
              key={dateStr}
              dateStr={dateStr}
              day={day}
              isSelected={isSelected}
              status={status}
              showHours={showHours}
              iconTopRight={iconTopRight}
              totalHours={totalHours}
              onClick={onDaySelect}
              tooltipContent={tooltipContent}
              variant={variant}
              isHoliday={isHoliday}
              /* isOutOfMonth intentionally omitted to allow DayEntryTile to use its default */
            />
          );
        })}
        </Box>
      </Box>

      {/* Monthly summary or legend under the calendar */}
      <Box sx={{ mt: 1.5 }}>
        {showMonthlySummary ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2">Mese: {fullMonth[currentMonth]} {currentYear}</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip size="small" label={`Ferie: ${monthlySummary.ferie.days} gg (${monthlySummary.ferie.hours}h)`} sx={{ borderRadius: 1 }} />
              <Chip size="small" label={`Malattia: ${monthlySummary.malattia.days} gg (${monthlySummary.malattia.hours}h)`} sx={{ borderRadius: 1 }} />
              <Chip size="small" label={`Permessi: ${monthlySummary.permesso.days} gg (${monthlySummary.permesso.hours}h)`} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        ) : (
          <TileLegend />
        )}
      </Box>
    </Box>
  );
}
