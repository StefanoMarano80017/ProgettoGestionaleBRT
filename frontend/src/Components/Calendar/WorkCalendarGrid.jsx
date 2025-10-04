import React, { useCallback, useMemo } from "react";
import PropTypes from 'prop-types';
import { Box, IconButton, Typography, Tooltip } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DayEntryTile from "@components/Calendar/DayEntryTile";
import { useCalendarMonthYear } from '@/Hooks/Timesheet/calendar';
import useCalendarGridRows from '@/Hooks/Timesheet/calendar/useCalendarGridRows';

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

export function WorkCalendarGrid({
  data = {},         // { 'YYYY-MM-DD': [records], 'YYYY-MM-DD_segnalazione': { descrizione } }
  year,
  month,             // 0-based
  compact = false,
  onDayClick,        // (dateKey) => void
}) {
  const today = useMemo(() => new Date(), []);
  const { currentMonth, currentYear, shift } = useCalendarMonthYear(today);
  const { rows } = useCalendarGridRows({ data, year: currentYear, month: currentMonth, today });

  const handlePrev = useCallback(() => shift(-1), [shift]);
  const handleNext = useCallback(() => shift(1), [shift]);

  const width = compact ? 44 : 60;
  const height = compact ? 44 : 36; // ensure compact cells have at least 44px height for consistency

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDow = useMemo(() => new Date(year, month, 1).getDay(), [year, month]); // 0=Dom
  const startOffset = useMemo(() => (firstDow + 6) % 7, [firstDow]); // lun=0

  const headers = useMemo(() => ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], []);

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
        {rows.map(r => {
          const tooltipContent = (
            <span style={{ whiteSpace: 'pre-line' }}>{r.tooltipContent}</span>
          );
          return (
            <Box key={r.dateStr} sx={{ height }}>
              <DayEntryTile
                dateStr={r.dateStr}
                day={r.day}
                isSelected={false}
                status={r.status}
                variant={height < 44 ? 'compact' : 'default'}
                iconTopRight={false}
                showHours={r.totalHours > 0}
                totalHours={r.totalHours}
                onClick={onDayClick ? () => onDayClick(r.dateStr) : undefined}
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

WorkCalendarGrid.propTypes = {
  data: PropTypes.object,
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  compact: PropTypes.bool,
  onDayClick: PropTypes.func,
};

WorkCalendarGrid.displayName = 'WorkCalendarGrid';

export default React.memo(WorkCalendarGrid);