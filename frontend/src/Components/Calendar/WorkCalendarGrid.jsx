import React, { useMemo, useState } from "react";
import { Box, IconButton, Typography, Tooltip } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DayEntryTile from "./DayEntryTile";

const weekDays = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];
const monthNames = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

function getDayStatus(dayData = [], segnalazione, dateStr, today) {
  const totalHours = dayData.reduce((s, r) => s + Number(r.ore || 0), 0);
  const hasFerie = dayData.some((r) => r.commessa === "FERIE");
  const hasMalattia = dayData.some((r) => r.commessa === "MALATTIA");
  const hasPermesso = dayData.some((r) => r.commessa === "PERMESSO");
  const isFuture = new Date(dateStr) > today;

  if (!dayData.length) return { label: "Vuoto", color: "default" };
  if (hasFerie) return { label: "Ferie", color: "success" };
  if (hasMalattia) return { label: "Malattia", color: "secondary" };
  if (segnalazione) return { label: "Segnalazione", color: "error" };
  if (hasPermesso && totalHours < 8) return { label: "Permesso/Parziale", color: "info" };
  if (isFuture) return { label: "Futuro", color: "default" };
  if (totalHours === 8) return { label: "Completo", color: "success" };
  if (totalHours > 0 && totalHours < 8) return { label: "Parziale", color: "warning" };
  return { label: "Vuoto", color: "default" };
}

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

export default function WorkCalendarGrid({
  data = {},         // { 'YYYY-MM-DD': [records], 'YYYY-MM-DD_segnalazione': { descrizione } }
  year,
  month,             // 0-based
  compact = false,
  onDayClick,        // (dateKey) => void
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const firstDay = useMemo(() => new Date(currentYear, currentMonth, 1), [currentMonth, currentYear]);
  const lastDay = useMemo(() => new Date(currentYear, currentMonth + 1, 0), [currentMonth, currentYear]);

  const rows = useMemo(() => {
    const out = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const jsDate = new Date(currentYear, currentMonth, d);
      const dow = jsDate.getDay(); // 0=Dom ... 6=Sab
      const dayData = data[dateStr] || [];
      const segnalazione = data[`${dateStr}_segnalazione`];

      const totalHours = dayData.reduce((s, r) => s + Number(r.ore || 0), 0);
      const hasPermesso = dayData.some((r) => r.commessa === "PERMESSO");
      const hasFerie = dayData.some((r) => r.commessa === "FERIE");
      const hasMalattia = dayData.some((r) => r.commessa === "MALATTIA");

      const status = getDayStatus(dayData, segnalazione, dateStr, today);
      const weekdayLabel = weekDays[(dow + 6) % 7];

      out.push({
        id: dateStr,
        day: d,
        dateStr,
        weekdayLabel,
        totalHours,
        dayData,
        hasPermesso,
        hasFerie,
        hasMalattia,
        segnalazione,
        status,
      });
    }
    return out;
  }, [data, currentMonth, currentYear, lastDay, today]);

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };
  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const width = compact ? 44 : 60;
  const height = compact ? 44 : 36; // ensure compact cells have at least 44px height for consistency

  const daysInMonth = React.useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDow = React.useMemo(() => new Date(year, month, 1).getDay(), [year, month]); // 0=Dom
  const startOffset = (firstDow + 6) % 7; // lun=0

  const headers = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <IconButton onClick={handlePrev}><ArrowBackIosIcon /></IconButton>
        <Typography variant="h6">{monthNames[currentMonth]} {currentYear}</Typography>
        <IconButton onClick={handleNext}><ArrowForwardIosIcon /></IconButton>
      </Box>

      {/* Header giorni settimana */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
          mb: 0.5,
          px: 0.5,
        }}
      >
        {headers.map((h) => (
          <Typography key={h} variant="caption" sx={{ textAlign: "center", color: "text.secondary" }}>
            {h}
          </Typography>
        ))}
      </Box>

      {/* Griglia giorni */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
        }}
      >
        {/* Celle vuote prima del primo giorno */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <Box key={`empty-${i}`} />
        ))}

        {/* Giorni del mese */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const d = idx + 1;
          const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
          const recs = data[dateKey] || [];
          const seg = data[`${dateKey}_segnalazione`] || null;
          const total = (recs || []).reduce((s, r) => s + Number(r?.ore || 0), 0);
          const ferie = (recs || []).some((r) => r?.commessa === "FERIE");
          const mal = (recs || []).some((r) => r?.commessa === "MALATTIA");
          const perm = (recs || []).some((r) => r?.commessa === "PERMESSO");
          let bg = "transparent";
          if (seg) bg = "rgba(244, 67, 54, 0.15)";
          else if (ferie) bg = "rgba(76, 175, 80, 0.18)";
          else if (mal) bg = "rgba(156, 39, 176, 0.15)";
          else if (perm) bg = "rgba(2, 136, 209, 0.15)";
          else if (total === 8) bg = "rgba(76, 175, 80, 0.12)";
          else if (total > 0 && total < 8) bg = "rgba(255, 193, 7, 0.15)";

          const tooltipLines = [
            recs?.length ? `Ore totali: ${total}h` : "Nessun inserimento",
            ...(recs || []).map((r) => `${r.commessa}: ${r.ore}h${r.descrizione ? ` — ${r.descrizione}` : ""}`),
            seg ? `Segnalazione: ${seg.descrizione}` : null,
          ].filter(Boolean);

          const tooltipContent = (
            <span style={{ whiteSpace: "pre-line" }}>{tooltipLines.join("\n")}</span>
          );
          const status = getDayStatus(recs, seg, dateKey, today);

          return (
            <Box key={dateKey} sx={{ height }}>
              <DayEntryTile
                dateStr={dateKey}
                day={d}
                isSelected={false}
                /* let DayEntryTile decide visuals based on status */
                status={status?.label ? (status.label.toLowerCase().includes('ferie') ? 'ferie' : status.label.toLowerCase().includes('malattia') ? 'malattia' : status.label.toLowerCase().includes('segnalazione') ? 'admin-warning' : status.label.toLowerCase().includes('permesso') ? 'permesso' : status.label.toLowerCase().includes('completo') ? 'complete' : status.label.toLowerCase().includes('parziale') ? 'partial' : undefined) : undefined}
                variant={height < 44 ? 'compact' : 'default'}
                iconTopRight={false}
                showHours={total > 0}
                totalHours={total}
                onClick={onDayClick ? (ds) => onDayClick(ds) : undefined}
                tooltipContent={tooltipContent}
                showDayNumber={false}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}