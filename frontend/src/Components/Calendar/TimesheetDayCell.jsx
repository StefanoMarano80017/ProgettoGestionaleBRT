import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

export default function TimesheetDayCell({
  records = [],
  segnalazione = null,
  width = 44,
  height = 28,
  onClick,          // nuovo: handler click
  sx = {},          // nuovo: stile aggiuntivo
}) {
  const total = (records || []).reduce((s, r) => s + Number(r?.ore || 0), 0);
  const ferie = (records || []).some((r) => r?.commessa === "FERIE");
  const mal = (records || []).some((r) => r?.commessa === "MALATTIA");
  const perm = (records || []).some((r) => r?.commessa === "PERMESSO");

  let bg = "transparent";
  if (segnalazione) bg = "rgba(244, 67, 54, 0.15)";
  else if (ferie) bg = "rgba(76, 175, 80, 0.18)";
  else if (mal) bg = "rgba(156, 39, 176, 0.15)";
  else if (perm) bg = "rgba(2, 136, 209, 0.15)";
  else if (total === 8) bg = "rgba(76, 175, 80, 0.12)";
  else if (total > 0 && total < 8) bg = "rgba(255, 193, 7, 0.15)";

  const tooltip = [
    records?.length ? `Ore totali: ${total}h` : "Nessun inserimento",
    ...(records || []).map(
      (r) => `${r.commessa}: ${r.ore}h${r.descrizione ? ` — ${r.descrizione}` : ""}`
    ),
    segnalazione ? `Segnalazione: ${segnalazione.descrizione}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Tooltip title={<span style={{ whiteSpace: "pre-line" }}>{tooltip}</span>} arrow>
      <Box
        onClick={onClick}
        sx={{
          width,
          height,
          borderRadius: 1,
          bgcolor: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          border: segnalazione ? "1px solid rgba(244,67,54,0.6)" : "1px solid transparent",
          cursor: onClick ? "pointer" : "default",
          ...sx,
        }}
      >
        {total > 0 ? (
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {total}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.disabled">
            —
          </Typography>
        )}
        <Box sx={{ position: "absolute", right: 2, bottom: 2, display: "flex", gap: 0.2 }}>
          {ferie && <BeachAccessIcon sx={{ fontSize: 12 }} />}
          {mal && <LocalHospitalIcon sx={{ fontSize: 12 }} />}
          {perm && <EventAvailableIcon sx={{ fontSize: 12 }} />}
          {segnalazione && <WarningAmberIcon sx={{ fontSize: 12, color: "error.main" }} />}
        </Box>
      </Box>
    </Tooltip>
  );
}