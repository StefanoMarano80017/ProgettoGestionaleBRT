import React from "react";
import { Box, Typography } from "@mui/material";
import TimesheetDayCell from "./TimesheetDayCell";

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const GAP = 4; // px, come WorkCalendarGrid (gap: 0.5)
export default function EmployeeMonthGrid({
  year,
  month,            // 0-based
  rows = [],        // [{ id, dipendente, azienda }]
  tsMap = {},       // { [empId]: { 'YYYY-MM-DD': [records], 'YYYY-MM-DD_segnalazione': {...} } }
  onDayClick,       // (row, dateKey) => void
  height = 520,
  dayWidth = 52,
  dayHeight = 28,
  dipWidth = 240,
  azWidth = 130,
  sx = {},
}) {
  const daysInMonth = React.useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const gridTemplateColumns = React.useMemo(
    () => `${dipWidth}px ${azWidth}px ${Array.from({ length: daysInMonth }).map(() => `${dayWidth}px`).join(" ")}`,
    [dipWidth, azWidth, dayWidth, daysInMonth]
  );

  return (
    <Box
      sx={{
        height,
        overflow: "auto",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "customBackground.main",
        ...sx,
      }}
    >
      {/* Header sticky */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          display: "grid",
          gridTemplateColumns,
          alignItems: "stretch",
          columnGap: `${GAP}px`,
          rowGap: `${GAP}px`,
          px: 1,
          py: 0.75,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Intestazioni fisse a sinistra */}
        <Box
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 3,
            width: dipWidth,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            pl: 1,
          }}
        >
          Dipendente
        </Box>
        <Box
          sx={{
            position: "sticky",
            left: dipWidth + GAP,
            zIndex: 3,
            width: azWidth,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            pl: 1,
          }}
        >
          Azienda
        </Box>

        {/* Giorni */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          return (
            <Box
              key={`h-${d}`}
              sx={{
                textAlign: "center",
                fontWeight: 600,
                color: "text.primary",
                borderRadius: 1,
                py: 0.5,
              }}
            >
              {d}
            </Box>
          );
        })}
      </Box>

      {/* Body righe */}
      <Box sx={{ px: 1, py: 1 }}>
        {rows.map((row) => (
          <Box
            key={row.id}
            sx={{
              display: "grid",
              gridTemplateColumns,
              alignItems: "center",
              columnGap: `${GAP}px`,
              rowGap: `${GAP}px`,
              mb: 0.75,
            }}
          >
            {/* Celle sticky a sinistra */}
            <Box
              sx={{
                position: "sticky",
                left: 0,
                zIndex: 1,
                width: dipWidth,
                bgcolor: "customBackground.main",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                px: 1,
                py: 0.75,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                fontSize: 14,
                fontWeight: 500,
              }}
              title={row.dipendente}
            >
              {row.dipendente}
            </Box>
            <Box
              sx={{
                position: "sticky",
                left: dipWidth + GAP,
                zIndex: 1,
                width: azWidth,
                bgcolor: "customBackground.main",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                px: 1,
                py: 0.75,
                display: "flex",
                alignItems: "center",
                fontSize: 13,
                color: "text.secondary",
              }}
            >
              {row.azienda || "—"}
            </Box>

            {/* Giorni del mese */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
              const ts = tsMap[row.id] || {};
              const recs = ts[dateKey] || [];
              const seg = ts[`${dateKey}_segnalazione`] || null;

              return (
                <TimesheetDayCell
                  key={`c-${row.id}-${dateKey}`}
                  records={recs}
                  segnalazione={seg}
                  width="100%"           // riusa esattamente il look del componente
                  height={dayHeight}
                  onClick={onDayClick ? () => onDayClick(row, dateKey) : undefined}
                />
              );
            })}
          </Box>
        ))}

        {!rows.length && (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">Nessun dipendente corrisponde ai filtri.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}